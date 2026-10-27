"""固定订阅模型图上的投影注册与具名选择器设计候选。"""
import argparse
import copy
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SDK = ROOT.parents[1]
spec = importlib.util.spec_from_file_location('composition', ROOT.parent / 'composition/compose.py')
C = importlib.util.module_from_spec(spec); spec.loader.exec_module(C)
SID = 'https://leafseamer.invalid/sdk/scope-registry/0.1/models.schema.json'
VERSION = 'scope-registry/0.1.0-draft.1'
P = '#/$defs/'
HISTORY = ['current', 'current_and_unresolved', 'bounded_history_and_unresolved']
RELATIONS = ['required_in_scope', 'authorized_reference']


def load(path): return C.decode(path.read_bytes())
def ref(name): return {'$ref': P + name}
def obj(**properties): return dict(type='object', properties=properties, required=list(properties), additionalProperties=False)
def choices(values): return {'enum': values}
def array(item, maximum, minimum=1): return dict(type='array', items=item, minItems=minimum, maxItems=maximum, uniqueItems=True)


def build():
    sources = load(ROOT / 'sources.json')
    C.require(sources['approved'] is False, '不能自动批准')
    for path, checksum in sources['inputs'].items():
        C.require(C.sha((SDK / path).read_bytes()) == checksum, '固定输入漂移: ' + path)
    graph = load(ROOT.parent / 'event-channel/preview/models.schema.json')
    policy = load(ROOT.parent / 'event-channel/preview/policy.json')
    definitions = copy.deepcopy(graph['$defs'])
    definitions['registry__Identity'] = obj(
        format_version={'const': VERSION}, kind=choices(['projection_profile', 'selector']),
        authority_service_id=ref('snapshot__Id'), database_instance_id=ref('snapshot__Id'),
        entity_id=ref('snapshot__Id'), entity_epoch=ref('snapshot__Id'), revision=ref('snapshot__Counter'))
    identity = definitions.pop('registry__Identity')['properties']
    def body(kind, **fields):
        properties = copy.deepcopy(identity); properties['kind'] = {'const': kind}; properties.update(fields)
        return obj(**properties)
    definitions['registry__CollectionRule'] = obj(entity_kind=ref('snapshot__EntityKind'),
        view_schema_ref=ref('snapshot__SchemaRef'), permission=dict(type='string', minLength=1, maxLength=128),
        relation_policies=array(choices(RELATIONS), 2), history_policies=array(choices(HISTORY), 3))
    definitions['registry__Profile'] = body('projection_profile', authority_role=choices(['controller', 'seamer']),
        selection=ref('channel__Selection'), owner_kinds=array(choices(['human', 'service']), 2),
        purposes=array(choices(['status_projection', 'canonical_trigger']), 2),
        graph_digest=ref('snapshot__Digest'), collections=array(ref('registry__CollectionRule'), 12),
        maximum_records=dict(type='integer', minimum=1, maximum=4096))
    definitions['registry__Window'] = obj(first_cursor=ref('snapshot__Counter'), last_cursor=ref('snapshot__Counter'),
        order={'const': 'journal_cursor_then_identity'})
    definitions['registry__Selector'] = body('selector', profile_ref=ref('snapshot__ObjectRef'),
        target_collection=ref('snapshot__EntityKind'), mode=choices(['entity_set', 'all_authorized']),
        entity_ids=array(ref('snapshot__Id'), 4096, 0), relation_policy=choices(RELATIONS),
        history_policy=choices(HISTORY), window={'oneOf': [ref('registry__Window'), {'type': 'null'}]})
    selector = definitions['registry__Selector']
    selector['allOf'] = [
        {'if': {'properties': {'mode': {'const': 'entity_set'}}},
         'then': {'properties': {'entity_ids': {'minItems': 1}}},
         'else': {'properties': {'entity_ids': {'maxItems': 0}}}},
        {'if': {'properties': {'history_policy': {'const': 'bounded_history_and_unresolved'}}},
         'then': {'properties': {'window': ref('registry__Window')}},
         'else': {'properties': {'window': {'type': 'null'}}}}]
    roots = {}
    for branch in definitions['snapshot__Record']['oneOf']:
        props = branch['properties']
        roots[props['entity_kind']['const']] = props['view']['$ref'].removeprefix(P)
    C.require(set(roots) == set(policy['collection_permissions']), '集合映射不完整')
    mapping = dict(format='scope-registry-mapping/1', approved=False, runtime_ready=False,
        source_graph_id=graph['$id'], source_graph_digest=C.sha((ROOT.parent / 'event-channel/preview/models.schema.json').read_bytes()),
        collection_models=roots, collection_permissions=policy['collection_permissions'],
        mandatory_unresolved=['commands', 'executions', 'occurrences'], silent_truncation_allowed=False)
    schema = dict(graph, **{'$id': SID, 'title': VERSION, '$defs': definitions})
    return {'models.schema.json': schema, 'mapping.json': mapping}


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__); p.add_argument('--output', type=Path); args = p.parse_args()
    result = build()
    if args.output:
        args.output.mkdir(exist_ok=False)
        for name, value in result.items(): (args.output / name).write_bytes(C.encode(value))
    print(json.dumps(dict(models=len(result['models.schema.json']['$defs']), approved=False)))
