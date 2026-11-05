import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import Ajv from 'ajv/dist/2020.js';
import standalone from 'ajv/dist/standalone/index.js';
import openapiTS, {astToString} from 'openapi-typescript';
import canonicalize from 'canonicalize';
import {releaseManifestSchema} from './release-manifest-schema.mjs';
const base = new URL('../', import.meta.url), read = name => fs.readFile(new URL(name, base));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
export async function buildReleaseManifest() {
  const bytes = await read('contracts/release-manifest/base.schema.json'), input = JSON.parse(await read('contracts/release-manifest/source.json'));
  if (input.format !== 'leafseamer-release-input/1' || input.runtime_approved !== false || hash(bytes) !== input.schema_sha256) throw new Error('release_source_drift');
  const schema = releaseManifestSchema(JSON.parse(bytes));
  const ajv = new Ajv({strict: false, ownProperties: true, allErrors: false, coerceTypes: false, useDefaults: false,
    removeAdditional: false, inlineRefs: false, code: {source: true, esm: true, lines: true}});
  ajv.addSchema(schema);
  const names = ['ReleaseManifest', 'ReleaseRevocations', 'ReleaseExtensionBinding'], refs = Object.fromEntries(names.map(name => [name, schema.$id + '#/$defs/' + name]));
  const generated = standalone(ajv, refs);
  for (const [, name] of generated.matchAll(/require\("([^"]+)"\)/g)) if (!['ajv/dist/runtime/ucs2length', 'ajv/dist/runtime/equal'].includes(name)) throw new Error('release_helper');
  const template = (await read('contracts/panel-wire/preview/registry.mjs')).toString();
  const start = template.indexOf('const schemas=new Map();'), end = template.indexOf('export function getSchema');
  if (start < 0 || end <= start) throw new Error('release_registry');
  const registry = template.slice(0, start) + 'const schemas=new Map();\nfor(const name of ' + JSON.stringify(names) + '){const handle=Object.freeze({name});schemas.set(name,handle);compiled.set(handle,validators[name]);}\n' + template.slice(end);
  const types = astToString(await openapiTS({openapi: '3.1.0', info: {title: 'LeafSeamer release manifest', version: '1'}, paths: {},
    components: {schemas: JSON.parse(JSON.stringify(schema.$defs).replaceAll('#/$defs/', '#/components/schemas/'))}}, {immutable: true, alphabetize: true, silent: true}));
  const wire = await read('contracts/panel-wire/preview/wire.mjs');
  const manifest = {format: 'leafseamer-release-selection/1', schema_sha256: hash(canonicalize(schema)),
    definition_sha256: hash(await read('scripts/release-manifest-schema.mjs')), builder_sha256: hash(await read('scripts/release-manifest-contract.mjs')),
    decoder_sha256: hash(await read('src/release-manifest.mjs')), wire_sha256: hash(wire), protocol_sha256: hash(await read('contracts/release-manifest/README.md'))};
  const selection = {contract_id: 'leafseamer.release-manifest.1', contract_digest: 'sha256:' + hash(canonicalize(manifest)), manifest_version: 'native-release/0.2.0-draft.1'};
  return new Map([
    ['release-manifest/selection.mjs', Buffer.from('export const releaseManifestSelection = Object.freeze(' + JSON.stringify(selection) + ');\n')],
    ['release-manifest/manifest.json', Buffer.from(JSON.stringify(manifest, null, 2) + '\n')],
    ['release-manifest/PROTOCOL.md', await read('contracts/release-manifest/README.md')],
    ['release-manifest/validators.mjs', Buffer.from('import {requireStatic as require} from "../runtime/panel-wire/preview/helpers.mjs";\n' + generated)],
    ['release-manifest/registry.mjs', Buffer.from(registry)], ['release-manifest/wire.mjs', wire],
    ['release-manifest/models.d.ts', Buffer.from(types)], ['release-manifest/schema.json', Buffer.from(JSON.stringify(schema, null, 2) + '\n')],
    ['release-manifest/source.json', await read('contracts/release-manifest/source.json')],
    ['release-manifest.mjs', await read('src/release-manifest.mjs')], ['release-manifest.d.mts', await read('src/release-manifest.d.mts')]
  ]);
}
