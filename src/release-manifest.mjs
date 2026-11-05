import {decodeWire, getSchema, profile, WireError} from './release-manifest/wire.mjs';
export {releaseManifestSelection} from './release-manifest/selection.mjs';
export {WireError as ReleaseWireError};
const budget = profile({max_message_bytes: 4194304, max_depth: 32, max_value_nodes: 1048576, max_object_members: 128,
  max_key_utf8_bytes: 128, max_string_utf8_bytes: 32768, parse_deadline_ms: 5000});
const need = (ok, reason) => { if (!ok) throw new WireError('binding', reason); };
const yieldNow = () => new Promise(resolve => { if (typeof setImmediate === 'function') setImmediate(resolve); else setTimeout(resolve, 0); });
const unique = values => { const result = new Set(values); need(result.size === values.length, 'release_duplicate'); return result; };
const index = (values, key) => { unique(values.map(value => value[key])); return new Map(values.map(value => [value[key], value])); };
function acyclic(nodes, dependencies, step) {
  const done = new Set(), active = new Set();
  for (const key of nodes.keys()) {
    const stack = [[key, false]];
    while (stack.length) {
      step();
      const [id, exit] = stack.pop();
      if (exit) { active.delete(id); done.add(id); continue; }
      need(nodes.has(id), 'release_dependency_missing'); if (done.has(id)) continue;
      need(!active.has(id), 'release_dependency_cycle'); active.add(id); stack.push([id, true]);
      for (const next of dependencies(nodes.get(id))) stack.push([next, false]);
    }
  }
}
export async function decodeReleaseManifest(bytes) {
  const m = (await decodeWire(bytes, getSchema('ReleaseManifest'), {profile: budget, yieldNow})).value;
  let work = 0; const started = performance.now();
  const step = () => { need(++work <= 2097152, 'release_complexity'); if (work % 1024 === 0) need(performance.now() - started < 5000, 'release_deadline'); };
  const artifacts = index(m.artifacts, 'artifact_id'), paths = index(m.artifacts, 'path'), components = index(m.component_bindings, 'component_id');
  const entries = index(m.entrypoints, 'entrypoint_id'), protocols = index(m.protocol_bindings, 'channel_id');
  const engines = index(m.storage_engines, 'engine_id'), connections = index(m.connection_profiles, 'profile_id');
  const stores = index(m.storage_bindings, 'storage_id'), runtimes = index(m.runtime_bindings, 'runtime_id');
  const migrations = index(m.migration_bindings, 'migration_id'), containers = index(m.container_bindings, 'image_id');
  const profiles = index(m.deployment_profiles, 'profile_id');
  const by = (map, id) => { step(); const value = map.get(id); need(value, 'release_reference'); return value; };
  const file = (id, roles) => { const value = by(artifacts, id); need(!roles || roles.includes(value.role), 'release_artifact_role'); return value; };
  const filePath = (name, roles) => file(by(paths, name).artifact_id, roles);
  const refs = (values, map) => { unique(values); for (const id of values) by(map, id); };
  const subset = (values, selected) => { for (const id of values) { step(); need(selected.has(id), 'release_deployment_closure'); } };
  const platform = value => need(value.os === m.target.os && value.arch === m.target.arch && value.libc === m.target.libc, 'release_platform_binding');
  need((m.target.os === 'windows') === (m.target.libc === null), 'release_platform'); unique(m.target.required_cpu_features);
  const date = new Date(m.created_at); need(Number.isFinite(date.getTime()) && date.toISOString().replace('.000Z', 'Z') === m.created_at, 'release_created_at');
  const folded = new Set(), directories = new Set();
  for (const a of m.artifacts) {
    const lower = a.path.toLowerCase(), parts = a.path.split('/');
    need(!folded.has(lower) && !directories.has(lower), 'release_path_collision'); folded.add(lower);
    for (const part of parts) need(part !== '.' && part !== '..' && !part.endsWith('.') && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(part.split('.')[0]), 'release_path');
    for (let n = 1; n < parts.length; ++n) { const parent = parts.slice(0, n).join('/').toLowerCase(); need(!folded.has(parent), 'release_path_collision'); directories.add(parent); }
    need((a.role === 'native_addon') === (a.abi.kind !== 'none'), 'release_artifact_abi');
    by(components, a.component); refs(a.requires, artifacts);
    for (const dependency of a.dynamic_dependencies) {
      if (dependency.kind === 'bundled') filePath(dependency.artifact_path);
      else filePath(dependency.environment_report_path, ['report']);
    }
  }
  const artifactDeps = a => [...a.requires, ...a.dynamic_dependencies.filter(d => d.kind === 'bundled').map(d => by(paths, d.artifact_path).artifact_id)];
  acyclic(artifacts, artifactDeps, step);
  for (const c of components.values()) {
    refs(c.entrypoints, entries); refs(c.artifact_refs, artifacts); refs(c.requires, components);
    for (const id of c.artifact_refs) need(file(id).component === c.component_id, 'release_component_owner');
    for (const id of c.entrypoints) need(by(entries, id).component_id === c.component_id, 'release_component_owner');
  }
  for (const a of artifacts.values()) need(by(components, a.component).artifact_refs.includes(a.artifact_id), 'release_component_inventory');
  acyclic(components, c => c.requires, step);
  const componentClosures = new Map();
  const componentClosure = id => {
    if (componentClosures.has(id)) return componentClosures.get(id);
    const result = new Set(), pending = [id];
    while (pending.length) { const next = pending.pop(); if (result.has(next)) continue; result.add(next); pending.push(...by(components, next).requires); }
    componentClosures.set(id, result); return result;
  };
  for (const a of artifacts.values()) for (const id of artifactDeps(a)) need(componentClosure(a.component).has(file(id).component), 'release_component_dependency');
  for (const r of runtimes.values()) {
    file(r.artifact_ref, ['runtime', 'native_helper', 'app']); file(r.report_artifact_ref, ['report']); refs(r.components, components); platform(r.platform);
    if (r.host_runtime_ref !== null) by(runtimes, r.host_runtime_ref);
    if (r.kind === 'node') need(r.abi.node_api_version !== null && r.abi.node_module_abi !== null && r.abi.native_abi_id === null && r.host_runtime_ref === null, 'release_runtime_abi');
    else if (r.kind === 'nodecg') need(r.host_runtime_ref !== null && by(runtimes, r.host_runtime_ref).kind === 'node' && Object.values(r.abi).every(v => v === null), 'release_runtime_abi');
    else need(r.abi.node_api_version === null && r.abi.node_module_abi === null && r.abi.native_abi_id !== null, 'release_runtime_abi');
  }
  acyclic(runtimes, r => r.host_runtime_ref === null ? [] : [r.host_runtime_ref], step);
  for (const e of entries.values()) {
    need(by(components, e.component_id).entrypoints.includes(e.entrypoint_id), 'release_component_inventory');
    need(file(e.artifact_ref).component === e.component_id, 'release_entrypoint_owner'); refs(e.requires, entries); refs(e.protocol_refs, protocols); refs(e.storage_refs, stores);
    const roles = {service: ['app', 'native_helper'], worker: ['module', 'app'], static_gui: ['gui'], native_helper: ['native_helper'], external_plugin: ['native_helper', 'module'], tool: ['app', 'native_helper']};
    file(e.artifact_ref, roles[e.kind]);
    for (const id of e.requires) need(componentClosure(e.component_id).has(by(entries, id).component_id), 'release_component_dependency');
    for (const id of e.protocol_refs) need(by(protocols, id).endpoints.some(endpoint => endpoint.entrypoint_ref === e.entrypoint_id), 'release_protocol_binding');
    if (e.runtime_ref !== null) need(by(runtimes, e.runtime_ref).components.includes(e.component_id), 'release_runtime_component');
    need(e.kind === 'static_gui' || e.runtime_ref !== null, 'release_entrypoint_runtime');
    let runtime = e.runtime_ref === null ? null : by(runtimes, e.runtime_ref);
    while (runtime?.host_runtime_ref !== null && runtime?.host_runtime_ref !== undefined) runtime = by(runtimes, runtime.host_runtime_ref);
    const seen = new Set(), pending = [e.artifact_ref];
    while (pending.length) {
      const id = pending.pop(); if (seen.has(id)) continue; seen.add(id); const a = file(id); pending.push(...artifactDeps(a));
      if (a.abi.kind !== 'none') need(runtime?.kind === 'node' && (a.abi.kind === 'node_api' ? a.abi.napi_version <= runtime.abi.node_api_version : a.abi.modules_abi === runtime.abi.node_module_abi), 'release_node_abi');
    }
  }
  acyclic(entries, e => e.requires, step);
  let publicSelection;
  for (const p of protocols.values()) {
    file(p.schema_artifact_ref, ['protocol_schema']); refs(p.components, components); const endpoints = index(p.endpoints, 'endpoint_id'), owners = new Set();
    if (['http', 'human_events', 'service_events'].includes(p.kind)) {
      const value = p.contract_id + '/' + p.contract_digest; need(publicSelection === undefined || publicSelection === value, 'release_public_selection'); publicSelection = value;
    }
    for (const endpoint of p.endpoints) {
      const entry = by(entries, endpoint.entrypoint_ref), peer = by(endpoints, endpoint.peer_endpoint_ref); owners.add(entry.component_id);
      need(entry.protocol_refs.includes(p.channel_id) && endpoint.contract_id === p.contract_id && endpoint.contract_digest === p.contract_digest, 'release_protocol_binding');
      need(peer.peer_endpoint_ref === endpoint.endpoint_id && peer.endpoint_id !== endpoint.endpoint_id && peer.role !== endpoint.role &&
        ({send: 'receive', receive: 'send', bidirectional: 'bidirectional'})[endpoint.direction] === peer.direction, 'release_endpoint_pair');
    }
    need(owners.size === p.components.length && p.components.every(id => owners.has(id)), 'release_protocol_components');
  }
  for (const e of engines.values()) { file(e.binary_artifact_ref); file(e.report_artifact_ref, ['report']); if (e.kind === 'sqlite') file(e.driver_artifact_ref); }
  for (const c of connections.values()) file(c.report_artifact_ref, ['report']);
  for (const v of migrations.values()) { file(v.artifact_ref, ['migration']); file(v.report_artifact_ref, ['report']); need(v.from_revision !== v.to_revision, 'release_migration_transition'); }
  const owners = {controller_business: ['controller', 'leafseamer-controller'], seamer_business: ['seamer', 'leafseamer'], installation: ['suite_agent', 'leafseamer-suite']};
  for (const s of stores.values()) {
    unique(s.read_schema_revisions); unique(s.write_schema_revisions);
    subset(s.write_schema_revisions, new Set(s.read_schema_revisions)); by(components, s.owner_component); refs(s.migration_refs, migrations); file(s.report_artifact_ref, ['report']);
    const engine = by(engines, s.engine_ref), connection = by(connections, s.connection_profile_ref);
    if (s.store_kind === 'supervisor_journal') need(s.owner_role === 'supervisor' && ['leafseamer', 'leafseamer-controller'].includes(s.owner_component), 'release_storage_owner');
    else if (s.store_kind === 'nodecg_data') need(s.owner_role === 'nodecg', 'release_storage_owner');
    else need(owners[s.store_kind][0] === s.owner_role && owners[s.store_kind][1] === s.owner_component, 'release_storage_owner');
    if (s.store_kind === 'nodecg_data') need(engine.kind === 'nodecg' && connection.kind === 'nodecg' && engine.format_id === connection.format_id, 'release_storage_profile');
    else need(engine.kind === 'sqlite' && connection.kind === 'sqlite' && connection.journal_mode === (s.store_kind === 'supervisor_journal' ? 'delete' : 'wal') &&
      connection.synchronous === (s.store_kind === 'supervisor_journal' ? 'EXTRA' : 'FULL'), 'release_storage_profile');
    for (const id of s.migration_refs) { const v = by(migrations, id); need(v.store_kind === s.store_kind && v.schema_id === s.schema_id && s.write_schema_revisions.includes(v.to_revision), 'release_migration_binding'); }
  }
  for (const c of containers.values()) {
    file(c.image_archive_ref, ['image_archive']); file(c.environment_report_ref, ['report']); refs(c.components, components); unique(c.tags); platform(c.platform);
    need(c.platform.os === 'linux' && c.components.includes(by(entries, c.entrypoint_ref).component_id), 'release_container_binding');
  }
  filePath(m.build.toolchain_manifest_path, ['build_metadata']); filePath(m.target.tested_environment_ref, ['report']);
  for (const value of Object.values(m.capabilities)) filePath(value.report_path, ['report']);
  for (const [key, role] of Object.entries({sbom_path: 'sbom', license_bundle_path: 'license', acceptance_path: 'report', provenance_path: 'provenance'})) filePath(m.reports[key], [role]);
  const reproduced = m.reproducibility.status === 'verified'; need(reproduced === (m.reproducibility.report_path !== null) && (m.channel !== 'stable' || reproduced), 'release_reproducibility');
  if (reproduced) filePath(m.reproducibility.report_path, ['report']);
  for (const p of profiles.values()) {
    for (const [name, map] of [['component_refs', components], ['entrypoint_refs', entries], ['protocol_refs', protocols], ['storage_refs', stores], ['runtime_refs', runtimes], ['container_refs', containers], ['artifact_refs', artifacts]]) refs(p[name], map);
    unique(p.optional_capabilities); index(p.host_prerequisites, 'requirement_id'); unique(p.report_refs);
    const cs = new Set(p.component_refs), es = new Set(p.entrypoint_refs), ps = new Set(p.protocol_refs), ss = new Set(p.storage_refs), rs = new Set(p.runtime_refs), as = new Set(p.artifact_refs);
    for (const id of cs) { const c = by(components, id); subset(c.requires, cs); subset(c.artifact_refs, as); }
    for (const id of as) { const a = file(id); need(cs.has(a.component), 'release_deployment_closure'); subset(artifactDeps(a), as); for (const d of a.dynamic_dependencies) if (d.kind === 'host') need(as.has(filePath(d.environment_report_path).artifact_id), 'release_deployment_closure'); }
    for (const id of es) { const e = by(entries, id); need(cs.has(e.component_id) && as.has(e.artifact_ref) && (e.runtime_ref === null || rs.has(e.runtime_ref)), 'release_deployment_closure'); subset(e.requires, es); subset(e.protocol_refs, ps); subset(e.storage_refs, ss); }
    for (const id of rs) { const r = by(runtimes, id); need(as.has(r.artifact_ref) && as.has(r.report_artifact_ref) && (r.host_runtime_ref === null || rs.has(r.host_runtime_ref)), 'release_deployment_closure'); }
    for (const id of ps) need(as.has(by(protocols, id).schema_artifact_ref), 'release_deployment_closure');
    for (const id of ss) {
      const s = by(stores, id), e = by(engines, s.engine_ref), c = by(connections, s.connection_profile_ref);
      need(cs.has(s.owner_component), 'release_deployment_closure'); subset([s.report_artifact_ref, e.binary_artifact_ref, e.report_artifact_ref, c.report_artifact_ref, ...(e.kind === 'sqlite' ? [e.driver_artifact_ref] : [])], as);
      for (const migration of s.migration_refs) { const m = by(migrations, migration); subset([m.artifact_ref, m.report_artifact_ref], as); }
    }
    for (const id of p.container_refs) { const c = by(containers, id); subset(c.components, cs); subset([c.image_archive_ref, c.environment_report_ref], as); need(es.has(c.entrypoint_ref), 'release_deployment_closure'); }
    need(p.kind === 'compose' ? p.container_refs.length > 0 && m.target.os === 'linux' : p.container_refs.length === 0, 'release_deployment_kind');
    for (const h of p.host_prerequisites) { file(h.report_artifact_ref, ['report']); need(as.has(h.report_artifact_ref), 'release_deployment_closure'); }
    for (const id of p.report_refs) { file(id, ['report']); need(as.has(id), 'release_deployment_closure'); }
  }
  return m;
}
export async function decodeReleaseRevocations(bytes) {
  const value = (await decodeWire(bytes, getSchema('ReleaseRevocations'), {profile: budget, yieldNow})).value;
  for (const name of ['revoked_release_ids', 'revoked_manifest_digests', 'revoked_artifact_digests']) unique(value[name]);
  return value;
}
export async function decodeReleaseExtensionBinding(bytes) {
  const value = (await decodeWire(bytes, getSchema('ReleaseExtensionBinding'), {profile: budget, yieldNow})).value;
  need(value.release_manifest.target_path.split('/').every(part => part && part !== '.' && part !== '..'), 'release_target_path');
  return value;
}
