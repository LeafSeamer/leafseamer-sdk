"""当前35方法的合成服务调用与回执；不授予真实委托或执行资格。"""
import copy
import json
from pathlib import Path
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parent
SDK = ROOT.parents[1]


def build():
    graph = json.loads((SDK / 'contracts/panel-wire/contract/models.schema.json').read_bytes())
    frames = json.loads((SDK / 'contracts/panel-wire/oracle.json').read_bytes())['panel_cases']
    old = json.loads((SDK / 'contracts/panel-integration/preview/method-registry.json').read_bytes())
    previous = {row['method']: row for row in old['registry']['methods']}
    requests = {c['label'][3:]: json.loads(c['raw']) for c in frames if c['label'].startswith('请求:')}
    results = {c['label'][3:]: json.loads(c['raw']) for c in frames if c['label'].startswith('结果:')}
    identity = dict(authority_service_id='authority.fixture', database_instance_id='db.fixture', issuer_id='issuer.fixture',
                    issuer_epoch='epoch.fixture', auth_session_id='auth.fixture', panel_session_id='session.1',
                    document_generation='1', request_id='request.fixture')
    objref = dict(authority_service_id='authority.fixture', database_instance_id='db.fixture', entity_kind='fixture',
                  entity_id='object.fixture', entity_epoch='epoch.fixture', revision='1', content_digest='1' * 64)
    delegation = dict(authority_service_id='authority.fixture', database_instance_id='db.fixture', delegation_id='delegation.fixture', revision='1')
    def validator(name):
        return Draft202012Validator({'$defs': graph['$defs'], '$ref': '#/$defs/' + name})
    invoke = validator('panel__Service_Invocation')
    receipt = validator('panel__Service_RequestReceipt')
    rows = []
    for method, request in requests.items():
        activation = request['activation_ref']
        body = dict(intent=dict(identity=identity, delegation_ref=delegation, method=method, target_ref=objref,
                               normalized_arguments=request['payload'], capability_ref=None, policy_ref=objref, activation_ref=activation))
        result = dict(identity=identity, intent_digest='1' * 64, method=method, activation_ref=activation, state='accepted',
                      reason_code='ok', accepted_result_ref=objref, projection_state='available', projection=results[method]['result'])
        invoke.validate(body)
        receipt.validate(result)
        unavailable = dict(result, projection_state='unavailable', projection=None)
        receipt.validate(unavailable)
        bad_input = copy.deepcopy(body)
        bad_input['intent']['normalized_arguments']['schema_ref'] = previous[method]['input_schema_ref']
        bad_result = copy.deepcopy(result)
        bad_result['projection']['schema_ref'] = previous[method]['result_schema_ref']
        assert not invoke.is_valid(bad_input) and not receipt.is_valid(bad_result)
        rows.append(dict(method=method, authority=method.split('.')[0], request=body, response=result,
                         unavailable=unavailable, old_input=bad_input, old_result=bad_result))
    assert len(rows) == 35
    return dict(format='panel-http-cases/1', synthetic=True, cases=rows)


if __name__ == '__main__':
    import sys
    sys.stdout.buffer.write((json.dumps(build(), ensure_ascii=False, indent=2) + '\n').encode('utf8'))
