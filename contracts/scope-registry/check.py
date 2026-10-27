"""注册来源、固定选择范围、撤权释放及原订阅入口的离线关系验收。"""
import argparse
import copy
from dataclasses import replace
import json
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
import generate as G
import registry as R
import fixtures as F
from jsonschema import Draft202012Validator, ValidationError


def inputs():
    paths = [p for p in G.ROOT.rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.name != 'report.json']
    paths += [G.SDK / p for p in G.load(G.ROOT / 'sources.json')['inputs']]
    return {p.relative_to(G.SDK).as_posix(): G.C.sha(p.read_bytes()) for p in sorted(set(paths))}


def run():
    checks = []
    def check(name, actual, expected=True):
        assert actual == expected, (name, actual, expected)
        checks.append(dict(name=name, passed=True))
    def denied(name, action, reason=None):
        try: action()
        except (ValueError, ValidationError) as error:
            if reason is not None: assert str(error) == reason, (name, str(error), reason)
            check(name, True)
        else: raise AssertionError(name + ': 应拒绝')
    artifacts = G.build()
    for name, value in artifacts.items(): check('生成字节:' + name, (G.ROOT / 'preview' / name).read_bytes(), G.C.encode(value))
    schema = artifacts['models.schema.json']; Draft202012Validator.check_schema(schema)
    original = G.load(G.ROOT.parent / 'event-channel/preview/models.schema.json')
    for name, value in original['$defs'].items(): check('原定义不改写:' + name, schema['$defs'][name], value)
    examples = F.examples(); check('手工正例可重现', G.load(G.ROOT / 'examples.json'), examples)
    for name, value in [('registry__Profile', examples['profile']), ('channel__ScopeSpec', examples['scope'])]:
        R.validate(name, value); check('正例结构:' + name, True)
    for s in examples['selectors']: R.validate('registry__Selector', s)
    f = F.fixture(); store, profile, selectors = f['store'], f['profile'], f['selectors']
    def authorize(f=f, previous=None): return R.authorize(f['store'], f['scope'], f['purpose'], f['grant'], f['ctx'], previous)
    bound, plan = authorize()
    check('批准源派生scope摘要', bound['allowed_scope_digests'], {R.digest(f['scope'])})
    check('未向请求添加可信布尔', set(f['scope']), {'scope_id', 'scope_revision', 'projection_profile_ref', 'collections'})
    store.install(copy.deepcopy(profile), R.reference(profile)); check('相同原件可幂等登记', store.get(R.reference(profile), 'projection_profile'), profile)
    altered = copy.deepcopy(profile); altered['maximum_records'] += 1
    denied('旧批准拒绝改正文', lambda: store.install(altered, R.reference(profile)), 'unapproved_body')
    denied('重算摘要不覆盖同身份', lambda: store.install(altered, R.reference(altered)), 'immutable_conflict')
    returned = store.get(R.reference(profile), 'projection_profile'); returned['maximum_records'] = 1
    check('读取副本不能改注册', store.get(R.reference(profile), 'projection_profile'), profile)
    for field, value in [('schema_id', 'https://remote.invalid/schema'), ('definition', 'snapshot__Id'), ('schema_digest', '0' * 64)]:
        bad = copy.deepcopy(profile); bad['collections'][0]['view_schema_ref'][field] = value
        denied('未安装视图:' + field, lambda bad=bad: R.Registry().install(bad, R.reference(bad)), 'view_not_installed')
    for field, value, reason in [('graph_digest', '0'*64, 'graph_not_installed'), ('authority_role', 'seamer', 'collection_authority_or_permission')]:
        bad = copy.deepcopy(profile); bad[field] = value
        denied('profile绑定:' + field, lambda bad=bad: R.Registry().install(bad, R.reference(bad)), reason)
    bad = copy.deepcopy(profile); bad['collections'][0]['permission'] = 'status.read'
    denied('命令权限不降级', lambda: R.Registry().install(bad, R.reference(bad)), 'collection_authority_or_permission')
    bad = copy.deepcopy(profile); bad['collections'][0]['history_policies'].append('current')
    denied('命令未决不能省略', lambda: R.Registry().install(bad, R.reference(bad)), 'unresolved_omitted')
    bad = copy.deepcopy(profile); bad['collections'].reverse()
    denied('集合排序固定', lambda: R.Registry().install(bad, R.reference(bad)), 'collection_order_or_duplicate')
    bad = copy.deepcopy(profile); bad['collections'].append(copy.deepcopy(bad['collections'][0]))
    denied('重复集合拒绝', lambda: R.Registry().install(bad, R.reference(bad)))
    def install_selector(body):
        isolated = R.Registry(); isolated.install(profile, R.reference(profile))
        isolated.install(body, R.reference(body))
    for field, value, reason in [('authority_service_id', 'other', 'selector_authority'),
                                ('target_collection', 'devices', 'collection_not_in_profile'),
                                ('history_policy', 'current', None)]:
        bad = copy.deepcopy(selectors[0]); bad[field] = value
        denied('selector错绑:' + field, lambda bad=bad: install_selector(bad), reason)
    bad = copy.deepcopy(selectors[0]); bad['window']['first_cursor'] = '9007199254740996'
    denied('窗口倒序', lambda: install_selector(bad), 'window_order')
    for extra in ('sql', 'script', 'expression', 'event_types'):
        bad = copy.deepcopy(selectors[0]); bad[extra] = 'untrusted'
        denied('不接收动态过滤:' + extra, lambda bad=bad: install_selector(bad))
    bad = copy.deepcopy(selectors[0]); bad['entity_ids'] = ['z', 'a']
    denied('实体排序固定', lambda: install_selector(bad), 'entity_order_or_duplicate')
    # 逐集合证明具名视图与对应authority及权限可登记；不声称十一类旧视图已升级。
    mapping = artifacts['mapping.json']
    for kind, definition in mapping['collection_models'].items():
        bad = copy.deepcopy(profile); rule = mapping['collection_permissions'][kind]
        bad['authority_role'] = rule['authorities'][0]; bad['purposes'] = ['status_projection']
        bad['collections'] = [dict(entity_kind=kind, permission=rule['permission'], relation_policies=G.RELATIONS,
            history_policies=G.HISTORY[1:] if kind in mapping['mandatory_unresolved'] else G.HISTORY,
            view_schema_ref=dict(schema_id=mapping['source_graph_id'], definition=definition, schema_digest=mapping['source_graph_digest']))]
        R.Registry().install(bad, R.reference(bad)); check('十二类具名注册:' + kind, True)
    for name, grant, reason in [('撤权', replace(f['grant'], current=False), 'authorization_not_current'),
        ('缺命令权限', replace(f['grant'], permissions=frozenset({'status.read'})), 'collection_permission'),
        ('未批准selector', replace(f['grant'], selector_refs=()), 'selector_not_granted'),
        ('部分实体权限', replace(f['grant'], entities={'commands': frozenset(), 'sources': frozenset()}), 'entity_not_authorized'),
        ('错发布库', replace(f['grant'], database_instance_id='other'), 'profile_binding')]:
        denied(name, lambda grant=grant: store.resolve(f['scope'], f['purpose'], grant), reason)
    changed = copy.deepcopy(f['scope']); changed['collections'][0]['relation_policy'] = 'required_in_scope'
    denied('scope不能改selector策略', lambda: store.resolve(changed, f['purpose'], f['grant']), 'selector_binding')
    changed = copy.deepcopy(f['scope']); changed['collections'][0]['selector_ref']['content_digest'] = '0'*64
    denied('格式正确Ref不自动批准', lambda: store.resolve(changed, f['purpose'], f['grant']), 'selector_not_granted')
    ctx = copy.deepcopy(f['ctx']); ctx['permissions'] = frozenset({'status.read'})
    denied('实际上下文收窄', lambda: R.authorize(store, f['scope'], f['purpose'], f['grant'], ctx), 'authority_context_mismatch')
    for name, field, value, reason in [('期限等号', 'now_tick', 100, 'authority_expired'),
        ('存储不可用', 'storage_available', False, 'authority_unavailable'), ('凭据失效', 'credential_current', False, 'authority_unavailable'),
        ('真实授权不可用', 'authorization_current', False, 'authority_unavailable'), ('人员错用mTLS', 'transport', 'service_mtls', 'transport_identity')]:
        ctx = copy.deepcopy(f['ctx']); ctx[field] = value
        denied(name, lambda ctx=ctx: R.authorize(store, f['scope'], f['purpose'], f['grant'], ctx), reason)
    ctx = copy.deepcopy(f['ctx']); ctx['allowed_scope_digests'] = {'fake'}; ctx['canonical_scope_complete'] = True
    check('调用方批准布尔被替换', R.authorize(store, f['scope'], f['purpose'], f['grant'], ctx)[0]['canonical_scope_complete'], False)
    canonical = F.fixture(True, True); _, cp = authorize(canonical)
    check('完整规范来源集合', cp['canonical_scope_complete'], True)
    check('规范快照完整来源通过', R.select_records(cp, [F.candidate(canonical['source'], current=True)]), [canonical['source']])
    denied('规范快照缺源整体拒绝', lambda: R.select_records(cp, []), 'canonical_snapshot_incomplete')
    denied('规范快照不能用历史策略隐藏源', lambda: R.select_records(cp, [F.candidate(canonical['source'])]), 'canonical_snapshot_incomplete')
    windowed = F.fixture(True, False)
    denied('规范来源不能增加历史窗口', lambda: windowed['store'].resolve(windowed['scope'], 'canonical_trigger', windowed['grant']), 'canonical_source_window')
    missing = replace(canonical['grant'], canonical_source_ids=canonical['grant'].canonical_source_ids | {'missing_source'})
    denied('规范来源不能静默遗漏', lambda: canonical['store'].resolve(canonical['scope'], canonical['purpose'], missing), 'canonical_scope_incomplete')
    denied('人员不能消费规范trigger', lambda: store.resolve(f['scope'], 'canonical_trigger', f['grant']), 'canonical_scope_incomplete')
    ctx = copy.deepcopy(canonical['ctx']); ctx['seamer_role'] = False
    denied('来源完整不替代Seamer身份', lambda: R.authorize(canonical['store'], canonical['scope'], canonical['purpose'], canonical['grant'], ctx), 'canonical_scope')
    current = replace(f['grant'], authorization_revision='2'); ctx = copy.deepcopy(f['ctx']); ctx['authorization_revision'] = '2'
    denied('新授权不能释放旧plan', lambda: R.authorize(store, f['scope'], f['purpose'], current, ctx, plan), 'release_plan_changed')
    check('同资格释放复核', authorize(previous=plan)[1], plan)
    store.revoke(R.reference(selectors[0])); store.revoke(R.reference(selectors[0]))
    denied('撤selector阻止旧释放', lambda: authorize(previous=plan), 'missing_or_revoked')
    denied('被撤身份不能重新登记', lambda: store.install(selectors[0], R.reference(selectors[0])), 'revoked_identity')
    f = F.fixture(); _, plan = authorize(f); f['store'].revoke(R.reference(f['profile']))
    denied('撤profile使全部selector失效', lambda: authorize(f, plan), 'missing_or_revoked')
    f = F.fixture(); _, plan = authorize(f)
    command = f['command']
    for name, cursor, unresolved, current, expected in [
        ('窗口起点包含', '9007199254740993', False, False, 1), ('窗口终点包含', '9007199254740995', False, False, 1),
        ('窗口前拒旧历史', '9007199254740992', False, False, 0), ('窗口后拒未来历史', '9007199254740996', False, False, 0),
        ('窗外未决保留', '1', True, False, 1), ('窗外当前保留', '1', False, True, 1)]:
        check(name, len(R.select_records(plan, [F.candidate(command, cursor, current, unresolved)])), expected)
    candidates = [F.candidate(f['source'], '9007199254740995'), F.candidate(command, '9007199254740993')]
    check('大整数精确排序', R.select_records(plan, candidates), [command, f['source']])
    denied('同实体重复拒绝', lambda: R.select_records(plan, [candidates[0], candidates[0]]), 'duplicate_entity')
    too_small = copy.deepcopy(plan); too_small['maximum_records'] = 1
    denied('容量不足整体拒绝不截断', lambda: R.select_records(too_small, candidates), 'capacity_exceeded')
    for value in ('01', '-1', '1\n', '100000000000000000000', 9007199254740993):
        denied('游标接受集:' + repr(value), lambda value=value: R.select_records(plan, [F.candidate(command, value)]))
    # 进入原Subscription构造与每次check，证明新判定输出实际可消费。
    bound, plan = authorize(f); sub = R.channel_model().Subscription('subscription', bound, f['scope'], f['purpose'])
    sub.check(bound); check('实际接入原订阅模型', sub.view['binding']['scope_digest'], plan['scope_digest'])
    # all_authorized的实体集合来自当前可信Grant，集合变化使旧释放计划失效。
    f = F.fixture(); selector = copy.deepcopy(f['selectors'][0]); selector['entity_id'] = 'all_commands'; selector['mode'] = 'all_authorized'; selector['entity_ids'] = []
    f['store'].install(selector, R.reference(selector)); f['scope']['collections'][0]['selector_ref'] = R.reference(selector)
    f['grant'] = replace(f['grant'], selector_refs=(R.reference(selector), f['grant'].selector_refs[1]))
    _, plan = authorize(f); check('全授权集合从可信来源取得', plan['collections'][0]['entity_ids'], [f['command']['entity_id']])
    updated_entities = copy.deepcopy(f['grant'].entities); updated_entities['commands'] = updated_entities['commands'] | {'new_command'}
    f['grant'] = replace(f['grant'], entities=updated_entities)
    denied('授权实体变更不能扩旧快照', lambda: authorize(f, plan), 'release_plan_changed')
    return dict(format='scope-registry-check/1', all_passed=True, approved=False, runtime_ready=False,
        cases_passed=len(checks), checks=checks, models=len(schema['$defs']), collections=12,
        runtime_tests_executed=0, database_tests_executed=0, authentication_tests_executed=0,
        browser_tests_executed=0, device_tests_executed=0, inputs=inputs())


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__); group = parser.add_mutually_exclusive_group()
    group.add_argument('--examples', action='store_true'); group.add_argument('--report', action='store_true'); group.add_argument('--check-report', action='store_true')
    args = parser.parse_args()
    if args.examples: (G.ROOT / 'examples.json').write_bytes(G.C.encode(F.examples()))
    elif args.check_report:
        r = G.load(G.ROOT / 'report.json'); assert r['all_passed'] and r['inputs'] == inputs()
        print(json.dumps(dict(all_passed=True, bindings=len(r['inputs']))))
    else:
        r = run()
        if args.report: (G.ROOT / 'report.json').write_bytes(G.C.encode(r))
        print(json.dumps({k:v for k,v in r.items() if k not in ('checks','inputs')}, ensure_ascii=False))
