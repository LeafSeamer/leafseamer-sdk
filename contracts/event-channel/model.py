"""串行设计状态模型；所有ctx为合成可信提供者输入，不是网络请求。"""
import copy
from functools import lru_cache
from functools import wraps
import hashlib
import json
import re
import rfc8785
from jsonschema import Draft202012Validator, FormatChecker
import build as B

MAX=10**20-1
TERMINAL={'resync_required','revoked','expired','closed'}
def need(ok,why):
    if not ok:raise ValueError(why)
def digest(v):return hashlib.sha256(rfc8785.dumps(v)).hexdigest()
def inc(v):
    need(int(v)<MAX,'counter_exhausted');return str(int(v)+1)


@lru_cache(maxsize=1)
def defs():return B.build()['models.schema.json']['$defs']
def validate(name,value):Draft202012Validator({'$ref':B.P+name,'$defs':defs()},format_checker=FormatChecker()).validate(value)


def atomic(fn):
    @wraps(fn)
    def call(self,*args,**kwargs):
        before=copy.deepcopy(self.__dict__)
        try:return fn(self,*args,**kwargs)
        except Exception as error:
            self.__dict__=before
            if fn.__name__=='attach' and isinstance(error,ValueError) and str(error) in {
                'projection_lost','retention_lost','resume_not_confirmed','snapshot_expired','snapshot_required'}:
                self.invalidate('resync_required')
            if fn.__name__=='sent' and isinstance(error,ValueError) and str(error)=='delivery_capacity':
                self.invalidate('resync_required')
            if isinstance(error,ValueError) and str(error)=='counter_exhausted':self.inhibited=True
            raise
    return call


def authorize(ctx,owner,scope,purpose,selection):
    need(ctx['credential_current'] and ctx['authorization_current'] and ctx['storage_available'],'authority_unavailable')
    need(ctx['now_tick']<ctx['deadline_tick'],'authority_expired')
    need(ctx['owner']==owner and ctx['selection']==selection,'identity_or_selection')
    validate('channel__Owner',owner);validate('channel__ScopeSpec',scope)
    needed='status.read' if owner['kind']=='human' else 'event.internal.subscribe'
    need(needed in ctx['permissions'],'subscription_permission')
    need(ctx['transport']==('human_ticket' if owner['kind']=='human' else 'service_mtls'),'transport_identity')
    need(digest(scope) in ctx['allowed_scope_digests'],'scope_not_approved')
    kinds=[c['entity_kind'] for c in scope['collections']]
    need(len(kinds)==len(set(kinds)),'duplicate_collection')
    for item in scope['collections']:
        authorities,permission=B.COLLECTIONS[item['entity_kind']]
        need(ctx['publisher_role'] in authorities and permission in ctx['permissions'],'collection_permission')
        need(item['entity_kind'] not in ('commands','executions','occurrences') or item['history_policy']!='current','unresolved_omitted')
    if purpose=='canonical_trigger':
        need(owner['kind']=='service' and ctx['seamer_role'] and ctx['canonical_scope_complete'] and 'sources' in kinds,'canonical_scope')
    else:need(purpose=='status_projection','purpose')


class Subscription:
    def __init__(self,identity,ctx,scope,purpose):
        self.view=dict(schema_version=B.VERSION,type='event.subscription',binding=dict(subscription_id=identity,
            publisher_service_id=ctx['publisher_service_id'],publisher_database_instance_id=ctx['publisher_database_instance_id'],
            stream_id=ctx['stream_id'],stream_epoch=ctx['stream_epoch'],scope_digest=digest(scope),authorization_revision=ctx['authorization_revision'],connection_generation='0'),
            revision='1',owner=copy.deepcopy(ctx['owner']),purpose=purpose,state='building',ack_cursor='0',ack_payload_digest='0'*64,
            snapshot_ref=None,selection=copy.deepcopy(ctx['selection']),scope=copy.deepcopy(scope))
        self.attempts={};self.transport=None;self.map={};self.last_sent=None;self.checkpoint=None
        self.closed_from=None;self.domain=ctx['publisher_domain'];self.snapshot_deadline=None
        self.boot=ctx['service_boot_id']
        self.inhibited=False;self.credential_binding=None
        validate('channel__SubscriptionView',self.view)

    def check(self,ctx,active=True):
        v=self.view;b=v['binding'];authorize(ctx,v['owner'],v['scope'],v['purpose'],v['selection'])
        for field in ('publisher_service_id','publisher_database_instance_id','stream_id','stream_epoch','authorization_revision'):
            need(ctx[field]==b[field],'binding_changed')
        need(ctx['publisher_domain']==self.domain,'publisher_restarted')
        need(ctx['service_boot_id']==self.boot,'publisher_boot_changed')
        if active:need(v['state'] not in TERMINAL and not self.inhibited,'subscription_terminal_or_inhibited')

    def changed(self):self.view['revision']=inc(self.view['revision'])

    @atomic
    def publish(self,snapshot,deadline,ctx):
        self.check(ctx);validate('channel__SnapshotRef',snapshot)
        need(ctx['snapshot_complete'] and ctx['content_authorized'],'snapshot_provider')
        need(self.view['state']=='building' and ctx['now_tick']<deadline,'snapshot_publish')
        self.view['snapshot_ref']=copy.deepcopy(snapshot);self.snapshot_deadline=min(deadline,ctx['deadline_tick'])
        self.view['state']='snapshot_ready';self.changed()

    @atomic
    def attach(self,request,transport_id,ctx,channel):
        self.check(ctx);validate('channel__ClientAttach',request);validate('channel__ChannelBinding',channel)
        v=self.view;b=v['binding'];owner=v['owner'];attempt=request['connection_attempt_id']
        need(channel['owner']==owner and channel['selection']==v['selection'] and channel['transport']==ctx['transport'],'channel_owner')
        need(channel['publisher_service_id']==b['publisher_service_id'] and channel['publisher_database_instance_id']==b['publisher_database_instance_id']
             and channel['service_boot_id']==ctx['service_boot_id'],'channel_publisher')
        need(channel['subscription_id']==(b['subscription_id'] if owner['kind']=='human' else None),'ticket_subscription')
        need(request['owner']==owner,'attach_owner')
        for key in ('subscription_id','stream_id','stream_epoch','scope_digest','authorization_revision'):
            need(request[key]==b[key],'attach_binding')
        if attempt in self.attempts:
            old=self.attempts[attempt]
            need(old['request']==request and old['transport']==transport_id,'attempt_reused')
            need(self.transport==transport_id and old['response']['binding']==b,'attempt_no_longer_current')
            return copy.deepcopy(old['response'])
        need(request['expected_connection_generation']==b['connection_generation'],'generation_conflict')
        need(self.transport is None or request['replace_existing'],'connection_busy')
        generation=inc(b['connection_generation']);resume=request['resume']
        if resume is None:
            need(v['state'] in ('building','snapshot_ready'),'snapshot_required')
        else:
            need(v['state'] in ('catching_up','live') and ctx['projection_preserved'],'projection_lost')
            need(resume['cursor']==v['ack_cursor'] and resume['payload_digest']==v['ack_payload_digest'],'resume_not_confirmed')
            need(self.map.get(resume['cursor'])==resume['payload_digest'],'retention_lost')
            need(resume['ack_kind']==self.ack_kind(),'ack_kind')
        # 这里模拟一次CAS的提交点；不证明真实writer并发或提交未知处理。
        b['connection_generation']=generation;self.transport=transport_id
        self.credential_binding=ctx['transport_credential_binding']
        if resume is not None:v['state']='catching_up'
        if v['snapshot_ref'] is not None and resume is None:need(ctx['now_tick']<self.snapshot_deadline,'snapshot_expired')
        self.last_sent=v['ack_cursor'] if resume is not None else None
        self.map={v['ack_cursor']:v['ack_payload_digest']} if resume is not None else {}
        self.checkpoint=None;self.changed()
        response=dict(schema_version=B.VERSION,type='server.attached',binding=copy.deepcopy(b),state=v['state'],
            snapshot_ref=copy.deepcopy(v['snapshot_ref']),ack_cursor=v['ack_cursor'],ack_payload_digest=v['ack_payload_digest'])
        validate('channel__ServerAttached',response)
        self.attempts[attempt]=dict(request=copy.deepcopy(request),transport=transport_id,response=copy.deepcopy(response))
        return response

    def attempt_view(self,attempt,ctx):
        self.check(ctx,False);need(attempt in self.attempts,'not_found_or_invisible');a=self.attempts[attempt]
        return dict(subscription_id=self.view['binding']['subscription_id'],connection_attempt_id=attempt,attached=copy.deepcopy(a['response']),
            current=not self.inhibited and self.view['state'] not in TERMINAL and a['transport']==self.transport and a['response']['binding']==self.view['binding'])

    def release(self,binding,transport,ctx):
        self.check(ctx);need(self.transport is not None and self.transport==transport and binding==self.view['binding'],'old_connection')
        need(ctx['transport_credential_binding']==self.credential_binding,'credential_replaced')

    def page(self,binding,transport,snapshot_id,ctx):
        self.release(binding,transport,ctx)
        need(ctx['http_authenticated'] and ctx['content_authorized'],'page_authority')
        need(self.view['snapshot_ref'] is not None and snapshot_id==self.view['snapshot_ref']['snapshot_id'],'snapshot_mismatch')
        need(ctx['now_tick']<self.snapshot_deadline,'snapshot_expired')
        return 'release_fixed_content_only'

    @atomic
    def applied(self,frame,transport,ctx):
        validate('channel__SnapshotApplied',frame);self.release(frame['binding'],transport,ctx)
        need(frame['snapshot']==self.view['snapshot_ref'],'snapshot_mismatch')
        marker=dict(entry_kind='snapshot.baseline',payload=copy.deepcopy(frame['snapshot']))
        cursor=frame['snapshot']['snapshot_cursor'];checksum=digest(marker)
        if self.view['state'] in ('catching_up','live'):
            need(self.map.get(cursor)==checksum,'baseline_lost');return 'duplicate'
        need(ctx['now_tick']<self.snapshot_deadline,'snapshot_expired')
        need(self.view['state']=='snapshot_ready','not_ready')
        self.view.update(state='catching_up',ack_cursor=cursor,ack_payload_digest=checksum)
        self.last_sent=cursor;self.map={cursor:checksum};self.changed();return 'baseline_confirmed'

    def ack_kind(self):return 'durable_ingest' if self.view['purpose']=='canonical_trigger' else 'projection_applied'

    @atomic
    def sent(self,frame,transport,ctx):
        """人工提供者表示已提交给传输层；真实发送及崩溃证明另验。"""
        self.release(frame['binding'],transport,ctx)
        v=self.view;need(v['state'] in ('catching_up','live'),'baseline_required')
        if frame['type']=='server.sync.ready':
            validate('channel__SyncReady',frame);need(v['state']=='catching_up' and self.checkpoint is None,'unexpected_checkpoint')
            need(frame['baseline_snapshot_id']==v['snapshot_ref']['snapshot_id'],'checkpoint_snapshot')
            expected=digest(dict(entry_kind='sync.ready',payload=dict(baseline_snapshot_id=frame['baseline_snapshot_id'])))
            need(frame['delivery_mode']=='reconcile','checkpoint_mode')
        else:
            validate('snapshot__Data',frame)
            need(ctx['content_authorized'],'content_selector')
            need(frame['delivery_mode']==('live' if v['state']=='live' else 'reconcile'),'delivery_mode')
            if frame['entry']['entry_kind']=='source.event':need(v['purpose']=='canonical_trigger','source_event_not_authorized')
            else:
                payload=frame['entry']['payload']
                need(payload['entity_kind'] in [c['entity_kind'] for c in v['scope']['collections']],'collection_outside_scope')
            expected=digest(frame['entry'])
        need(frame['payload_digest']==expected,'payload_digest')
        need(self.last_sent is not None and frame['previous_cursor']==self.last_sent and int(frame['cursor'])>int(self.last_sent),'chain')
        need(len(self.map)<256,'delivery_capacity')
        self.map[frame['cursor']]=expected;self.last_sent=frame['cursor']
        if frame['type']=='server.sync.ready':self.checkpoint=frame['cursor']

    @atomic
    def ack(self,frame,transport,ctx):
        validate('channel__ClientAck',frame);self.release(frame['binding'],transport,ctx)
        need(frame['ack_kind']==self.ack_kind(),'ack_kind')
        need(self.last_sent is not None and int(frame['cursor'])<=int(self.last_sent),'ack_unsent')
        need(self.map.get(frame['cursor'])==frame['payload_digest'],'ack_mapping')
        if int(frame['cursor'])<=int(self.view['ack_cursor']):return 'duplicate'
        self.view.update(ack_cursor=frame['cursor'],ack_payload_digest=frame['payload_digest'])
        if self.checkpoint is not None and int(frame['cursor'])>=int(self.checkpoint):self.view['state']='live'
        self.changed();return 'advanced'

    @atomic
    def close(self,expected,ctx):
        self.check(ctx,False)
        need(ctx['http_authenticated'] and (self.view['owner']['kind']=='service' or ctx['csrf_valid']),'close_identity')
        if self.view['state']=='closed':
            need(expected in (self.closed_from,self.view['revision']),'close_conflict');return copy.deepcopy(self.view)
        need(self.view['state'] not in TERMINAL and expected==self.view['revision'],'close_conflict')
        self.closed_from=expected;self.view['state']='closed';self.transport=None;self.changed();return copy.deepcopy(self.view)

    @atomic
    def invalidate(self,state):
        need(state in TERMINAL,'invalid_terminal')
        if self.view['state'] not in TERMINAL:self.view['state']=state;self.transport=None;self.changed()


class Registry:
    def __init__(self):self.requests={};self.subscriptions={}
    def create(self,request,ctx,identity):
        human=ctx['owner']['kind']=='human';validate('channel__HumanCreate' if human else 'channel__ServiceCreate',request)
        need(ctx['http_authenticated'] and (not human or ctx['csrf_valid']),'create_identity')
        if human:need(request['client_instance_id']==ctx['owner']['client_instance_id'] and ctx['request_context_current']
                      and request['context_id']==ctx['request_context_id'],'client_context')
        else:need(request['consumer_id']==ctx['owner']['consumer_id'],'consumer_slot')
        authorize(ctx,ctx['owner'],request['scope'],request['purpose'],ctx['selection'])
        key=(ctx['publisher_service_id'],ctx['publisher_database_instance_id'],digest(ctx['owner']),
             request.get('context_id',request['purpose']),request.get('idempotency_key',request.get('request_id')))
        if key in self.requests:
            checksum,sid=self.requests[key];need(checksum==digest(request),'idempotency_conflict')
            need(ctx['query_capacity'],'query_capacity');return self.subscriptions[sid],False
        need(ctx['new_capacity'] and ctx['slot_available'],'capacity')
        if not human:need(not any(s.view['owner']==ctx['owner'] and s.view['state'] not in TERMINAL for s in self.subscriptions.values()),'consumer_slot_busy')
        need(identity not in self.subscriptions,'identity_reuse')
        sub=Subscription(identity,ctx,request['scope'],request['purpose']);self.subscriptions[identity]=sub
        self.requests[key]=(digest(request),identity);return sub,True


def logout(subscriptions,issuer,epoch,session):
    for sub in subscriptions:
        o=sub.view['owner']
        if o['kind']=='human' and (o['issuer_id'],o['issuer_epoch'],o['session_id'])==(issuer,epoch,session):
            try:sub.invalidate('revoked')
            except ValueError:
                if not sub.inhibited:raise


def negotiate(protocols,profile,selection):
    validate('channel__Selection',selection)
    contract='leafseamer.contract.'+selection['contract_id']+'.'+selection['contract_digest'][7:]
    need(isinstance(protocols,list) and len(protocols)==(2 if profile=='human_ticket' else 1),'subprotocol_count')
    need(protocols.count(contract)==1,'contract_mismatch')
    if profile=='service_mtls':return contract,None
    need(profile=='human_ticket','transport')
    ticket=next(p for p in protocols if p!=contract)
    need(isinstance(ticket,str) and re.fullmatch(r'leafseamer\.ticket\.[A-Za-z0-9_-]{16,4096}',ticket),'ticket_format')
    return contract,ticket.removeprefix('leafseamer.ticket.')


class Ticket:
    def __init__(self,secret,binding,deadline):
        validate('channel__TicketBinding',binding);need(binding['consumed'] is False,'already_consumed')
        need(isinstance(secret,str) and re.fullmatch(r'[A-Za-z0-9_-]{16,4096}',secret),'ticket_format')
        self.secret_hash=hashlib.sha256(secret.encode()).digest();self.binding=copy.deepcopy(binding);self.deadline=deadline

    def consume(self,protocols,sub,ctx):
        sub.check(ctx);b=self.binding;channel=b['channel'];v=sub.view
        echoed,secret=negotiate(protocols,'human_ticket',v['selection'])
        need(not b['consumed'] and ctx['now_tick']<self.deadline,'ticket_spent_or_expired')
        need(hashlib.sha256(secret.encode()).digest()==self.secret_hash,'ticket_secret')
        need(channel['owner']==v['owner'] and channel['subscription_id']==v['binding']['subscription_id'],'ticket_owner')
        need(channel['selection']==v['selection'] and channel['service_boot_id']==ctx['service_boot_id'],'ticket_selection_or_boot')
        need(channel['publisher_service_id']==ctx['publisher_service_id'] and channel['publisher_database_instance_id']==ctx['publisher_database_instance_id'],'ticket_publisher')
        need(b['scope_digest']==v['binding']['scope_digest'] and b['authorization_revision']==ctx['authorization_revision'] and b['origin']==ctx['origin'],'ticket_binding')
        b['consumed']=True
        return echoed,dict(type='contract.ready',channel=copy.deepcopy(channel))


class ClientOrder:
    """仅验证新候选首帧/附着顺序与绑定；不应用页面或业务payload。"""
    def __init__(self,expected_channel,echoed_protocol,deadline):
        validate('channel__ChannelBinding',expected_channel)
        expected='leafseamer.contract.'+expected_channel['selection']['contract_id']+'.'+expected_channel['selection']['contract_digest'][7:]
        need(echoed_protocol==expected,'wrong_echo')
        self.channel=copy.deepcopy(expected_channel);self.deadline=deadline;self.state='await_ready'
        self.request=None;self.attached=None;self.baseline_declared=False

    def send(self,frame):
        try:
            validate('channel__ClientFrame',frame);need(self.state!='closed','closed')
            if frame['type']=='client.attach':
                need(self.state=='await_attach' and frame['owner']==self.channel['owner'],'attach_order_or_owner')
                need(self.channel['subscription_id'] in (None,frame['subscription_id']),'ticket_subscription')
                self.request=copy.deepcopy(frame);self.state='await_attached';return
            need(self.state=='attached' and frame['binding']==self.attached['binding'],'client_binding')
            if frame['type']=='client.snapshot.applied':self.baseline_declared=True
            else:need(self.baseline_declared,'ack_before_baseline')
        except Exception:self.state='closed';raise

    def receive(self,frame,now):
        try:
            validate('channel__ServerFrame',frame);need(self.state!='closed','closed')
            if self.state=='await_ready':
                need(now<self.deadline and frame==dict(type='contract.ready',channel=self.channel),'first_frame_or_binding')
                self.state='await_attach';return 'transport_ready_only'
            if frame['type']=='server.attached':
                if self.state=='attached':
                    need(frame==self.attached,'attached_changed');return 'duplicate_ignored'
                need(self.state=='await_attached','attached_before_attach');r=self.request;b=frame['binding']
                for k in ('subscription_id','stream_id','stream_epoch','scope_digest','authorization_revision'):need(b[k]==r[k],'attached_binding')
                for k in ('publisher_service_id','publisher_database_instance_id'):need(b[k]==self.channel[k],'attached_publisher')
                need(b['connection_generation']==inc(r['expected_connection_generation']),'attached_generation')
                self.attached=copy.deepcopy(frame);self.state='attached';self.baseline_declared=r['resume'] is not None;return 'attached_only'
            need(self.state=='attached' and frame.get('binding')==self.attached['binding'],'server_order_or_binding')
            if frame['type']=='server.resync.required':self.state='closed';return 'resync_required'
            need(self.baseline_declared and frame['type'] in ('server.data','server.sync.ready'),'data_before_baseline')
            return 'bound_frame_only'
        except Exception:self.state='closed';raise
