"""只验证调用策略设计资料，不执行凭据或业务授权。"""
import copy
import importlib.util
import json
from pathlib import Path
import argparse

ROOT=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('authorization_build',ROOT/'build.py');B=importlib.util.module_from_spec(spec);spec.loader.exec_module(B)

def validate(value,inventory):
    B.need(value['format']=='authorization-bindings/1' and value['approved'] is False and value['runtime_ready'] is False,'资格改变')
    B.need(value['selection']==inventory['selection'],'选择改变')
    expected={(o['authority'],o['operation_id']):o for o in inventory['operations']}
    seen=set()
    for op in value['operations']:
        identity=(op['authority'],op['operation_id']);B.need(identity not in seen and identity in expected,'重复或未知操作');seen.add(identity);source=expected[identity]
        B.need(op['key']==':'.join(identity) and all(op[k]==source[k] for k in ['method','path','transport','security']),'操作或认证分支漂移')
        B.need(op['authorization_granted'] is False,'不能授予权限')
        e=source['extensions'];permission=e.get('x-permission',e.get('x-required-permission'))
        B.need(op['permission']==permission,'权限漂移')
        B.need(op['branches'] and len({(b['profile'],b['origin']) for b in op['branches']})==len(op['branches']),'空或重复主体')
        covered=set()
        for branch in op['branches']:
            profile=branch['profile'];indices=branch['security_alternatives']
            B.need(len(indices)==len(set(indices)),'重复认证分支')
            for index in indices:
                B.need(type(index) is int and 0<=index<len(source['security']),'分支越界')
                B.need(all(profile in B.SCHEME_PROFILES[s] for s in source['security'][index]),'主体不匹配实际凭据')
            covered.update(indices)
            B.need(bool(indices) if source['security'] else profile in ['bootstrap','login','discovery'],'未认证主体越权')
            B.need(set(branch['guards'])<=set(value['guards']) and len(branch['guards'])==len(set(branch['guards'])),'守卫未定义或重复')
            B.need(branch['guards'] or profile=='discovery','无守卫的已认证操作')
            required=set(p for g in branch['guards'] for p in value['guards'][g]['providers'])|{'capacity'}
            if profile not in ['bootstrap','login','discovery']:required|={'identity','permission','object'}
            B.need(set(branch['providers'])==required and len(branch['providers'])==len(required) and required<=set(value['providers']),'提供者不完整')
            B.need(branch['origin'] is None or (op['operation_id']=='submitCommand' and (profile,branch['origin']) in [('human','manual'),('seamer','automation')]),'用途扩大')
        B.need(covered==set(range(len(source['security']))),'认证分支未完整覆盖')
        if op['operation_id']=='discoverContracts':
            B.need(op['permission_mode']=='public_discovery' and op['checkpoints']==['public_metadata_release'] and op['failure_statuses']=={},'发现入口扩大')
        else:
            checkpoints=['admission','before_authoritative_commit','before_response_release']+(['before_frame_release'] if op['transport']=='websocket-subprotocol' else [])
            B.need(op['checkpoints']==checkpoints,'复核阶段缺失')
            B.need(op['failure_statuses']==dict(unauthenticated='401',forbidden='403',context_unavailable='503') and set(op['failure_statuses'].values())<=set(source['responses']),'失败状态未绑定')
    B.need(seen==set(expected),'操作缺失')
    # 与逐项创作的策略源再核对；引用图检查不替代策略本身的评审。
    B.need(value==B.build(),'人工策略与生成清单不一致')

def run():
    value=B.load(ROOT/'bindings.json');inv=B.load(B.SDK/'contracts/http-envelope/preview/inventory.json');checks=[]
    def check(name,condition=True):B.need(condition,name);checks.append(dict(name=name,passed=True))
    validate(value,inv);check('完整策略闭包')
    check('两次生成字节一致',B.encoded(B.build())==B.encoded(B.build())==(ROOT/'bindings.json').read_bytes())
    ops={o['key']:o for o in value['operations']}
    for source in inv['operations']:
        key=source['authority']+':'+source['operation_id'];op=ops[key]
        check('精确调用身份:'+key,[op[k] for k in ['authority','operation_id','method','path','transport']]==[source[k] for k in ['authority','operation_id','method','path','transport']])
        check('原认证OR与AND:'+key,op['security']==source['security'])
        check('不授予权限:'+key,op['authorization_granted'] is False)
    expected={
      'controller:bootstrap':['bootstrap'],'controller:login':['login'],'controller:issueToken':['cookie'],
      'controller:submitCommand':['human','seamer'],'controller:getCommand':['human','seamer'],
      'controller:getClock':['human'],'controller:acquireControl':['human'],
      'controller:createPanelSession':['human'],'seamer:invokePanelMethod':['human'],
      'seamer:createPanelSubscription':['human'],'controller:approveExtension':['human'],
      'seamer:createRun':['human','service'],'seamer:publishDefinition':['human'],'seamer:armRun':['human'],
      'seamer:submitProviderEvent':['provider'],'seamer:readIngressCommit':['internal'],
      'controller:prepareAutomation':['internal'],'controller:protectRunGeneration':['internal'],
      'seamer:observeContinuationWithdrawal':['internal'],'controller:openEvents':['ticket'],
      'seamer:internalOpenEvents':['internal'],'controller:discoverContracts':['discovery']}
    for key,profiles in expected.items():check('独立主体预期:'+key,[b['profile'] for b in ops[key]['branches']]==profiles)
    for key,guard in [('controller:acquireControl','acquire_target'),('seamer:invokePanelMethod','panel_method'),('controller:issueWsTicket','ticket_issue'),('seamer:internalCreateSubscription','service_subscription'),('seamer:observeContinuationReceipt','controller_peer'),('controller:issueContinuation','origin_peer'),('controller:lookupCommandAdmission','command_namespace')]:
        check('关键用途守卫:'+key,all(guard in b['guards'] for b in ops[key]['branches']))
    check('票据守卫显式迁移',set(value['guard_changes'])=={'ticket_issue'} and 'subscription' in value['guard_changes']['ticket_issue']['current'])
    def rejected(name,mutate):
        bad=copy.deepcopy(value);mutate(bad)
        try:validate(bad,inv)
        except (ValueError,KeyError,IndexError,TypeError):check('拒绝:'+name)
        else:raise AssertionError('未拒绝:'+name)
    def get(v,key):return next(o for o in v['operations'] if o['key']==key)
    for name,mutate in [
      ('批准伪标',lambda v:v.update(approved=True)),('运行伪标',lambda v:v.update(runtime_ready=True)),
      ('选择漂移',lambda v:v['selection'].update(contract_digest='sha256:'+'0'*64)),
      ('缺操作',lambda v:v['operations'].pop()),('重复操作',lambda v:v['operations'].append(v['operations'][0])),
      ('跨authority',lambda v:get(v,'controller:getCommand').update(authority='seamer')),
      ('认证AND拆分',lambda v:get(v,'controller:issueToken').update(security=[{next(iter(r)):[]} for r in get(v,'controller:issueToken')['security']])),
      ('服务命令扩权',lambda v:get(v,'controller:getCommand')['branches'][1].update(profile='service')),
      ('人员布防扩服务',lambda v:get(v,'seamer:armRun')['branches'].append(dict(get(v,'seamer:armRun')['branches'][0],profile='service'))),
      ('伪造许可',lambda v:get(v,'controller:getCommand').update(authorization_granted=True)),
      ('清空守卫',lambda v:get(v,'controller:getCommand')['branches'][0].update(guards=[])),
      ('丢提供者',lambda v:get(v,'controller:getCommand')['branches'][0]['providers'].remove('object')),
      ('伪造提供者',lambda v:get(v,'controller:getCommand')['branches'][0]['providers'].append('caller_claim')),
      ('释放前不复核',lambda v:get(v,'controller:getCommand')['checkpoints'].remove('before_response_release')),
      ('WS不逐帧复核',lambda v:get(v,'controller:openEvents')['checkpoints'].remove('before_frame_release')),
      ('不可用伪装成功',lambda v:get(v,'controller:getCommand')['failure_statuses'].update(context_unavailable='200')),
      ('命名权限降级',lambda v:get(v,'controller:getCommand').update(permission=None)),
      ('发现入口加载身份',lambda v:get(v,'controller:discoverContracts')['branches'][0]['providers'].append('identity')),
      ('伪造manual服务',lambda v:get(v,'controller:submitCommand')['branches'][1].update(origin='manual')),
      ('票据旧守卫复活',lambda v:v['guards']['ticket_issue'].update(contract=v['guard_changes']['ticket_issue']['previous']))
    ]:rejected(name,mutate)
    active={g for o in value['operations'] for b in o['branches'] for g in b['guards']}
    paths=[p for p in ROOT.rglob('*') if p.is_file() and p.name!='report.json' and '__pycache__' not in p.parts]
    inputs={p.relative_to(B.SDK).as_posix():B.sha(p.read_bytes()) for p in sorted(paths)};inputs.update(B.load(ROOT/'sources.json')['inputs'])
    return dict(format='authorization-bindings-report/1',approved=False,runtime_ready=False,all_passed=True,cases_passed=len(checks),checks=checks,operations=len(ops),branches=sum(len(o['branches']) for o in value['operations']),registered_guards=len(value['guards']),active_guards=len(active),providers=len(value['providers']),legacy_changes=len(value['legacy_changes']),runtime_authorization_tests_executed=0,network_tests_executed=0,device_tests_executed=0,inputs=inputs)

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--report',action='store_true');args=parser.parse_args();r=run()
    if args.report:(ROOT/'report.json').write_bytes(B.encoded(r))
    print(json.dumps({k:v for k,v in r.items() if k not in ['checks','inputs']},ensure_ascii=False))
