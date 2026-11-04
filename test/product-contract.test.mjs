import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import canonicalize from 'canonicalize';
import {createHttpAdapter} from '../dist/http.mjs';
import {contractSelection as selection} from '../dist/index.mjs';
import {routes} from '../dist/runtime/panel-wire/preview/routes.mjs';
const read = path => JSON.parse(fs.readFileSync(new URL(path, import.meta.url)));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

test('产品选择覆盖完整原操作及新增注销，清单摘要和历史输入均可核验', () => {
  const baseline = read('../contracts/panel-wire/contract/selection.json'), lock = read('../sdk-inputs.json');
  assert.notDeepEqual(selection, baseline);
  for (const [path, digest] of Object.entries(lock.files)) assert.equal(hash(fs.readFileSync(new URL('../' + path, import.meta.url))), digest);
  const manifest = read('../dist/contract/manifest.json');
  assert.equal(selection.contract_digest, 'sha256:' + hash(canonicalize(manifest)));
  for (const [name, digest] of Object.entries(manifest.artifacts)) assert.equal(hash(fs.readFileSync(new URL('../dist/contract/' + name, import.meta.url))), digest);
  let originalCount = 0;
  for (const authority of ['controller', 'seamer']) {
    const original = read('../contracts/panel-wire/contract/' + authority + '.openapi.json');
    for (const [path, methods] of Object.entries(original.paths)) for (const [method, operation] of Object.entries(methods)) {
      originalCount++;
      const current = routes.operations.find(v => v.authority === authority && v.operation_id === operation.operationId);
      assert(current); assert.equal(current.method, method.toUpperCase()); assert.equal(current.path, path);
      assert.deepEqual(Object.keys(current.responses), Object.keys(operation.responses));
    }
  }
  assert.equal(originalCount, 201); assert.equal(routes.operations.length, originalCount + 1);
  const logout = routes.operations.find(v => v.operation_id === 'logoutSession');
  assert.equal(logout.authority, 'controller'); assert.equal(logout.path, '/auth/sessions/current');
  assert.equal(logout.request, null); assert(logout.responses['202']);
  assert.throws(() => createHttpAdapter(baseline));
  const adapter = createHttpAdapter(selection);
  assert.throws(() => adapter.prepareRequest('controller', 'DELETE', logout.path,
    [['Origin', 'https://controller.invalid'], ['X-LeafSeamer-Contract', baseline.contract_id], ['X-LeafSeamer-Contract-Digest', baseline.contract_digest]]));
  assert.throws(() => adapter.describe('seamer', 'logoutSession'));
});

test('产品SchemaRef、RegistryRef和WS选择随完整文档重绑', () => {
  const leaves = ['input', 'result'].map(n => read('../dist/contract/' + n + '.schema.json'));
  const digests = new Map(leaves.map(v => [v.$id, hash(canonicalize(v))]));
  const registry = read('../dist/contract/method-registry.json');
  assert.equal(registry.registry_ref.digest, hash(canonicalize(registry.registry)));
  let refs = 0, ws = 0;
  function visit(v) {
    if (!v || typeof v !== 'object') return;
    if (typeof v.schema_id === 'string' && typeof v.schema_digest === 'string') {
      assert.equal(v.schema_digest, digests.get(v.schema_id)); refs++;
    }
    for (const x of Object.values(v)) visit(x);
  }
  for (const authority of ['controller', 'seamer']) {
    const api = read('../dist/contract/' + authority + '.openapi.json'); visit(api);
    for (const item of Object.values(api.paths)) for (const op of Object.values(item)) {
      if (!op.responses['101']) continue;
      const pattern = op.responses['101'].headers['Sec-WebSocket-Protocol'].schema.pattern;
      assert(new RegExp(pattern).test('leafseamer.contract.' + selection.contract_id + '.' + selection.contract_digest.slice(7))); ws++;
    }
    assert.deepEqual(api.components.schemas.panel__Channel_ActivationRef.properties.registry_ref.const, registry.registry_ref);
  }
  assert(refs >= 70); assert.equal(ws, 4);
});
