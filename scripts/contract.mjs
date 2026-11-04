import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import canonicalize from 'canonicalize';
import {addIdentity} from './identity.mjs';
import {build as wire} from './generate/wire.mjs';
import {build as http} from './generate/http.mjs';
import {build as types} from './generate/types.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const read = name => fs.readFileSync(path.join(root, name));

export async function buildContract() {
  const config = JSON.parse(read('sdk-contract.json'));
  const base = 'contracts/panel-wire/contract/', manifestBytes = read(base + 'manifest.json');
  if (hash(manifestBytes) !== config.base_manifest_sha256) throw new Error('contract_baseline_drift');
  const original = JSON.parse(manifestBytes), documents = {};
  const oldBase = 'https://leafseamer.invalid/sdk/panel-wire/0.1/', newBase = 'https://leafseamer.invalid/sdk/product/1/';
  const escaped = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const replace = value => {
    if (typeof value === 'string') return value.replaceAll(original.contract_id, config.contract_id)
      .replaceAll(escaped(original.contract_id), escaped(config.contract_id)).replaceAll(oldBase, newBase);
    if (Array.isArray(value)) return value.map(replace);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, replace(v)]));
    return value;
  };
  for (const [name, expected] of Object.entries(original.artifacts)) {
    const bytes = read(name === 'PROTOCOL.md' ? 'contracts/panel-wire/PROTOCOL.md' : base + name);
    if (hash(bytes) !== expected) throw new Error('contract_input_drift:' + name);
    documents[name] = name.endsWith('.json') ? replace(JSON.parse(bytes)) : replace(bytes.toString('utf8'));
  }
  const apis = {controller: documents['controller.openapi.json'], seamer: documents['seamer.openapi.json']};
  addIdentity(apis, documents['models.schema.json']);
  // SchemaRef摘要绑定完整叶文档；RegistryRef随后绑定已重绑的Registry。
  const leafDigests = new Map(['input', 'result'].map(kind => {
    const doc = documents[kind + '.schema.json']; return [doc.$id, hash(canonicalize(doc))];
  }));
  function walk(value, visit) {
    if (!value || typeof value !== 'object') return;
    visit(value); for (const child of Object.values(value)) walk(child, visit);
  }
  walk(documents, value => {
    if (typeof value.schema_id === 'string' && typeof value.definition === 'string' && typeof value.schema_digest === 'string') {
      if (!leafDigests.has(value.schema_id)) throw new Error('schema_ref_document');
      value.schema_digest = leafDigests.get(value.schema_id);
    }
  });
  for (const kind of ['input', 'result']) {
    const doc = documents[kind + '.schema.json'];
    if (hash(canonicalize(doc)) !== leafDigests.get(doc.$id)) throw new Error('schema_ref_cycle');
  }
  const registry = documents['method-registry.json'], oldRef = {...registry.registry_ref}, digest = hash(canonicalize(registry.registry));
  walk(documents, value => {
    if (Object.keys(value).sort().join(',') === 'digest,revision' && value.revision === oldRef.revision && value.digest === oldRef.digest) value.digest = digest;
  });
  documents['binding-map.json'].added_models.push(...Object.keys(documents['models.schema.json'].$defs).filter(n => n.startsWith('identity__')));
  documents['PROTOCOL.md'] = read('CONTRACT.md').toString('utf8');
  const artifacts = Object.fromEntries(Object.entries(documents).map(([n, v]) => [n, n.endsWith('.json') ? json(v) : v]));
  const manifest = {format: 'sdk-contract-artifacts/1', contract_id: config.contract_id,
    approved: false, runtime_ready: false, advertisable: false, artifact_digest_algorithm: 'sha256-bytes', selection_digest_algorithm: 'sha256-jcs-manifest',
    artifacts: Object.fromEntries(Object.entries(artifacts).map(([n, b]) => [n, hash(b)]))};
  const selection = {contract_id: config.contract_id, contract_digest: 'sha256:' + hash(canonicalize(manifest))};
  artifacts['manifest.json'] = json(manifest); artifacts['selection.json'] = json(selection);
  const body = wire(apis, documents['models.schema.json'], documents['worker-messages.json'], selection);
  const envelope = http(apis, body.inventory, selection);
  const typing = await types(apis, envelope.inventory);
  const files = new Map(Object.entries(artifacts).map(([n, b]) => ['contract/' + n, Buffer.from(b)]));
  for (const [folder, output] of [['panel-wire', body.outputs], ['panel-http', envelope.outputs], ['panel-client', typing]]) {
    for (const [name, content] of Object.entries(output)) files.set('runtime/' + folder + '/preview/' + name, Buffer.from(content));
  }
  return {files, selection, operations: envelope.inventory.operations.length};
}
