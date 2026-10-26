"""从固定Suite提交提取HTTP归并源；不执行Suite生成器，不采用加载顺序裁决。"""
import argparse
import importlib.util
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('sdk_compose', ROOT / 'compose.py')
C = importlib.util.module_from_spec(spec); spec.loader.exec_module(C)
COMMIT = '5a2847524316a80cf5d6e2e663d91854d4d15675'
IMPORTS = [
    ('baseline_controller', 'draft4/controller.openapi.json', ['controller'], 'baseline'),
    ('baseline_seamer', 'draft4/seamer.openapi.json', ['seamer'], 'baseline'),
    ('lifecycle', 'c04-lifecycle/lifecycle.openapi.json', ['seamer'], 'lifecycle'),
    ('preparation', 'c04-preparation/preparation.openapi.json', ['controller'], 'preparation'),
    ('command', 'c04-lifecycle/command-contract.openapi.json', ['controller'], 'command'),
    ('control', 'c08-controller/control-authority.openapi.json', ['controller'], 'control'),
    ('ingress', 'c05-ingress/ingress.openapi.json', ['seamer'], 'ingress'),
    ('protection', 'c05-protection/protection.openapi.json', ['controller'], 'protection'),
    ('panel', 'c09-panel-service/service.openapi.json', ['controller', 'seamer'], 'panel'),
    ('subscription', 'c09-panel-subscriptions/subscriptions.openapi.json', ['controller', 'seamer'], 'subscription'),
    ('installation', 'c09-installation/installation-v02.openapi.json', ['controller', 'seamer'], 'installation'),
    ('time_public', 'df03-service/public.openapi.json', ['controller', 'seamer'], 'time_public'),
    ('time_internal', 'df03-service/internal.openapi.json', ['controller', 'seamer'], 'time_internal'),
    ('continuation_controller', 'c04-lifecycle/continuation-controller.openapi.json', ['controller'], 'continuation_controller'),
    ('continuation_seamer', 'c04-lifecycle/continuation-seamer.openapi.json', ['seamer'], 'continuation_seamer'),
]
# 身份逐项列出；新来源增加操作不能自动扩大覆盖范围。
REPLACE = {
    ('controller', 'command'): ['submitCommand', 'getCommand', 'cancelCommand', 'getCommandEvidence'],
    ('controller', 'control'): ['getControl', 'getControlOperation', 'acquireControl', 'releaseControl', 'offerTransfer', 'acceptTransfer'],
    ('seamer', 'lifecycle'): ['createDefinition', 'updateDraft', 'publishDefinition', 'getIndependenceProof',
                            'createRun', 'getRun', 'preflightRun', 'armRun', 'pauseRun', 'previewRecovery', 'resumeRun', 'getRecoveryOperation'],
    ('seamer', 'ingress'): ['ingestEvent'],
    ('controller', 'time_public'): ['getClock', 'getClockAssessment'],
    ('seamer', 'time_public'): ['getClock', 'getClockAssessment'],
}
RETIRE = ['/internal/time-evidence/{evidence_id}', '/internal/time-profiles/{profile_id}/{revision}',
          '/internal/clock-samples/{sample_id}']


def extract(suite):
    def raw(path):
        return subprocess.check_output(['git', 'show', COMMIT + ':' + path], cwd=suite)
    documents = {}; definitions = {}; imports = []; originals = {}
    for name, path, authorities, namespace in IMPORTS:
        path = 'docs/contracts/' + path
        data = raw(path); api = C.decode(data)
        C.require(C.encode(api) == data, '来源编码不符合冻结格式: ' + path)
        doc, models = C.canonicalize(api, namespace)
        for model, value in models.items():
            C.require(model not in definitions or definitions[model] == value, '共享模型冲突')
            definitions[model] = value
        documents[name] = doc; originals[name] = api
        imports.append(dict(id=name, path=path, authorities=authorities, namespace=namespace, sha256=C.sha(data),
                            path_mount='/api/v1' if name == 'control' else '', source_servers=api.get('servers', [])))
    replacements = []
    for (authority, newer), ids in REPLACE.items():
        older = 'baseline_' + authority
        for operation_id in ids:
            found = [(method, path, op) for path, methods in originals[older]['paths'].items()
                     for method, op in methods.items() if op['operationId'] == operation_id]
            C.require(len(found) == 1, '替换身份不唯一: ' + operation_id)
            method, path, _ = found[0]
            source_path = path.removeprefix('/api/v1') if newer == 'control' else path
            new_op = originals[newer]['paths'][source_path][method]
            replacements.append(dict(authority=authority, method=method, path=path, old_source=older,
                new_source=newer, old_operation_id=operation_id, new_operation_id=new_op['operationId']))
    retirements = []
    for authority in ('controller', 'seamer'):
        for path in RETIRE:
            name = 'baseline_' + authority
            operation_id = originals[name]['paths'][path]['get']['operationId']
            retirements.append(dict(authority=authority, method='get', path=path, source=name, operation_id=operation_id,
                                    reason='改用四项精确reference-time历史查询，禁止旧格式回退'))
    source = dict(format='sdk-composition-source/1', approved=False, documents=documents, definitions=definitions)
    policy = dict(format='sdk-composition-policy/1', approved=False,
        provenance=dict(repository='https://github.com/LeafSeamer/leafseamer-suite', commit=COMMIT,
                        license='Apache-2.0', license_sha256=C.sha(raw('LICENSE'))),
        imports=imports, replacements=replacements, retirements=retirements)
    C.compose(source, policy)
    return source, policy


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--suite', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    source, policy = extract(args.suite.resolve())
    args.output.mkdir(parents=False, exist_ok=False)
    (args.output / 'source.json').write_bytes(C.encode(source))
    (args.output / 'policy.json').write_bytes(C.encode(policy))
    print('已提取15份固定来源、27项替换和6项退役裁决')


if __name__ == '__main__':
    main()
