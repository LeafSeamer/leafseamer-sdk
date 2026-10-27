"""显式合成批准记录、授权来源与领域读取事实，不生成真实授权。"""
import copy
import generate as G
import registry as R


def fixture(service=False, canonical=False):
    mapping = R.assets()['mapping.json']
    common = dict(format_version=G.VERSION, authority_service_id='controller', database_instance_id='database',
                  entity_epoch='epoch', revision='1')
    selection = dict(contract_id='synthetic.registry.candidate', contract_digest='sha256:' + 'a' * 64)
    profile = dict(common, kind='projection_profile', entity_id='profile', authority_role='controller',
        selection=selection, owner_kinds=['human', 'service'], purposes=['status_projection', 'canonical_trigger'],
        graph_digest=mapping['source_graph_digest'], maximum_records=64, collections=[])
    for kind in ('commands', 'sources'):
        profile['collections'].append(dict(entity_kind=kind, permission=mapping['collection_permissions'][kind]['permission'],
            view_schema_ref=dict(schema_id=mapping['source_graph_id'], definition=mapping['collection_models'][kind],
                                 schema_digest=mapping['source_graph_digest']), relation_policies=G.RELATIONS,
            history_policies=G.HISTORY[1:] if kind == 'commands' else G.HISTORY))
    command = copy.deepcopy(G.load(G.ROOT.parent / 'event-projection/examples.json')['records']['queued'])
    source = copy.deepcopy(G.load(G.ROOT.parent / 'event-projection/source/snapshot-cases.json')['records']['sources'])
    selectors = []
    for kind, record in (('commands', command), ('sources', source)):
        selectors.append(dict(common, kind='selector', entity_id=kind + '_selector', profile_ref=R.reference(profile),
            target_collection=kind, mode='entity_set', entity_ids=[record['entity_id']], relation_policy='authorized_reference',
            history_policy='bounded_history_and_unresolved',
            window=dict(first_cursor='9007199254740993', last_cursor='9007199254740995', order='journal_cursor_then_identity')))
    if canonical:
        selectors[1]['history_policy'] = 'current_and_unresolved'; selectors[1]['window'] = None
    store = R.Registry(); store.install(profile, R.reference(profile))
    for selector in selectors: store.install(selector, R.reference(selector))
    owner = dict(kind='service' if service else 'human', issuer_id='issuer', issuer_epoch='issuer_epoch', principal_id='principal')
    if service: owner.update(consumer_service_id='seamer', consumer_database_instance_id='seamer_db', consumer_id='consumer', pairing_id='pairing')
    else: owner.update(session_id='session', client_instance_id='gui')
    scope = dict(scope_id='scope', scope_revision='1', projection_profile_ref=R.reference(profile),
        collections=[dict(entity_kind=s['target_collection'], selector_ref=R.reference(s),
                          history_policy=s['history_policy'], relation_policy=s['relation_policy']) for s in selectors])
    permissions = frozenset({'status.read', 'command.read', 'event.internal.subscribe'})
    grant = R.Grant(owner=owner, selection=selection, authority_role='controller', authority_service_id='controller',
        database_instance_id='database', authorization_revision='1', permissions=permissions, profile_ref=R.reference(profile),
        selector_refs=tuple(R.reference(s) for s in selectors), entities={'commands': frozenset([command['entity_id']]),
        'sources': frozenset([source['entity_id']])}, canonical_source_ids=frozenset([source['entity_id']]), current=True)
    ctx = dict(owner=owner, selection=selection, publisher_role='controller', publisher_service_id='controller',
        publisher_database_instance_id='database', authorization_revision='1', permissions=permissions,
        credential_current=True, authorization_current=True, storage_available=True, now_tick=0, deadline_tick=100,
        transport='service_mtls' if service else 'human_ticket', seamer_role=service,
        stream_id='stream', stream_epoch='stream_epoch', publisher_domain='domain', service_boot_id='boot')
    purpose = 'canonical_trigger' if canonical else 'status_projection'
    return dict(store=store, profile=profile, selectors=selectors, scope=scope, grant=grant, ctx=ctx, purpose=purpose,
                command=command, source=source)


def candidate(record, cursor='9007199254740994', current=False, unresolved=False):
    return dict(record=copy.deepcopy(record), journal_cursor=cursor, current=current, unresolved=unresolved)


def examples():
    f = fixture()
    return dict(profile=f['profile'], selectors=f['selectors'], scope=f['scope'],
                candidates=[candidate(f['command']), candidate(f['source'])])
