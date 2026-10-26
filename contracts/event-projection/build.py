"""从固定SDK命令字段生成当前快照候选；不改既有HTTP或已广告契约。"""
import argparse
import copy
import importlib.util
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
SDK = ROOT.parents[1]
spec = importlib.util.spec_from_file_location('composition', ROOT.parent / 'composition/compose.py')
C = importlib.util.module_from_spec(spec); spec.loader.exec_module(C)
SID = 'https://leafseamer.invalid/sdk/event-projection/0.1/models.schema.json'
VERSION = 'snapshot-projection/0.2.0-draft.1'
P = '#/$defs/'
DIRECT = ('initial_command_ref', 'request_identity', 'target', 'origin', 'accepted_at', 'control_binding', 'state_ref', 'cancellation')
STATE = ('command_id', 'scope', 'revision', 'phase', 'outcome', 'effect_status', 'resource_status',
         'automation_continuation', 'reason_code', 'terminal_revision', 'resolution_ref')
COUNTS = ('completion_evidence_refs', 'resource_evidence_refs', 'attempt_ids')


def load(path): return C.decode(path.read_bytes())
def obj(properties): return dict(type='object', properties=properties, required=list(properties), additionalProperties=False)
def ref(name): return {'$ref': P + name}


def resolve(definitions, name):
    seen = set()
    while '$ref' in definitions[name]:
        C.require(name not in seen, '别名循环'); seen.add(name)
        name = definitions[name]['$ref'].removeprefix(P)
    return definitions[name]


def build():
    provenance = load(ROOT / 'sources.json')
    C.require(provenance['approved'] is False, '不得自动批准')
    for name, checksum in provenance['inputs'].items():
        C.require(C.sha((SDK / name).read_bytes()) == checksum, 'SDK输入漂移: ' + name)
    for name, item in provenance['source_files'].items():
        C.require(C.sha((ROOT / 'source' / name).read_bytes()) == item['sha256'], '固定来源漂移')
    canonical = load(ROOT.parent / 'negotiation/preview/models.schema.json')['$defs']
    old = load(ROOT / 'source/snapshot.schema.json')
    defs = {'snapshot__' + n: C.refs(v, lambda r: P + 'snapshot__' + r.removeprefix(P)) for n,v in old['$defs'].items()}
    record = resolve(canonical, 'command__CommandRecord')
    state = resolve(canonical, record['properties']['state']['$ref'].removeprefix(P))
    completion = resolve(canonical, record['properties']['completion']['$ref'].removeprefix(P))
    C.require(set(state['properties']) == set(STATE) | set(COUNTS), '新增命令State字段未裁决')
    # 保留来源状态条件，只有被明确移除的证据数组改成有界数量约束。
    properties = {n: copy.deepcopy(state['properties'][n]) for n in STATE}
    for src, dst in zip(COUNTS, ('completion_evidence_count', 'resource_evidence_count', 'attempt_count')):
        properties[dst] = dict(type='integer', minimum=0, maximum=state['properties'][src]['maxItems'])
    projected_state = obj(properties)
    projected_state['allOf'] = copy.deepcopy(state['allOf'])
    last = projected_state['allOf'][-1]
    C.require(last['if'] == {'properties': {'outcome': {'const': 'unknown'}, 'resource_status': {'const': 'clear'}}}, 'unknown-clear规则漂移')
    evidence = last['then']['properties'].pop('resource_evidence_refs')
    C.require(evidence['minItems'] == 1, '资源证据规则漂移')
    last['then']['properties']['resource_evidence_count'] = dict(type='integer', minimum=1, maximum=256)
    defs['snapshot__CommandState'] = projected_state
    props = {n: copy.deepcopy(record['properties'][n]) for n in DIRECT}
    props['source_record_ref'] = obj(dict(kind={'const':'command'}, scope=copy.deepcopy(record['properties']['scope']),
        object_id=copy.deepcopy(record['properties']['command_id']), revision=copy.deepcopy(record['properties']['revision']),
        digest=copy.deepcopy(record['properties']['record_digest'])))
    props['state'] = ref('snapshot__CommandState')
    cp = {n: copy.deepcopy(completion['properties'][n]) for n in ('required','achieved','policy_ref')}
    cp['evidence_count'] = dict(type='integer', minimum=0, maximum=256)
    props['completion'] = obj(cp)
    defs['snapshot__CommandSnapshotView'] = obj(props)
    # 快照规范版本单独升级；旧HTTP选择ID及已确认wire不得借此静默改写。
    for name in ('Manifest','PageContent','Data'):
        C.require(defs['snapshot__'+name]['properties']['format_version'] == {'const':'snapshot-projection/0.1.0-draft.1'}, '旧快照版本漂移')
        defs['snapshot__'+name]['properties']['format_version'] = {'const': VERSION}
    # 完整闭包含本包的显式新类型，避免跨仓运行期解析和网络取Schema。
    combined = {**canonical, **defs}
    roots = [ref('snapshot__' + n) for n in old['$defs']] + [ref('snapshot__CommandState')]
    selected = C.closure(combined, roots)
    graph = {'$schema':'https://json-schema.org/draft/2020-12/schema', '$id':SID,
             'title':VERSION, 'x-approved':False, 'not':{}, '$defs':selected}
    wrapper = {'$schema':graph['$schema'], '$id':SID.replace('models','snapshot'),
               'oneOf':[{'$ref':SID+P+'snapshot__'+n} for n in ('Manifest','PageResponse','Data')]}
    mapping = dict(format='command-snapshot-projection/1', approved=False, source_model='command__CommandRecord',
        target_model='snapshot__CommandSnapshotView', direct_fields=list(DIRECT), state_fields=list(STATE),
        count_fields=dict(zip(COUNTS, ('completion_evidence_count','resource_evidence_count','attempt_count'))),
        derived_source_fields=['command_id','scope','revision','record_digest','state','completion'],
        omitted_source_fields=sorted(set(record['properties'])-set(DIRECT)-{'command_id','scope','revision','record_digest','state','completion'}),
        permission='command.read', evidence_body_permission='command.evidence.read',
        ordinary_status_permission_sufficient=False, reference_grants_access=False,
        applied_to_http=False, applied_to_ws=False, runtime_ready=False)
    return {'models.schema.json':graph, 'snapshot.schema.json':wrapper, 'projection-map.json':mapping}


if __name__ == '__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--output',type=Path);a=p.parse_args()
    result=build()
    if a.output:
        a.output.mkdir(exist_ok=False)
        for name,value in result.items():(a.output/name).write_bytes(C.encode(value))
    print(json.dumps(dict(models=len(result['models.schema.json']['$defs']),approved=False)))
