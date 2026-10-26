"""用于人员和服务双向订阅的合成输入。"""
import copy
import build as B
import model as M

HEX='a'*64
SELECTION=dict(contract_id='synthetic.events.candidate',contract_digest='sha256:'+'b'*64)
def object_ref(name,kind='selector'):
    return dict(authority_service_id='controller',database_instance_id='database',entity_kind=kind,
        entity_id=name,entity_epoch='epoch',revision='1',content_digest=HEX)


def fixture(service=False,canonical=False):
    owner=dict(kind='service' if service else 'human',issuer_id='issuer',issuer_epoch='issuer-epoch',principal_id='principal')
    if service:owner.update(consumer_service_id='seamer',consumer_database_instance_id='seamer-db',consumer_id='consumer',pairing_id='pairing')
    else:owner.update(session_id='session',client_instance_id='gui')
    kind='sources' if canonical else 'commands'
    scope=dict(scope_id='scope',scope_revision='1',projection_profile_ref=object_ref('profile','projection_profile'),
        collections=[dict(entity_kind=kind,selector_ref=object_ref('selector'),relation_policy='authorized_reference',history_policy='current_and_unresolved')])
    ctx=dict(owner=owner,selection=copy.deepcopy(SELECTION),credential_current=True,authorization_current=True,storage_available=True,
        now_tick=0,deadline_tick=100,publisher_role='controller',publisher_service_id='controller',publisher_database_instance_id='database',
        stream_id='stream',stream_epoch='stream-epoch',authorization_revision='1',publisher_domain='domain-1',service_boot_id='boot-1',
        permissions={'status.read','command.read','event.internal.subscribe'},transport='service_mtls' if service else 'human_ticket',
        allowed_scope_digests={M.digest(scope)},seamer_role=service,canonical_scope_complete=canonical,projection_preserved=True,
        request_context_current=True,request_context_id='context',new_capacity=True,query_capacity=True,slot_available=True,snapshot_complete=True,content_authorized=True,
        http_authenticated=True,csrf_valid=True,origin='https://control.invalid',transport_credential_binding='credential-1')
    request=dict(scope=scope,purpose='canonical_trigger' if canonical else 'status_projection')
    if service:request.update(request_id='request',consumer_id='consumer')
    else:request.update(context_id='context',idempotency_key='request',client_instance_id='gui')
    registry=M.Registry();sub,_=registry.create(request,ctx,'subscription')
    return registry,sub,ctx,request


def channel(sub,ctx):
    return dict(binding_id='channel',selection=copy.deepcopy(ctx['selection']),publisher_service_id=ctx['publisher_service_id'],
        publisher_database_instance_id=ctx['publisher_database_instance_id'],service_boot_id=ctx['service_boot_id'],owner=copy.deepcopy(ctx['owner']),
        subscription_id=sub.view['binding']['subscription_id'] if ctx['owner']['kind']=='human' else None,transport=ctx['transport'])


def attach(sub,ctx,attempt='attempt',resume=None):
    b=sub.view['binding']
    return dict(schema_version=B.VERSION,type='client.attach',owner=copy.deepcopy(ctx['owner']),
        **{k:b[k] for k in ('subscription_id','stream_id','stream_epoch','scope_digest','authorization_revision')},
        expected_connection_generation=b['connection_generation'],replace_existing=True,resume=copy.deepcopy(resume),connection_attempt_id=attempt)


def baseline(sub,ctx):
    sub.publish(dict(snapshot_id='snapshot',manifest_digest=HEX,snapshot_cursor='9007199254740993'),30,ctx)
    request=attach(sub,ctx);sub.attach(request,'socket-1',ctx,channel(sub,ctx))
    applied=dict(schema_version=B.VERSION,type='client.snapshot.applied',binding=copy.deepcopy(sub.view['binding']),snapshot=copy.deepcopy(sub.view['snapshot_ref']))
    sub.applied(applied,'socket-1',ctx);return request,applied


def checkpoint(sub):
    entry=dict(entry_kind='sync.ready',payload=dict(baseline_snapshot_id=sub.view['snapshot_ref']['snapshot_id']))
    return dict(schema_version=B.VERSION,type='server.sync.ready',binding=copy.deepcopy(sub.view['binding']),
        baseline_snapshot_id=entry['payload']['baseline_snapshot_id'],cursor=M.inc(sub.last_sent),previous_cursor=sub.last_sent,
        payload_digest=M.digest(entry),delivery_mode='reconcile')


def ack(sub,frame):
    return dict(schema_version=B.VERSION,type='client.ack',binding=copy.deepcopy(sub.view['binding']),
        cursor=frame['cursor'],payload_digest=frame['payload_digest'],ack_kind=sub.ack_kind())


def data(sub):
    if sub.view['purpose']=='canonical_trigger':
        record=copy.deepcopy(B.load(B.ROOT.parent/'event-projection/source/snapshot-cases.json')['records']['sources'])
    else:record=copy.deepcopy(B.load(B.ROOT.parent/'event-projection/examples.json')['records']['queued'])
    entry=dict(entry_kind='entity.upsert',payload=record)
    return dict(format_version='snapshot-projection/0.2.0-draft.1',type='server.data',binding=copy.deepcopy(sub.view['binding']),
        cursor=M.inc(sub.last_sent),previous_cursor=sub.last_sent,delivery_mode='live' if sub.view['state']=='live' else 'reconcile',
        entry=entry,payload_digest=M.digest(entry))


def examples():
    _,sub,ctx,request=fixture();create_view=copy.deepcopy(sub.view)
    attach_request,applied=baseline(sub,ctx);data_frame=data(sub);sub.sent(data_frame,'socket-1',ctx)
    checkpoint_frame=checkpoint(sub)
    resync=dict(schema_version=B.VERSION,type='server.resync.required',binding=copy.deepcopy(sub.view['binding']),
        reason_code='authorization_changed',last_confirmed_cursor=sub.view['ack_cursor'])
    _,service,peer,service_request=fixture(True,True)
    return dict(human_create=request,service_create=service_request,human_view=create_view,service_view=service.view,
        client_frames=[attach_request,applied,ack(sub,data_frame)],
        server_frames=[dict(type='contract.ready',channel=channel(sub,ctx)),sub.attempts['attempt']['response'],data_frame,checkpoint_frame,resync])
