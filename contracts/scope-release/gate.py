"""单一可信出口的局部释放顺序参考；不是产品HTTP、WS或TLS实现。"""
import copy
from dataclasses import dataclass
import hashlib
from pathlib import Path
import socket
import sys
import threading

ROOT=Path(__file__).resolve().parent
SDK=ROOT.parents[1]
sys.path.insert(0,str(ROOT.parent/'scope-storage'))
import storage as S
R=S.R
CONTEXT_BINDINGS=('publisher_domain','service_boot_id','stream_id','stream_epoch','transport','transport_credential_binding')


def checksum(payload): return hashlib.sha256(payload).hexdigest()


@dataclass(frozen=True)
class CurrentRead:
    """可信提供者的完整正文授权结果；不得直接从远端请求构造。"""
    grant: object
    context: dict
    binding: dict
    payload_digest: str


class SocketSink:
    """仅展示非阻塞明文socket出口；HTTP/WS/TLS须另行实现并证明相同边界。"""
    def __init__(self,sock):
        R.need(isinstance(sock,socket.socket),'socket_required')
        self.socket=sock;self.socket.setblocking(False)
    def write_once(self,payload):
        R.need(self.socket.gettimeout()==0,'blocking_transport')
        return self.socket.send(payload)


class Gate:
    def __init__(self,owner_epoch,clock,max_items=16,max_bytes=262144):
        R.validate('snapshot__Id',owner_epoch)
        R.need(type(max_items) is int and max_items>0 and type(max_bytes) is int and max_bytes>0,'capacity')
        for path,digest in S.G.load(ROOT/'sources.json')['inputs'].items():
            R.need(checksum((SDK/path).read_bytes())==digest,'source_drift:'+path)
        self.owner_epoch=owner_epoch;self.clock=clock;self.max_items=max_items;self.max_bytes=max_bytes
        self._lock=threading.Lock();self._version=0;self._stopped=False;self._blocked=set()
        self._channels={};self._transports=set();self._queued_bytes=0;self._queued_items=0;self._sequence=0
        self._last_tick=None

    def _now(self):
        try:now=self.clock()
        except Exception:now=None
        if not (type(now) is int and now>=0 and (self._last_tick is None or now>=self._last_tick)):
            self._stopped=True;self._version+=1
            for channel in self._channels.values():self._close(channel,'clock_invalid')
            raise ValueError('clock_invalid')
        self._last_tick=now;return now

    def _channel(self,handle):
        R.need(not self._stopped,'owner_stopped')
        R.need(handle in self._channels,'foreign_handle')
        channel=self._channels[handle]
        R.need(channel['closed'] is None,'channel_closed')
        return channel

    def _close(self,channel,reason):
        self._queued_items-=len(channel['queue'])
        self._queued_bytes-=sum(len(item['payload']) for item in channel['queue'])
        channel['queue'].clear();channel['closed']=reason

    def open(self,store,scope,purpose,grant,context,binding):
        """绑定由可信订阅/连接提供者给出；同一owner内transport_id永不复用。"""
        scope=copy.deepcopy(scope);grant=copy.deepcopy(grant);context=copy.deepcopy(context);binding=copy.deepcopy(binding)
        R.need(set(binding)=={'owner_epoch','subscription_id','connection_generation','transport_id','credential_binding'},'binding_shape')
        R.need(binding['owner_epoch']==self.owner_epoch,'owner_epoch')
        R.need(context['transport_credential_binding']==binding['credential_binding'],'credential_binding')
        for field in ('subscription_id','transport_id','credential_binding'):R.validate('snapshot__Id',binding[field])
        R.validate('snapshot__Counter',binding['connection_generation'])
        refs={S.key(scope['projection_profile_ref'])}|{S.key(c['selector_ref']) for c in scope['collections']}
        with self._lock:
            R.need(not self._stopped,'owner_stopped');version=self._version;context['now_tick']=self._now()
            R.need(not refs & self._blocked,'reference_blocked')
        _,plan=store.authorize_at_writer(scope,purpose,grant,context)
        with self._lock:
            R.need(not self._stopped and version==self._version,'admission_interrupted')
            R.need(not refs & self._blocked and self._now()<context['deadline_tick'],'admission_expired_or_blocked')
            R.need(binding['transport_id'] not in self._transports,'transport_reused')
            handle=object();self._transports.add(binding['transport_id'])
            self._channels[handle]=dict(scope=scope,purpose=purpose,plan=copy.deepcopy(plan),binding=binding,refs=refs,queue=[],closed=None,
                                       context_binding={field:context[field] for field in CONTEXT_BINDINGS})
            return handle

    def enqueue(self,handle,payload):
        """只复制已编码字节；入队不是授权，也不推进发送/ACK状态。"""
        R.need(type(payload) is bytes and 0<len(payload)<=self.max_bytes,'payload_size_or_type')
        with self._lock:
            channel=self._channel(handle)
            R.need(self._queued_items<self.max_items and self._queued_bytes+len(payload)<=self.max_bytes,'queue_capacity')
            ticket=object();channel['queue'].append(dict(ticket=ticket,payload=payload,digest=checksum(payload)))
            self._queued_items+=1;self._queued_bytes+=len(payload);return ticket

    def close(self,handle,reason='connection_invalidated'):
        with self._lock:
            R.need(handle in self._channels,'foreign_handle')
            self._version+=1;self._close(self._channels[handle],reason);self._sequence+=1
            return dict(owner_epoch=self.owner_epoch,cut=self._sequence,status='locally_closed')

    def invalidate_ref(self,ref):
        R.validate('snapshot__ObjectRef',ref)
        with self._lock:
            self._version+=1;self._blocked.add(S.key(ref))
            for channel in self._channels.values():
                if S.key(ref) in channel['refs']:self._close(channel,'reference_invalidated')
            self._sequence+=1
            return dict(owner_epoch=self.owner_epoch,cut=self._sequence,status='locally_closed')

    def revoke(self,store,operation_id,ref,**faults):
        """本机先关门，再保存原撤销写集；失败或结果未知均不重开。"""
        cut=self.invalidate_ref(ref)
        receipt=store.revoke(operation_id,ref,**faults)
        return dict(cut=cut,storage_receipt=receipt)

    def stop(self):
        with self._lock:
            self._stopped=True;self._version+=1
            for channel in self._channels.values():self._close(channel,'owner_stopped')

    def release(self,handle,ticket,store,reader,sink):
        """每次重取可信授权；数据库事务结束后，关门与一次非阻塞出口共享顺序。"""
        with self._lock:
            channel=self._channel(handle)
            R.need(channel['queue'] and channel['queue'][0]['ticket'] is ticket,'not_queue_head')
            item=channel['queue'][0];version=self._version
            scope=copy.deepcopy(channel['scope']);plan=copy.deepcopy(channel['plan']);binding=copy.deepcopy(channel['binding'])
            now=self._now()
        try:
            current=copy.deepcopy(reader(item['digest']))
            R.need(isinstance(current,CurrentRead) and current.payload_digest==item['digest'],'payload_authority')
            R.need(current.binding==binding,'binding_changed')
            context=copy.deepcopy(current.context);context['now_tick']=now
            R.need(context['transport_credential_binding']==binding['credential_binding'],'credential_binding')
            R.need({field:context[field] for field in CONTEXT_BINDINGS}==channel['context_binding'],'runtime_binding_changed')
            R.need(context['content_authorized'] is True,'content_not_authorized')
            store.authorize_at_writer(scope,channel['purpose'],current.grant,context,plan)
        except Exception:
            with self._lock:self._version+=1;self._close(channel,'authorization_failed')
            raise
        with self._lock:
            channel=self._channel(handle)
            R.need(version==self._version,'release_interrupted')
            R.need(channel['queue'] and channel['queue'][0]['ticket'] is ticket,'not_queue_head')
            try:
                R.need(self._now()<context['deadline_tick'],'release_expired')
                R.need(not store.db.in_transaction,'transaction_at_transport')
            except Exception:
                self._version+=1;self._close(channel,'release_check_failed');raise
            try:
                # 可信出口不得缓存到未受此门保护的异步队列，不得等待可写或重入本门。
                count=sink.write_once(item['payload'])
            except BlockingIOError as error:
                if getattr(error,'characters_written',0)!=0:
                    self._version+=1;self._close(channel,'transport_result_unknown')
                    return dict(status='indeterminate',bytes_accepted=None)
                return dict(status='would_block',bytes_accepted=0)
            except Exception:
                self._version+=1;self._close(channel,'transport_result_unknown')
                return dict(status='indeterminate',bytes_accepted=None)
            if type(count) is not int or not 0<=count<=len(item['payload']):
                self._version+=1;self._close(channel,'invalid_transport_result')
                return dict(status='indeterminate',bytes_accepted=None)
            self._sequence+=1
            if count!=len(item['payload']):
                self._version+=1;self._close(channel,'partial_transport_write')
                return dict(status='partial_closed',bytes_accepted=count,cut=self._sequence)
            channel['queue'].pop(0);self._queued_items-=1;self._queued_bytes-=count
            return dict(status='handed_off',bytes_accepted=count,cut=self._sequence,payload_digest=item['digest'])

    def state(self,handle):
        with self._lock:
            R.need(handle in self._channels,'foreign_handle');channel=self._channels[handle]
            return dict(closed=channel['closed'],queued=len(channel['queue']),owner_stopped=self._stopped,
                        queued_bytes=self._queued_bytes,queued_items=self._queued_items)
