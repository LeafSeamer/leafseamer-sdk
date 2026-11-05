import {decodeWire, getSchema, profile, WireError} from './worker-runtime/wire.mjs';
export {workerRuntimeSelection} from './worker-runtime/selection.mjs';
export {WireError as WorkerRuntimeWireError};
export const workerControlVersion = 'supervisor-control/0.4.0-draft.1';
export const sourceWorkerProtocol = 'source-worker/1';
const small = profile({max_message_bytes: 65536, max_depth: 16, max_value_nodes: 8192, max_object_members: 64,
  max_key_utf8_bytes: 128, max_string_utf8_bytes: 1024, parse_deadline_ms: 1000});
const control = profile({...small, max_message_bytes: 262144,max_string_utf8_bytes:65536});
const loadMaterials=profile({...small,max_message_bytes:8388608,max_depth:32,max_value_nodes:524288,max_object_members:4096,max_string_utf8_bytes:1048576,parse_deadline_ms:3000});
const result = profile({...small, max_message_bytes: 16777216, max_string_utf8_bytes: 11184812, parse_deadline_ms: 5000});
const controls = new Set(['FENCE_PUT', 'FENCE_RESULT', 'LAUNCH_REGISTER', 'LAUNCH_CREATE', 'LAUNCH_QUERY', 'LAUNCH_RESULT', 'LAUNCH_MATERIALIZE', 'MATERIALIZATION_RESULT','LAUNCH_LOAD','LOAD_RESULT', 'RETIRE_REQUEST', 'RETIRE_RESULT', 'ERROR']);
const sourceTypes = new Set(['CAPTURE', 'CAPTURE_RESULT', 'CAPTURE_FAILED', 'CAPTURE_ACK', 'CANCEL', 'CANCEL_ACK', 'STOP', 'STOP_ACK']);
const check = (ok, reason) => { if (!ok) throw new WireError('binding', reason); };
const yieldNow = () => new Promise(resolve => { if (typeof setImmediate === 'function') setImmediate(resolve); else setTimeout(resolve, 0); });
async function decode(bytes, schema, budget = small) {
  return (await decodeWire(bytes, getSchema(schema), {profile: budget, yieldNow})).value;
}
const sameOwner = (value, scope) => value.authority_service_id === scope.service_id && value.database_instance_id === scope.database_instance_id;
const refKey = ref => [ref.kind, ref.authority_service_id, ref.database_instance_id, ref.object_id, ref.revision, ref.digest].join('\0');
function orderedRefs(refs) {
  const seen = new Set(); let previous = '';
  for (const ref of refs) {
    const key = refKey(ref), identity = [ref.kind, ref.authority_service_id, ref.database_instance_id, ref.object_id].join('\0');
    check(key > previous && !seen.has(identity), 'object_scope_order'); seen.add(identity); previous = key;
  }
}
function intentSemantics(value) {
  const scope = value.object_scope;
  if (scope.kind === 'devices') check(scope.device_ids.every((id, i, ids) => i === 0 || ids[i - 1] < id), 'object_scope_order');
  else { orderedRefs(scope.source_refs); orderedRefs(scope.data_object_refs); }
}
export async function decodeWorkerIntent(bytes, context) {
  const value = await decode(bytes, 'intent', control); intentSemantics(value);
  check(context && ['controller', 'seamer'].includes(context.authority) && value.service_id === context.service_id, 'worker_authority');
  check((context.authority === 'controller') === (value.object_scope.kind === 'devices'), 'worker_authority');
  for (const key of ['installation_ref', 'approval_ref', 'review_ref', 'role_resolution_ref', 'configuration_ref']) check(sameOwner(value.extension_binding[key], context), 'worker_binding_scope');
  if (value.object_scope.kind === 'data_sources') for (const ref of [...value.object_scope.source_refs, ...value.object_scope.data_object_refs]) check(sameOwner(ref, context), 'worker_binding_scope');
  return value;
}
export async function decodeWorkerControl(bytes, expectedType) {
  check(controls.has(expectedType), 'worker_control_type');
  const value = await decode(bytes, 'control', control); check(value.type === expectedType, 'worker_control_direction');
  if (value.type === 'LAUNCH_LOAD' && value.payload.operation === 'chunk') base64Length(value.payload.bytes);
  if (value.type === 'LAUNCH_REGISTER') intentSemantics(value.payload.intent);
  if(value.type==='MATERIALIZATION_RESULT'&&value.payload.status==='verified'){
    const life=value.payload.observation.lifetime;
    check(life.clock.clock_domain_id===value.scope.domain_ref.clock_domain_id&&life.clock.descriptor_digest===value.scope.domain_ref.descriptor_digest,'materialization_domain');
    check(BigInt(life.deadline_tick)>BigInt(life.issued_tick)&&BigInt(life.deadline_tick)-BigInt(life.issued_tick)<=5000000000n,'materialization_window');
  }
  return value;
}
export async function decodeWorkerLoadMaterials(bytes){
 const value=await decode(bytes,'loadMaterials',loadMaterials),paths=new Set();let previous='';
 for(const file of value.inventory.files){const path=file.path.toLowerCase();check(file.file_id>previous&&!paths.has(path),'worker_load_inventory');previous=file.file_id;paths.add(path);}
 return value;
}
export async function decodeLaunchAuthorization(bytes) { return decode(bytes, 'authorization'); }
function sourceBindingScope(value, scope) {
  for (const [key, ref] of Object.entries(value)) if (key.endsWith('_ref') && ref && 'authority_service_id' in ref) check(sameOwner(ref, scope), 'source_binding_scope');
}
export async function decodeSourceRuntimeBinding(bytes) {
  const value = await decode(bytes, 'sourceRuntime');
  sourceBindingScope(value, {service_id: value.scope.authority_service_id, database_instance_id: value.scope.database_instance_id}); return value;
}
export async function decodeSourceBinding(bytes) {
  const value = await decode(bytes, 'sourceBinding');
  if (value.target.kind === 'data_source') sourceBindingScope(value.target, {service_id: value.owner_service_id, database_instance_id: value.database_instance_id});
  return value;
}
function base64Length(bytes) {
  check(bytes.length % 4 === 0, 'source_base64');
  const padding = bytes.endsWith('==') ? 2 : bytes.endsWith('=') ? 1 : 0;
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  for (let i = 0; i < bytes.length - padding; i++) check(alphabet.includes(bytes[i]), 'source_base64');
  if (padding) check((alphabet.indexOf(bytes[bytes.length - padding - 1]) & (padding === 2 ? 15 : 3)) === 0, 'source_base64');
  return bytes.length / 4 * 3 - padding;
}
export async function decodeSourceWorker(bytes, expectedType) {
  check(sourceTypes.has(expectedType), 'source_type');
  const value = await decode(bytes, 'source', expectedType === 'CAPTURE_RESULT' ? result : small);
  check(value.type === expectedType, 'source_direction'); const body = value.body;
  sourceBindingScope(body, {service_id: value.runtime_binding_ref.authority_service_id, database_instance_id: value.runtime_binding_ref.database_instance_id});
  if (value.type === 'CAPTURE') check(BigInt(body.deadline_tick) > BigInt(body.issued_tick) && BigInt(body.deadline_tick) - BigInt(body.issued_tick) <= 10000000000n, 'source_capture_window');
  if (value.type === 'CAPTURE_RESULT') {
    check(BigInt(body.finished_tick) >= BigInt(body.started_tick), 'source_capture_window');
    check(base64Length(body.raw_response.bytes) === body.raw_response.byte_length, 'source_response_length');
  }
  if (value.type === 'STOP_ACK') {
    const ids = new Set(), ordinals = new Set();
    for (const capture of body.captures) { check(!ids.has(capture.capture_id) && !ordinals.has(capture.capture_ordinal), 'source_capture_identity'); ids.add(capture.capture_id); ordinals.add(capture.capture_ordinal); }
  }
  return value;
}
