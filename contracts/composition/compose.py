"""从固定来源的单一模型图生成按authority分离的HTTP审阅预览。"""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
METHODS = {'get', 'put', 'post', 'delete', 'patch', 'head', 'options', 'trace'}
DATA = {'const', 'enum', 'example', 'examples', 'default'}
REF_KEYS = {'$ref', 'x-ticket-binding-schema', 'x-websocket-frame-schema'}
MAP_KEYS = {'properties', 'patternProperties', '$defs', 'definitions', 'dependentSchemas',
            'schemas', 'responses', 'securitySchemes'}
VERSION = 'sdk-composition/0.1.0-draft.1'
BLOCKERS = [
    '所选操作仍保留各来源协商头；全系统版本协商尚未统一，不能部署此预览',
    '同名异源模型保持独立；跨域Ref和数字接受集须逐项显式绑定',
    'worker应归并当前IPC0.14及其他独立通道；本包没有生成IPC',
    '授权矩阵、面板方法、快照投影和摘要/DDL映射须同步归并',
    '来源候选批准、阶段0交接及真实服务设备验收仍未完成',
]


def require(ok, message):
    if not ok:
        raise ValueError(message)


def unique(pairs):
    out = {}
    for key, value in pairs:
        require(key not in out, '重复JSON键: ' + key)
        out[key] = value
    return out


def decode(raw):
    return json.loads(raw.decode('utf8'), object_pairs_hook=unique,
                      parse_constant=lambda _: (_ for _ in ()).throw(ValueError('非有限JSON数值')))


def encode(value):
    return (json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + '\n').encode()


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def refs(value, replace, mapping=False):
    if isinstance(value, list):
        return [refs(v, replace) for v in value]
    if not isinstance(value, dict):
        return value
    if mapping:
        return {k: refs(v, replace) for k, v in value.items()}
    return {k: copy.deepcopy(v) if k in DATA else replace(v) if k in REF_KEYS else refs(v, replace, k in MAP_KEYS)
            for k, v in value.items()}


def canonicalize(api, namespace):
    require(set(api['components']) == {'schemas', 'securitySchemes'}, '尚未支持的组件类别')
    require(re.fullmatch(r'[a-z0-9_]+', namespace), '非法模型命名空间')
    def rename(ref):
        prefix = '#/components/schemas/'
        require(isinstance(ref, str) and ref.startswith(prefix), '未知来源引用')
        name = ref[len(prefix):]
        require(name in api['components']['schemas'], '来源引用不存在')
        require(re.fullmatch(r'[A-Za-z0-9._-]+', name), '非法组件名')
        return '#/$defs/' + namespace + '__' + name
    transformed = refs(api, rename)
    definitions = {namespace + '__' + n: value for n, value in transformed['components']['schemas'].items()}
    transformed['components']['schemas'] = {n: {'$ref': '#/$defs/' + namespace + '__' + n}
                                             for n in api['components']['schemas']}
    return transformed, definitions


def restore(document, definitions, namespace):
    restored = copy.deepcopy(document)
    restored['components']['schemas'] = {name: definitions[alias['$ref'].removeprefix('#/$defs/')]
                                        for name, alias in restored['components']['schemas'].items()}
    prefix = '#/$defs/' + namespace + '__'
    def rename(ref):
        require(ref.startswith(prefix), '跨源引用未经绑定')
        return '#/components/schemas/' + ref[len(prefix):]
    return refs(restored, rename)


def referenced(value):
    found = set()
    def collect(ref):
        require(isinstance(ref, str) and ref.startswith('#/$defs/'), '预览只接受本地图引用')
        found.add(ref[len('#/$defs/'):])
        return ref
    refs(value, collect)
    return found


def closure(definitions, values):
    pending = list(referenced(values)); selected = set()
    while pending:
        name = pending.pop()
        if name in selected:
            continue
        require(name in definitions, '缺少模型: ' + name)
        selected.add(name)
        pending.extend(referenced(definitions[name]) - selected)
    return {k: definitions[k] for k in sorted(selected)}


def key(authority, method, path):
    return authority, method, path


def mounted_path(record, doc, path):
    require(doc.get('servers', []) == record['source_servers'], '来源server声明漂移')
    prefix = record['path_mount']
    if prefix:
        require(doc.get('servers') == [{'url': prefix}] and prefix == '/api/v1', '路径挂载未精确绑定')
        require(not path.startswith(prefix + '/'), '路径被重复挂载')
    require(path.startswith('/') and not path.startswith('//'), '非法操作路径')
    return prefix + path


def compose(source, policy):
    require(source['approved'] is False and policy['approved'] is False, '审阅产物不能自行批准')
    require(source['format'] == 'sdk-composition-source/1' and policy['format'] == 'sdk-composition-policy/1', '资料格式不符')
    documents = source['documents']; definitions = source['definitions']; identities = {}
    require(set(documents) == {item['id'] for item in policy['imports']}, '源集合与导入声明不同')
    expected_models = set()
    for record in policy['imports']:
        for name, alias in documents[record['id']]['components']['schemas'].items():
            target = record['namespace'] + '__' + name
            require(alias == {'$ref': '#/$defs/' + target}, '模型身份映射不是精确别名')
            expected_models.add(target)
            origin = dict(document=record['id'], document_uri=policy['provenance']['repository'] + '/blob/' +
                          policy['provenance']['commit'] + '/' + record['path'],
                          pointer='/components/schemas/' + name,
                          declared_canonical_schema=documents[record['id']].get('x-canonical-schema'))
            identities.setdefault(target, []).append(origin)
    require(expected_models == set(definitions), '模型集合含遗漏或孤立成员')
    declarations = {}; source_count = 0
    for record in policy['imports']:
        name = record['id']; doc = documents[name]
        require(len(record['authorities']) == len(set(record['authorities'])) and
                set(record['authorities']) <= {'controller', 'seamer'}, '无效authority声明')
        require(record['authorities'], '空authority')
        restored = restore(doc, definitions, record['namespace'])
        require(sha(encode(restored)) == record['sha256'], '重建来源字节不一致: ' + name)
        closure(definitions, doc)
        for source_path, item in doc['paths'].items():
            path = mounted_path(record, doc, source_path)
            require(set(item) <= METHODS, '尚未裁决的路径级元数据')
            for method, op in item.items():
                require('servers' not in op, '操作级server尚未裁决')
                source_count += 1
                for authority in record['authorities']:
                    k = key(authority, method, path)
                    declarations.setdefault(k, []).append((name, op))
    replacements = {}
    for choice in policy['replacements']:
        k = key(choice['authority'], choice['method'], choice['path'])
        require(k not in replacements, '重复替换裁决')
        replacements[k] = choice
    retirements = {}
    for choice in policy['retirements']:
        k = key(choice['authority'], choice['method'], choice['path'])
        require(k not in retirements and k not in replacements, '重复或矛盾退役裁决')
        retirements[k] = choice
    selected = {}; consumed = set(); retired = set()
    for k, offers in sorted(declarations.items()):
        if k in retirements:
            choice = retirements[k]
            require(len(offers) == 1 and offers[0][0] == choice['source'] and
                    offers[0][1]['operationId'] == choice['operation_id'], '退役对象错配')
            retired.add(k)
            continue
        if len(offers) > 1:
            require(k in replacements, '未登记路由重合: ' + str(k))
            choice = replacements[k]; by_source = dict(offers)
            require(len(by_source) == len(offers) == 2 and set(by_source) == {choice['old_source'], choice['new_source']}, '替换来源不完整')
            require(by_source[choice['old_source']]['operationId'] == choice['old_operation_id'] and
                    by_source[choice['new_source']]['operationId'] == choice['new_operation_id'], '替换操作身份改变')
            selected[k] = choice['new_source'], by_source[choice['new_source']]
            consumed.add(k)
        else:
            require(k not in replacements, '替换裁决没有实际冲突')
            selected[k] = offers[0]
    require(consumed == set(replacements) and retired == set(retirements), '存在未消费裁决')
    apis = {}; inventories = []
    for authority in ('controller', 'seamer'):
        paths = {}; schemes = {}; ids = set(); templates = set(); used = set()
        for (owner, method, path), (name, original) in sorted(selected.items()):
            if owner != authority:
                continue
            op = copy.deepcopy(original); doc = documents[name]; used.add(name)
            require(op['operationId'] not in ids, '同服务operationId重复')
            ids.add(op['operationId'])
            template = method, re.sub(r'\{[^}]+\}', '{}', path)
            require(template not in templates, '同服务路由模板等价冲突')
            templates.add(template)
            security = copy.deepcopy(op.get('security', doc.get('security', [])))
            effective = []
            for alternative in security:
                mapped = {}
                for scheme, scopes in alternative.items():
                    require(scheme in doc['components']['securitySchemes'], '安全方案不存在')
                    mapped[name + '__' + scheme] = scopes
                    schemes[name + '__' + scheme] = doc['components']['securitySchemes'][scheme]
                effective.append(mapped)
            op['security'] = effective
            require('x-composition-source' not in op, '源占用预览元数据')
            op['x-composition-source'] = dict(document=name, source_version=doc['info']['version'])
            paths.setdefault(path, {})[method] = op
            inventories.append(dict(authority=authority, method=method, path=path, operation_id=op['operationId'],
                                    selected_source=name, source_version=doc['info']['version'],
                                    replaced_sources=[n for n, _ in declarations[(owner, method, path)] if n != name],
                                    transport='websocket-upgrade' if '101' in op['responses'] else 'http'))
        models = closure(definitions, paths)
        convert = lambda value: refs(value, lambda ref: '#/components/schemas/' + ref.removeprefix('#/$defs/'))
        apis[authority] = dict(openapi='3.1.1', info=dict(title='LeafSeamer ' + authority + ' 接口归并审阅预览', version=VERSION), servers=[{'url': '/'}],
            paths=convert(paths), components=dict(schemas=convert(models), securitySchemes=schemes),
            **{'x-approved': False, 'x-runtime-approved': False, 'x-authority-role': authority,
               'x-generation-purpose': 'review-only', 'x-release-blockers': BLOCKERS,
               'x-source-metadata': {name: {k: v for k, v in documents[name].items() if k not in ('paths', 'components')}
                                     for name in sorted(used)}})
    schema = {'$schema': 'https://json-schema.org/draft/2020-12/schema',
              '$id': 'https://leafseamer.invalid/sdk/composition/0.1/models.schema.json',
              'title': VERSION, 'not': {}, '$defs': definitions, 'x-approved': False}
    report = dict(format='sdk-composition-inventory/1', approved=False, runtime_ready=False,
                  source_documents=len(documents), source_operation_declarations=source_count,
                  authority_operation_declarations=sum(len(v) for v in declarations.values()),
                  selected_operations=len(selected), replacements=len(consumed), retirements=len(retired),
                  operations=inventories, retired=[retirements[k] for k in sorted(retirements)], blockers=BLOCKERS)
    identity_map = {name: {'definition_ref': schema['$id'] + '#/$defs/' + name,
                           'origins': sorted(origins, key=lambda x: x['document'])}
                    for name, origins in sorted(identities.items())}
    return {'models.schema.json': schema, 'model-identities.json': identity_map, 'controller.preview.openapi.json': apis['controller'],
            'seamer.preview.openapi.json': apis['seamer'], 'inventory.json': report}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    output = compose(decode((ROOT / 'source.json').read_bytes()), decode((ROOT / 'policy.json').read_bytes()))
    if args.output:
        args.output.mkdir(parents=False, exist_ok=False)
        for name, value in output.items():
            (args.output / name).write_bytes(encode(value))
    print(json.dumps({k: v for k, v in output['inventory.json'].items() if k not in ('operations', 'retired', 'blockers')}, ensure_ascii=False))


if __name__ == '__main__':
    main()
