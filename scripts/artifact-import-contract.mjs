import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import Ajv from 'ajv/dist/2020.js';
import standalone from 'ajv/dist/standalone/index.js';
import openapiTS, {astToString} from 'openapi-typescript';
import canonicalize from 'canonicalize';
const base = new URL('../', import.meta.url);
const read = name => fs.readFile(new URL(name, base));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const names = ['Manifest', 'FileInventory', 'ImportIdentity', 'ImportBegin', 'ImportStatus', 'IntakeQuery', 'IntakeResult',
  'VerifyMaterialization', 'MaterializationResult', 'RoleResolution', 'ResolvedReview'];
export async function buildArtifactImport() {
  const input = JSON.parse(await read('contracts/artifact-import/source.json')), documents = new Map();
  if (input.format !== 'leafseamer-artifact-import-input/1' || input.runtime_approved !== false) throw new Error('artifact_import_input');
  for (const [name, entry] of Object.entries(input.files)) {
    if (!/^[a-z.-]+$/.test(name)) throw new Error('artifact_import_input_path');
    const bytes = await read('contracts/artifact-import/' + name);
    if (hash(bytes) !== entry.sha256) throw new Error('artifact_import_source_drift');
    if (name.endsWith('.json')) { const value = JSON.parse(bytes); documents.set(value.$id, {value, prefix: name.split('.')[0]}); }
  }
  function convert(value, document) {
    if (Array.isArray(value)) return value.map(child => convert(child, document));
    if (!value || typeof value !== 'object') return value;
    const out = {};
    for (const [key, child] of Object.entries(value)) {
      if (key === '$ref') {
        const [url, fragment] = child.split('#'), target = url ? documents.get(url) : document;
        if (!target || !fragment?.startsWith('/$defs/')) throw new Error('artifact_import_external_reference');
        out[key] = '#/$defs/' + target.prefix + '_' + fragment.slice('/$defs/'.length);
      } else if (['const', 'enum', 'default', 'examples'].includes(key)) out[key] = child;
      else out[key] = convert(child, document);
    }
    return out;
  }
  const schema = {$schema: 'https://json-schema.org/draft/2020-12/schema', $id: 'urn:leafseamer:artifact-import:1', $defs: {}};
  for (const document of documents.values()) {
    for (const [name, value] of Object.entries(document.value.$defs ?? {})) schema.$defs[document.prefix + '_' + name] = convert(value, document);
    if (document.prefix === 'ipc') schema.$defs.ImportFrame = {oneOf: convert(document.value.oneOf, document)};
  }
  // 完整对象的二次方去重由decoder的file_id与路径线性唯一检查等价覆盖。
  const compiledSchema = structuredClone(schema); delete compiledSchema.$defs.artifact_FileInventory.properties.files.uniqueItems;
  const ajv = new Ajv({strict: false, ownProperties: true, allErrors: false, coerceTypes: false, useDefaults: false,
    removeAdditional: false, inlineRefs: false, code: {source: true, esm: true, lines: true}});
  ajv.addSchema(compiledSchema);
  const refs = Object.fromEntries(names.map(name => [name, schema.$id + '#/$defs/artifact_' + name])); refs.ImportFrame = schema.$id + '#/$defs/ImportFrame';
  const generated = standalone(ajv, refs);
  for (const [, name] of generated.matchAll(/require\("([^"]+)"\)/g)) if (!['ajv/dist/runtime/ucs2length', 'ajv/dist/runtime/equal'].includes(name)) throw new Error('artifact_import_helper');
  const template = (await read('contracts/panel-wire/preview/registry.mjs')).toString();
  const start = template.indexOf('const schemas=new Map();'), end = template.indexOf('export function getSchema');
  if (start < 0 || end <= start) throw new Error('artifact_import_registry');
  const registry = template.slice(0, start) + 'const schemas=new Map();\nfor(const name of ' + JSON.stringify(Object.keys(refs)) + '){const handle=Object.freeze({name});schemas.set(name,handle);compiled.set(handle,validators[name]);}\n' + template.slice(end);
  const typeDefs = JSON.parse(JSON.stringify(schema.$defs).replaceAll('#/$defs/', '#/components/schemas/'));
  const types = astToString(await openapiTS({openapi: '3.1.0', info: {title: 'LeafSeamer artifact import', version: '1'}, paths: {}, components: {schemas: typeDefs}},
    {immutable: true, alphabetize: true, silent: true}));
  const wire = await read('contracts/panel-wire/preview/wire.mjs');
  const manifest = {format: 'leafseamer-artifact-import-selection/1', schema_sha256: hash(canonicalize(schema)),
    definition_sha256: hash(await read('scripts/artifact-import-contract.mjs')), decoder_sha256: hash(await read('src/artifact-import.mjs')),
    wire_sha256: hash(wire), protocol_sha256: hash(await read('contracts/artifact-import/README.md')), policy_sha256: input.files['source-policy.md'].sha256};
  const selection = {contract_id: 'leafseamer.artifact-import.1', contract_digest: 'sha256:' + hash(canonicalize(manifest)), ipc_version: 'extension-import/0.1.0-draft.1'};
  return new Map([
    ['artifact-import/selection.mjs', Buffer.from('export const artifactImportSelection = Object.freeze(' + JSON.stringify(selection) + ');\n')],
    ['artifact-import/manifest.json', Buffer.from(JSON.stringify(manifest, null, 2) + '\n')],
    ['artifact-import/PROTOCOL.md', await read('contracts/artifact-import/README.md')],
    ['artifact-import/validators.mjs', Buffer.from('import {requireStatic as require} from "../runtime/panel-wire/preview/helpers.mjs";\n' + generated)],
    ['artifact-import/registry.mjs', Buffer.from(registry)], ['artifact-import/wire.mjs', wire],
    ['artifact-import/models.d.ts', Buffer.from(types)], ['artifact-import/schema.json', Buffer.from(JSON.stringify(schema, null, 2) + '\n')],
    ['artifact-import/source.json', await read('contracts/artifact-import/source.json')],
    ['artifact-import.mjs', await read('src/artifact-import.mjs')], ['artifact-import.d.mts', await read('src/artifact-import.d.mts')]
  ]);
}
