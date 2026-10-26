"""独立SDK源迁入校验；可选固定Suite来源对账，不实现业务SDK。"""
import argparse
import copy
import importlib.util
import json
import platform
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[1]
spec = importlib.util.spec_from_file_location('sdk_draft4_assembler', ROOT / 'assemble_candidate.py')
assembler = importlib.util.module_from_spec(spec)
spec.loader.exec_module(assembler)
OUTPUTS = assembler.OUTPUTS
decode, encode, sha = assembler.decode, assembler.encode, assembler.sha
source_path, walk = assembler.source_path, assembler.walk


def diff_nodes(a, b, path=''):
    # 类型也须相同，避免True==1或1==1.0掩盖树变化；字节对账再检查键序/格式。
    if type(a) is not type(b):
        return [path]
    if isinstance(a, dict):
        if set(a) != set(b):
            return [path]
        return [p for k in a for p in diff_nodes(a[k], b[k], path + '/' + k.replace('~', '~0').replace('/', '~1'))]
    if isinstance(a, list):
        if len(a) != len(b):
            return [path]
        return [p for i in range(len(a)) for p in diff_nodes(a[i], b[i], path + '/' + str(i))]
    return [] if a == b else [path]


def mutants(files):
    # 每个反例修改一个独立安全/元数据边界，预期统一拒绝，绝不更新历史期待摘要。
    changes = [
        ('SE01', ['http/controller.operations.json', 'paths', '/api/v1/events'], None, 'delete'),
        ('SE02', ['http/controller.operations.json', 'paths', '/auth/sessions/refresh', 'post', 'security'], [], 'set'),
        ('SE03', ['http/controller.operations.json', 'paths', '/api/v1/meta', 'get', 'summary'], 'changed', 'set'),
        ('SE04', ['public.schema.json', '$defs', 'Revision', 'maxLength'], 19, 'set'),
        ('SE05', ['public.schema.json', '$id'], 'https://unregistered.invalid/public', 'set'),
        ('SE06', ['ipc.schema.json', 'oneOf', 0, '$ref'], 'https://unregistered.invalid/model#/x', 'set'),
        ('SE07', ['ipc.schema.json', 'oneOf', 0, '$ref'], '#/$defs/DoesNotExist', 'set'),
        ('SE08', ['route-projection.json'], files['route-projection.json'] + [files['route-projection.json'][0]], 'set'),
        ('SE09', ['http/seamer.operations.json', 'paths', '/api/v1/events', 'get', 'x-websocket-frame-schema'], '#/components/schemas/DoesNotExist', 'set'),
        ('SE10', ['http/controller.operations.json', 'paths', '/api/v1/meta', 'get', 'responses', '200', 'headers'], {'X-Unreviewed': {'schema': {'type': 'string'}}}, 'set'),
        ('SE11', ['http/controller.operations.json', 'paths', '/api/v1/events', 'get', 'parameters'], [], 'set'),
        ('SE12', ['http/controller.operations.json', 'components', 'schemas'], {}, 'set'),
        ('SE13', ['schema-registry.json', 'legacy_openapi_component_order'], list(reversed(files['schema-registry.json']['legacy_openapi_component_order'])), 'set'),
        ('SE14', ['fixtures.json', 'examples', 0, 'schema_valid'], False, 'set'),
        ('SE15', ['route-projection.json', 0, 'unconsumed_policy'], 'unexpected', 'set'),
        ('SE16', ['schema-registry.json', 'component_projection_is_public_export_approval'], True, 'set'),
    ]
    for id, path, value, op in changes:
        changed = copy.deepcopy(files)
        parent = changed
        for key in path[:-1]:
            parent = parent[key]
        if op == 'delete':
            del parent[path[-1]]
        else:
            parent[path[-1]] = value
        yield id, changed


def require(condition, message):
    if not condition:
        raise ValueError(message)


def inputs():
    return sorted(['.gitattributes', 'LICENSE', 'README.md', 'THIRD_PARTY_NOTICES.md',
                   'contracts/draft4/README.md', 'contracts/draft4/migration.json',
                   'contracts/draft4/assemble_candidate.py', 'contracts/draft4/check_migration.py'] +
                  [p.relative_to(REPO).as_posix() for p in (ROOT / 'source').rglob('*') if p.is_file()])


def check_local():
    migration = decode((ROOT / 'migration.json').read_bytes())
    require(migration['format'] == 'leafseamer-sdk-source-migration/1', '来源格式不符')
    require(migration['protocol_changed'] is False and migration['production_sdk'] is False, '迁入边界改变')
    names = [item['path'] for item in migration['files']]
    expected = {'contracts/draft4/assemble_candidate.py'} | {
        p.relative_to(REPO).as_posix() for p in (ROOT / 'source').rglob('*') if p.is_file()}
    require(len(names) == len(set(names)) and set(names) == expected, '迁入清单不完整或重复')
    for item in migration['files']:
        raw = source_path(REPO, item['path']).read_bytes()
        require(sha(raw) == item['sha256'], '迁入原件摘要改变: ' + item['path'])
        require(item['source_path'] == 'docs/contracts/df01-source/' +
                item['path'].removeprefix('contracts/draft4/'), '来源路径错配')
    require(sha((REPO / 'LICENSE').read_bytes()) == migration['source_license_sha256'], '许可原文不一致')
    manifest, files = assembler.load_source(ROOT / 'source')
    out, counts = assembler.assemble(files)
    assembler.verify_outputs(manifest, out)
    return migration, manifest, files, out, counts


def isolated_runs(out):
    results = []
    for _ in range(2):
        with tempfile.TemporaryDirectory(prefix='leafseamer-sdk-') as temporary:
            temp = Path(temporary)
            shutil.copyfile(ROOT / 'assemble_candidate.py', temp / 'assemble_candidate.py')
            shutil.copytree(ROOT / 'source', temp / 'source')
            command = [sys.executable, '-I', '-B', str(temp / 'assemble_candidate.py'),
                       '--output', str(temp / 'generated')]
            result = subprocess.run(command, cwd=temp, capture_output=True, check=True)
            require(decode(result.stdout)['byte_equal_outputs'] == 6, '隔离生成不完整')
            raw = {name: (temp / 'generated' / name).read_bytes() for name in OUTPUTS}
            for name in OUTPUTS:
                require(raw[name] == encode(out[name]), '隔离产物不同: ' + name)
            repeated = subprocess.run(command, cwd=temp, capture_output=True)
            require(repeated.returncode != 0, '覆盖既有输出目录未拒绝')
            require(all((temp / 'generated' / n).read_bytes() == raw[n] for n in OUTPUTS), '拒绝后改写了旧产物')
            results.append(raw)
    require(results[0] == results[1], '两次隔离生成不一致')


def verify_upstream(suite, migration, manifest, out):
    def original(commit, path):
        source_path(suite, path)
        return subprocess.check_output(['git', 'show', commit + ':' + path], cwd=suite)
    source_commit = migration['source_commit']
    for item in migration['files']:
        require(original(source_commit, item['source_path']) == source_path(REPO, item['path']).read_bytes(),
                '来源提交原件不同: ' + item['path'])
    license_raw = original(source_commit, migration['source_license_path'])
    require(license_raw == (REPO / 'LICENSE').read_bytes(), '来源许可不同')
    checker = migration['derived_checker_source']
    require(sha(original(source_commit, checker['path'])) == checker['sha256'], '改编校验器来源不同')
    comparisons = []
    for name in OUTPUTS:
        path = manifest['source_directory'] + '/' + name
        raw = original(manifest['source_commit'], path)
        differences = diff_nodes(decode(raw), out[name])
        require(not differences and raw == encode(out[name]), '固定历史产物不等价: ' + name)
        require(raw == (suite / path).read_bytes(), '历史工作区产物漂移: ' + name)
        comparisons.append(dict(file=name, nodes_compared=sum(1 for _ in walk(out[name])),
                                byte_equal=True, node_differences=differences, sha256=sha(raw)))
    # 此处明确调用旧验证器，不能宣称语义实现已独立；输出等价性在上面逐项证明。
    completed = subprocess.run([sys.executable, '-B', str(suite / 'docs/contracts/draft4/validate_contracts.py')],
                               cwd=suite, capture_output=True, check=True)
    historical = decode(completed.stdout)
    require(historical.get('all_passed') is True, '历史验收失败')
    report_path = suite / 'docs/contracts/draft4/validation-report.json'
    prior = decode(report_path.read_bytes())
    dependencies = {}
    for path, expected_hash in prior['input_sha256'].items():
        relative = 'docs/' + path
        raw = source_path(suite, relative).read_bytes()
        require(sha(raw) == expected_hash, '历史报告输入漂移: ' + relative)
        require(raw == original(source_commit, relative), '历史验证输入未绑定固定来源: ' + relative)
        dependencies[relative] = expected_hash
    require(sum(historical[k] for k in ('positive', 'structural_negative', 'semantic_negative',
                                       'ipc_positive', 'ipc_negative', 'linked_cases')) == 232, '历史接受集数量不符')
    # 只保留相对路径、摘要及明确的结果；不记录宿主路径或原始进程输出。
    return dict(source_commit=source_commit, baseline_commit=manifest['source_commit'],
                original_files=len(migration['files']), comparisons=comparisons,
                historical_validation=historical, historical_input_sha256=dependencies,
                semantic_runner='suite-historical-python', sdk_semantic_implementation=False)


def run(suite):
    migration, manifest, files, out, counts = check_local()
    rejected = []
    for case_id, changed in mutants(files):
        try:
            altered, _ = assembler.assemble(changed)
            assembler.verify_outputs(manifest, altered)
        except (ValueError, KeyError, IndexError):
            rejected.append(case_id)
        else:
            raise ValueError('变异未拒绝: ' + case_id)
    for name in ('../escape', '/absolute', 'C:/absolute', 'http\\x', 'a//b'):
        try:
            source_path(ROOT, name)
        except ValueError:
            continue
        raise ValueError('越界或非规范路径未拒绝')
    isolated_runs(out)
    upstream = verify_upstream(suite, migration, manifest, out) if suite else None
    return dict(format='leafseamer-sdk-migration-report/1', all_passed=True,
                runtime=dict(python=platform.python_version(), system=platform.system()),
                byte_equal_outputs=6, public_models=len(files['public.schema.json']['$defs']),
                ipc_message_types=len(files['ipc.schema.json']['oneOf']), operations=counts,
                rejected_mutations=rejected, rejected_paths=5, isolated_python_runs=2,
                existing_output_rejections=2, upstream=upstream,
                protocol_changed=False, production_sdk=False, runtime_acceptance_cases_executed=0,
                input_sha256={path: sha(source_path(REPO, path).read_bytes()) for path in inputs()})


def check_report():
    report = decode((ROOT / 'migration-report.json').read_bytes())
    require(report['all_passed'] is True and report['upstream'] is not None, '缺少完整迁入报告')
    require(set(report['input_sha256']) == set(inputs()), '报告输入集合不完整')
    for path, expected in report['input_sha256'].items():
        require(sha(source_path(REPO, path).read_bytes()) == expected, '报告绑定过期: ' + path)
    return dict(all_passed=True, scope='仅核本仓输入绑定，不重跑验收', matched_bindings=len(inputs()))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--suite', type=Path)
    group = parser.add_mutually_exclusive_group()
    group.add_argument('--report', action='store_true')
    group.add_argument('--check-report', action='store_true')
    args = parser.parse_args()
    if args.report and not args.suite:
        parser.error('--report 需要 --suite 的固定来源与历史验收证据')
    if args.check_report and args.suite:
        parser.error('--check-report 不执行来源验收，不接受 --suite')
    result = check_report() if args.check_report else run(args.suite.resolve() if args.suite else None)
    if args.report:
        (ROOT / 'migration-report.json').write_bytes(encode(result))
    print(json.dumps({k: v for k, v in result.items() if k not in ('input_sha256', 'upstream')},
                     ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
