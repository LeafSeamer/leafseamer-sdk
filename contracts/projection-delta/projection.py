"""状态投影增量消费参考；投影与确认在同一SQLite事务中提交。"""
import copy
import sqlite3
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'snapshot-consumer'))
import consumer as C
ROOT=Path(__file__).resolve().parent
R=C.R;S=C.S;M=C.M
TABLES=('dp_head','dp_object','dp_delivery')


class Projection:
    def __init__(self,snapshot,purpose,max_frames=256,max_history_bytes=1048576):
        self.snapshot=snapshot;self.db=snapshot.db;self.gen=snapshot._visible
        R.need(purpose=='status_projection','canonical_consumer_required')
        R.need(type(max_frames) is int and 1<=max_frames<=256 and type(max_history_bytes) is int and 1<=max_history_bytes<=1048576,'capacity')
        self.max_frames=max_frames;self.max_history_bytes=max_history_bytes
        for path,digest in S.G.load(ROOT/'sources.json')['inputs'].items():
            R.need(C.B.G.checksum((C.B.G.SDK/path).read_bytes())==digest,'source_drift:'+path)
        snapshot._thread_check()
        with snapshot._lock:
            self._active();R.need(not self.db.in_transaction,'nested_transaction')
            self.db.executescript((ROOT/'projection.sql').read_text(encoding='utf8'))
            self.db.execute('BEGIN IMMEDIATE')
            try:
                self._active()
                if self.db.execute('SELECT 1 FROM dp_head WHERE generation=?',(self.gen,)).fetchone() is None:
                    ref=snapshot._expected['snapshot_ref'];checksum=R.digest(dict(entry_kind='snapshot.baseline',payload=ref))
                    self.db.execute('INSERT INTO dp_head VALUES(?,?,?,?)',(self.gen,ref['snapshot_cursor'],checksum,'catching_up'))
                    for kind,entity,epoch,revision,body in self.db.execute('SELECT kind,entity_id,epoch,revision,body FROM sp_record WHERE generation=?',(self.gen,)).fetchall():
                        self.db.execute('INSERT INTO dp_object VALUES(?,?,?,?,?,?,?)',(self.gen,kind,entity,epoch,revision,None,body))
                self._active();self.db.commit()
            except Exception:self.db.rollback();raise

    def _active(self):
        s=self.snapshot;s._current()
        R.need(self.gen is not None and s._visible==self.gen,'projection_not_applied')
        s._slot(self.gen)
        R.need(self.db.execute('SELECT generation FROM sp_active WHERE slot=?',(s.slot,)).fetchone()==(self.gen,),'projection_replaced')

    def _close(self):
        self.snapshot._revoked=True;self.snapshot._visible=None;self.snapshot._stage=None

    def _object(self,entry):
        kind=entry['entry_kind'];p=entry['payload']
        R.need(kind in ('entity.upsert','entity.remove'),'canonical_consumer_required')
        R.need(p['entity_kind'] in self.snapshot._expected['schemas'],'collection_outside_scope')
        key=(self.gen,p['entity_kind'],p['entity_id'])
        old=self.db.execute('SELECT epoch,revision,removed,body FROM dp_object WHERE generation=? AND kind=? AND entity_id=?',key).fetchone()
        removed=None if kind=='entity.upsert' else p['reason'];body=S.raw(p)
        if old is not None:
            epoch,revision,reason,previous=old
            R.need(epoch==p['entity_epoch'],'entity_epoch_reused')
            if int(p['entity_revision'])<int(revision):return 'older_ignored'
            if int(p['entity_revision'])==int(revision):
                if reason is not None and removed is None:return 'tombstone_retained'
                if reason==removed:R.need(previous==body,'revision_conflict');return 'duplicate_entity'
                # 离开筛选范围可不改变领域修订；同修订移除优先于原显示记录。
                R.need(reason is None and removed is not None,'revision_conflict')
            if reason=='deleted':R.need(removed=='deleted','deleted_identity')
        count=self.db.execute('SELECT count(*) FROM dp_object WHERE generation=?',(self.gen,)).fetchone()[0]
        R.need(old is not None or count<32768,'object_capacity')
        self.db.execute('INSERT INTO dp_object VALUES(?,?,?,?,?,?,?) ON CONFLICT(generation,kind,entity_id) DO UPDATE SET revision=excluded.revision,removed=excluded.removed,body=excluded.body',
                        (*key,p['entity_epoch'],p['entity_revision'],removed,body))
        size=self.db.execute('SELECT coalesce(sum(length(CAST(body AS BLOB))),0) FROM dp_object WHERE generation=?',(self.gen,)).fetchone()[0]
        R.need(size<=8388608,'projection_capacity')
        return 'removed' if removed else 'upserted'

    def receive(self,raw,fail_after=None,lose_observation=False,after_step=None):
        s=self.snapshot;s._thread_check()
        with s._lock:
            started=False
            try:
                self._active();R.need(not self.db.in_transaction,'nested_transaction')
                R.need(type(raw) is bytes and 0<len(raw)<=65536,'frame_capacity')
                frame=S.G.C.decode(raw)
                R.validate('channel__SyncReady' if frame.get('type')=='server.sync.ready' else 'snapshot__Data',frame)
                R.need(frame['binding']==s._expected['delivery_binding'],'delivery_binding')
                encoded=S.raw(frame);self.db.execute('BEGIN IMMEDIATE');started=True;self._active()
                old=self.db.execute('SELECT frame,ack FROM dp_delivery WHERE generation=? AND cursor=?',(self.gen,frame['cursor'])).fetchone()
                if old is not None:
                    R.need(old[0]==encoded,'cursor_conflict');self._active();self.db.commit();return S.decode(old[1])
                cursor,digest,phase=self.db.execute('SELECT cursor,digest,phase FROM dp_head WHERE generation=?',(self.gen,)).fetchone()
                R.need(frame['previous_cursor']==cursor and int(frame['cursor'])>int(cursor),'delivery_chain')
                count,size=self.db.execute('SELECT count(*),coalesce(sum(length(CAST(frame AS BLOB))+length(CAST(ack AS BLOB))),0) FROM dp_delivery WHERE generation=?',(self.gen,)).fetchone()
                R.need(count<self.max_frames,'delivery_capacity')
                if frame['type']=='server.sync.ready':
                    R.need(phase=='catching_up' and frame['delivery_mode']=='reconcile','checkpoint_phase')
                    R.need(frame['baseline_snapshot_id']==s._expected['snapshot_ref']['snapshot_id'],'checkpoint_snapshot')
                    expected=R.digest(dict(entry_kind='sync.ready',payload=dict(baseline_snapshot_id=frame['baseline_snapshot_id'])))
                else:
                    R.need(frame['delivery_mode']==('live' if phase=='live' else 'reconcile'),'delivery_mode')
                    expected=R.digest(frame['entry'])
                R.need(frame['payload_digest']==expected,'payload_digest')
                step=0
                def cut():
                    nonlocal step
                    step+=1
                    if after_step is not None:after_step(step)
                    if fail_after==step:raise C.InjectedFailure(str(step))
                if frame['type']=='server.data':self._object(frame['entry'])
                cut()
                ack=dict(schema_version=M.B.VERSION,type='client.ack',binding=frame['binding'],cursor=frame['cursor'],payload_digest=frame['payload_digest'],ack_kind='projection_applied')
                R.validate('channel__ClientAck',ack);ack_body=S.raw(ack)
                R.need(size+len(encoded.encode('utf8'))+len(ack_body.encode('utf8'))<=self.max_history_bytes,'history_capacity')
                self.db.execute('INSERT INTO dp_delivery VALUES(?,?,?,?)',(self.gen,frame['cursor'],encoded,ack_body));cut()
                self.db.execute('UPDATE dp_head SET cursor=?,digest=?,phase=? WHERE generation=?',
                                (frame['cursor'],frame['payload_digest'],'live' if frame['type']=='server.sync.ready' else phase,self.gen));cut()
                self._active();self.db.commit()
            except Exception as error:
                if started and self.db.in_transaction:self.db.rollback()
                # 注入故障和SQLite暂时故障可按同一帧重试；协议/资格失败需新快照。
                if not isinstance(error,(C.InjectedFailure,sqlite3.Error)):self._close()
                raise
            if lose_observation:raise C.ObservationLost('commit_observation_lost')
            return copy.deepcopy(ack)

    def view(self):
        s=self.snapshot;s._thread_check()
        with s._lock:
            self._active();R.need(not self.db.in_transaction,'nested_transaction');self.db.execute('BEGIN')
            try:
                self._active()
                cursor,digest,phase=self.db.execute('SELECT cursor,digest,phase FROM dp_head WHERE generation=?',(self.gen,)).fetchone()
                records=[S.decode(row[0]) for row in self.db.execute('SELECT body FROM dp_object WHERE generation=? AND removed IS NULL ORDER BY kind,entity_id,epoch',(self.gen,))]
                self._active();self.db.commit()
                return dict(cursor=cursor,payload_digest=digest,phase=phase,records=records)
            except Exception:self.db.rollback();raise
