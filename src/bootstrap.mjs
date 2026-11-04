import {decodeWire, getSchema, profile, WireError} from './bootstrap/wire.mjs';
export {WireError as BootstrapWireError};
export const bootstrapVersion = 'bootstrap/0.1.0-draft.1';
const budget = profile({max_message_bytes: 16384, max_depth: 12, max_value_nodes: 512, max_object_members: 64,
  max_key_utf8_bytes: 128, max_string_utf8_bytes: 1024, parse_deadline_ms: 100});
const types = new Set(['ASSIGNMENT', 'PROOF', 'ADMISSION', 'REJECT']);
/** 只校验报文；OS对端、批准来源、摘要、HMAC、有效期及一次消费由监督/核心执行。 */
export async function decodeBootstrap(input, expectedType) {
  if (!types.has(expectedType)) throw new WireError('binding', 'bootstrap_type');
  const result = await decodeWire(input, getSchema('frame'), {profile: budget});
  if (result.value.type !== expectedType) throw new WireError('binding', 'bootstrap_direction');
  return result.value;
}
export async function decodeProtectedLaunchIntent(input) {
  return (await decodeWire(input, getSchema('intent'), {profile: budget})).value;
}
