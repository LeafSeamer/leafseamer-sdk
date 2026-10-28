"""按当前具名输入与结果生成合成面板报文；不代表真实会话或授权。"""
import copy
import importlib.util
import json
from pathlib import Path
import hashlib
import rfc8785

SDK = Path(__file__).resolve().parents[2]


def load(path):
    return json.loads((SDK / path).read_bytes())


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, SDK / path)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


def digest(value):
    return hashlib.sha256(rfc8785.dumps(value)).hexdigest()


def build():
    prefix = 'contracts/panel-wire/'
    selection = load(prefix + 'contract/selection.json')
    registry = load(prefix + 'contract/method-registry.json')
    rows = {r['method']: r for r in registry['registry']['methods']}
    previous_rows = {r['method']: r for r in load('contracts/panel-integration/preview/method-registry.json')['registry']['methods']}
    old = load('contracts/panel-integration/source/channel-v02-cases.json')
    bundle = copy.deepcopy(old['bundle']['manifest'])
    bundle['registry_ref'] = registry['registry_ref']
    bundle['manifest_digest'] = digest({k: v for k, v in bundle.items() if k != 'manifest_digest'})
    activation = copy.deepcopy(old['context']['activation_ref'])
    activation['registry_ref'] = registry['registry_ref']
    activation['bundle_ref']['manifest_digest'] = bundle['manifest_digest']
    inputs = module('input_samples', 'contracts/panel-methods/fixtures.py').examples()
    results = module('result_samples', 'contracts/panel-results/fixtures.py').examples()
    results['MetaView']['protocol_version'] = selection['contract_id']
    bindings = load('contracts/panel-results/bindings.json')['methods']
    cases = []

    def frame(key):
        value = copy.deepcopy(old['frames'][key])
        value['protocol_version'] = 'panel-channel/0.3.0-draft.1'
        if 'public_binding' in value:
            value['public_binding']['protocol_version'] = value['protocol_version']
        for field, replacement in [('activation_ref', activation), ('registry_ref', registry['registry_ref']),
                                    ('manifest_digest', bundle['manifest_digest']), ('manifest', bundle)]:
            if field in value:
                value[field] = copy.deepcopy(replacement)
        if 'methods' in value:
            value['methods'] = [copy.deepcopy(rows[m['method']]) for m in value['methods']]
        return value

    def add(label, value, accepted=True):
        cases.append(dict(label=label, type=value['type'], raw=json.dumps(value, ensure_ascii=False, separators=(',', ':')), accepted=accepted))

    for method, row in rows.items():
        for kind in ['input', 'result']:
            ref = row[kind + '_schema_ref']
            document = load(prefix + 'contract/' + kind + '.schema.json')
            assert ref['schema_id'] == document['$id'] and ref['schema_digest'] == digest(document)
        request = frame('request:' + method)
        request['payload'] = dict(schema_ref=row['input_schema_ref'], value=inputs[method])
        result = frame('result:' + method)
        result.update(result=dict(schema_ref=row['result_schema_ref'], value=results[bindings[method]['variant']]), projection_state='available')
        add('请求:' + method, request)
        add('结果:' + method, result)
        add('受理但不可显示:' + method, dict(result, result=None, projection_state='unavailable'))
        for label, source, field in [('输入摘要', request, 'payload'), ('结果摘要', result, 'result')]:
            wrong = copy.deepcopy(source)
            wrong[field]['schema_ref']['schema_digest'] = '0' * 64
            add(label + ':' + method, wrong, False)
            wrong = copy.deepcopy(source)
            wrong[field]['schema_ref'] = copy.deepcopy(previous_rows[method]['input_schema_ref' if field == 'payload' else 'result_schema_ref'])
            add('实际panel3引用:' + label + ':' + method, wrong, False)
        wrong = copy.deepcopy(request)
        wrong['payload']['value']['actor'] = 'forged'
        add('透传宿主字段:' + method, wrong, False)
        wrong = copy.deepcopy(result)
        wrong.update(status='rejected')
        add('拒绝带投影:' + method, wrong, False)
        subscribe = dict(request, type='panel.subscribe', subscription_id='sub.fixture')
        subscribe.pop('request_id')
        add('订阅用途:' + method, subscribe, row['subscription_mode'] != 'none')
        if row['subscription_mode'] != 'none':
            projection = frame('baseline')
            projection.update(method=method, value=result['result'])
            if row['subscription_mode'] == 'invalidation':
                projection.update(kind='invalidated', value=None)
            add('投影:' + method, projection)
    for key in ['Ready', 'Challenge', 'Reply', 'PortOffer', 'Close', 'Closed', 'Ack', 'active', 'query',
                'projection-ack', 'unsubscribe', 'bundle:offer', 'bundle:chunk0', 'bundle:ready', 'bundle:revoke']:
        add('其他帧:' + key, frame(key))
    originals = list(cases)
    seen = set()
    for case in originals:
        if not case['accepted'] or case['type'] in seen:
            continue
        seen.add(case['type'])
        value = json.loads(case['raw'])
        wrong = copy.deepcopy(value)
        wrong['protocol_version'] = 'panel-channel/0.2.0-draft.1'
        add('旧端口版本:' + case['type'], wrong, False)
        wrong = copy.deepcopy(value)
        wrong['unexpected'] = True
        add('额外字段:' + case['type'], wrong, False)
        wrong = copy.deepcopy(value)
        wrong.pop('protocol_version')
        add('缺端口版本:' + case['type'], wrong, False)
        cases.append(dict(label='重复字段:' + case['type'], type=case['type'], raw=case['raw'][:-1] + ',"type":' + json.dumps(case['type']) + '}', accepted=False))
    assert len(seen) == 19
    # 只改变旧事件夹具中已声明的完整选择；不声称重新计算业务摘要或认证。
    previous = load('contracts/event-integration/preview/selection.json')

    def select(value):
        if value == previous:
            return copy.deepcopy(selection)
        if isinstance(value, list):
            return [select(v) for v in value]
        if isinstance(value, dict):
            return {k: selection['contract_id'] if k == 'protocol_version' and v == previous['contract_id'] else select(v) for k, v in value.items()}
        return value

    samples = select(load('contracts/wire-static/preview/contract-cases.json'))
    return dict(panel_cases=cases, event_samples=samples)
