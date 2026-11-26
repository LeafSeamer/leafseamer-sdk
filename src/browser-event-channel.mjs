import {createDecoder} from './runtime/panel-wire/decoder.mjs';
import {contractSelection} from './selection.mjs';
import canonicalize from './vendor/canonicalize.mjs';

const encoder = new TextEncoder();
const decoder = createDecoder(contractSelection);
const client = decoder.websocket('controller', 'openEvents', 'client');
const server = decoder.websocket('controller', 'openEvents', 'server');

export const eventChannelProtocol = 'leafseamer.contract.' + contractSelection.contract_id + '.' + contractSelection.contract_digest.slice(7);

export async function decodeBrowserEventFrame(text) {
  if (typeof text !== 'string' || text.length > 65536) throw new TypeError('event_frame_text');
  return (await decoder.decode(encoder.encode(text), server)).value;
}

export async function encodeBrowserEventFrame(frame) {
  const text = JSON.stringify(frame);
  await decoder.decode(encoder.encode(text), client);
  return text;
}

export async function projectionContentDigest(value) {
  const bytes = encoder.encode(canonicalize(value));
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return {digest: Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join(''), bytes: bytes.length};
}
