"""归并预览验收：完整来源往返、接口结构、显式裁决与负例。"""
import argparse
import copy
import importlib.util
from importlib.metadata import version
import json
from pathlib import Path
import platform
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('sdk_compose', ROOT / 'compose.py')
C = importlib.util.module_from_spec(spec); spec.loader.exec_module(C)


def run(suite=None):
    source = C.decode((ROOT / 'source.json').read_bytes()); policy = C.decode((ROOT / 'policy.json').read_bytes())
    generated = C.compose(source, policy); cases = []
    def check(name, ok):
        C.require(ok, name); cases.append(name)
    for name, value in generated.items():
        check('产物字节一致:' + name, C.encode(value) == (ROOT / 'preview' / name).read_bytes())
    reversed_policy = copy.deepcopy(policy); reversed_policy['imports'].reverse()
    reversed_policy['replacements'].reverse(); reversed_policy['retirements'].reverse()
    check('来源及裁决加载顺序不影响输出', C.encode(C.compose(source, reversed_policy)) == C.encode(generated))
    inv = generated['inventory.json']
    check('完整操作数量', (inv['source_documents'], inv['source_operation_declarations'],
          inv['authority_operation_declarations'], inv['selected_operations'], inv['replacements'], inv['retirements']) == (15, 170, 210, 177, 27, 6))
    check('全部模型身份可追溯', set(generated['model-identities.json'])==set(source['definitions']) and
          sum(len(x['origins']) for x in generated['model-identities.json'].values())==
          sum(len(doc['components']['schemas']) for doc in source['documents'].values()))
    for authority, count in [('controller', 90), ('seamer', 87)]:
        api = generated[authority + '.preview.openapi.json']
        check('authority独立:' + authority, sum(len(x) for x in api['paths'].values()) == count and api['x-authority-role'] == authority)
        check('当前命令及继续运行源:' + authority,
              api['paths']['/internal/automation/continuations']['post']['x-composition-source']['document'] == 'continuation_' + authority)
        check('WS完整元数据:' + authority, all(k in api['paths']['/api/v1/events']['get'] for k in ('x-ticket-binding-schema', 'x-websocket-frame-schema')))
        for record in policy['retirements']:
            if record['authority'] == authority:
                check('退役无回退:' + authority + record['path'], record['path'] not in api['paths'])
    # 逐操作检查所有原字段：只允许具名引用、安全方案名、挂载位置与来源注记发生机械变化。
    for item in inv['operations']:
        record = next(x for x in policy['imports'] if x['id'] == item['selected_source'])
        doc = source['documents'][record['id']]
        source_path = item['path'][len(record['path_mount']):] if record['path_mount'] else item['path']
        expected = copy.deepcopy(doc['paths'][source_path][item['method']])
        expected['security'] = [{record['id'] + '__' + key: scopes for key, scopes in option.items()}
                                for option in expected.get('security', doc.get('security', []))]
        expected['x-composition-source'] = dict(document=record['id'], source_version=doc['info']['version'])
        expected = C.refs(expected, lambda ref: '#/components/schemas/' + ref.removeprefix('#/$defs/'))
        actual = generated[item['authority'] + '.preview.openapi.json']['paths'][item['path']][item['method']]
        check('操作元数据完整:' + item['authority'] + ':' + item['operation_id'], actual == expected)
    literal = {'description': '#/components/schemas/X', 'example': {'$ref': '#/components/schemas/X'},
               'const': {'$ref': '#/components/schemas/X'}, '$ref': '#/components/schemas/X'}
    mapped = C.refs(literal, lambda _: '#/$defs/new')
    check('不改样例和字面量中的引用文本', mapped['example'] == literal['example'] and mapped['const'] == literal['const'] and
          mapped['description'] == literal['description'] and mapped['$ref'] == '#/$defs/new')
    named = {'properties': {'default': {'$ref': '#/$defs/old'}, 'enum': {'$ref': '#/$defs/old'},
                            'examples': {'$ref': '#/$defs/old'}}}
    check('关键字同名属性仍重写Schema引用', all(x['$ref']=='#/$defs/new' for x in C.refs(named,lambda _:'#/$defs/new')['properties'].values()))
    check('default响应引用仍参与闭包', C.referenced({'responses':{'default':{'content':{'application/json':{'schema':{'$ref':'#/$defs/Model'}}}}}})=={'Model'})

    def reject(name, change, restamp=None):
        s, p = copy.deepcopy(source), copy.deepcopy(policy)
        change(s, p)
        if restamp:
            r = next(x for x in p['imports'] if x['id'] == restamp)
            r['sha256'] = C.sha(C.encode(C.restore(s['documents'][restamp], s['definitions'], r['namespace'])))
        try:
            C.compose(s, p)
        except (ValueError, KeyError):
            cases.append('拒绝:' + name)
        else:
            raise ValueError('未拒绝:' + name)
    reject('遗漏替换裁决', lambda s,p:p['replacements'].pop())
    reject('重复替换裁决', lambda s,p:p['replacements'].append(copy.deepcopy(p['replacements'][0])))
    reject('旧操作身份错配', lambda s,p:p['replacements'][0].update(old_operation_id='wrong'))
    reject('新操作来源错配', lambda s,p:p['replacements'][0].update(new_source='control'))
    reject('替换没有实际冲突', lambda s,p:p['replacements'][0].update(path='/api/v1/absent'))
    reject('重复退役裁决', lambda s,p:p['retirements'].append(copy.deepcopy(p['retirements'][0])))
    reject('退役与替换矛盾', lambda s,p:p['retirements'][0].update(method='post',path='/api/v1/commands'))
    reject('退役对象不存在', lambda s,p:p['retirements'][0].update(path='/internal/absent'))
    reject('来源批准偷改', lambda s,p:s.update(approved=True))
    reject('裁决批准偷改', lambda s,p:p.update(approved=True))
    reject('未知authority', lambda s,p:p['imports'][0].update(authorities=['other']))
    reject('空authority', lambda s,p:p['imports'][0].update(authorities=[]))
    reject('重复authority', lambda s,p:p['imports'][0].update(authorities=['controller','controller']))
    reject('多余来源', lambda s,p:s['documents'].update(extra=copy.deepcopy(s['documents']['command'])))
    reject('重复导入', lambda s,p:p['imports'].append(copy.deepcopy(p['imports'][0])))
    reject('原件摘要错配', lambda s,p:p['imports'][0].update(sha256='0'*64))
    reject('挂载丢失', lambda s,p:next(r for r in p['imports'] if r['id']=='control').update(path_mount=''))
    reject('挂载漂移', lambda s,p:next(r for r in p['imports'] if r['id']=='control').update(path_mount='/wrong'))
    reject('孤立模型', lambda s,p:s['definitions'].update(unregistered={'type':'string'}))
    reject('模型别名偷换', lambda s,p:s['documents']['command']['components']['schemas'].update(A__S0_RequestKey={'$ref':'#/$defs/baseline__Id'}))
    def duplicate(s,p):
        s['documents']['continuation_controller']['paths']['/internal/duplicate'] = copy.deepcopy(s['documents']['continuation_controller']['paths']['/internal/automation/continuations'])
    reject('重算摘要仍拒绝同服务operationId重复', duplicate, 'continuation_controller')
    def template(s,p):
        path=s['documents']['command']['paths']['/api/v1/commands/{command_id}']
        new=copy.deepcopy(path);new['get']['operationId']='aliasedCommand'
        s['documents']['command']['paths']['/api/v1/commands/{alias}']=new
    reject('重算摘要仍拒绝等价路径模板', template, 'command')
    def missing_scheme(s,p):
        s['documents']['continuation_controller']['paths']['/internal/automation/continuations']['post']['security']=[{'absent':[]}]
    reject('重算摘要仍拒绝不存在的安全方案', missing_scheme, 'continuation_controller')
    def op_server(s,p):
        s['documents']['continuation_controller']['paths']['/internal/automation/continuations']['post']['servers']=[{'url':'/other'}]
    reject('重算摘要仍拒绝未裁决操作挂载', op_server, 'continuation_controller')
    def path_metadata(s,p):
        s['documents']['continuation_controller']['paths']['/internal/automation/continuations']['summary']='new metadata'
    reject('重算摘要仍拒绝未支持路径元数据', path_metadata, 'continuation_controller')

    # 验证已生成OpenAPI和Schema；不把文档验证当成运行服务或协议接受验证。
    from openapi_spec_validator import validate_spec
    from jsonschema import Draft202012Validator
    for authority in ('controller', 'seamer'):
        validate_spec(generated[authority + '.preview.openapi.json']); cases.append('OpenAPI结构:' + authority)
    Draft202012Validator.check_schema(generated['models.schema.json']); cases.append('单一模型图Schema结构')
    for value in generated['models.schema.json']['$defs'].values():
        C.closure(source['definitions'], value)
    cases.append('全部模型引用闭包')
    upstream = None
    if suite:
        spec=importlib.util.spec_from_file_location('sdk_import', ROOT/'import_sources.py')
        importer=importlib.util.module_from_spec(spec);spec.loader.exec_module(importer)
        a,b=importer.extract(suite)
        check('固定提交重新提取一致', C.encode(a)==C.encode(source) and C.encode(b)==C.encode(policy))
        upstream=policy['provenance']['commit']
    with tempfile.TemporaryDirectory(prefix='sdk-compose-') as td:
        temp=Path(td).resolve()
        import shutil
        for name in ('compose.py','source.json','policy.json'):
            shutil.copyfile(ROOT/name,temp/name)
        subprocess.run([sys.executable,'-I','-B',str(temp/'compose.py'),'--output',str(temp/'out')],cwd=temp,check=True,capture_output=True)
        for name in generated:
            check('标准库隔离生成:'+name,(temp/'out'/name).read_bytes()==C.encode(generated[name]))
    inputs=[p for p in ROOT.rglob('*') if p.is_file() and p.name!='report.json' and '__pycache__' not in p.parts]
    return dict(format='sdk-composition-report/1',all_passed=True,cases=len(cases),case_results=cases,
                runtime=dict(python=platform.python_version(),system=platform.system(),
                             jsonschema=version('jsonschema'),openapi_spec_validator=version('openapi-spec-validator')),
                fixed_source_verified=upstream,approved=False,runtime_acceptance_executed=0,
                input_sha256={p.relative_to(ROOT).as_posix():C.sha(p.read_bytes()) for p in sorted(inputs)})


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--suite',type=Path);parser.add_argument('--report',action='store_true')
    args=parser.parse_args()
    if args.report and not args.suite:parser.error('写报告需固定来源对账')
    result=run(args.suite.resolve() if args.suite else None)
    if args.report:(ROOT/'report.json').write_bytes(C.encode(result))
    print(json.dumps({k:v for k,v in result.items() if k not in ('input_sha256','case_results')},ensure_ascii=False))


if __name__=='__main__':main()
