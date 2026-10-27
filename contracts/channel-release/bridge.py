"""固定订阅模型与唯一出口的参考接线；只接受可信日志提供者确认的完整帧。"""
import copy
from dataclasses import dataclass
from pathlib import Path
import sys
import threading

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'scope-recovery'))
import owner as O
G=O.G
S=O.S
R=O.R
M=R.channel_model()
ORIGIN=('publisher_service_id','publisher_database_instance_id','publisher_domain','service_boot_id','stream_id','stream_epoch')


@dataclass(frozen=True)
class FrameBody:
    """由可信日志读取器返回；不能把远端提交的帧转换成本对象作为批准。"""
    frame: dict
    origin: dict
    facts: dict


def content(frame,body,plan,ctx):
    R.need(isinstance(body,FrameBody) and S.raw(body.frame)==S.raw(frame),'body_mismatch')
    R.need(body.origin=={k:ctx[k] for k in ORIGIN},'body_origin')
    if frame['type']=='server.sync.ready':
        # 提供者必须证明固定基线到该游标的补齐完整性，摘要本身不证明完整性。
        R.need(body.facts==dict(baseline_snapshot_id=frame['baseline_snapshot_id'],through_cursor=frame['previous_cursor']),
               'checkpoint_evidence')
        return
    entry=frame['entry'];kind=entry['entry_kind'];payload=entry['payload']
    if kind=='source.event':
        R.need(plan['purpose']=='canonical_trigger' and plan['canonical_scope_complete'],'canonical_required')
        R.need(set(body.facts)=={'source_record'},'source_evidence')
        source=body.facts['source_record'];R.validate('snapshot__Record',source)
        selected=next(c for c in plan['collections'] if c['entity_kind']=='sources')
        R.need(source['entity_kind']=='sources' and source['entity_id'] in selected['entity_ids'],'source_outside_scope')
        view=source['view'];key=payload['source_key']
        R.need(key==view['source_key'] and key['authority_service_id']==ctx['publisher_service_id'] and
               key['database_instance_id']==ctx['publisher_database_instance_id'],'source_binding')
        R.need(view['state']=='synchronized' and not view['gaps'] and
               int(payload['source_sequence'])<=int(view['contiguous_sequence']),'source_not_contiguous')
        return
    R.need(kind in ('entity.upsert','entity.remove'),'entry_kind')
    fact=body.facts
    R.need(set(fact)=={'record','current','unresolved','journal_cursor'},'record_evidence')
    record=fact['record'];R.validate('snapshot__Record',record)
    R.validate('snapshot__Counter',fact['journal_cursor'])
    R.need(type(fact['current']) is bool and type(fact['unresolved']) is bool,'record_state')
    R.need(fact['journal_cursor']==frame['cursor'],'record_cursor')
    if kind=='entity.upsert':R.need(S.raw(record)==S.raw(payload),'record_mismatch')
    else:
        R.need(all(record[k]==payload[k] for k in ('entity_kind','entity_id','entity_epoch')) and
               int(record['entity_revision'])<=int(payload['entity_revision']),'removal_identity')
    selected=next((c for c in plan['collections'] if c['entity_kind']==record['entity_kind']),None)
    R.need(selected is not None and record['entity_id'] in selected['entity_ids'],'entity_outside_scope')
    included=fact['current'] or (selected['history_policy']!='current' and fact['unresolved'])
    window=selected['window']
    if window is not None:included |= int(window['first_cursor'])<=int(fact['journal_cursor'])<=int(window['last_cursor'])
    R.need(included,'record_outside_history')
    if record['entity_kind']=='sources':
        key=record['view']['source_key']
        R.need(key['authority_service_id']==ctx['publisher_service_id'] and
               key['database_instance_id']==ctx['publisher_database_instance_id'],'source_binding')


class Session:
    """拥有订阅状态副本；所有数据库操作在建立本实例的owner线程执行。"""
    def __init__(self,owner,subscription,current,read_body):
        for path,digest in S.G.load(ROOT/'sources.json')['inputs'].items():
            R.need(G.checksum((G.SDK/path).read_bytes())==digest,'source_drift:'+path)
        self.owner=owner;self.gate=owner.gate;self._sub=copy.deepcopy(subscription)
        self._current=current;self._read_body=read_body;self._lock=threading.Lock()
        self._thread=threading.get_ident();self._queue=[];self._shadow=copy.deepcopy(self._sub)
        owner._ready();grant,ctx=copy.deepcopy(current())
        with self.gate._lock:ctx['now_tick']=self.gate._now()
        ctx,self._plan=owner.store.authorize_at_writer(self._sub.view['scope'],self._sub.view['purpose'],grant,ctx)
        self._sub.release(self._sub.view['binding'],self._sub.transport,ctx)
        R.need(self._sub.view['state'] in ('catching_up','live') and self._sub.last_sent is not None,'baseline_required')
        self._binding=dict(owner_epoch=owner.epoch,subscription_id=self._sub.view['binding']['subscription_id'],
            connection_generation=self._sub.view['binding']['connection_generation'],transport_id=self._sub.transport,
            credential_binding=self._sub.credential_binding)
        sessions=getattr(owner,'_channel_sessions',None)
        if sessions is None:owner._channel_sessions={};sessions=owner._channel_sessions
        old=sessions.get(self._binding['subscription_id'])
        if old is not None:
            old._thread_check()
            R.need(int(self._binding['connection_generation'])>int(old._binding['connection_generation']),'generation_reused')
            old.close()
        self._handle=owner.open(self._sub.view['scope'],self._sub.view['purpose'],grant,ctx,self._binding)
        sessions[self._binding['subscription_id']]=self

    def _thread_check(self):R.need(threading.get_ident()==self._thread,'owner_thread_required')

    def _fresh(self):
        self.owner._ready()
        with self.gate._lock:
            channel=self.gate._channel(self._handle);version=self.gate._version;now=self.gate._now()
            runtime=copy.deepcopy(channel['context_binding'])
        grant,ctx=copy.deepcopy(self._current());ctx['now_tick']=now
        R.need({k:ctx[k] for k in G.CONTEXT_BINDINGS}==runtime,'runtime_binding_changed')
        ctx,plan=self.owner.store.authorize_at_writer(self._sub.view['scope'],self._sub.view['purpose'],grant,ctx,self._plan)
        self._sub.release(self._sub.view['binding'],self._sub.transport,ctx)
        return grant,ctx,plan,version

    def _final(self,ctx,version):
        # 调用者已经持有Gate锁；不得在此区间读取数据库或调用提供者。
        self.gate._channel(self._handle)
        R.need(self.gate._version==version,'state_interrupted')
        R.need(self.gate._now()<ctx['deadline_tick'],'state_expired')
        R.need(not self.owner.db.in_transaction,'transaction_at_state_commit')

    def _fail(self):
        self.gate.close(self._handle,'session_failed');self._queue.clear()
        self._shadow=copy.deepcopy(self._sub)

    def _sent_copy(self,sub,frame,plan,ctx):
        M.validate('channel__SyncReady' if frame.get('type')=='server.sync.ready' else 'snapshot__Data',frame)
        body=copy.deepcopy(self._read_body(R.digest(frame)))
        content(frame,body,plan,ctx)
        clone=copy.deepcopy(sub);clone.sent(frame,self._binding['transport_id'],dict(ctx,content_authorized=True))
        return clone

    def enqueue(self,frame):
        self._thread_check();frame=copy.deepcopy(frame)
        with self._lock:
            try:
                _,ctx,plan,version=self._fresh()
                R.need(self._shadow.checkpoint is None or self._shadow.view['state']=='live','checkpoint_ack_required')
                shadow=self._sent_copy(self._shadow,frame,plan,ctx)
                with self.gate._lock:self._final(ctx,version)
                # Gate.enqueue再次检查关闭状态；队列本身仍不构成发送授权。
                ticket=self.gate.enqueue(self._handle,S.raw(frame).encode('utf8'))
                self._queue.append((ticket,frame));self._shadow=shadow
                return ticket
            except Exception:self._fail();raise

    def release(self,ticket,sink):
        self._thread_check()
        with self._lock:
            try:
                R.need(self._queue and self._queue[0][0] is ticket,'not_queue_head')
                frame=self._queue[0][1];prepared=[]
                def reader(checksum):
                    grant,ctx,plan,_=self._fresh()
                    prepared.append(self._sent_copy(self._sub,frame,plan,ctx))
                    R.need(checksum==G.checksum(S.raw(frame).encode('utf8')),'queued_body_changed')
                    return G.CurrentRead(grant,dict(ctx,content_authorized=True),self._binding,checksum)
                result=self.gate.release(self._handle,ticket,self.owner.store,reader,sink)
                if result['status']=='handed_off':
                    # 此赋值保留已经进入出口的历史；并发关闭不能把它改成未发送。
                    self._sub=prepared[0];self._queue.pop(0)
                elif result['status']!='would_block':self._fail()
                return result
            except Exception:self._fail();raise

    def ack(self,frame):
        self._thread_check();frame=copy.deepcopy(frame)
        with self._lock:
            try:
                _,ctx,plan,version=self._fresh();clone=copy.deepcopy(self._sub)
                result=clone.ack(frame,self._binding['transport_id'],ctx)
                shadow=copy.deepcopy(clone)
                for _,pending in self._queue:shadow=self._sent_copy(shadow,pending,plan,ctx)
                with self.gate._lock:
                    self._final(ctx,version);self._sub=clone;self._shadow=shadow
                return result
            except Exception:self._fail();raise

    def close(self):
        self._thread_check()
        with self._lock:self._fail()

    def state(self):
        with self._lock:
            gate=self.gate.state(self._handle)
            return copy.deepcopy(dict(subscription=self._sub.view,last_sent=self._sub.last_sent,
                delivered=self._sub.map,checkpoint=self._sub.checkpoint,gate=gate,
                usable=gate['closed'] is None and not gate['owner_stopped']))
