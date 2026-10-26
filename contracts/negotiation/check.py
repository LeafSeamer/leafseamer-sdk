"""验证明确版本选择、HTTP路由绑定和WS故障时序；无业务服务或设备操作。"""
import argparse
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import platform
import subprocess
import sys
import tempfile
from jsonschema import Draft202012Validator
from jsonschema.exceptions import ValidationError
from openapi_spec_validator import validate as validate_openapi
from referencing import Registry, Resource

ROOT = Path(__file__).resolve().parent


def module(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / filename)
    result = importlib.util.module_from_spec(spec); spec.loader.exec_module(result)
    return result


B = module('selection_build', 'build.py')
M = module('selection_model', 'model.py')
C = B.C


def examples(selection):
    context = dict(context_id='ctx.synthetic', service_id='controller.synthetic', principal_id='human.synthetic',
        audience='controller.synthetic', operations=['issueWsTicket'], issued_at='2026-10-27T00:00:00.000Z',
        expires_at='2026-10-27T00:00:30.000Z', ttl_ms=30000, max_unique_requests=1, context_epoch='context.1',
        issuer_id='issuer.synthetic', issuer_epoch='issuer.1', selection=copy.deepcopy(selection))
    binding = dict(binding_id='binding.synthetic', session_id='session.synthetic', audience='controller.synthetic',
        origin='https://console.example.invalid', client_instance_id='browser.synthetic', issuer_epoch='issuer.1',
        scope_digest='sha256:' + '2' * 64, expires_at='2026-10-27T00:00:20.000Z', consumed=False,
        selection=copy.deepcopy(selection), service_boot_id='boot.synthetic')
    return dict(context=context, binding=binding, request=dict(context_id=context['context_id'], idempotency_key='key.synthetic',
        origin=binding['origin'], subscription_scope=['subscription.synthetic'], client_instance_id=binding['client_instance_id'],
        selection=copy.deepcopy(selection)), context_request=dict(audience=context['audience'], operations=context['operations'],
        ttl_ms=context['ttl_ms'], max_unique_requests=1, selection=copy.deepcopy(selection)),
        ready=dict(type='contract.ready', selection=copy.deepcopy(selection), binding_id=binding['binding_id'],
        service_id=binding['audience'], service_boot_id=binding['service_boot_id']),
        discovery=dict(negotiation_protocol='contract-selection/1', authority_role='controller', supported_contracts=[copy.deepcopy(selection)]),
        selection_error=dict(negotiation_protocol='contract-selection/1', code='CONTRACT_NOT_SUPPORTED', request_id='request.synthetic',
        domain_evaluated=False, retry_advice='do_not_retry'),
        data=dict(subscription_id='subscription.synthetic', stream_id='stream.synthetic', event_type='resync.required',
                  code='RESYNC_REQUIRED', reason='synthetic'))


def bindings():
    paths = sorted(p for p in ROOT.rglob('*') if p.is_file() and p.suffix in ('.py', '.json', '.md', '.txt') and p.name != 'report.json')
    paths += [B.SDK / p for p in B.load(ROOT / 'sources.json')['inputs']]
    paths += [ROOT.parent / 'composition/requirements-validation.txt']
    return {p.relative_to(B.SDK).as_posix(): C.sha(p.read_bytes()) for p in paths}


def run():
    checks = []
    def check(name, ok):
        if not ok: raise AssertionError(name)
        checks.append(dict(name=name, passed=True))
    def reject(name, function, kind=(ValueError, ValidationError), code=None):
        try: function()
        except kind as e:
            if code is not None and getattr(e, 'code', None) != code:
                raise AssertionError(name + ':拒绝码错误') from e
            check(name, True); return
        raise AssertionError(name + ':应拒绝')
    outputs = B.build(); selection = outputs['selection.json']; models = outputs['models.schema.json']
    schema = M.Schemas(models); fixture = examples(selection)
    bad_advertisement=dict(selection,contract_id='synthetic.id\n')
    reject('广告ID禁止尾随换行',lambda:schema.validate('negotiation__AdvertisedSelection',bad_advertisement))
    check('样例固定字节', (ROOT / 'examples.json').read_bytes() == C.encode(fixture))
    for name, value in outputs.items():
        check('生成固定字节:' + name, (ROOT / 'preview' / name).read_bytes() == C.encode(value))
    manifest = outputs['manifest.json']
    for name, digest in manifest['artifacts'].items():
        raw = C.encode(outputs[name]) if name in outputs else (ROOT / name).read_bytes()
        check('产物摘要:' + name, C.sha(raw) == digest)
    check('无自指摘要', not ({'manifest.json', 'selection.json', 'report.json'} & manifest['artifacts'].keys()))
    check('JCS选择摘要', selection['contract_digest'] == B.digest(manifest))
    reordered = dict(reversed(list(manifest.items())))
    check('manifest键顺序不改变选择', B.digest(reordered) == selection['contract_digest'])
    tampered = copy.deepcopy(manifest); tampered['artifacts']['models.schema.json'] = '0' * 64
    check('资料替换不能保持摘要', B.digest(tampered) != selection['contract_digest'])
    Draft202012Validator.check_schema(models)
    Draft202012Validator.check_schema(outputs['worker-ipc.schema.json'])
    check('两Schema元校验', True)
    for key, name in [('context', 'baseline__RequestContext'), ('binding', 'baseline__WsTicketBinding'),
                      ('request', 'baseline__WsTicketRequest'), ('context_request', 'baseline__RequestContextRequest'),
                      ('ready', 'negotiation__WsReady'), ('discovery', 'negotiation__Discovery'),
                      ('selection_error', 'negotiation__SelectionError'), ('data', 'negotiation__WsData')]:
        schema.validate(name, fixture[key]); check('具名正例:' + key, True)
        bad = copy.deepcopy(fixture[key]); bad['unknown_write_field'] = True
        reject('未知字段:' + key, lambda n=name, b=bad: schema.validate(n, b))
    for key, name in [('context', 'baseline__RequestContext'), ('binding', 'baseline__WsTicketBinding'),
                      ('request', 'baseline__WsTicketRequest'), ('context_request', 'baseline__RequestContextRequest')]:
        bad = copy.deepcopy(fixture[key]); del bad['selection']
        reject('旧绑定不可降级:' + key, lambda n=name, b=bad: schema.validate(n, b))
    routing = outputs['routing.json']
    check('原177加两发现入口', routing['ordinary_http_operations'] == 175 and routing['websocket_operations'] == 2 and routing['discovery_operations'] == 2)
    operations = 0; changed_versions = 0
    for name in routing['changed_definitions']:
        d = models['$defs'][name]
        if 'protocol_version' in d.get('properties', {}):
            check('基线版本一致:' + name, d['properties']['protocol_version'] == {'const': selection['contract_id']})
            changed_versions += 1
    check('38类响应及Meta共39个基线版本', changed_versions == 39)
    for authority in ('controller', 'seamer'):
        api = outputs[authority + '.openapi.json']; validate_openapi(api); check('OpenAPI元校验:' + authority, True)
        old = B.load(ROOT.parent / 'integration/preview' / (authority + '.preview.openapi.json'))
        for name, scheme in old['components']['securitySchemes'].items():
            new = api['components']['securitySchemes'][name]
            check('认证方案结构保留:' + name,
                {k:v for k,v in new.items() if k!='description'} == {k:v for k,v in scheme.items() if k!='description'})
        for path, methods in api['paths'].items():
            for method, op in methods.items():
                operations += 1
                if op['operationId'] == 'discoverContracts':
                    check('发现无认证无选择前提:' + authority, op['security'] == [] and 'parameters' not in op)
                    continue
                original = old['paths'][path][method]
                check('原认证不被协商替代:' + authority + ':' + op['operationId'], op['security'] == original['security'])
                for key in ('x-permission', 'x-subject-kinds', 'requestBody'):
                    check('原路由绑定保留:' + authority + ':' + op['operationId'] + ':' + key, op.get(key) == original.get(key))
                if op['operationId'] != 'openEvents':
                    params = {p['name'].lower(): p for p in op['parameters'] if p['in'] == 'header'}
                    check('所有普通入口显式选择:' + authority + ':' + op['operationId'],
                        params['x-leafseamer-contract']['required'] and params['x-leafseamer-contract']['schema'] == {'const': selection['contract_id']} and params['x-leafseamer-contract-digest']['required'])
                else:
                    check('浏览器升级不要求自定义选择头:' + authority, all(p['name'].lower() != 'x-leafseamer-contract' for p in op['parameters']))
                    check('首帧引用可解析:' + authority, api['components']['schemas'][op['x-first-server-frame-schema'].split('/')[-1]] ==
                          C.refs(models['$defs']['negotiation__WsReady'], lambda r: r.replace('#/$defs/', '#/components/schemas/')))
                    token_schema=op['responses']['101']['headers']['Sec-WebSocket-Protocol']['schema']
                    Draft202012Validator(token_schema).validate(M.token(selection))
                    reject('WS响应token禁止换行:'+authority,lambda s=token_schema:Draft202012Validator(s).validate(M.token(selection)+'\n'))
                # 在真实组件闭包内验证统一选择错误；不下载引用。
                reg = Registry().with_resource('https://test.invalid/' + authority, Resource.from_contents(dict(api, **{'$schema': 'https://json-schema.org/draft/2020-12/schema'})))
                for code in ('400', '409'):
                    fragment = op['responses'][code]['content']['application/json']['schema']
                    absolute = C.refs(fragment, lambda r: 'https://test.invalid/' + authority + r)
                    Draft202012Validator(absolute, registry=reg).validate(fixture['selection_error'])
                check('路由选择错误可解码:' + authority + ':' + op['operationId'], True)
        for opid in ('issueWsTicket',):
            op = next(op for ps in api['paths'].values() for op in ps.values() if op['operationId'] == opid)
            check('票据秘密只在首次201:' + authority,
                op['responses']['201']['content']['application/json']['schema']['$ref'].endswith('WsTicketResultResponse') and
                op['responses']['200']['content']['application/json']['schema']['$ref'].endswith('WsTicketBindingResponse') and
                op['responses']['201']['headers']['Cache-Control']['schema']['const'] == 'no-store')
    check('操作总数179', operations == 179)
    # worker只重绑图URI：逐条恢复引用证明没有顺手升级其wire。
    old_models = B.load(ROOT.parent / 'integration/preview/models.schema.json')
    for name, definition in old_models['$defs'].items():
        if name.startswith('command__'):
            check('worker命令模型保持:' + name, models['$defs'][name] == definition)
    old_ipc = B.load(ROOT.parent / 'integration/preview/worker-ipc.schema.json')
    restored = copy.deepcopy(outputs['worker-ipc.schema.json']); restored['$id'] = old_ipc['$id']
    restored['oneOf'] = [{'$ref': x['$ref'].replace(B.SID, old_models['$id'], 1)} for x in restored['oneOf']]
    check('worker接受集保持', restored == old_ipc)
    catalogue = M.Catalogue([selection]); headers = M.response_headers(selection)
    check('HTTP精确选择', catalogue.http(headers) == selection)
    check('响应选择核对', M.verify_response(selection, headers) == 'response_selection_matches')
    for key,name in [('request','baseline__WsTicketRequest'),('context_request','baseline__RequestContextRequest')]:
        check('提交正文选择:'+key,M.selected_input(name,fixture[key],selection,schema)=='input_selection_matches')
        bad=copy.deepcopy(fixture[key]);bad['selection']['contract_digest']='sha256:'+'0'*64
        reject('正确头不能掩盖错正文选择:'+key,lambda n=name,b=bad:M.selected_input(n,b,selection,schema))
    base_response=dict(request_id='response.synthetic',service_id='controller.synthetic',service_boot_id='boot.synthetic',
                       protocol_version=selection['contract_id'],selection=copy.deepcopy(selection))
    for name,payload in [('baseline__RequestContextResponse',fixture['context']),
                         ('baseline__WsTicketBindingResponse',fixture['binding']),
                         ('baseline__WsTicketResultResponse',dict(ticket='synthetic_ticket_value_only',binding=fixture['binding']))]:
        body=dict(base_response,data=copy.deepcopy(payload))
        check('响应内外选择一致:'+name,M.response_body(name,body,selection,headers,schema)=='response_shape_and_selection_match')
        bad=copy.deepcopy(body);bad['selection']['contract_digest']='sha256:'+'0'*64
        reject('正确响应头不能掩盖错信封:'+name,lambda n=name,b=bad:M.response_body(n,b,selection,headers,schema))
        bad=copy.deepcopy(body)
        target=bad['data']['binding'] if name.endswith('WsTicketResultResponse') else bad['data']
        target['selection']['contract_digest']='sha256:'+'0'*64
        reject('正确响应头不能掩盖错数据绑定:'+name,lambda n=name,b=bad:M.response_body(n,b,selection,headers,schema))
    check('头名不区分大小写', catalogue.http([(n.lower(), ' '+v+'\t') for n,v in headers]) == selection)
    for name, bad in [('缺摘要', headers[:1]), ('重复ID', headers + [headers[0]]), ('异大小写重复', headers + [(headers[0][0].lower(), headers[0][1])]),
                      ('列表值', [(headers[0][0], headers[0][1]+','+headers[0][1]), headers[1]]),
                      ('换行', [headers[0], (headers[1][0], headers[1][1]+'\n')]),
                      ('旧来源版本头', [(headers[0][0], 'command-contract/0.1.0-draft.1'), headers[1]]),
                      ('错摘要', [headers[0], (headers[1][0], 'sha256:'+'0'*64)])]:
        reject('HTTP拒绝:' + name, lambda bad=bad: catalogue.http(bad), code='CONTRACT_NOT_SUPPORTED' if name=='错摘要' else 'CONTRACT_SELECTION_INVALID')
    reject('响应缺选择头', lambda: M.verify_response(selection, []))
    bad_selection = dict(selection, contract_digest='sha256:'+'0'*64)
    reject('禁止同ID不同摘要广告', lambda: M.Catalogue([selection, bad_selection]))
    reject('禁止重复广告', lambda: M.Catalogue([selection, selection]))
    reject('禁止空广告', lambda: M.Catalogue([]))
    eight=[dict(selection,contract_id='synthetic.profile.'+str(i)) for i in range(8)]
    check('八组合容量边界',len(M.Catalogue(eight).selections)==8)
    reject('第九组合不能挤掉旧组合',lambda:M.Catalogue(eight+[dict(selection,contract_id='synthetic.profile.9')]))
    old_selection = dict(contract_id='synthetic.retained.profile', contract_digest='sha256:'+'3'*64)
    two = M.Catalogue([selection, old_selection])
    check('明确保留旧组合可精确路由', two.choose(old_selection) == old_selection)
    reject('同主版本不自动放行', lambda: two.choose(dict(old_selection, contract_id='synthetic.retained.other')))
    reject('未保留旧组合拒绝', lambda: catalogue.choose(old_selection))
    context = fixture['context']; current = {k: context[k] for k in ('service_id','principal_id','issuer_id','issuer_epoch','audience','context_epoch')}
    current.update(valid=True, operation='issueWsTicket')
    check('Context绑定正例', M.use_context(context, selection, current) == 'context_selection_matches')
    reject('Context跨契约复用', lambda: M.use_context(context, old_selection, current))
    for key in ('service_id','principal_id','issuer_id','issuer_epoch','audience','context_epoch','operation'):
        reject('Context权威错配:'+key, lambda key=key: M.use_context(context, selection, dict(current, **{key:'other'})))
    reject('Context失效保留认证拒绝', lambda: M.use_context(context, selection, dict(current, valid=False)), M.AuthorityRejected)
    binding = fixture['binding']; secret = 'synthetic_ticket_value_only'
    protocols = [M.token(selection), 'leafseamer.ticket.'+secret]
    ticket_current = {k: binding[k] for k in ('session_id','issuer_epoch','audience','origin','client_instance_id','scope_digest','service_boot_id')}
    ticket_current['valid'] = True
    check('子协议顺序无关', catalogue.websocket(list(reversed(protocols))) == (selection, secret))
    for name, bad in [('缺票据',protocols[:1]), ('重复契约',protocols+protocols[:1]), ('旧token',['leafseamer.v1',protocols[1]]),
                      ('多个选择',[protocols[0],M.token(old_selection)]), ('秘密格式',[protocols[0],'leafseamer.ticket.invalid!']),
                      ('过长秘密',[protocols[0],'leafseamer.ticket.'+'a'*4097]), ('错摘要',[M.token(bad_selection),protocols[1]])]:
        reject('WS握手拒绝:'+name,lambda bad=bad:catalogue.websocket(bad))
    for key in ticket_current:
        ticket = M.TicketClaim(secret,binding,schema)
        bad = dict(ticket_current, **{key:False if key=='valid' else 'other'})
        reject('票据权威错配:'+key,lambda b=bad,t=ticket:t.consume(catalogue,protocols,b))
        check('拒绝前未消费:'+key,ticket.binding['consumed'] is False)
    ticket = M.TicketClaim(secret,binding,schema)
    reject('正确选择不替代秘密',lambda:ticket.consume(catalogue,[protocols[0],'leafseamer.ticket.'+'x'*16],ticket_current))
    echoed,ready=ticket.consume(catalogue,protocols,ticket_current)
    check('只回显契约不回显秘密',echoed==protocols[0] and secret not in echoed and ready==fixture['ready'])
    reject('已消费不可重用',lambda:ticket.consume(catalogue,protocols,ticket_current))
    check('模拟101丢失仍已消费',ticket.binding['consumed'] is True)
    conn=M.Connection(selection,binding,echoed,schema,100)
    check('Ready前仅等待',conn.state=='await_ready')
    check('首帧匹配',conn.receive(ready,99)=='transport_ready_only')
    check('随后数据只证明形状',conn.receive(fixture['data'],101)=='data_shape_valid_only')
    reject('重复Ready关闭',lambda:conn.receive(ready,102));check('重复后关闭状态',conn.state=='closed')
    reject('关闭不能复活',lambda:conn.receive(fixture['data'],103))
    for name,frame,now in [('先事件',fixture['data'],99),('期限等号',ready,100),('超时',ready,101),
                         ('错选择',dict(ready,selection=bad_selection),99),('错boot',dict(ready,service_boot_id='other'),99),
                         ('错binding',dict(ready,binding_id='other'),99),('错service',dict(ready,service_id='other'),99)]:
        conn=M.Connection(selection,binding,echoed,schema,100)
        reject('首帧拒绝:'+name,lambda c=conn,f=frame,n=now:c.receive(f,n));check('首帧失败关闭:'+name,conn.state=='closed')
    reject('不得回显秘密token',lambda:M.Connection(selection,binding,protocols[1],schema,100))
    with tempfile.TemporaryDirectory(prefix='sdk-selection-') as tmp:
        for i in range(2):
            dest=Path(tmp)/str(i)
            subprocess.run([sys.executable,'-I','-B',str(ROOT/'build.py'),'--output',str(dest)],check=True,capture_output=True)
            check('隔离生成确定性:'+str(i),all((dest/n).read_bytes()==C.encode(v) for n,v in outputs.items()))
        p=subprocess.run([sys.executable,'-I','-B',str(ROOT/'build.py'),'--output',str(dest)],capture_output=True)
        check('拒覆盖输出',p.returncode!=0)
    return dict(format='sdk-negotiation-check/1',all_passed=True,approved=False,runtime_ready=False,
        cases_passed=len(checks),checks=checks,http_and_ws_operations=179,worker_message_types=52,
        source_commit=B.load(ROOT/'sources.json')['source_commit'],selection=selection,inputs=bindings(),
        python_version=platform.python_version(),runtime_tests_executed=0,device_tests_executed=0,
        browser_tests_executed=0,concurrent_ticket_tests_executed=0)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--examples',action='store_true');parser.add_argument('--report',action='store_true');parser.add_argument('--check-report',action='store_true')
    args=parser.parse_args()
    if args.examples:
        (ROOT/'examples.json').write_bytes(C.encode(examples(B.build()['selection.json'])))
    elif args.check_report:
        report=B.load(ROOT/'report.json');C.require(report['inputs']==bindings(),'报告输入漂移')
        print(json.dumps(dict(input_bindings_match=True,inputs=len(report['inputs']))))
    else:
        report=run()
        if args.report:(ROOT/'report.json').write_bytes(C.encode(report))
        print(json.dumps({k:v for k,v in report.items() if k not in ('checks','inputs')},ensure_ascii=False))
