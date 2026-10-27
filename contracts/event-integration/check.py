"""新完整选择的图、OpenAPI、帧及来源等价检查。"""
import argparse
import copy
import importlib.util
import json
from pathlib import Path
import sys
from jsonschema import Draft202012Validator,FormatChecker
from jsonschema.exceptions import ValidationError
from openapi_spec_validator import validate as validate_openapi
from referencing import Registry,Resource
sys.path.insert(0,str(Path(__file__).resolve().parent))
import build as B
C=B.C


def inputs():
    files=[p for p in B.ROOT.rglob('*') if p.is_file() and p.name!='report.json' and '__pycache__' not in p.parts]
    files += [B.SDK/p for p in B.load(B.ROOT/'sources.json')['inputs']]
    return {p.relative_to(B.SDK).as_posix():C.sha(p.read_bytes()) for p in sorted(set(files))}


def module(name,path):
    spec=importlib.util.spec_from_file_location(name,path);result=importlib.util.module_from_spec(spec);spec.loader.exec_module(result);return result


def run():
    outputs=B.build();checks=[]
    def check(name,value,expected=True):
        assert value==expected,(name,value,expected);checks.append(dict(name=name,passed=True))
    def denied(name,fn,reason=None):
        try:fn()
        except (ValueError,ValidationError) as e:
            if reason is not None:check(name,str(e),reason)
            else:check(name,True)
        else:raise AssertionError(name+':应拒绝')
    for name,value in outputs.items():check('生成原件:'+name,(B.ROOT/'preview'/name).read_bytes(),C.encode(value))
    manifest=outputs['manifest.json'];selection=outputs['selection.json'];defs=outputs['models.schema.json']['$defs']
    for name,checksum in manifest['artifacts'].items():
        raw=C.encode(outputs[name]) if name in outputs else (B.ROOT/name).read_bytes()
        check('制品字节摘要:'+name,C.sha(raw),checksum)
    check('选择无自指摘要',selection['contract_digest'],B.digest(manifest))
    check('发布资格默认关闭',[manifest[k] for k in ('approved','runtime_ready','advertisable')],[False]*3)
    check('模型总数',len(defs),1351);check('操作总数',len(outputs['routing.json']['operations']),201)
    Draft202012Validator.check_schema(outputs['models.schema.json']);check('统一图meta校验',True)
    registry=Registry().with_resource(B.SID,Resource.from_contents(outputs['models.schema.json']))
    def valid(name,value):Draft202012Validator({'$ref':B.SID+B.P+name},registry=registry,format_checker=FormatChecker()).validate(value)
    base=B.load(B.ROOT.parent/'negotiation/preview/models.schema.json')['$defs']
    extension=B.load(B.ROOT.parent/'scope-registry/preview/models.schema.json')['$defs']
    mapping=outputs['model-map.json'];check('公共原件逐项相同',len(mapping['shared_identical']),44)
    for name in mapping['shared_identical']:check('公共模型:'+name,base[name],extension[name])
    for name in mapping['unchanged']:check('旧图保留:'+name,defs[name],base[name])
    for name in mapping['added']:
        if name!='channel__Selection':check('新增原件:'+name,defs[name],extension[name])
    for kind,name in outputs['registry-map.json']['collection_models'].items():
        check('投影视图完整闭包:'+kind,C.closure(defs,B.ref(name)),C.closure(extension,B.ref(name)))
    for role in ('controller','seamer'):
        api=outputs[role+'.openapi.json'];validate_openapi(api);check(role+'完整OpenAPI校验',True)
        check(role+'组件与统一图一致',B.rewrite(api['components']['schemas'],B.local_ref),defs)
        old=B.load(B.ROOT.parent/'negotiation/preview'/(role+'.openapi.json'))
        for path,methods in old['paths'].items():
            for method,op in methods.items():
                if (path,method) in B.REPLACED:continue
                current=api['paths'][path][method]
                check(role+method+path+'认证不变',current.get('security'),op.get('security'))
                check(role+method+path+'请求正文不变',current.get('requestBody'),op.get('requestBody'))
                old_params=[p for p in op.get('parameters',[]) if not(p.get('in')=='header' and p['name']=='X-LeafSeamer-Contract')]
                new_params=[p for p in current.get('parameters',[]) if not(p.get('in')=='header' and p['name']=='X-LeafSeamer-Contract')]
                check(role+method+path+'其余参数不变',new_params,old_params)
                check(role+method+path+'响应正文不变',{k:v.get('content') for k,v in current['responses'].items()},
                      {k:v.get('content') for k,v in op['responses'].items()})
        for path,methods in api['paths'].items():
            for method,op in methods.items():
                name=role+method+path
                if op['operationId']=='discoverContracts':check(name+'发现不授予权限',op['security'],[]);continue
                if op['operationId'] in ('openEvents','internalOpenEvents'):
                    check(name+'首帧改绑',op['x-first-server-frame-schema'],'#/components/schemas/channel__Ready')
                    check(name+'双向帧根',[op['x-client-frame-schema'],op['x-server-frame-schema']],
                        ['#/components/schemas/channel__ClientFrame','#/components/schemas/channel__ServerFrame'])
                    check(name+'子协议数量',len(op['x-offered-subprotocols']),2 if op['x-owner-profile']=='human' else 1)
                else:
                    header=[p for p in op['parameters'] if p.get('in')=='header' and p['name']=='X-LeafSeamer-Contract']
                    check(name+'HTTP选择头',len(header),1);check(name+'HTTP选择ID',header[0]['schema'],{'const':B.CID})
                check(name+'选择不授权',op['x-contract-selection']['authorization_granted'],False)
    check('八项显式替换',len(outputs['routing.json']['replacements']),8)
    check('四条WS入口',sum(r['transport']=='websocket' for r in outputs['routing.json']['operations']),4)
    valid('negotiation__Selection',selection);valid('channel__Selection',selection);check('全局与订阅选择一致',True)
    old_selection=B.load(B.ROOT.parent/'negotiation/preview/selection.json')
    denied('新选择图拒绝旧ID',lambda:valid('channel__Selection',old_selection))
    negotiation=module('event_selection_model',B.ROOT.parent/'negotiation/model.py');catalogue=negotiation.Catalogue([selection])
    check('HTTP精确选择',catalogue.http(negotiation.response_headers(selection)),selection)
    denied('同ID异摘要拒绝',lambda:catalogue.choose(dict(selection,contract_digest='sha256:'+'0'*64)),'CONTRACT_NOT_SUPPORTED')
    denied('不隐式降级旧选择',lambda:catalogue.choose(old_selection),'CONTRACT_NOT_SUPPORTED')
    check('新WS人员选择',catalogue.websocket([negotiation.token(selection),'leafseamer.ticket.'+'s'*16])[0],selection)
    samples=B.load(B.ROOT.parent/'event-channel/examples.json')
    def select(value):
        if isinstance(value,list):return [select(v) for v in value]
        if not isinstance(value,dict):return value
        return {k:copy.deepcopy(selection) if k=='selection' else select(v) for k,v in value.items()}
    samples=select(samples)
    for i,frame in enumerate(samples['client_frames']):valid('channel__ClientFrame',frame);check('客户端帧:'+str(i),True)
    for i,frame in enumerate(samples['server_frames']):valid('channel__ServerFrame',frame);check('服务端帧:'+str(i),True)
    legacy_ready=dict(type='contract.ready',selection=selection,binding_id='binding',service_id='controller',service_boot_id='boot')
    denied('旧首帧不冒充新绑定',lambda:valid('negotiation__WsReady',legacy_ready))
    examples=B.load(B.ROOT.parent/'integration/source/frames.json')
    old_messages=B.load(B.ROOT.parent/'negotiation/preview/worker-messages.json')
    current=outputs['worker-messages.json']
    check('worker消息总数',len(current['messages']),52)
    for before,after in zip(old_messages['messages'],current['messages']):
        check('worker方向及回复:'+before['type'],{k:v for k,v in before.items() if k!='schema_ref'},{k:v for k,v in after.items() if k!='schema_ref'})
        name=after['schema_ref'].split(B.P,1)[1];valid(name,examples[before['type']]);check('worker帧:'+before['type'],True)
    # 在原件之外构造失败输入，检验生成器拒绝，而非只确认固定正例能生成。
    base_doc=B.load(B.ROOT.parent/'negotiation/preview/models.schema.json');ext=B.load(B.ROOT.parent/'scope-registry/preview/models.schema.json')
    sub=B.load(B.ROOT.parent/'event-channel/preview/subscriptions.openapi.json')
    apis={role:B.load(B.ROOT.parent/'negotiation/preview'/(role+'.openapi.json')) for role in ('controller','seamer')}
    ipc=B.load(B.ROOT.parent/'negotiation/preview/worker-ipc.schema.json')
    def compose(a=base_doc,b=ext,c=sub,d=apis):return B.compose(a,b,c,d,ipc,old_messages)
    bad=copy.deepcopy(ext);shared=mapping['shared_identical'][0];bad['$defs'][shared]={'type':'null'}
    denied('同名不同正文生成拒绝',lambda:compose(b=bad),'模型重名但不等价:'+shared)
    bad=copy.deepcopy(apis);del bad['controller']['paths']['/api/v1/events']['get']
    denied('缺原入口拒绝静默新增',lambda:compose(d=bad),'预期旧入口缺失')
    bad=copy.deepcopy(sub);bad['paths']['/api/v1/devices']={'get':copy.deepcopy(sub['paths']['/api/v1/subscriptions']['post'])}
    denied('未裁决覆盖其他API拒绝',lambda:compose(c=bad),'未裁决路由冲突')
    literal={'properties':{'schema_ref':{'type':'object','properties':{'$ref':{'const':'#/components/schemas/data'}}}},'examples':[{'$ref':'literal'}]}
    check('Schema属性名与业务数据不当成引用',B.rewrite(literal,B.local_ref),literal)
    return dict(format='event-integration-check/1',all_passed=True,approved=False,runtime_ready=False,advertisable=False,
        cases_passed=len(checks),checks=checks,models=len(defs),operations=201,worker_messages=52,shared_equal_models=44,
        product_runtime_tests_executed=0,authentication_tests_executed=0,browser_tests_executed=0,network_tests_executed=0,device_tests_executed=0,
        scope='完整候选图与OpenAPI和固定帧等价及精确选择；不代表部署就绪或全部系统设计获批',inputs=inputs())


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);g=p.add_mutually_exclusive_group();g.add_argument('--report',action='store_true');g.add_argument('--check-report',action='store_true');a=p.parse_args()
    if a.check_report:
        r=B.load(B.ROOT/'report.json');assert r['all_passed'] and r['inputs']==inputs();print(json.dumps(dict(all_passed=True,bindings=len(r['inputs']))))
    else:
        r=run()
        if a.report:(B.ROOT/'report.json').write_bytes(C.encode(r))
        print(json.dumps({k:v for k,v in r.items() if k not in ('checks','inputs')},ensure_ascii=False))
