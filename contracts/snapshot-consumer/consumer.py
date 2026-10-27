"""固定快照消费参考：隔离暂存、完整校验与SQLite原子投影替换。"""
import copy
from collections import Counter
from datetime import datetime
from pathlib import Path
import sqlite3
import sys
import threading
import uuid
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'channel-release'))
import bridge as B
ROOT=Path(__file__).resolve().parent
R=B.R;S=B.S;M=B.M
VERSION='snapshot-projection/0.2.0-draft.1'
TABLES=('sp_generation','sp_slot','sp_page','sp_record','sp_receipt','sp_active')


class InjectedFailure(RuntimeError):pass
class ObservationLost(RuntimeError):pass


def wire(raw,model,limit):
    R.need(type(raw) is bytes and 0<len(raw)<=limit,'wire_capacity')
    value=S.G.C.decode(raw);R.validate(model,value)
    return value


def canonical(value):return S.raw(value).encode('utf8')
def identity(record):return tuple(record[k] for k in ('entity_kind','entity_id','entity_epoch'))


def connect(path):
    db=sqlite3.connect(path,isolation_level=None,timeout=0)
    try:
        db.execute('PRAGMA foreign_keys=ON');db.execute('PRAGMA journal_mode=WAL');db.execute('PRAGMA synchronous=FULL')
        R.need(db.execute('PRAGMA foreign_keys').fetchone()[0]==1 and db.execute('PRAGMA synchronous').fetchone()[0]==2,'sqlite_configuration')
        db.executescript((ROOT/'projection.sql').read_text(encoding='utf8'))
        return db
    except Exception:db.close();raise


class Consumer:
    """数据库只在创建线程使用；invalidate可由其他线程同步关闭本消费者。"""
    def __init__(self,db,slot,clock):
        for path,digest in S.G.load(ROOT/'sources.json')['inputs'].items():
            R.need(B.G.checksum((B.G.SDK/path).read_bytes())==digest,'source_drift:'+path)
        R.validate('snapshot__Id',slot)
        self.db=db;self.slot=slot;self.clock=clock;self._thread=threading.get_ident();self._lock=threading.Lock()
        self._expected=None;self._stage=None;self._visible=None;self._last_tick=None;self._revoked=False

    def _thread_check(self):R.need(threading.get_ident()==self._thread,'consumer_thread_required')

    def _now(self):
        try:now=self.clock()
        except Exception:now=None
        if not (type(now) is int and now>=0 and (self._last_tick is None or now>=self._last_tick)):
            self._revoked=True;self._visible=None;raise ValueError('clock_invalid')
        self._last_tick=now;return now

    def _current(self):
        R.need(self._expected is not None and not self._revoked,'consumer_inactive')
        R.need(self._now()<self._expected['deadline_tick'],'consumer_expired')

    def invalidate(self):
        with self._lock:self._revoked=True;self._visible=None;self._stage=None

    def start(self,expected,manifest_raw):
        """expected由认证附着结果和批准profile提供，不从待验manifest现算批准。"""
        self._thread_check();expected=copy.deepcopy(expected)
        with self._lock:
            # 新scope开始时旧投影立即不可见，即使新下载失败也不回退到旧授权数据。
            self._visible=None;self._stage=None;self._expected=None;self._revoked=True
            R.need(set(expected)=={'content_binding','delivery_binding','snapshot_ref','schemas','deadline_tick'},'expected_shape')
            R.validate('snapshot__ContentBinding',expected['content_binding'])
            R.validate('snapshot__DeliveryBinding',expected['delivery_binding'])
            R.validate('channel__SnapshotRef',expected['snapshot_ref'])
            R.need(type(expected['deadline_tick']) is int and expected['deadline_tick']>self._now(),'consumer_expired')
            cb=expected['content_binding'];delivery=expected['delivery_binding']
            R.need(all(cb[k]==delivery[k] for k in delivery if k!='connection_generation'),'expected_binding')
            R.need(expected['snapshot_ref']['snapshot_id']==cb['snapshot_id'],'expected_snapshot')
            m=wire(manifest_raw,'snapshot__Manifest',65536)
            R.need(m['binding']==cb,'content_binding')
            R.need(m['manifest_digest']==R.digest({k:v for k,v in m.items() if k!='manifest_digest'})==expected['snapshot_ref']['manifest_digest'],'manifest_digest')
            R.need(m['snapshot_cursor']==expected['snapshot_ref']['snapshot_cursor'],'snapshot_cursor')
            R.need(datetime.fromisoformat(m['created_at'].replace('Z','+00:00'))<datetime.fromisoformat(m['expires_at'].replace('Z','+00:00')),'manifest_time')
            kinds=[c['entity_kind'] for c in m['collections']]
            R.need(kinds==sorted(expected['schemas']) and len(set(kinds))==len(kinds),'collection_set')
            for c in m['collections']:R.need(c['view_schema_ref']==expected['schemas'][c['entity_kind']],'collection_schema')
            R.need(sum(int(c['count']) for c in m['collections'])<=32768,'record_capacity')
            R.need([p['page_index'] for p in m['pages']]==list(range(m['page_count'])),'page_layout')
            R.need(sum(p['content_bytes'] for p in m['pages'])==m['total_content_bytes'],'total_bytes')
            R.need(not self.db.in_transaction,'nested_transaction')
            self.db.execute('BEGIN IMMEDIATE')
            try:
                R.need(self.db.execute('SELECT count(*) FROM sp_generation').fetchone()[0]<64,'generation_capacity')
                gen=uuid.uuid4().hex
                self.db.execute('INSERT INTO sp_generation VALUES(?,?,?,?)',(gen,self.slot,S.raw(expected),S.raw(m)))
                self.db.execute('INSERT INTO sp_slot VALUES(?,?) ON CONFLICT(slot) DO UPDATE SET generation=excluded.generation',(self.slot,gen))
                self.db.commit()
            except Exception:self.db.rollback();raise
            self._expected=expected;self._stage=gen;self._revoked=False
            return gen

    def _slot(self,gen):
        row=self.db.execute('SELECT generation FROM sp_slot WHERE slot=?',(self.slot,)).fetchone()
        R.need(row is not None and row[0]==gen,'consumer_replaced')

    def _page(self,m,p):
        R.validate('snapshot__PageResponse',p);c=p['content'];i=c['page_index']
        R.need(p['delivery_binding']==self._expected['delivery_binding'],'delivery_binding')
        R.need(c['binding']==self._expected['content_binding'],'content_binding')
        R.need(p['manifest_digest']==m['manifest_digest'],'page_manifest')
        R.need(i<m['page_count'] and c['next_page_index']==(i+1 if i+1<m['page_count'] else None),'page_layout')
        descriptor=m['pages'][i];encoded=canonical(c)
        R.need(len(encoded)==descriptor['content_bytes'] and R.digest(c)==descriptor['content_digest']==p['content_digest'],'page_digest')
        R.need(len(canonical(p))<=262144,'wire_capacity')

    def page(self,raw):
        self._thread_check()
        with self._lock:
            self._current();R.need(self._stage is not None,'stage_required')
            R.need(not self.db.in_transaction,'nested_transaction')
            self._slot(self._stage)
            m=S.decode(self.db.execute('SELECT manifest FROM sp_generation WHERE id=?',(self._stage,)).fetchone()[0])
            p=wire(raw,'snapshot__PageResponse',262144);c=p['content'];i=c['page_index']
            self._page(m,p)
            body=S.raw(p);old=self.db.execute('SELECT body FROM sp_page WHERE generation=? AND ordinal=?',(self._stage,i)).fetchone()
            if old is not None:R.need(old[0]==body,'page_conflict');return 'duplicate'
            # 本候选最多64个构建代，总暂存正文32MiB；不自动删历史来腾出成功空间。
            size=self.db.execute('SELECT coalesce(sum(length(CAST(body AS BLOB))),0) FROM sp_page').fetchone()[0]
            R.need(size+len(body.encode('utf8'))<=33554432,'storage_capacity')
            self.db.execute('INSERT INTO sp_page VALUES(?,?,?)',(self._stage,i,body))
            return 'staged'

    def apply(self,fail_after=None,lose_observation=False,after_step=None):
        self._thread_check()
        with self._lock:
            self._current();R.need(self._stage is not None,'stage_required');gen=self._stage
            R.need(not self.db.in_transaction,'nested_transaction');self.db.execute('BEGIN IMMEDIATE')
            try:
                self._slot(gen)
                old=self.db.execute('SELECT body FROM sp_receipt WHERE generation=?',(gen,)).fetchone()
                if old is not None:
                    # 原提交结果按完整generation查原，不从“查不到”猜测失败。
                    R.need(self.db.execute('SELECT generation FROM sp_active WHERE slot=?',(self.slot,)).fetchone()==(gen,),'projection_replaced')
                    self._current();self.db.commit();self._visible=gen;return S.decode(old[0])
                m=S.decode(self.db.execute('SELECT manifest FROM sp_generation WHERE id=?',(gen,)).fetchone()[0])
                pages=[S.decode(row[0]) for row in self.db.execute('SELECT body FROM sp_page WHERE generation=? ORDER BY ordinal',(gen,))]
                R.need(len(pages)==m['page_count'],'pages_incomplete')
                R.need([p['content']['page_index'] for p in pages]==list(range(m['page_count'])),'page_layout')
                for page in pages:self._page(m,page)
                R.need(len(canonical(m))+sum(len(canonical(p)) for p in pages)<=8388608,'snapshot_capacity')
                records=[r for p in pages for r in p['content']['records']];keys=[identity(r) for r in records]
                R.need(keys==sorted(keys) and len(set(keys))==len(keys),'entity_order_or_duplicate')
                R.need(len({k[:2] for k in keys})==len(keys),'entity_epoch_reused')
                counts=Counter(r['entity_kind'] for r in records)
                R.need(not set(counts)-set(self._expected['schemas']),'collection_outside_scope')
                R.need(all(counts[c['entity_kind']]==int(c['count']) for c in m['collections']),'collection_count')
                sources=[r for r in records if r['entity_kind']=='sources']
                R.need(len({S.raw(r['view']['source_key']) for r in sources})==len(sources),'source_identity')
                for r in sources:R.need(int(r['view']['contiguous_sequence'])<=int(r['view']['highest_seen_sequence']),'source_frontier')
                watermarks=[dict(source_key=r['view']['source_key'],binding_ref=r['view']['binding_ref'],baseline_sequence=r['view']['contiguous_sequence'],
                    source_state_revision=r['entity_revision'],baseline_ref=r['view']['baseline_ref'],gap_summary=r['view']['gaps']) for r in sources]
                R.need(sorted(map(S.raw,watermarks))==sorted(map(S.raw,m['source_watermarks'])),'source_watermarks')
                step=0
                def cut():
                    nonlocal step
                    step+=1
                    if after_step is not None:after_step(step)
                    if fail_after==step:raise InjectedFailure(str(step))
                for record in records:
                    self.db.execute('INSERT INTO sp_record VALUES(?,?,?,?,?,?,?)',(gen,*identity(record),record['entity_revision'],R.digest(record),S.raw(record)));cut()
                receipt=dict(schema_version=M.B.VERSION,type='client.snapshot.applied',binding=self._expected['delivery_binding'],snapshot=self._expected['snapshot_ref'])
                R.validate('channel__SnapshotApplied',receipt)
                self.db.execute('INSERT INTO sp_receipt VALUES(?,?)',(gen,S.raw(receipt)));cut()
                self.db.execute('INSERT INTO sp_active VALUES(?,?) ON CONFLICT(slot) DO UPDATE SET generation=excluded.generation',(self.slot,gen));cut()
                self._current();self.db.commit()
            except Exception:
                if self.db.in_transaction:self.db.rollback()
                raise
            if lose_observation:raise ObservationLost('commit_observation_lost')
            self._visible=gen;return copy.deepcopy(receipt)

    def view(self):
        self._thread_check()
        with self._lock:
            self._current();R.need(self._visible is not None,'projection_not_applied')
            R.need(not self.db.in_transaction,'nested_transaction');self.db.execute('BEGIN')
            try:
                self._slot(self._visible)
                active=self.db.execute('SELECT generation FROM sp_active WHERE slot=?',(self.slot,)).fetchone()
                R.need(active is not None and active[0]==self._visible,'projection_replaced')
                result=[S.decode(row[0]) for row in self.db.execute('SELECT body FROM sp_record WHERE generation=? ORDER BY kind,entity_id,epoch',(self._visible,))]
                self._current();self.db.commit();return result
            except Exception:self.db.rollback();raise
