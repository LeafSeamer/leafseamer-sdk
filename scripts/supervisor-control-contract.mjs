import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import Ajv from 'ajv/dist/2020.js';
import standalone from 'ajv/dist/standalone/index.js';
import openapiTS, {astToString} from 'openapi-typescript';

const base = new URL('../', import.meta.url);
const read = name => fs.readFile(new URL(name, base));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
export async function buildSupervisorControl() {
  const bytes = await read('contracts/supervisor-control/supervisor.schema.json');
  const input = JSON.parse(await read('contracts/supervisor-control/source.json'));
  if (input.format !== 'leafseamer-supervisor-query-input/1' || hash(bytes) !== input.schema_sha256 ||
      input.control_version !== 'supervisor-control/0.1.0-draft.1' || input.runtime_approved !== false) throw new Error('bootstrap_source_drift');
  const schema = JSON.parse(bytes), id = schema.$id;
  // 独立通道沿既定结构生成，不将内部引导消息加入公开HTTP接受集。
  schema.$defs.frame = {oneOf: schema.oneOf}; delete schema.oneOf;
  const refs = {frame: id + '#/$defs/frame'};
  const ajv = new Ajv({strict: false, ownProperties: true, allErrors: false, coerceTypes: false,
    useDefaults: false, removeAdditional: false, code: {source: true, esm: true, lines: true}, inlineRefs: false});
  ajv.addSchema(schema);
  const generated = standalone(ajv, refs);
  for (const [, name] of generated.matchAll(/require\("([^"]+)"\)/g)) {
    if (!['ajv/dist/runtime/ucs2length', 'ajv/dist/runtime/equal'].includes(name)) throw new Error('bootstrap_helper');
  }
  const template = (await read('contracts/panel-wire/preview/registry.mjs')).toString();
  const start = template.indexOf('const schemas=new Map();'), end = template.indexOf('export function getSchema');
  if (start < 0 || end <= start) throw new Error('bootstrap_registry');
  const registry = template.slice(0, start) + 'const schemas=new Map();\nfor(const name of ["frame"]){const handle=Object.freeze({name});schemas.set(name,handle);compiled.set(handle,validators[name]);}\n' + template.slice(end);
  const local = value => {
    if (Array.isArray(value)) return value.map(local);
    if (!value || typeof value !== 'object') return value;
    const result = {};
    for (const [key, child] of Object.entries(value)) {
      if (key === '$ref') {
        if (!child.startsWith('#/$defs/')) throw new Error('bootstrap_external_reference');
        result[key] = child.replace('#/$defs/', '#/components/schemas/');
      } else if (['const', 'enum', 'default', 'examples'].includes(key)) result[key] = child;
      else result[key] = local(child);
    }
    return result;
  };
  const types = astToString(await openapiTS({openapi: '3.1.0', info: {title: 'LeafSeamer supervisor query', version: input.control_version},
    paths: {}, components: {schemas: local(schema.$defs)}}, {immutable: true, alphabetize: true, silent: true}));
  return new Map([
    ['supervisor-control/validators.mjs', Buffer.from('import {requireStatic as require} from "../runtime/panel-wire/preview/helpers.mjs";\n' + generated)],
    ['supervisor-control/registry.mjs', Buffer.from(registry)],
    ['supervisor-control/wire.mjs', await read('contracts/panel-wire/preview/wire.mjs')],
    ['supervisor-control/models.d.ts', Buffer.from(types)],
    ['supervisor-control/schema.json', bytes],
    ['supervisor-control/source.json', await read('contracts/supervisor-control/source.json')],
    ['supervisor-control.mjs', await read('src/supervisor-control.mjs')],
    ['supervisor-control.d.mts', await read('src/supervisor-control.d.mts')],
  ]);
}
