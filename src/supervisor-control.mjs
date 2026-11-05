import {decodeWire, getSchema, profile, WireError} from './supervisor-control/wire.mjs';
export {WireError as SupervisorWireError};
export const supervisorControlVersion = 'supervisor-control/0.1.0-draft.1';
const budget = profile({max_message_bytes: 65536, max_depth: 12, max_value_nodes: 4096, max_object_members: 64,
  max_key_utf8_bytes: 128, max_string_utf8_bytes: 1024, parse_deadline_ms: 100});
const fenceBudget = profile({...budget, max_message_bytes: 262144, parse_deadline_ms: 1000});
const types = new Set(['LAUNCH_QUERY', 'LAUNCH_RESULT', 'ERROR', 'FENCE_PUT', 'FENCE_RESULT']);
// 完整快照只提交启动准入边界；不授予进程创建或设备执行权限。
export async function decodeSupervisorControl(bytes, expectedType) {
  if (!types.has(expectedType)) throw new WireError('binding', 'supervisor_type');
  const result = await decodeWire(bytes, getSchema('frame'), {profile: expectedType === 'FENCE_PUT' ? fenceBudget : budget});
  if (result.value.type !== expectedType) throw new WireError('binding', 'supervisor_direction');
  return result.value;
}
