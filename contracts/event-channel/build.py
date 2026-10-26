"""人员和服务订阅的同源HTTP/双向消息设计切片，不生成可广告发行组合。"""
import argparse
import copy
import importlib.util
import json
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parent;SDK=ROOT.parents[1]
s=importlib.util.spec_from_file_location('composition',ROOT.parent/'composition/compose.py')
C=importlib.util.module_from_spec(s);s.loader.exec_module(C)
SID='https://leafseamer.invalid/sdk/event-channel/0.1/models.schema.json'
VERSION='event-channel/0.1.0-draft.1';P='#/$defs/'
def load(p):return C.decode(p.read_bytes())
def ref(n):return {'$ref':P+n}
def obj(**p):return dict(type='object',properties=p,required=list(p),additionalProperties=False)
def enum(*v):return {'enum':list(v)}
def const(v):return {'const':v}
def null(v):return {'oneOf':[v,{'type':'null'}]}
def array(v,max=256,min=0):return dict(type='array',items=v,minItems=min,maxItems=max)
def add(d,**fields):d['properties'].update(fields);d['required']+=list(fields)

COLLECTIONS={
 'devices':(['controller'],'device.read'), 'catalogs':(['controller'],'device.read'),
 'commands':(['controller'],'command.read'), 'controls':(['controller'],'control.read'),
 'observations':(['controller'],'device.read'), 'sources':(['controller','seamer'],'status.read'),
 'definitions':(['seamer'],'definition.read'), 'runs':(['seamer'],'run.read'),
 'business_states':(['seamer'],'run.read'), 'executions':(['seamer'],'run.read'),
 'schedule_activations':(['seamer'],'run.read'), 'occurrences':(['seamer'],'run.read')}


def build():
    source=load(ROOT/'sources.json')
    for n,h in source['inputs'].items():C.require(C.sha((SDK/n).read_bytes())==h,'SDK来源漂移')
    raw=(ROOT/'source/service-subscription.schema.json').read_bytes()
    C.require(C.sha(raw)==source['source_sha256'],'订阅来源漂移')
    old=C.decode(raw);d=copy.deepcopy(load(ROOT.parent/'event-projection/preview/models.schema.json')['$defs'])
    for name,v in old['$defs'].items():
        d['channel__'+name]=C.refs(v,lambda r:P+'channel__'+r.removeprefix(P))
    # 这两个来源Binding的字段和接受集均相同；逐节点证明后只保留一个引用。
    def denamespace(v):return C.refs(v,lambda r:P+r.split('__',1)[1])
    for name in ('Id','Counter','Digest','DeliveryBinding'):
        C.require(denamespace(d['channel__'+name])==denamespace(d['snapshot__'+name]),'公共类型不等价:'+name)
        d['channel__'+name]=ref('snapshot__'+name)
    service=d['channel__ServiceOwner'];add(service,kind=const('service'))
    d['channel__HumanOwner']=obj(kind=const('human'),**{k:ref('channel__Id') for k in
        ('issuer_id','issuer_epoch','principal_id','session_id','client_instance_id')})
    d['channel__Owner']={'oneOf':[ref('channel__HumanOwner'),ref('channel__ServiceOwner')]}
    for name in ('SubscriptionView','ClientAttach'):
        d['channel__'+name]['properties']['owner']=ref('channel__Owner')
    for name in ('SubscriptionView','ClientAttach','ServerAttached','ClientAck','SnapshotApplied','SyncReady','ResyncRequired'):
        d['channel__'+name]['properties']['schema_version']=const(VERSION)
    d['channel__Selection']=obj(contract_id=dict(type='string',minLength=1,maxLength=128,pattern=r'^[A-Za-z0-9._-]+(?![\s\S])'),
        contract_digest=dict(type='string',pattern=r'^sha256:[0-9a-f]{64}(?![\s\S])'))
    d['channel__CollectionSelection']=obj(entity_kind=ref('snapshot__EntityKind'),selector_ref=ref('snapshot__ObjectRef'),
        relation_policy=enum('required_in_scope','authorized_reference'),
        history_policy=enum('current','current_and_unresolved','bounded_history_and_unresolved'))
    d['channel__ScopeSpec']=obj(scope_id=ref('channel__Id'),scope_revision=ref('channel__Counter'),
        projection_profile_ref=ref('snapshot__ObjectRef'),collections=array(ref('channel__CollectionSelection'),12,1))
    d['channel__HumanCreate']=obj(context_id=ref('channel__Id'),idempotency_key=ref('channel__Id'),
        client_instance_id=ref('channel__Id'),purpose=const('status_projection'),scope=ref('channel__ScopeSpec'))
    d['channel__ServiceCreate']=obj(request_id=ref('channel__Id'),consumer_id=ref('channel__Id'),
        purpose=enum('status_projection','canonical_trigger'),scope=ref('channel__ScopeSpec'))
    d['channel__Close']=obj(expected_revision=ref('channel__Counter'))
    add(d['channel__SubscriptionView'],selection=ref('channel__Selection'),scope=ref('channel__ScopeSpec'))
    d['channel__SubscriptionView']['properties']['type']=const('event.subscription')
    d['channel__SubscriptionView']['allOf']=[{'if':{'properties':{'owner':{'properties':{'kind':const('human')}}}},
        'then':{'properties':{'purpose':const('status_projection')}}}]
    d['channel__AttemptView']=obj(subscription_id=ref('channel__Id'),connection_attempt_id=ref('channel__Id'),
        attached=ref('channel__ServerAttached'),current=dict(type='boolean'))
    d['channel__ChannelBinding']=obj(binding_id=ref('channel__Id'),selection=ref('channel__Selection'),
        publisher_service_id=ref('channel__Id'),publisher_database_instance_id=ref('channel__Id'),service_boot_id=ref('channel__Id'),
        owner=ref('channel__Owner'),subscription_id=null(ref('channel__Id')),transport=enum('human_ticket','service_mtls'))
    d['channel__ChannelBinding']['allOf']=[
        {'if':{'properties':{'transport':const('human_ticket')}},'then':{'properties':{'owner':ref('channel__HumanOwner'),'subscription_id':ref('channel__Id')}},
         'else':{'properties':{'owner':ref('channel__ServiceOwner'),'subscription_id':{'type':'null'}}}}]
    d['channel__Ready']=obj(type=const('contract.ready'),channel=ref('channel__ChannelBinding'))
    d['channel__TicketRequest']=obj(context_id=ref('channel__Id'),idempotency_key=ref('channel__Id'),
        subscription_id=ref('channel__Id'),expected_authorization_revision=ref('channel__Counter'),scope_digest=ref('channel__Digest'),
        client_instance_id=ref('channel__Id'),origin=dict(type='string',pattern=r'^https://',format='uri'),selection=ref('channel__Selection'))
    d['channel__TicketBinding']=obj(channel=ref('channel__ChannelBinding'),authorization_revision=ref('channel__Counter'),
        scope_digest=ref('channel__Digest'),origin=dict(type='string',pattern=r'^https://',format='uri'),
        expires_at=ref('snapshot__Timestamp'),consumed=dict(type='boolean'))
    d['channel__TicketBinding']['properties']['channel']={'allOf':[ref('channel__ChannelBinding'),{'properties':{'transport':const('human_ticket')}}]}
    d['channel__TicketIssued']=obj(binding=ref('channel__TicketBinding'),ticket=dict(type='string',minLength=16,maxLength=4096,pattern=r'^[A-Za-z0-9_-]+(?![\s\S])'))
    d['channel__Error']=obj(code=enum('invalid_request','authentication_required','forbidden','not_found_or_invisible','conflict',
        'gone','binding_invalid','payload_too_large','invalid_scope','capacity_exceeded','source_unavailable'),
        request_id=ref('channel__Id'),retry_action=enum('do_not_retry','query_original','resubscribe','read_current'))
    d['channel__SelectionError']=obj(negotiation_protocol=const('contract-selection/1'),
        code=enum('CONTRACT_SELECTION_INVALID','CONTRACT_NOT_SUPPORTED','CONTRACT_BINDING_MISMATCH'),
        request_id=ref('channel__Id'),domain_evaluated=const(False),retry_advice=const('do_not_retry'))
    d['channel__ClientFrame']={'oneOf':[ref('channel__'+n) for n in ('ClientAttach','SnapshotApplied','ClientAck')]}
    d['channel__ServerFrame']={'oneOf':[ref('channel__'+n) for n in ('Ready','ServerAttached','SyncReady','ResyncRequired')]+[ref('snapshot__Data')]}
    # 检查点entry与baseline entry具名封闭；外层connection binding不参与内容摘要。
    d['channel__BaselineEntry']=obj(entry_kind=const('snapshot.baseline'),payload=ref('channel__SnapshotRef'))
    d['channel__SyncEntry']=obj(entry_kind=const('sync.ready'),payload=obj(baseline_snapshot_id=ref('channel__Id')))
    C.closure(d,{'$defs':d})
    models={'$schema':'https://json-schema.org/draft/2020-12/schema','$id':SID,'title':VERSION,'not':{},'$defs':d,'x-approved':False}
    paths={};operations=[]
    for profile,prefix in [('human','/api/v1'),('service','/internal')]:
        routes=[('post','/subscriptions','createSubscription','HumanCreate' if profile=='human' else 'ServiceCreate','channel__SubscriptionView',[200,202]),
            ('get','/subscriptions/{subscription_id}','getSubscription',None,'channel__SubscriptionView',[200]),
            ('delete','/subscriptions/{subscription_id}','closeSubscription',None,'channel__SubscriptionView',[200]),
            ('get','/subscriptions/{subscription_id}/connections/{attempt_id}','getSubscriptionConnection',None,'channel__AttemptView',[200]),
            ('get','/subscriptions/{subscription_id}/snapshot','getSnapshot',None,'snapshot__Manifest',[200]),
            ('get','/subscriptions/{subscription_id}/snapshots/{snapshot_id}/pages/{page_index}','getSnapshotPage',None,'snapshot__PageResponse',[200]),
            ('get','/events','openEvents',None,None,[101])]
        if profile=='human':routes.append(('post','/ws-tickets','issueWsTicket','TicketRequest',None,[200,201]))
        for verb,path,operation,request,response,success in routes:
            operation=operation if profile=='human' else 'internal'+operation[0].upper()+operation[1:]
            full=prefix+path;is_ws=path=='/events'
            params=[dict(name=n,**{'in':'path'},required=True,schema=dict(type='integer',minimum=0,maximum=127) if n=='page_index' else ref('channel__Id')) for n in re.findall(r'{([^}]+)}',path)]
            if verb=='delete':params.append(dict(name='expected_revision',**{'in':'query'},required=True,schema=ref('channel__Counter')))
            if path.endswith('/snapshot') or '/pages/' in path:
                params.append(dict(name='expected_connection_generation',**{'in':'query'},required=True,schema=ref('channel__Counter')))
            if not is_ws:
                params += [dict(name=n,**{'in':'header'},required=True,schema=copy.deepcopy(d['channel__Selection']['properties'][field]))
                           for n,field in [('X-LeafSeamer-Contract','contract_id'),('X-LeafSeamer-Contract-Digest','contract_digest')]]
            if profile=='human':params.append(dict(name='Origin',**{'in':'header'},required=True,schema=dict(type='string',pattern='^https://',format='uri')))
            security={'serviceMtls':[]} if profile=='service' else {'wsTicketHeader':[]} if is_ws else {'humanBearer':[]}
            if profile=='human' and verb in ('post','delete'):security['csrfHeader']=[]
            responses={}
            errors={400:'invalid_request',401:'authentication_required',403:'forbidden',404:'not_found_or_invisible',409:'conflict',410:'gone',412:'binding_invalid',413:'payload_too_large',422:'invalid_scope',429:'capacity_exceeded',503:'source_unavailable'}
            for status in success+list(errors):
                shape=ref(response) if response and status in success else ref('channel__Error')
                if operation=='issueWsTicket' and status in success:shape=ref('channel__TicketIssued' if status==201 else 'channel__TicketBinding')
                if status in errors:shape={'allOf':[shape,{'properties':{'code':const(errors[status])}}]}
                if status in (400,409):shape={'anyOf':[shape,{'allOf':[ref('channel__SelectionError'),
                    {'properties':{'code':const('CONTRACT_SELECTION_INVALID') if status==400 else enum('CONTRACT_NOT_SUPPORTED','CONTRACT_BINDING_MISMATCH')}}]}]}
                r={'description':'可靠受理、当前读取或明确拒绝；不授予设备执行资格','headers':{'Cache-Control':{'schema':const('no-store')}}}
                if status!=101:r['content']={'application/json':{'schema':shape}}
                else:r['headers']['Sec-WebSocket-Protocol']={'schema':dict(type='string',pattern=r'^leafseamer\.contract\.[A-Za-z0-9._-]+\.[0-9a-f]{64}(?![\s\S])')}
                if status!=101:
                    for header,field in [('X-LeafSeamer-Contract','contract_id'),('X-LeafSeamer-Contract-Digest','contract_digest')]:
                        r['headers'][header]={'schema':copy.deepcopy(d['channel__Selection']['properties'][field]),'x-required-after-selection':True}
                responses[str(status)]=r
            op=dict(operationId=operation,parameters=params,security=[security],responses=responses)
            op.update({'x-authorities':['controller','seamer'],'x-owner-profile':profile,'x-permission':'status.read' if profile=='human' else 'event.internal.subscribe',
                'x-collection-authorization-required':True,'x-release-recheck-required':True,'x-automatic-write-retry':False})
            if request:op['requestBody']={'required':True,'content':{'application/json':{'schema':ref('channel__'+request)}}}
            if is_ws:op.update({'x-client-frame-schema':P+'channel__ClientFrame','x-server-frame-schema':P+'channel__ServerFrame',
                'x-subprotocol-count':2 if profile=='human' else 1,'x-secret-ticket-required':profile=='human'})
            paths.setdefault(full,{})[verb]=op;operations.append(dict(profile=profile,method=verb,path=full,operation_id=operation))
    # x-frame引用也显式转换，不能遗留生成器未识别的内部指针。
    def local(value):
        if isinstance(value,list):return [local(x) for x in value]
        if not isinstance(value,dict):return value
        return {k:(v.replace(P,'#/components/schemas/',1) if k in ('$ref','x-client-frame-schema','x-server-frame-schema') else
                   copy.deepcopy(v) if k in C.DATA else local(v)) for k,v in value.items()}
    api={'openapi':'3.1.1','info':{'title':'LeafSeamer 人员与服务订阅候选','version':VERSION},'x-approved':False,
         'x-canonical-model-graph':SID,'x-advertisable':False,'paths':local(paths),
         'components':{'schemas':local(d),'securitySchemes':{'humanBearer':{'type':'http','scheme':'bearer'},'csrfHeader':{'type':'apiKey','in':'header','name':'X-CSRF-Token'},
            'serviceMtls':{'type':'mutualTLS'},'wsTicketHeader':{'type':'apiKey','in':'header','name':'Sec-WebSocket-Protocol'}}}}
    channel={'$schema':models['$schema'],'$id':SID.replace('models','frames'),
             'oneOf':[{'$ref':SID+P+'channel__'+n} for n in ('ClientFrame','ServerFrame')]}
    policy=dict(format='event-channel-policy/1',approved=False,operations=operations,
        collection_permissions={n:dict(authorities=a,permission=p) for n,(a,p) in COLLECTIONS.items()},
        subscription_frame_version=VERSION,snapshot_frame_version='snapshot-projection/0.2.0-draft.1',
        requires_new_full_contract_selection=True,runtime_ready=False)
    return {'models.schema.json':models,'subscriptions.openapi.json':api,'frames.schema.json':channel,'policy.json':policy}


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--output',type=Path);a=p.parse_args();o=build()
    if a.output:
        a.output.mkdir(exist_ok=False)
        for n,v in o.items():(a.output/n).write_bytes(C.encode(v))
    print(json.dumps(dict(models=len(o['models.schema.json']['$defs']),operations=len(o['policy.json']['operations']),approved=False)))
