"""具名注册、当前授权及固定选择器参考判定；不实现身份服务或持久库。"""
import copy
from dataclasses import dataclass
from functools import lru_cache
import hashlib
import importlib.util
import sys
import rfc8785
from jsonschema import Draft202012Validator, FormatChecker
import generate as G


def need(ok, reason):
    if not ok: raise ValueError(reason)


def digest(value): return hashlib.sha256(rfc8785.dumps(value)).hexdigest()


@lru_cache(maxsize=1)
def assets(): return G.build()


def validate(name, value):
    Draft202012Validator({'$ref': G.P + name, '$defs': assets()['models.schema.json']['$defs']},
                        format_checker=FormatChecker()).validate(value)


def reference(body):
    return dict(authority_service_id=body['authority_service_id'], database_instance_id=body['database_instance_id'],
                entity_kind=body['kind'], entity_id=body['entity_id'], entity_epoch=body['entity_epoch'],
                revision=body['revision'], content_digest=digest(body))


def identity(value):
    return tuple(value[k] for k in ('authority_service_id', 'database_instance_id', 'entity_kind', 'entity_id', 'entity_epoch', 'revision'))


@dataclass(frozen=True)
class Grant:
    """来自可信认证与配置提供者的快照；不存在接收该对象的网络请求入口。"""
    owner: dict
    selection: dict
    authority_role: str
    authority_service_id: str
    database_instance_id: str
    authorization_revision: str
    permissions: frozenset
    profile_ref: dict
    selector_refs: tuple
    entities: dict
    canonical_source_ids: frozenset
    current: bool


class Registry:
    def __init__(self):
        self._bodies = {}; self._revoked = set()

    def install(self, body, trusted_ref):
        """trusted_ref必须来自本地批准记录，不能从同一远端正文现算后当作信任。"""
        validate('registry__Profile' if body.get('kind') == 'projection_profile' else 'registry__Selector', body)
        validate('snapshot__ObjectRef', trusted_ref)
        need(reference(body) == trusted_ref, 'unapproved_body')
        key = identity(trusted_ref)
        need(key not in self._revoked, 'revoked_identity')
        if key in self._bodies:
            need(self._bodies[key] == body, 'immutable_conflict')
            return
        mapping = assets()['mapping.json']
        if body['kind'] == 'projection_profile':
            need(body['graph_digest'] == mapping['source_graph_digest'], 'graph_not_installed')
            kinds = [c['entity_kind'] for c in body['collections']]
            need(kinds == sorted(set(kinds)), 'collection_order_or_duplicate')
            for rule in body['collections']:
                kind = rule['entity_kind']; fixed = mapping['collection_permissions'][kind]
                need(body['authority_role'] in fixed['authorities'] and rule['permission'] == fixed['permission'], 'collection_authority_or_permission')
                expected = dict(schema_id=mapping['source_graph_id'], definition=mapping['collection_models'][kind],
                                schema_digest=mapping['source_graph_digest'])
                need(rule['view_schema_ref'] == expected, 'view_not_installed')
                need(kind not in mapping['mandatory_unresolved'] or 'current' not in rule['history_policies'], 'unresolved_omitted')
            if 'canonical_trigger' in body['purposes']:
                need('service' in body['owner_kinds'] and 'sources' in kinds, 'canonical_profile')
        else:
            profile = self.get(body['profile_ref'], 'projection_profile')
            need(all(body[k] == profile[k] for k in ('authority_service_id', 'database_instance_id')), 'selector_authority')
            rule = next((c for c in profile['collections'] if c['entity_kind'] == body['target_collection']), None)
            need(rule is not None, 'collection_not_in_profile')
            need(body['relation_policy'] in rule['relation_policies'] and body['history_policy'] in rule['history_policies'], 'selector_policy')
            need(body['entity_ids'] == sorted(set(body['entity_ids'])), 'entity_order_or_duplicate')
            if body['window'] is not None:
                need(int(body['window']['first_cursor']) <= int(body['window']['last_cursor']), 'window_order')
        self._bodies[key] = copy.deepcopy(body)

    def get(self, ref, kind):
        validate('snapshot__ObjectRef', ref)
        key = identity(ref)
        need(key not in self._revoked and key in self._bodies, 'missing_or_revoked')
        body = self._bodies[key]
        need(body['kind'] == kind and reference(body) == ref, 'reference_mismatch')
        return copy.deepcopy(body)

    def revoke(self, ref):
        validate('snapshot__ObjectRef', ref)
        key = identity(ref)
        need(key in self._bodies and reference(self._bodies[key]) == ref, 'reference_mismatch')
        self._revoked.add(key)

    def resolve(self, scope, purpose, grant):
        validate('channel__ScopeSpec', scope); validate('channel__Owner', grant.owner)
        validate('channel__Selection', grant.selection); validate('snapshot__Counter', grant.authorization_revision)
        need(grant.current, 'authorization_not_current')
        need(scope['projection_profile_ref'] == grant.profile_ref, 'profile_not_granted')
        profile = self.get(scope['projection_profile_ref'], 'projection_profile')
        need(profile['selection'] == grant.selection and profile['authority_role'] == grant.authority_role and
             profile['authority_service_id'] == grant.authority_service_id and
             profile['database_instance_id'] == grant.database_instance_id, 'profile_binding')
        need(grant.owner['kind'] in profile['owner_kinds'] and purpose in profile['purposes'], 'owner_or_purpose')
        need(('status.read' if grant.owner['kind'] == 'human' else 'event.internal.subscribe') in grant.permissions, 'subscription_permission')
        kinds = [c['entity_kind'] for c in scope['collections']]
        need(kinds == sorted(set(kinds)), 'scope_order_or_duplicate')
        rules = {c['entity_kind']: c for c in profile['collections']}
        selectors = []
        for item in scope['collections']:
            kind = item['entity_kind']
            need(kind in rules and rules[kind]['permission'] in grant.permissions, 'collection_permission')
            need(item['selector_ref'] in grant.selector_refs, 'selector_not_granted')
            selected = self.get(item['selector_ref'], 'selector')
            need(selected['profile_ref'] == grant.profile_ref and selected['target_collection'] == kind and
                 selected['history_policy'] == item['history_policy'] and selected['relation_policy'] == item['relation_policy'], 'selector_binding')
            allowed = grant.entities.get(kind, frozenset())
            need(isinstance(allowed, frozenset) and all(isinstance(v, str) for v in allowed), 'grant_entities')
            members = set(selected['entity_ids']) if selected['mode'] == 'entity_set' else set(allowed)
            need(members <= allowed, 'entity_not_authorized')
            need(len(members) <= 4096, 'entity_capacity')
            for member in members: validate('snapshot__Id', member)
            selectors.append(dict(entity_kind=kind, selector_ref=copy.deepcopy(item['selector_ref']),
                entity_ids=sorted(members), history_policy=selected['history_policy'], window=copy.deepcopy(selected['window']),
                relation_policy=selected['relation_policy'], view_schema_ref=copy.deepcopy(rules[kind]['view_schema_ref'])))
        canonical_complete = False
        if purpose == 'canonical_trigger':
            source = next((s for s in selectors if s['entity_kind'] == 'sources'), None)
            need(grant.owner['kind'] == 'service' and source is not None and grant.canonical_source_ids and
                 set(source['entity_ids']) == set(grant.canonical_source_ids), 'canonical_scope_incomplete')
            need(source['window'] is None, 'canonical_source_window')
            canonical_complete = True
        return dict(scope_digest=digest(scope), profile_ref=copy.deepcopy(grant.profile_ref),
                    selection=copy.deepcopy(grant.selection), owner=copy.deepcopy(grant.owner),
                    authorization_revision=grant.authorization_revision, purpose=purpose, collections=selectors,
                    maximum_records=profile['maximum_records'], canonical_scope_complete=canonical_complete)


def select_records(plan, candidates):
    """输入完整性由同一数据库快照提供者证明；此函数只执行固定谓词，不猜测缺失记录。"""
    selections = {c['entity_kind']: c for c in plan['collections']}
    chosen = []; seen = set()
    for candidate in candidates:
        need(set(candidate) == {'record', 'current', 'unresolved', 'journal_cursor'}, 'candidate_shape')
        record = candidate['record']; validate('snapshot__Record', record)
        validate('snapshot__Counter', candidate['journal_cursor'])
        need(type(candidate['current']) is bool and type(candidate['unresolved']) is bool, 'candidate_state')
        key = tuple(record[k] for k in ('entity_kind', 'entity_id', 'entity_epoch'))
        need(key not in seen, 'duplicate_entity'); seen.add(key)
        selector = selections.get(record['entity_kind'])
        if selector is None or record['entity_id'] not in selector['entity_ids']: continue
        included = candidate['current']
        if selector['history_policy'] != 'current' and candidate['unresolved']: included = True
        window = selector['window']
        if window is not None:
            included |= int(window['first_cursor']) <= int(candidate['journal_cursor']) <= int(window['last_cursor'])
        if included: chosen.append((int(candidate['journal_cursor']), key, copy.deepcopy(record)))
    if plan['canonical_scope_complete']:
        expected = selections['sources']['entity_ids']
        actual = [record['entity_id'] for _, _, record in chosen if record['entity_kind'] == 'sources']
        need(sorted(actual) == expected, 'canonical_snapshot_incomplete')
    need(len(chosen) <= plan['maximum_records'], 'capacity_exceeded')
    return [record for _, _, record in sorted(chosen)]


@lru_cache(maxsize=1)
def channel_model():
    # 原模型内部使用import build；仅装载阶段临时绑定，实例保留其原模块对象。
    def module(name, path):
        spec = importlib.util.spec_from_file_location(name, path)
        value = importlib.util.module_from_spec(spec); spec.loader.exec_module(value); return value
    build = module('registered_channel_build', G.ROOT.parent / 'event-channel/build.py')
    old = sys.modules.get('build'); sys.modules['build'] = build
    try: return module('registered_channel_model', G.ROOT.parent / 'event-channel/model.py')
    finally:
        if old is None: sys.modules.pop('build', None)
        else: sys.modules['build'] = old


def authorize(registry, scope, purpose, grant, ctx, previous_plan=None):
    plan = registry.resolve(scope, purpose, grant)
    for field, value in dict(owner=grant.owner, selection=grant.selection, publisher_role=grant.authority_role,
        publisher_service_id=grant.authority_service_id, publisher_database_instance_id=grant.database_instance_id,
        authorization_revision=grant.authorization_revision, permissions=grant.permissions).items():
        need(ctx[field] == value, 'authority_context_mismatch')
    if previous_plan is not None: need(plan == previous_plan, 'release_plan_changed')
    bound = copy.deepcopy(ctx)
    bound['allowed_scope_digests'] = {plan['scope_digest']}
    bound['canonical_scope_complete'] = plan['canonical_scope_complete']
    channel_model().authorize(bound, grant.owner, scope, purpose, grant.selection)
    return bound, plan
