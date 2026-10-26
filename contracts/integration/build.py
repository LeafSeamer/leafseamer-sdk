"""离线归并当前命令 HTTP 与 worker IPC；不创建服务或改变 wire 版本。"""
import argparse
import copy
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SDK = ROOT.parents[1]
BASE = ROOT.parent / 'composition'
spec = importlib.util.spec_from_file_location('composition', BASE / 'compose.py')
C = importlib.util.module_from_spec(spec)
spec.loader.exec_module(C)
SID = 'https://leafseamer.invalid/sdk/integration/0.1/models.schema.json'
IPC_ID = 'https://leafseamer.invalid/sdk/integration/0.1/worker-ipc.schema.json'
VERSION = 'sdk-integration/0.1.0-draft.1'
BLOCKERS = [
    'HTTP及WS仍保留来源版本，完整bundle互认尚未冻结',
    '跨域Ref、数字接受集、授权及面板映射、快照投影和摘要DDL映射待归并',
    '握手关联通过不证明平台描述符来源可信，也不授予Ready或发送权限',
    '其他独立IPC通道、候选批准、阶段0交接及真实服务设备验收尚未完成',
]


def load(path):
    return C.decode(path.read_bytes())


def verified_inputs():
    record = load(ROOT / 'sources.json')
    C.require(record['format'] == 'sdk-integration-source/1' and
              record['approved'] is False and record['wire_format_changed'] is False,
              '来源声明越过候选边界')
    C.require(record['canonical_namespace'] == 'command', '命名空间未固定')
    expected = {'source/command-contract.schema.json', 'source/command-contract-ipc.schema.json',
                'source/command-contract-manifest.json'}
    C.require(set(record['source_files']) == expected, '命令源集合不完整')
    C.require(set(record['base_inputs']) == {'contracts/composition/' + n for n in
              ('compose.py', 'source.json', 'policy.json')}, '基础输入集合不完整')
    for name, info in record['source_files'].items():
        C.require(C.sha((ROOT / name).read_bytes()) == info['sha256'], '固定源漂移: ' + name)
    for name, digest in record['base_inputs'].items():
        C.require(C.sha((SDK / name).read_bytes()) == digest, '基础输入漂移: ' + name)
    return record


def integrate(base, canonical, ipc, manifest, record):
    """只对已证明相等的 command 命名空间扩展，不按名称猜跨域别名。"""
    outputs = copy.deepcopy(base)
    definitions = outputs['models.schema.json']['$defs']
    prefix = canonical['$id'] + '#/$defs/'
    C.require(manifest['canonical_schema'] == canonical['$id'] and
              manifest['ipc_version'] == record['ipc_protocol'], '源协议绑定不符')
    C.require(canonical['x-approved'] is False and manifest['approved'] is False and
              ipc['x-approved'] is False and ipc['x-runtime-approved'] is False,
              '来源批准状态不符')

    def rename(ref):
        if ref.startswith(prefix):
            name = ref[len(prefix):]
        else:
            C.require(ref.startswith('#/$defs/'), '未知外部引用: ' + ref)
            name = ref[len('#/$defs/'):]
        C.require(name in canonical['$defs'], '缺失命令模型: ' + name)
        return '#/$defs/command__' + name

    commands = {'command__' + name: C.refs(value, rename)
                for name, value in canonical['$defs'].items()}
    existing = {name for name in definitions if name.startswith('command__')}
    C.require(existing and existing <= commands.keys(), 'HTTP命令闭包有遗漏')
    for name in existing:
        C.require(definitions[name] == commands[name], 'HTTP与IPC模型不等价: ' + name)
    definitions.update(commands)
    C.closure(definitions, {'$defs': definitions})
    model = outputs['models.schema.json']
    model.update({'$id': SID, 'title': VERSION, 'x-runtime-approved': False})
    identities = outputs['model-identities.json']
    for name in definitions:
        item = identities.setdefault(name, {'origins': []})
        item['definition_ref'] = SID + '#/$defs/' + name
        if name in commands:
            item['origins'].append(dict(document='command-canonical',
                document_uri=record['source_repository'] + '/blob/' + record['source_commit'] + '/' +
                    record['source_files']['source/command-contract.schema.json']['source_path'],
                pointer='/$defs/' + name.removeprefix('command__'),
                declared_canonical_schema=canonical['$id']))
    roots = C.refs(ipc['oneOf'], rename)
    messages = {}
    for root in roots:
        C.require(set(root) == {'$ref'}, 'IPC入口不是单一引用')
        name = root['$ref'].removeprefix('#/$defs/')
        definition = definitions[name]
        p = definition['properties']; kind = p['type']['const']
        C.require(kind not in messages, '重复IPC类型')
        C.require(p['ipc_version'] == {'const': record['ipc_protocol']}, 'IPC版本漂移')
        direction = definition['x-direction']; replies = definition['x-reply-to-types']
        C.require(direction in ('c2w', 'w2c') and isinstance(replies, list) and
                  len(replies) == len(set(replies)), '方向或回复声明无效')
        messages[kind] = dict(type=kind, direction=direction, reply_to_types=replies,
                              schema_ref=SID + root['$ref'])
    C.require(len(messages) == 52, 'worker完整类型集合改变')
    for item in messages.values():
        C.require(all(r in messages and messages[r]['direction'] != item['direction']
                      for r in item['reply_to_types']), '回复目标缺失或同方向')
    outputs['worker-ipc.schema.json'] = {
        '$schema': canonical['$schema'], '$id': IPC_ID, 'title': VERSION + ' worker IPC',
        'oneOf': [{'$ref': SID + root['$ref']} for root in roots],
        'x-approved': False, 'x-runtime-approved': False,
    }
    features = {}
    for kind, field in [('HELLO', 'supported_features'), ('HELLO_ACK', 'selected_features')]:
        root = definitions[messages[kind]['schema_ref'].split('#/$defs/')[1]]
        body = definitions[root['properties']['body']['$ref'].split('#/$defs/')[1]]
        features[kind] = [v['contains']['const'] for v in body['properties'][field]['allOf']]
    outputs['worker-messages.json'] = dict(format='sdk-worker-messages/1', approved=False,
        ipc_version=record['ipc_protocol'], messages=sorted(messages.values(), key=lambda x: x['type']),
        required_features=features, handshake_result='wire_compatible_closed', send_authorized=False)
    for authority in ('controller', 'seamer'):
        api = outputs[authority + '.preview.openapi.json']
        # components仅为统一图的可移植投影；操作正文和安全方案完整保留。
        for name in api['components']['schemas']:
            api['components']['schemas'][name] = C.refs(definitions[name],
                lambda ref: '#/components/schemas/' + ref.removeprefix('#/$defs/'))
        api['info']['version'] = VERSION
        api['x-canonical-model-graph'] = SID
        api['x-release-blockers'] = BLOCKERS
    inventory = outputs['inventory.json']
    inventory.update(format='sdk-integration-inventory/1', model_count=len(definitions),
        command_models=len(commands), http_command_models_proven_equal=len(existing),
        ipc_message_types=len(messages), ipc_version=record['ipc_protocol'],
        wire_format_changed=False, full_bundle_negotiated=False, blockers=BLOCKERS)
    return outputs


def build():
    record = verified_inputs()
    base = C.compose(load(BASE / 'source.json'), load(BASE / 'policy.json'))
    return integrate(base, load(ROOT / 'source/command-contract.schema.json'),
        load(ROOT / 'source/command-contract-ipc.schema.json'),
        load(ROOT / 'source/command-contract-manifest.json'), record)


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--output', type=Path)
    args = p.parse_args()
    outputs = build()
    if args.output:
        args.output.mkdir(parents=False, exist_ok=False)
        for name, value in outputs.items():
            (args.output / name).write_bytes(C.encode(value))
    print(json.dumps({k: v for k, v in outputs['inventory.json'].items()
                      if k not in ('operations', 'retired', 'blockers')}, ensure_ascii=False))
