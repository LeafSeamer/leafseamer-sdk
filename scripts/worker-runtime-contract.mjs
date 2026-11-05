import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import Ajv from 'ajv/dist/2020.js';
import standalone from 'ajv/dist/standalone/index.js';
import openapiTS, {astToString} from 'openapi-typescript';

import canonicalize from 'canonicalize';
import {workerRuntimeSchema} from './worker-runtime-schema.mjs';

const base = new URL('../', import.meta.url);
const read = name => fs.readFile(new URL(name, base));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
export async function buildWorkerRuntime(artifactSchema) {
  const bytes = await read('contracts/worker-runtime/base.schema.json');
  const input = JSON.parse(await read('contracts/worker-runtime/source.json'));
  if (input.format !== 'leafseamer-worker-runtime-input/1' || hash(bytes) !== input.schema_sha256 ||
      input.control_version !== 'supervisor-control/0.1.0-draft.1' || input.runtime_approved !== false) throw new Error('worker_runtime_source_drift');
  const schema = workerRuntimeSchema(JSON.parse(bytes),artifactSchema), id = schema.$id;
  const models = {control: 'ControlFrame', intent: 'installation2_ExtensionLaunchIntent', authorization: 'installation2_LaunchAuthorization', source: 'SourceFrame', sourceBinding: 'SourceBinding', sourceRuntime: 'SourceRuntimeBinding',loadMaterials:'WorkerLoadMaterials'};
  const refs = Object.fromEntries(Object.entries(models).map(([name, type]) => [name, id + '#/$defs/' + type]));
  const ajv = new Ajv({strict: false, ownProperties: true, allErrors: false, coerceTypes: false,
    useDefaults: false, removeAdditional: false, code: {source: true, esm: true, lines: true}, inlineRefs: false});
  const compiledSchema=structuredClone(schema);delete compiledSchema.$defs.load_artifact_FileInventory.properties.files.uniqueItems;
  ajv.addSchema(compiledSchema);
  const generated = standalone(ajv, refs);
  for (const [, name] of generated.matchAll(/require\("([^"]+)"\)/g)) {
    if (!['ajv/dist/runtime/ucs2length', 'ajv/dist/runtime/equal'].includes(name)) throw new Error('worker_runtime_helper');
  }
  const template = (await read('contracts/panel-wire/preview/registry.mjs')).toString();
  const start = template.indexOf('const schemas=new Map();'), end = template.indexOf('export function getSchema');
  if (start < 0 || end <= start) throw new Error('worker_runtime_registry');
  const registry = template.slice(0, start) + 'const schemas=new Map();\nfor(const name of ["control","intent","authorization","source","sourceBinding","sourceRuntime","loadMaterials"]){const handle=Object.freeze({name});schemas.set(name,handle);compiled.set(handle,validators[name]);}\n' + template.slice(end);
  const local = value => {
    if (Array.isArray(value)) return value.map(local);
    if (!value || typeof value !== 'object') return value;
    const result = {};
    for (const [key, child] of Object.entries(value)) {
      if (key === '$ref') {
        if (!child.startsWith('#/$defs/')) throw new Error('worker_runtime_external_reference');
        result[key] = child.replace('#/$defs/', '#/components/schemas/');
      } else if (['const', 'enum', 'default', 'examples'].includes(key)) result[key] = child;
      else result[key] = local(child);
    }
    return result;
  };
  const types = astToString(await openapiTS({openapi: '3.1.0', info: {title: 'LeafSeamer worker runtime', version: '1'},
    paths: {}, components: {schemas: local(schema.$defs)}}, {immutable: true, alphabetize: true, silent: true}));
  let wire = (await read('contracts/panel-wire/preview/wire.mjs')).toString();
  for (const [before, after] of [['max_message_bytes:8388608', 'max_message_bytes:16777216'], ['max_string_utf8_bytes:8388608', 'max_string_utf8_bytes:16777216']]) {
    if (wire.split(before).length !== 2) throw new Error('worker_runtime_wire_drift'); wire = wire.replace(before, after);
  }
  const manifest = {format: 'leafseamer-worker-runtime-selection/1', schema_sha256: hash(canonicalize(schema)),
    artifact_schema_sha256:hash(canonicalize(artifactSchema)), definition_sha256: hash(await read('scripts/worker-runtime-schema.mjs')), decoder_sha256: hash(await read('src/worker-runtime.mjs')),
    wire_sha256: hash(wire), protocol_sha256: hash(await read('contracts/worker-runtime/README.md'))};
  const selection = {contract_id: 'leafseamer.worker-runtime.3', contract_digest: 'sha256:' + hash(canonicalize(manifest)), control_version: 'supervisor-control/0.4.0-draft.1', source_protocol: 'source-worker/1'};
  return new Map([
    ['worker-runtime/selection.mjs', Buffer.from('export const workerRuntimeSelection = Object.freeze(' + JSON.stringify(selection) + ');\n')],
    ['worker-runtime/manifest.json', Buffer.from(JSON.stringify(manifest, null, 2) + '\n')],
    ['worker-runtime/PROTOCOL.md', await read('contracts/worker-runtime/README.md')],
    ['worker-runtime/validators.mjs', Buffer.from('import {requireStatic as require} from "../runtime/panel-wire/preview/helpers.mjs";\n' + generated)],
    ['worker-runtime/registry.mjs', Buffer.from(registry)],
    ['worker-runtime/wire.mjs', Buffer.from(wire)],
    ['worker-runtime/models.d.ts', Buffer.from(types)],
    ['worker-runtime/schema.json', Buffer.from(JSON.stringify(schema, null, 2) + '\n')],
    ['worker-runtime/source.json', await read('contracts/worker-runtime/source.json')],
    ['worker-runtime.mjs', await read('src/worker-runtime.mjs')],
    ['worker-runtime.d.mts', await read('src/worker-runtime.d.mts')],
  ]);
}
