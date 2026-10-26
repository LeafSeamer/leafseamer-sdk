"""共源、wire结构、方向及握手关联的离线正反例；不执行真实IPC。"""
import argparse
import copy
import importlib.util
import json
from pathlib import Path
import platform
import subprocess
import sys
import tempfile
from dataclasses import replace
from jsonschema import Draft202012Validator
from jsonschema.exceptions import ValidationError
from openapi_spec_validator import validate as validate_openapi
from referencing import Registry, Resource

ROOT = Path(__file__).resolve().parent


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    value = importlib.util.module_from_spec(spec)
    sys.modules[name] = value
    spec.loader.exec_module(value)
    return value


B = module('integration_build', ROOT / 'build.py')
H = module('integration_handshake', ROOT / 'handshake.py')
C = B.C


def bindings():
    files = [ROOT / n for n in ('build.py', 'handshake.py', 'check.py', 'README.md', 'sources.json')]
    files += sorted((ROOT / 'source').glob('*.json')) + sorted((ROOT / 'preview').glob('*.json'))
    files += [B.SDK / n for n in B.load(ROOT / 'sources.json')['base_inputs']]
    files += [B.BASE / 'requirements-validation.txt']
    return {p.relative_to(B.SDK).as_posix(): C.sha(p.read_bytes()) for p in files}


def run(suite=None):
    checks = []
    def check(name, ok):
        if not ok:
            raise AssertionError(name)
        checks.append(dict(name=name, passed=True))
    def reject(name, action):
        try:
            action()
        except (ValueError, ValidationError):
            check(name, True)
            return
        raise AssertionError(name + ':应拒绝')
    output = B.build()
    original = C.compose(B.load(B.BASE / 'source.json'), B.load(B.BASE / 'policy.json'))
    for name, value in output.items():
        check('生成字节一致:' + name, (ROOT / 'preview' / name).read_bytes() == C.encode(value))
    models = output['models.schema.json']; ipc = output['worker-ipc.schema.json']
    for name, value in [('models', models), ('worker-ipc', ipc)]:
        Draft202012Validator.check_schema(value)
        check('Schema元校验:' + name, True)
    check('模型数和入口数', len(models['$defs']) == 1263 and len(ipc['oneOf']) == 52)
    check('模型图不是消息入口', not Draft202012Validator(models).is_valid({}))
    for authority in ('controller', 'seamer'):
        api = output[authority + '.preview.openapi.json']; old = original[authority + '.preview.openapi.json']
        validate_openapi(api)
        check('OpenAPI结构:' + authority, True)
        check('HTTP模型闭包保留:' + authority, api['components'] == old['components'])
        for path, item in old['paths'].items():
            for method, operation in item.items():
                check('操作完整保留:' + authority + ':' + operation['operationId'], api['paths'][path][method] == operation)
    canonical = B.load(ROOT / 'source/command-contract.schema.json')
    for name, definition in canonical['$defs'].items():
        restored = C.refs(models['$defs']['command__' + name],
                         lambda r: '#/$defs/' + r.removeprefix('#/$defs/command__'))
        check('命令模型可逆:' + name, restored == definition)
    records = output['worker-messages.json']; contract = H.Contract(models, ipc, records)
    frames = B.load(ROOT / 'source/frames.json')
    provenance = B.load(ROOT / 'source/frames-provenance.json')
    check('合成样例摘要', provenance['frames_sha256'] == C.sha((ROOT / 'source/frames.json').read_bytes()))
    check('合成样例覆盖完整入口', set(frames) == set(contract.messages))
    channel = H.Channel(**{k: frames['HELLO'][k] for k in H.Channel.__dataclass_fields__})
    # 上面的合成通道仅为测试夹具；运行时必须由监督器独立提供。
    registry = Registry().with_resource(models['$id'], Resource.from_contents(models))
    validator = Draft202012Validator(ipc, registry=registry)
    for kind, frame in frames.items():
        validator.validate(frame)
        direction = contract.messages[kind]['direction']
        frame_channel = H.Channel(**{k: frame[k] for k in H.Channel.__dataclass_fields__})
        contract.frame(frame, direction, frame_channel)
        check('52帧结构及方向:' + kind, True)
        reject('反方向:' + kind, lambda f=frame, d=direction, c=frame_channel: contract.frame(f, {'c2w': 'w2c', 'w2c': 'c2w'}[d], c))
        reject('旧版本:' + kind, lambda f=frame: validator.validate(dict(f, ipc_version='ipc/0.13.0-journal-draft.1')))
        reject('序号前导零:' + kind, lambda f=frame: validator.validate(dict(f, seq='01')))
        for target in contract.messages[kind]['reply_to_types']:
            request = frames[target]; response = copy.deepcopy(frame)
            response['reply_to'] = request['message_id']; response['message_id'] = 'response-correlated'
            response.update({k: request[k] for k in H.Channel.__dataclass_fields__})
            reply_channel = H.Channel(**{k: request[k] for k in H.Channel.__dataclass_fields__})
            check('回复映射:' + kind + ':' + target,
                  contract.reply(request, response, contract.messages[target]['direction'], reply_channel) == 'reply_envelope_valid')
    for name, direction in [('HELLO', 'w2c'), ('HELLO_ACK', 'c2w'), ('PREPARE_PACKET', 'w2c'),
                            ('PREPARE_PACKET_REJECTED', 'c2w'), ('CANCEL_PREPARE_REJECTED', 'c2w'), ('DISPATCH_CANCEL', 'c2w')]:
        check('独立方向预期:' + name, contract.messages[name]['direction'] == direction)
    hello, ack = copy.deepcopy(frames['HELLO']), copy.deepcopy(frames['HELLO_ACK'])
    descriptor = copy.deepcopy(hello['body']['clock_domain_descriptor'])
    reject('原结构样例不能冒充关联握手', lambda: contract.negotiate(hello, ack, channel, descriptor))
    ack['reply_to'] = hello['message_id']
    check('匹配握手仍然关闭', contract.negotiate(hello, ack, channel, descriptor) == dict(
        state='wire_compatible_closed', gate_state='closed', send_authorized=False, full_bundle_negotiated=False))
    check('反向序号独立不能要求ACK大于HELLO', hello['seq'] == ack['seq'])
    for field in H.Channel.__dataclass_fields__:
        bad = copy.deepcopy(ack); bad[field] = 'clock_' + '0' * 64 if field == 'clock_domain_id' else 'sha256:' + '0' * 64 if field == 'descriptor_digest' else 'different'
        reject('ACK通道错配:' + field, lambda b=bad: contract.negotiate(hello, b, channel, descriptor))
        bad_channel = replace(channel, **{field: bad[field]})
        reject('可信通道不符:' + field, lambda c=bad_channel: contract.negotiate(hello, ack, c, descriptor))
    for field, value in [('runtime_generation', 'other-generation'), ('supervisor_instance_id', 'other-supervisor'),
                         ('authority_service_id', 'other-authority'), ('clock_backend_revision', 'other-backend')]:
        h, a = copy.deepcopy(hello), copy.deepcopy(ack)
        h['body']['clock_domain_descriptor'][field] = a['body']['clock_domain_descriptor'][field] = value
        reject('双方同改运行域仍拒绝:' + field, lambda h=h, a=a: contract.negotiate(h, a, channel, descriptor))
    for field in ('clock_domain_id', 'descriptor_digest'):
        a = copy.deepcopy(ack); a['body'][field] = 'clock_' + '0' * 64 if field == 'clock_domain_id' else 'sha256:' + '0' * 64
        reject('内外投影不一致:' + field, lambda a=a: contract.negotiate(hello, a, channel, descriptor))
    for field, value in [('gate_state', 'open'), ('selected_ipc_version', 'ipc/0.13.0-journal-draft.1')]:
        a = copy.deepcopy(ack); a['body'][field] = value
        reject('握手拒非法选择:' + field, lambda a=a: contract.negotiate(hello, a, channel, descriptor))
    for field, value in [('reply_to', 'wrong-id'), ('message_id', hello['message_id'])]:
        a = dict(ack, **{field: value})
        reject('关联ID错误:' + field, lambda a=a: contract.negotiate(hello, a, channel, descriptor))
    reject('回复类型错误', lambda: contract.reply(frames['PREPARE_PACKET'], ack, 'w2c', channel))
    reject('非对象', lambda: contract.frame([], 'w2c', channel))
    h = copy.deepcopy(hello)
    h['body']['supported_features'] = records['required_features']['HELLO']
    validator.validate(h)
    check('23项HELLO结构有效但不足以接受30项ACK', len(h['body']['supported_features']) == 23 and len(records['required_features']['HELLO_ACK']) == 30)
    reject('ACK不能选择未提供的七项能力', lambda: contract.negotiate(h, ack, channel, descriptor))
    a = copy.deepcopy(ack); a['body']['selected_features'].append('future-extra')
    validator.validate(a)
    reject('ACK不能单方增加扩展能力', lambda: contract.negotiate(hello, a, channel, descriptor))
    h = copy.deepcopy(hello); h['body']['supported_features'].append('future-extra')
    check('允许共同声明额外能力但仍不授发送', contract.negotiate(h, a, channel, descriptor)['send_authorized'] is False)
    a = copy.deepcopy(ack); a['body']['selected_features'].remove('execution_guard')
    reject('不允许只协商共同子集而遗漏强制能力', lambda: contract.negotiate(hello, a, channel, descriptor))
    source_ipc = B.load(ROOT / 'source/command-contract-ipc.schema.json')
    manifest = B.load(ROOT / 'source/command-contract-manifest.json'); record = B.verified_inputs()
    def changed_model(name, action):
        modified = copy.deepcopy(canonical); action(modified)
        reject(name, lambda: B.integrate(original, modified, source_ipc, manifest, record))
    changed_model('共用HTTP模型漂移必须拒绝', lambda s: s['$defs']['CommandRequest'].update(description='unexpected'))
    changed_model('模型缺失必须拒绝', lambda s: s['$defs'].pop('CommandRequest'))
    changed_model('外部引用必须拒绝', lambda s: s['$defs']['S9__HELLO'].update({'$ref': 'https://unbound.invalid/schema'}))
    changed_model('未知方向必须拒绝', lambda s: s['$defs']['S9__HELLO'].update({'x-direction': 'both'}))
    changed_model('同方向回复必须拒绝', lambda s: s['$defs']['S9__HELLO_ACK'].update({'x-reply-to-types': ['OPEN_GATE']}))
    changed_model('未知回复类型必须拒绝', lambda s: s['$defs']['S9__HELLO_ACK'].update({'x-reply-to-types': ['MISSING']}))
    bad_ipc = copy.deepcopy(source_ipc); bad_ipc['oneOf'][1] = bad_ipc['oneOf'][0]
    reject('重复IPC入口必须拒绝', lambda: B.integrate(original, canonical, bad_ipc, manifest, record))
    with tempfile.TemporaryDirectory(prefix='sdk-integration-') as tmp:
        for i in range(2):
            dest = Path(tmp) / str(i)
            subprocess.run([sys.executable, '-I', '-B', str(ROOT / 'build.py'), '--output', str(dest)], check=True, capture_output=True)
            check('隔离确定性生成:' + str(i), all((dest / n).read_bytes() == C.encode(v) for n, v in output.items()))
        collision = subprocess.run([sys.executable, '-I', '-B', str(ROOT / 'build.py'), '--output', str(dest)], capture_output=True)
        check('拒覆盖既有输出目录', collision.returncode != 0)
    source_count = 0
    if suite:
        paths = dict(provenance['source_inputs'])
        for info in record['source_files'].values():
            paths[info['source_path']] = info['sha256']
        check('样例与契约来自同一提交', provenance['source_commit'] == record['source_commit'])
        # 一次batch读固定Git对象，不依赖Suite工作区，也不执行旧服务。
        for path in paths:
            if '\\' in path or path.startswith('/') or any(p in ('', '..', '.') for p in path.split('/')):
                raise ValueError('来源路径不规范')
        query = ''.join(record['source_commit'] + ':' + path + '\n' for path in paths)
        result = subprocess.run(['git', '-C', str(suite), 'cat-file', '--batch'], input=query.encode(), capture_output=True, check=True).stdout
        offset = 0
        for path, digest in paths.items():
            end = result.index(b'\n', offset); header = result[offset:end].split()
            check('Git来源为blob:' + path, len(header) == 3 and header[1] == b'blob')
            size = int(header[2]); raw = result[end + 1:end + 1 + size]; offset = end + 2 + size
            check('固定Git来源摘要:' + path, C.sha(raw) == digest)
        check('Git batch无尾随输出', offset == len(result)); source_count = len(paths)
    return dict(format='sdk-integration-check/1', all_passed=True, approved=False, runtime_ready=False,
        checks=checks, cases_passed=len(checks), model_count=1263, http_operations=177, ipc_message_types=52,
        fixed_source_files_verified=source_count, runtime_tests_executed=0, device_tests_executed=0,
        python_version=platform.python_version(), inputs=bindings())


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--suite', type=Path)
    parser.add_argument('--report', action='store_true')
    parser.add_argument('--check-report', action='store_true')
    args = parser.parse_args()
    if args.check_report:
        report = B.load(ROOT / 'report.json')
        C.require(report['inputs'] == bindings(), '报告输入漂移')
        print(json.dumps(dict(input_bindings_match=True, inputs=len(report['inputs']))))
    else:
        report = run(args.suite)
        if args.report:
            (ROOT / 'report.json').write_bytes(C.encode(report))
        print(json.dumps({k: v for k, v in report.items() if k not in ('checks', 'inputs')}, ensure_ascii=False))
