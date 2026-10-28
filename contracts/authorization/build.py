"""完整HTTP调用授权设计清单；仅编译固定策略，不验证实际凭据。"""
import hashlib
import json
from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parent;SDK=ROOT.parents[1]
sys.path.insert(0,str(ROOT))
from policy import branches,ADDITIONAL_GUARDS
from providers import PROVIDERS,GUARD_PROVIDERS
def load(p):return json.loads(Path(p).read_bytes())
def sha(b):return hashlib.sha256(b).hexdigest()
def encoded(v):return (json.dumps(v,ensure_ascii=False,indent=2)+'\n').encode()
def need(ok,reason):
    if not ok:raise ValueError(reason)

SCHEME_PROFILES={
 'baseline_controller__bearerAuth':['human','service','seamer','provider'],
 'baseline_seamer__bearerAuth':['human','service','seamer','provider'],
 'command__bearerAuth':['human','seamer'], 'command__serviceBearer':['seamer'],
 'lifecycle__serviceToken':['service'], 'ingress__ProviderBearer':['provider'],
 'baseline_controller__sessionCookie':['cookie'], 'baseline_controller__csrfHeader':['cookie'],
 'events__wsTicketHeader':['ticket']
}
for name in ['time_public__humanBearer','command__humanBearer','control__humanBearer','installation__humanBearer','panel__humanBearer','subscription__humanBearer','events__humanBearer','lifecycle__humanSession','command__csrfToken','control__csrf','installation__sessionCsrf','panel__sessionCsrf','subscription__sessionCsrf','events__csrfHeader','lifecycle__csrf']:
    SCHEME_PROFILES[name]=['human']
for name in ['baseline_controller__serviceMtls','baseline_seamer__serviceMtls','time_internal__pairedMTLS','continuation_controller__InternalMTLS','continuation_seamer__InternalMTLS','preparation__InternalMTLS','protection__InternalMTLS','events__serviceMtls','ingress__InternalMTLS']:
    SCHEME_PROFILES[name]=['internal']

def build():
    sources=load(ROOT/'sources.json')
    for p,h in sources['inputs'].items():need(sha((SDK/p).read_bytes())==h,'SDK来源漂移:'+p)
    for p,item in sources['copied_sources'].items():need(sha((SDK/p).read_bytes())==item['sha256'],'复制来源漂移:'+p)
    inv=load(SDK/'contracts/http-envelope/preview/inventory.json');legacy=load(ROOT/'source/legacy-authorization.json')
    guards=dict(legacy['guard_registry'],**ADDITIONAL_GUARDS)
    need(set(guards)==set(GUARD_PROVIDERS),'守卫提供者未完整登记')
    need(all(set(v)<=set(PROVIDERS) and v for v in GUARD_PROVIDERS.values()),'提供者未知')
    operations=[];changes=[];seen=set()
    for op in inv['operations']:
        key=op['authority']+':'+op['operation_id'];need(key not in seen,'重复操作');seen.add(key)
        e=op['extensions'];permission=e.get('x-permission',e.get('x-required-permission'))
        need(not ('x-permission' in e and 'x-required-permission' in e) or e['x-permission']==e['x-required-permission'],'权限冲突')
        plans=[];covered=set()
        for b in branches(op,legacy):
            need(set(b['guards'])<=set(guards),'未知守卫');profile=b['profile'];alternatives=[]
            for index,requirement in enumerate(op['security']):
                need(requirement and all(not scopes for scopes in requirement.values()),'不支持的空认证或OAuth范围')
                need(set(requirement)<=set(SCHEME_PROFILES),'未知认证方案')
                if all(profile in SCHEME_PROFILES[n] for n in requirement):
                    alternatives.append(index);covered.add(index)
            if not op['security']:need(profile in ['bootstrap','login','discovery'],'无认证不得创建已认证主体')
            else:need(alternatives,'主体与实际认证分支冲突')
            providers=list(dict.fromkeys(['capacity']+([] if profile=='discovery' else ['identity','permission','object'])+[p for g in b['guards'] for p in GUARD_PROVIDERS[g]]))
            if profile in ['bootstrap','login']:providers=[p for p in providers if p not in ['identity','permission','object']]
            plans.append(dict(b,security_alternatives=alternatives,providers=providers))
        need(covered==set(range(len(op['security']))),'遗漏认证分支')
        mode='public_discovery' if op['operation_id']=='discoverContracts' else 'pre_identity_purpose' if plans[0]['profile'] in ['bootstrap','login'] else 'named_permission' if permission else 'bound_object_and_method'
        need(permission is not None or mode in ['public_discovery','bound_object_and_method'],'权限缺失')
        statuses={} if mode=='public_discovery' else dict(unauthenticated='401',forbidden='403',context_unavailable='503')
        need(set(statuses.values())<=set(op['responses']),'失败响应缺失')
        operations.append(dict(key=key,authority=op['authority'],operation_id=op['operation_id'],method=op['method'],path=op['path'],transport=op['transport'],
            source_document=e.get('x-composition-source',{}).get('document','events_or_discovery'),security=op['security'],permission=permission,permission_mode=mode,branches=plans,
            checkpoints=(['admission','before_authoritative_commit','before_response_release']+(['before_frame_release'] if op['transport']=='websocket-subprotocol' else [])) if mode!='public_discovery' else ['public_metadata_release'],
            source_requirements={k:v for k,v in e.items() if k in ['x-subject-profiles','x-principal-profiles','x-subject-kinds','x-required-guards','x-owner-profile','x-current-object-authorization-required','x-current-object-authorization','x-collection-authorization-required','x-release-recheck-required','x-host-only','x-internal-only','x-required-peer-role','x-required-origin-ownership','x-force-permission','x-origin-policy']},
            failure_statuses=statuses,authorization_granted=False))
        old=legacy['operations'].get(key)
        if old is None:changes.append(dict(key=key,kind='new_operation'))
        elif old['permission']!=permission or old['branches']!=[{k:b[k] for k in ['profile','origin','guards']} for b in plans]:
            changes.append(dict(key=key,kind='explicit_current_binding',previous=old,current=dict(permission=permission,branches=[{k:b[k] for k in ['profile','origin','guards']} for b in plans])))
    for key in legacy['operations']:
        if key not in seen:changes.append(dict(key=key,kind='old_operation_replaced'))
    result=dict(format='authorization-bindings/1',approved=False,runtime_ready=False,selection=inv['selection'],
        providers=PROVIDERS,guards={g:dict(contract=text,providers=GUARD_PROVIDERS[g]) for g,text in guards.items()},operations=operations,legacy_changes=changes,
        guard_changes={g:dict(previous=legacy['guard_registry'][g],current=text) for g,text in guards.items() if g in legacy['guard_registry'] and text!=legacy['guard_registry'][g]})
    return result

if __name__=='__main__':
    value=build();(ROOT/'bindings.json').write_bytes(encoded(value));print(json.dumps(dict(operations=len(value['operations']),guards=len(value['guards']),providers=len(value['providers']))))
