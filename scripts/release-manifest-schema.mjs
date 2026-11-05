export const releaseComponents = ['leafseamer', 'leafseamer-controller', 'leafseamer-gui', 'leafseamer-sdk', 'leafseamer-suite'];
export function releaseManifestSchema(base) {
  const defs = structuredClone(base.$defs), ref = name => ({$ref: '#/$defs/' + name});
  const object = properties => ({type: 'object', properties, required: Object.keys(properties), additionalProperties: false});
  const array = (items, minItems = 0, maxItems = 4096) => ({type: 'array', items, minItems, maxItems});
  const nullable = schema => ({anyOf: [schema, {type: 'null'}]});
  const id = {type: 'string', pattern: '^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}(?![\\s\\S])'};
  const component = {enum: releaseComponents};
  const u20 = {type: 'string', pattern: '^[1-9][0-9]{0,19}(?![\\s\\S])'};
  const ids = (min = 0) => array(id, min);
  const components = (min = 1) => array(component, min, 5);
  const text = {type: 'string', minLength: 1, maxLength: 1024};
  defs.Platform = object({os: {enum: ['windows', 'linux']}, arch: {const: 'x64'}, libc: {enum: [null, 'glibc']}});
  defs.Artifact = object({...defs.artifact.properties, artifact_id: id, requires: ids(), dynamic_dependencies: array(ref('dependency'))});
  defs.Artifact.properties.role.enum.push('image_archive', 'protocol_schema', 'configuration_template', 'migration', 'extension_archive');
  defs.ComponentBinding = object({...defs.component.properties, component_id: component, entrypoints: ids(), artifact_refs: ids(), requires: components(0)});
  defs.RuntimeAbi = object({node_api_version: nullable({type: 'integer', minimum: 1, maximum: 1000}), node_module_abi: nullable({type: 'integer', minimum: 1, maximum: 10000}), native_abi_id: nullable(id)});
  defs.RuntimeBinding = object({runtime_id: id, kind: {enum: ['node', 'native', 'nodecg', 'external']}, version: ref('version'), artifact_ref: id,
    abi: ref('RuntimeAbi'), platform: ref('Platform'), components: components(), host_runtime_ref: nullable(id), report_artifact_ref: id});
  defs.Entrypoint = object({entrypoint_id: id, component_id: component, kind: {enum: ['service', 'worker', 'static_gui', 'native_helper', 'external_plugin', 'tool']},
    artifact_ref: id, runtime_ref: nullable(id), requires: ids(), protocol_refs: ids(), storage_refs: ids()});
  defs.ProtocolEndpoint = object({endpoint_id: id, entrypoint_ref: id, role: id, peer_endpoint_ref: id,
    direction: {enum: ['send', 'receive', 'bidirectional']}, contract_id: id, contract_digest: ref('hash')});
  defs.ProtocolBinding = object({channel_id: id, kind: {enum: ['http', 'human_events', 'service_events', 'device_worker', 'supervisor_control', 'bootstrap',
    'time_collector', 'extension_import', 'panel', 'source_worker', 'vlc', 'maintenance_local']}, contract_id: id, contract_digest: ref('hash'),
    schema_artifact_ref: id, components: components(), endpoints: array(ref('ProtocolEndpoint'), 2)});
  defs.StorageEngine = {oneOf: [
    object({engine_id: id, kind: {const: 'sqlite'}, binary_artifact_ref: id, driver_artifact_ref: id, version: ref('version'), source_id: text,
      compile_options_digest: ref('hash'), report_artifact_ref: id}),
    object({engine_id: id, kind: {const: 'nodecg'}, binary_artifact_ref: id, version: ref('version'), format_id: id, report_artifact_ref: id})
  ]};
  defs.ConnectionProfile = {oneOf: [
    object({profile_id: id, kind: {const: 'sqlite'}, journal_mode: {enum: ['wal', 'delete']}, synchronous: {enum: ['FULL', 'EXTRA']},
      foreign_keys: {const: true}, busy_timeout: {const: 0}, wal_autocheckpoint: {const: 0}, recursive_triggers: {const: true}, trusted_schema: {const: false}, report_artifact_ref: id}),
    object({profile_id: id, kind: {const: 'nodecg'}, format_id: id, report_artifact_ref: id})
  ]};
  const storeKind = {enum: ['controller_business', 'seamer_business', 'supervisor_journal', 'installation', 'nodecg_data']};
  defs.MigrationBinding = object({migration_id: id, artifact_ref: id, store_kind: storeKind, schema_id: id, from_revision: u20, to_revision: u20,
    from_schema_digest: ref('hash'), to_schema_digest: ref('hash'), report_artifact_ref: id});
  defs.StorageBinding = object({storage_id: id, owner_role: {enum: ['controller', 'seamer', 'supervisor', 'suite_agent', 'nodecg']}, owner_component: component,
    store_kind: storeKind, schema_id: id, read_schema_revisions: array(u20, 1), write_schema_revisions: array(u20, 1),
    engine_ref: id, connection_profile_ref: id, migration_refs: ids(), report_artifact_ref: id});
  defs.ContainerBinding = object({image_id: id, image_archive_ref: id, config_digest: ref('hash'), rootfs_diff_ids: array(ref('hash'), 1), platform: ref('Platform'),
    entrypoint_ref: id, components: components(), environment_report_ref: id, registry_manifest_digest: nullable(ref('hash')), tags: array(text)});
  defs.HostPrerequisite = object({requirement_id: id, requirement: text, report_artifact_ref: id});
  defs.DeploymentProfile = object({profile_id: id, kind: {enum: ['native', 'compose']}, component_refs: components(), entrypoint_refs: ids(), protocol_refs: ids(),
    storage_refs: ids(), runtime_refs: ids(), container_refs: ids(), artifact_refs: ids(1), optional_capabilities: ids(), host_prerequisites: array(ref('HostPrerequisite')), report_refs: ids(1)});
  const properties = structuredClone(base.properties);
  for (const name of ['components', 'protocols', 'db_compatibility', 'runtime', 'dynamic_dependencies']) delete properties[name];
  properties.manifest_schema = {const: 'native-release/0.2.0-draft.1'};
  properties.release_id = id; properties.target_profile_id = id;
  properties.created_at = {type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z(?![\\s\\S])'};
  properties.target = object({...defs.Platform.properties, tested_environment_ref: ref('path'), required_cpu_features: ids()});
  delete properties.capabilities.properties.sqlite;
  properties.capabilities.required = properties.capabilities.required.filter(name => name !== 'sqlite');
  Object.assign(properties, {
    component_bindings: array(ref('ComponentBinding'), 5, 5), artifacts: array(ref('Artifact'), 1), entrypoints: array(ref('Entrypoint')),
    protocol_bindings: array(ref('ProtocolBinding')), storage_engines: array(ref('StorageEngine')), connection_profiles: array(ref('ConnectionProfile')),
    storage_bindings: array(ref('StorageBinding')), runtime_bindings: array(ref('RuntimeBinding')), migration_bindings: array(ref('MigrationBinding')),
    container_bindings: array(ref('ContainerBinding')), deployment_profiles: array(ref('DeploymentProfile'), 1)
  });
  defs.ReleaseManifest = object(properties);
  defs.ReleaseRevocations = object({format: {const: 'release-revocations/1'}, revision: u20, revoked_release_ids: ids(), revoked_manifest_digests: array(ref('hash')), revoked_artifact_digests: array(ref('hash'))});
  defs.ReleaseExtensionBinding = object({format: {const: 'leafseamer.release-extension/1'},
    release_manifest: object({target_path: {type:'string',minLength:1,maxLength:240,pattern:'^[A-Za-z0-9][A-Za-z0-9/_.-]*(?![\\s\\S])'},
      size_bytes: {type:'integer',minimum:1,maximum:4194304}, digest:ref('hash')}),
    artifact_id:id, deployment_profile_id:id, extension_manifest_digest:ref('hash')});
  return {$schema: 'https://json-schema.org/draft/2020-12/schema', $id: 'urn:leafseamer:release-manifest:1', $defs: defs};
}
