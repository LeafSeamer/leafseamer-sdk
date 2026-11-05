import {decodeWire, getSchema, profile, WireError} from './artifact-import/wire.mjs';
export {artifactImportSelection} from './artifact-import/selection.mjs';
export {WireError as ArtifactImportWireError};
export const artifactImportVersion = 'extension-import/0.1.0-draft.1';
const documents = new Set(['Manifest', 'FileInventory', 'ImportIdentity', 'ImportBegin', 'ImportStatus', 'IntakeQuery', 'IntakeResult',
  'VerifyMaterialization', 'MaterializationResult', 'RoleResolution', 'ResolvedReview']);
const frames = new Set(['IMPORT_BEGIN', 'IMPORT_QUERY', 'IMPORT_CANCEL', 'IMPORT_STATUS', 'INTAKE_QUERY', 'INTAKE_RESULT',
  'VERIFY_MATERIALIZATION', 'MATERIALIZATION_RESULT', 'ERROR']);
const control = profile({max_message_bytes: 65536, max_depth: 32, max_value_nodes: 16384, max_object_members: 128,
  max_key_utf8_bytes: 128, max_string_utf8_bytes: 32768, parse_deadline_ms: 5000});
const document = profile({...control, max_message_bytes: 4194304, max_value_nodes: 1048576});
const need = (ok, reason) => { if (!ok) throw new WireError('binding', reason); };
const yieldNow = () => new Promise(resolve => { if (typeof setImmediate === 'function') setImmediate(resolve); else setTimeout(resolve, 0); });
function inventory(value) {
  const files = new Set(), directories = new Set(); let previous = '', total = 0n;
  for (const file of value.files) {
    need(file.file_id > previous, 'inventory_order'); previous = file.file_id;
    const parts = file.path.split('/'), lower = file.path.toLowerCase();
    need(parts.every(part => /^[A-Za-z0-9_.-]+$/.test(part) && part !== '.' && part !== '..' && !part.endsWith('.') &&
      !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(part.split('.')[0])), 'inventory_path');
    need(!['extension.json', 'files.json'].includes(lower) && !files.has(lower) && !directories.has(lower), 'inventory_path_collision');
    files.add(lower);
    for (let n = 1; n < parts.length; ++n) {
      const parent = parts.slice(0, n).join('/').toLowerCase(); need(!files.has(parent), 'inventory_path_collision'); directories.add(parent);
    }
    const size = BigInt(file.size_bytes); total += size;
    need(size <= 268435456n && total <= 1073741824n, 'inventory_capacity');
  }
}
export async function decodeArtifactDocument(bytes, kind) {
  need(documents.has(kind), 'artifact_document_kind');
  const value = (await decodeWire(bytes, getSchema(kind), {profile: document, yieldNow})).value;
  if (kind === 'FileInventory') inventory(value); return value;
}
export async function decodeImportFrame(bytes, expectedType) {
  need(frames.has(expectedType), 'import_frame_type');
  const value = (await decodeWire(bytes, getSchema('ImportFrame'), {profile: control, yieldNow})).value;
  need(value.type === expectedType, 'import_frame_direction'); return value;
}
