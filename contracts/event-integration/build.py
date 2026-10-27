"""完整HTTP/订阅/投影/注册/worker模型的新选择组合；保留旧组合原件。"""
import argparse
import copy
import importlib.util
import json
from pathlib import Path
import re
import rfc8785
ROOT=Path(__file__).resolve().parent;SDK=ROOT.parents[1]
spec=importlib.util.spec_from_file_location('composition',ROOT.parent/'composition/compose.py')
C=importlib.util.module_from_spec(spec);spec.loader.exec_module(C)
SID='https://leafseamer.invalid/sdk/event-integration/0.1/models.schema.json'
CID='leafseamer.api.v1.events2'
OLD_CID='leafseamer.api.v1.integration1'
P='#/$defs/'
REF_KEYS={'$ref','x-first-server-frame-schema','x-client-frame-schema','x-server-frame-schema','selection_schema','schema_ref'}
REPLACED={('/api/v1/events','get'):'openEvents',('/api/v1/subscriptions','post'):'createSubscription',
    ('/api/v1/subscriptions/{subscription_id}/snapshot','get'):'getSnapshot',('/api/v1/ws-tickets','post'):'issueWsTicket'}


def load(path):return C.decode(path.read_bytes())
def digest(value):return 'sha256:'+C.sha(rfc8785.dumps(value))
def ref(name):return {'$ref':P+name}


def rewrite(value,replace,mapping=False):
    if isinstance(value,list):return [rewrite(v,replace) for v in value]
    if not isinstance(value,dict):return value
    if mapping:return {k:rewrite(v,replace) for k,v in value.items()}
    return {k:replace(v) if k in REF_KEYS and isinstance(v,str) else copy.deepcopy(v) if k in C.DATA else rewrite(v,replace,k in C.MAP_KEYS) for k,v in value.items()}


def local_ref(value):
    if value.startswith('#/components/schemas/'):return P+value.removeprefix('#/components/schemas/')
    return value


def portable(value):
    return rewrite(value,lambda r:'#/components/schemas/'+r.removeprefix(P) if r.startswith(P) else r)


def operation(op,profile=None):
    result=copy.deepcopy(op)
    is_ws=result['operationId'] in ('openEvents','internalOpenEvents')
    for param in result.get('parameters',[]):
        if param.get('in')=='header' and param['name']=='X-LeafSeamer-Contract':param['schema']={'const':CID}
    for status,response in result['responses'].items():
        for name,header in response.get('headers',{}).items():
            if name=='X-LeafSeamer-Contract':header['schema']={'const':CID}
        if status=='101':response['headers']['Sec-WebSocket-Protocol']['schema']={'type':'string','pattern':r'^leafseamer\.contract\.'+re.escape(CID)+r'\.[0-9a-f]{64}(?![\s\S])'}
    if is_ws:
        result['x-offered-subprotocols']=['leafseamer.contract.'+CID+'.<64-lowercase-hex>']+(['leafseamer.ticket.<base64url>'] if profile=='human' else [])
        result['x-first-server-frame-schema']=P+'channel__Ready'
    if result['operationId']!='discoverContracts':
        existing=result.get('x-contract-selection',{})
        result['x-contract-selection']=dict(existing,transport='websocket-subprotocol' if is_ws else 'http-headers',
            selection_schema=SID+P+'negotiation__Selection',authorization_granted=False)
    return result


def compose(base,extension,subscription,apis,ipc,messages):
    definitions=copy.deepcopy(base['$defs']);original=copy.deepcopy(definitions)
    shared=sorted(definitions.keys() & extension['$defs'].keys())
    for name in shared:C.require(definitions[name]==extension['$defs'][name],'模型重名但不等价:'+name)
    definitions.update(copy.deepcopy(extension['$defs']));changes={}
    for name,value in definitions.items():
        if value.get('properties',{}).get('protocol_version')=={'const':OLD_CID}:
            value['properties']['protocol_version']={'const':CID};changes[name]='完整选择身份显式升级，其他字段不变'
    definitions['negotiation__Selection']['properties']['contract_id']={'const':CID}
    changes['negotiation__Selection']='只接受本候选完整选择ID；摘要仍由运行时精确核对'
    definitions['channel__Selection']=ref('negotiation__Selection');changes['channel__Selection']='订阅及注册绑定同一完整选择'
    for old,new in [('baseline__WsFrame','channel__ServerFrame'),('negotiation__WsReady','channel__Ready'),('negotiation__WsData','snapshot__Data')]:
        definitions[old]=ref(new);changes[old]='显式改绑当前订阅帧根:'+new
    C.closure(definitions,{'$defs':definitions})
    C.require(all(v==definitions[n] for n,v in original.items() if n.startswith('command__')),'worker命令语义漂移')
    graph=dict(base,**{'$id':SID,'title':CID,'$defs':definitions,'x-approved':False,'x-runtime-ready':False,'x-advertisable':False})
    outputs={'models.schema.json':graph};inventory=[];replacements=[]
    newpaths=rewrite(subscription['paths'],local_ref)
    for role,source_api in apis.items():
        api=copy.deepcopy(source_api);paths=rewrite(api['paths'],local_ref);seen=set()
        for path,methods in newpaths.items():
            for method,raw in methods.items():
                previous=paths.get(path,{}).get(method)
                if previous is not None:
                    C.require((path,method) in REPLACED and previous['operationId']==REPLACED[(path,method)],'未裁决路由冲突')
                    seen.add((path,method));replacements.append(dict(authority=role,path=path,method=method,
                        old_operation_id=previous['operationId'],old_operation_digest=digest(previous),new_operation_id=raw['operationId']))
                else:C.require((path,method) not in REPLACED,'预期旧入口缺失')
                op=copy.deepcopy(raw)
                op['security']=[{'events__'+name:value for name,value in choice.items()} for choice in op['security']]
                paths.setdefault(path,{})[method]=op
        C.require(seen==set(REPLACED),'替换入口集合不完整')
        scheme=api['components']['securitySchemes']
        for name,value in subscription['components']['securitySchemes'].items():
            target='events__'+name;C.require(target not in scheme,'安全方案重名');scheme[target]=copy.deepcopy(value)
        ids=set();normalized=set()
        for path,methods in paths.items():
            for method,op in list(methods.items()):
                C.require(method in C.METHODS,'不支持的路径项字段')
                C.require(op['operationId'] not in ids,'重复operationId');ids.add(op['operationId'])
                key=(method,re.sub(r'\{[^}]+\}','{}',path));C.require(key not in normalized,'参数别名路由冲突');normalized.add(key)
                profile=op.get('x-owner-profile');updated=operation(op,profile);methods[method]=updated
                transport='discovery' if op['operationId']=='discoverContracts' else 'websocket' if op['operationId'] in ('openEvents','internalOpenEvents') else 'http'
                inventory.append(dict(authority=role,path=path,method=method,operation_id=op['operationId'],transport=transport,
                    source='subscription' if method in newpaths.get(path,{}) else 'base'))
                for choice in updated.get('security',[]):C.require(set(choice)<=scheme.keys(),'安全方案未绑定')
        # 整个图按相同名字投影，避免x-frame等具名根被闭包剪掉。
        api['paths']=portable(paths);api['components']['schemas']=portable(definitions)
        api['info']['version']=CID;api['x-canonical-model-graph']=SID
        api['x-approved']=False;api['x-runtime-ready']=False;api['x-advertisable']=False
        api['x-release-blockers']=['规范摄取与执行事务仍待接线','真实认证传输及GUI未验收','全系统设计门槛及候选批准未完成']
        outputs[role+'.openapi.json']=api
    old_id=base['$id']
    def relocate(r):return r.replace(old_id,SID,1) if r.startswith(old_id+P) else r
    ipc=rewrite(ipc,relocate);ipc['$id']=SID.replace('models','worker-ipc');outputs['worker-ipc.schema.json']=ipc
    outputs['worker-messages.json']=rewrite(messages,relocate)
    outputs['frames.schema.json']={'$schema':graph['$schema'],'$id':SID.replace('models','frames'),
        'oneOf':[{'$ref':SID+P+'channel__'+name} for name in ('ClientFrame','ServerFrame')]}
    outputs['routing.json']=dict(format='event-integration-routing/1',approved=False,operations=inventory,replacements=replacements)
    outputs['model-map.json']=dict(format='event-integration-model-map/1',approved=False,shared_identical=shared,
        added=sorted(set(definitions)-set(original)),changed=changes,
        unchanged=sorted(n for n in original if n not in changes),worker_semantics_unchanged=True)
    mapping=load(ROOT.parent/'scope-registry/preview/mapping.json')
    for name in mapping['collection_models'].values():
        C.require(C.closure(definitions,ref(name))==C.closure(extension['$defs'],ref(name)),'投影视图闭包漂移:'+name)
    outputs['registry-map.json']=mapping
    return outputs


def build():
    source=load(ROOT/'sources.json');C.require(source['approved'] is False,'来源不能自行批准')
    for path,checksum in source['inputs'].items():C.require(C.sha((SDK/path).read_bytes())==checksum,'来源漂移:'+path)
    base=ROOT.parent/'negotiation/preview'
    outputs=compose(load(base/'models.schema.json'),load(ROOT.parent/'scope-registry/preview/models.schema.json'),
        load(ROOT.parent/'event-channel/preview/subscriptions.openapi.json'),
        {role:load(base/(role+'.openapi.json')) for role in ('controller','seamer')},
        load(base/'worker-ipc.schema.json'),load(base/'worker-messages.json'))
    policy=load(ROOT/'policy.json');C.require(policy['contract_id']==CID and policy['approved'] is False and policy['runtime_ready'] is False,'候选政策漂移')
    hashes={n:C.sha(C.encode(v)) for n,v in sorted(outputs.items())}
    hashes.update({name:C.sha((ROOT/name).read_bytes()) for name in ('policy.json','PROTOCOL.md')})
    manifest=dict(format='sdk-contract-artifacts/1',contract_id=CID,approved=False,runtime_ready=False,advertisable=False,
        artifact_digest_algorithm='sha256-bytes',selection_digest_algorithm='sha256-jcs-manifest',artifacts=hashes)
    outputs['manifest.json']=manifest;outputs['selection.json']=dict(contract_id=CID,contract_digest=digest(manifest))
    return outputs


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--output',type=Path);a=p.parse_args();o=build()
    if a.output:
        a.output.mkdir(exist_ok=False)
        for n,v in o.items():(a.output/n).write_bytes(C.encode(v))
    print(json.dumps(dict(selection=o['selection.json'],models=len(o['models.schema.json']['$defs']),operations=len(o['routing.json']['operations']),approved=False)))
