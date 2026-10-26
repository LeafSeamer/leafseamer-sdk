"""生成显式契约选择的HTTP/WS候选及无循环摘要清单；只处理设计资料。"""
import argparse
import copy
import importlib.util
import json
from pathlib import Path
import re
import rfc8785

ROOT = Path(__file__).resolve().parent
SDK = ROOT.parents[1]
spec = importlib.util.spec_from_file_location('composition', ROOT.parent / 'composition/compose.py')
C = importlib.util.module_from_spec(spec)
spec.loader.exec_module(C)
SID = 'https://leafseamer.invalid/sdk/negotiation/0.1/models.schema.json'
IPC_ID = 'https://leafseamer.invalid/sdk/negotiation/0.1/worker-ipc.schema.json'
REF = '#/$defs/'


def load(path):
    return C.decode(path.read_bytes())


def obj(properties):
    return dict(type='object', properties=properties, required=list(properties), additionalProperties=False)


def ref(name):
    return {'$ref': REF + name}


def digest(value):
    return 'sha256:' + C.sha(rfc8785.dumps(value))


def build():
    source = load(ROOT / 'sources.json'); policy = load(ROOT / 'policy.json')
    C.require(source['format'] == 'sdk-negotiation-source/1' and source['approved'] is False,
              '来源格式或批准状态错误')
    expected = {'contracts/integration/preview/' + n for n in ('models.schema.json',
        'controller.preview.openapi.json', 'seamer.preview.openapi.json', 'worker-ipc.schema.json', 'worker-messages.json')}
    expected.add('contracts/composition/compose.py')
    C.require(set(source['inputs']) == expected, '来源集合改变')
    for name, checksum in source['inputs'].items():
        C.require(C.sha((SDK / name).read_bytes()) == checksum, '来源漂移: ' + name)
    C.require(policy['approved'] is False and not any(policy[k] for k in
              ('implicit_fallback', 'automatic_write_retry', 'selection_is_authorization', 'worker_wire_changed')),
              '传输策略越过候选边界')
    C.require(re.fullmatch(r'[A-Za-z0-9._-]{1,128}', policy['contract_id']) and
              policy['max_advertised_contracts'] == 8, '候选身份或广告容量未冻结')
    base = ROOT.parent / 'integration/preview'
    model = load(base / 'models.schema.json'); old_id = model['$id']; model['$id'] = SID
    model['title'] = policy['contract_id']; definitions = model['$defs']
    cid = policy['contract_id']; digest_shape = dict(type='string', pattern=r'^sha256:[0-9a-f]{64}$', minLength=71, maxLength=71)
    id_shape = dict(type='string', pattern=r'^[A-Za-z0-9._-]+$', minLength=1, maxLength=128,
                    **{'not': {'pattern': r'[^A-Za-z0-9._-]'}})
    definitions['negotiation__Selection'] = obj(dict(contract_id={'const': cid}, contract_digest=digest_shape))
    # 广告可含明确保留的旧契约；本候选Schema只接受自身选择，不将未知广告当作可解析模型。
    definitions['negotiation__AdvertisedSelection'] = obj(dict(contract_id=id_shape, contract_digest=digest_shape))
    definitions['negotiation__Discovery'] = obj(dict(
        negotiation_protocol={'const': policy['negotiation_protocol']},
        authority_role={'enum': ['controller', 'seamer']},
        supported_contracts=dict(type='array', minItems=1, maxItems=policy['max_advertised_contracts'],
                                uniqueItems=True, items=ref('negotiation__AdvertisedSelection'))))
    definitions['negotiation__SelectionError'] = obj(dict(
        negotiation_protocol={'const': policy['negotiation_protocol']},
        code={'enum': policy['selection_errors']}, request_id=copy.deepcopy(id_shape),
        domain_evaluated={'const': False}, retry_advice={'const': 'do_not_retry'}))
    changes = []
    for name, definition in list(definitions.items()):
        if name.startswith('baseline__') and 'protocol_version' in definition.get('properties', {}):
            C.require(definition['properties']['protocol_version'] == {'const': '1.0.0-draft.4'}, '基线协议字段漂移')
            definition['properties']['protocol_version'] = {'const': cid}
            definition['properties']['selection'] = ref('negotiation__Selection')
            definition['required'].append('selection'); changes.append(name)
    for name in ('baseline__RequestContextRequest', 'baseline__RequestContext', 'baseline__WsTicketRequest', 'baseline__WsTicketBinding'):
        d = definitions[name]
        C.require('selection' not in d['properties'], '选择字段已存在')
        d['properties']['selection'] = ref('negotiation__Selection'); d['required'].append('selection'); changes.append(name)
    d = definitions['baseline__WsTicketBinding']
    d['properties']['service_boot_id'] = ref('baseline__Id'); d['required'].append('service_boot_id')
    definitions['negotiation__WsReady'] = obj(dict(type={'const': 'contract.ready'},
        selection=ref('negotiation__Selection'), binding_id=ref('baseline__Id'),
        service_id=ref('baseline__Id'), service_boot_id=ref('baseline__Id')))
    definitions['negotiation__WsData'] = copy.deepcopy(definitions['baseline__WsFrame'])
    definitions['baseline__WsFrame'] = {'oneOf': [ref('negotiation__WsReady'), ref('negotiation__WsData')]}
    changes.append('baseline__WsFrame')
    C.closure(definitions, {'$defs': definitions})
    outputs = {'models.schema.json': model}
    inventory = []
    for authority in ('controller', 'seamer'):
        api = load(base / (authority + '.preview.openapi.json'))
        paths = C.refs(api['paths'], lambda r: REF + r.removeprefix('#/components/schemas/'))
        for path, methods in paths.items():
            for method, op in methods.items():
                old_parameters = op.get('parameters', [])
                removed = [p for p in old_parameters if p.get('in') == 'header' and p['name'].lower() == policy['contract_header'].lower()]
                op['parameters'] = [p for p in old_parameters if p not in removed]
                if removed:
                    op['x-source-contract-parameters'] = removed
                is_ws = op['operationId'] == 'openEvents'
                if not is_ws:
                    op['parameters'] += [dict(name=policy['contract_header'], **{'in': 'header'}, required=True, schema={'const': cid}),
                        dict(name=policy['digest_header'], **{'in': 'header'}, required=True, schema=copy.deepcopy(digest_shape))]
                else:
                    op['x-offered-subprotocols'] = [policy['ws_contract_prefix'] + cid + '.<64-lowercase-hex>', policy['ws_ticket_prefix'] + '<base64url>']
                    op['x-first-server-frame-schema'] = '#/components/schemas/negotiation__WsReady'
                    token_prefix = policy['ws_contract_prefix'] + cid + '.'
                    op['responses']['101']['headers']['Sec-WebSocket-Protocol']['schema'] = dict(type='string',
                        minLength=len(token_prefix)+64, maxLength=len(token_prefix)+64,
                        pattern='^' + re.escape(token_prefix) + '[0-9a-f]{64}$')
                # 选择失败发生于领域解析前，不能冒充原领域错误或永久拒收裁决。
                for code in ('400', '409'):
                    response = op['responses'].setdefault(code, {'description': '契约选择拒绝，不能据此重放业务写入'})
                    content = response.setdefault('content', {}).setdefault('application/json', {})
                    prior = content.get('schema')
                    content['schema'] = {'anyOf': [prior, ref('negotiation__SelectionError')]} if prior else ref('negotiation__SelectionError')
                for code, response in op['responses'].items():
                    headers = response.setdefault('headers', {})
                    headers[policy['contract_header']] = {'schema': {'const': cid}, 'x-required-after-selection': True}
                    headers[policy['digest_header']] = {'schema': copy.deepcopy(digest_shape), 'x-required-after-selection': True}
                    if is_ws and code == '101':
                        headers.pop(policy['contract_header']); headers.pop(policy['digest_header'])
                op['x-contract-selection'] = dict(transport='websocket-subprotocol' if is_ws else 'http-headers',
                    selection_schema=SID + REF + 'negotiation__Selection', auth_policy_unchanged=True,
                    stored_context_selection='match_when_operation_uses_context', negotiation_errors_do_not_adjudicate_original_request=True)
                inventory.append(dict(authority=authority, method=method, path=path, operation_id=op['operationId'],
                    transport='websocket' if is_ws else 'http', old_contract_headers=removed))
        C.require(policy['discovery_path'] not in paths, '发现路由重合')
        paths[policy['discovery_path']] = {'get': dict(operationId='discoverContracts', security=[],
            summary='有限契约广告，不签发凭据或授权', responses={
                '200': dict(description='当前部署明确支持的契约身份', headers={'Cache-Control': {'schema': {'const': 'no-store'}}},
                            content={'application/json': {'schema': ref('negotiation__Discovery')}}),
                '429': dict(description='发现请求限流'), '503': dict(description='没有已就绪的契约处理组合')},
            **{'x-contract-selection': {'transport': 'discovery', 'authorization_granted': False}})}
        # 包含WS元数据的具名根；保持原闭包之外新增根显式加入。
        roots = [paths, ref('negotiation__WsReady')]
        subset = C.closure(definitions, roots)
        local = lambda value: C.refs(value, lambda r: '#/components/schemas/' + r.removeprefix(REF))
        api['paths'] = local(paths); api['components']['schemas'] = local(subset)
        scheme = api['components']['securitySchemes']['baseline_' + authority + '__wsTicketHeader']
        scheme['description'] = '同时提供明确契约token与单次票据token；服务端只回显契约token，禁止记录秘密票据。'
        api['info']['version'] = cid; api['x-canonical-model-graph'] = SID
        api['x-release-blockers'] = ['候选未批准；跨域Ref、数字、授权、投影及DDL仍待统一',
            '保留旧契约的实际处理组合和完整认证提供者未实现', 'worker只证明原IPC能力匹配，不证明完整bundle互认']
        outputs[authority + '.openapi.json'] = api
    ipc = load(base / 'worker-ipc.schema.json')
    ipc['$id'] = IPC_ID
    ipc['oneOf'] = [{'$ref': r['$ref'].replace(old_id, SID, 1)} for r in ipc['oneOf']]
    outputs['worker-ipc.schema.json'] = ipc
    messages = load(base / 'worker-messages.json')
    for msg in messages['messages']:
        msg['schema_ref'] = msg['schema_ref'].replace(old_id, SID, 1)
    outputs['worker-messages.json'] = messages
    outputs['routing.json'] = dict(format='sdk-selection-routing/1', approved=False,
        ordinary_http_operations=sum(r['transport'] == 'http' for r in inventory),
        websocket_operations=sum(r['transport'] == 'websocket' for r in inventory), discovery_operations=2,
        changed_definitions=changes, operations=inventory)
    # 摘要仅覆盖声明的固定资料字节，不将selection文件或manifest自身递归纳入。
    artifact_hashes = {name: C.sha(C.encode(value)) for name, value in sorted(outputs.items())}
    artifact_hashes.update({'policy.json': C.sha((ROOT / 'policy.json').read_bytes()),
                            'PROTOCOL.md': C.sha((ROOT / 'PROTOCOL.md').read_bytes())})
    manifest = dict(format='sdk-contract-artifacts/1', contract_id=cid, approved=False,
        artifact_digest_algorithm='sha256-bytes', selection_digest_algorithm='sha256-jcs-manifest', artifacts=artifact_hashes)
    outputs['manifest.json'] = manifest
    outputs['selection.json'] = dict(contract_id=cid, contract_digest=digest(manifest))
    return outputs


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__); p.add_argument('--output', type=Path); args = p.parse_args()
    outputs = build()
    if args.output:
        args.output.mkdir(parents=False, exist_ok=False)
        for name, value in outputs.items(): (args.output / name).write_bytes(C.encode(value))
    print(json.dumps(dict(selection=outputs['selection.json'], operations=179, approved=False), ensure_ascii=False))
