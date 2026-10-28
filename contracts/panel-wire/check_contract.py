"""独立核对完整候选、URI闭包及允许迁移；不授予运行资格。"""
import copy
import importlib.util
import json
from pathlib import Path
from urllib.parse import urldefrag
import rfc8785
from jsonschema import Draft202012Validator
from openapi_spec_validator import validate
import hashlib

ROOT = Path(__file__).resolve().parent
SDK = ROOT.parents[1]


def load(path):
    return json.loads(path.read_bytes())


def digest(value):
    return hashlib.sha256(rfc8785.dumps(value)).hexdigest()


def run():
    checks = []

    def check(name, value):
        if not value:
            raise AssertionError(name)
        checks.append(dict(name=name, passed=True))

    spec = importlib.util.spec_from_file_location('current_composition', ROOT / 'compose.py')
    compose = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(compose)
    expected = compose.build()
    outputs = {p.name: load(p) for p in (ROOT / 'contract').iterdir()}
    check('完整候选文件集合', set(outputs) == set(expected))
    for name, value in expected.items():
        check('完整候选确定性:' + name, (ROOT / 'contract' / name).read_bytes() == compose.B.encoded(value))
    manifest = outputs['manifest.json']
    check('候选未批准', all(manifest[k] is False for k in ['approved', 'runtime_ready', 'advertisable']))
    check('完整选择摘要', outputs['selection.json'] == dict(contract_id='leafseamer.api.v1.panel4', contract_digest='sha256:' + digest(manifest)))
    check('清单覆盖无自指', set(manifest['artifacts']) == set(outputs) - {'manifest.json', 'selection.json'} | {'PROTOCOL.md'})
    for name, sha in manifest['artifacts'].items():
        path = ROOT / name if name == 'PROTOCOL.md' else ROOT / 'contract' / name
        check('候选制品字节:' + name, hashlib.sha256(path.read_bytes()).hexdigest() == sha)
    resources = {v['$id']: v for v in outputs.values() if '$schema' in v}
    graph = outputs['models.schema.json']

    def resolve(reference, document):
        uri, fragment = urldefrag(reference)
        target = resources[uri] if uri else document
        assert fragment.startswith('/')
        for part in fragment[1:].split('/'):
            target = target[part.replace('~1', '/').replace('~0', '~')]
        return target

    def refs(value, document):
        if isinstance(value, list):
            for child in value:
                refs(child, document)
        elif isinstance(value, dict):
            for key, child in value.items():
                if key in ['const', 'enum', 'default', 'example', 'examples']:
                    continue
                if key in ['$ref', 'x-client-frame-schema', 'x-server-frame-schema', 'x-first-server-frame-schema', 'selection_schema', 'schema_ref'] and isinstance(child, str):
                    resolve(child, document)
                else:
                    refs(child, document)

    for name, document in outputs.items():
        if '$schema' in document:
            Draft202012Validator.check_schema(document)
        if 'openapi' in document:
            validate(document)
        refs(document, document)
        check('逐制品引用闭包:' + name, True)
    previous = {name: load(SDK / 'contracts/panel-integration/preview' / name) for name in outputs}
    old_graph = previous['models.schema.json']
    registry = outputs['method-registry.json']
    check('Registry完整摘要', registry['registry_ref']['digest'] == digest(registry['registry']))
    for row in registry['registry']['methods']:
        for kind in ['input', 'result']:
            reference = row[kind + '_schema_ref']
            document = resources[reference['schema_id']]
            check('方法整文档:' + kind + row['method'], reference['definition'] in document['$defs'] and reference['schema_digest'] == digest(document))
    workers = outputs['worker-messages.json']['messages']
    check('worker数量与IPC保持', len(workers) == 52 and outputs['worker-messages.json']['ipc_version'] == previous['worker-messages.json']['ipc_version'])
    for row, old in zip(workers, previous['worker-messages.json']['messages']):
        check('worker消息元数据:' + row['type'], {k: v for k, v in row.items() if k != 'schema_ref'} == {k: v for k, v in old.items() if k != 'schema_ref'})
        check('worker指向当前图:' + row['type'], row['schema_ref'].startswith(graph['$id'] + '#/$defs/') and resolve(row['schema_ref'], graph) == old_graph['$defs'][row['schema_ref'].split('/')[-1]])
    # 固定记录原缺陷；只有旧schema_ref确实不能在旧候选制品中解析才算复现。
    old_resources = {v['$id'] for v in previous.values() if '$schema' in v}
    check('原panel3未闭合引用复现', all(urldefrag(w['schema_ref'])[0] not in old_resources for w in previous['worker-messages.json']['messages']))
    substitutions = {digest(outputs[k]): digest(previous[k]) for k in ['input.schema.json', 'result.schema.json']}
    substitutions[registry['registry_ref']['digest']] = previous['method-registry.json']['registry_ref']['digest']
    new_base = graph['$id'].rsplit('/', 1)[0] + '/'
    old_base = old_graph['$id'].rsplit('/', 1)[0] + '/'

    def restore(value):
        if isinstance(value, str):
            if value in substitutions:
                return substitutions[value]
            return value.replace(new_base, old_base).replace('leafseamer.api.v1.panel4', 'leafseamer.api.v1.panel3').replace('leafseamer\\.api\\.v1\\.panel4', 'leafseamer\\.api\\.v1\\.panel3')
        if isinstance(value, list):
            return [restore(v) for v in value]
        if isinstance(value, dict):
            return {k: restore(v) for k, v in value.items()}
        return value

    for name, value in outputs.items():
        if name in ['manifest.json', 'selection.json', 'worker-messages.json']:
            continue
        check('限定语义迁移:' + name, restore(value) == previous[name])
    return dict(all_passed=True, cases_passed=len(checks), checks=checks, selection=outputs['selection.json'], models=len(graph['$defs']), worker_references=52)


if __name__ == '__main__':
    print(json.dumps(run(), ensure_ascii=False))
