import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {createClient, createFetchTransport, contractSelection, ClientError, TransportError} from '../dist/index.mjs';

const selection = contractSelection;
const errorBody = {request_id: 'request', service_id: 'service', service_boot_id: 'boot', protocol_version: selection.contract_id,
  selection, error: {code: 'AUTH_REQUIRED', message_key: 'auth_required', request_id: 'request', details: {},
    existing_command_id: null, retry_advice: 'do_not_retry', existing_operation_id: null}};
const context = {audience: 'controller', operations: ['read'], ttl_ms: 1000, max_unique_requests: 1, selection};

test('实际HTTP：固定服务路径、完整请求与响应、失败后不重发', {timeout: 10000}, async t => {
  const requests = []; let mode = 'normal', redirectHits = 0, received;
  const server = http.createServer(async (req, res) => {
    const chunks = []; for await (const b of req) chunks.push(b);
    requests.push({url: req.url, method: req.method, headers: req.headers, body: Buffer.concat(chunks)});
    if (received) { const notify = received; received = undefined; notify(); }
    if (req.url === '/other') { redirectHits++; res.end(); return; }
    if (mode === 'redirect') { res.writeHead(307, {Location: '/other'}); res.end(); return; }
    if (mode === 'drop') { req.socket.destroy(); return; }
    if (mode === 'hang') return;
    if (mode === 'hang-body') { res.writeHead(200); res.write('a'); return; }
    if (mode === 'declared-large') { res.writeHead(200, {'Content-Length': '1000000'}); res.flushHeaders(); return; }
    if (mode === 'chunked-large') { res.writeHead(200); res.write('a'.repeat(80)); res.end('b'.repeat(80)); return; }
    if (req.url.endsWith('/.well-known/leafseamer-contracts')) { res.writeHead(429); res.end(); return; }
    res.writeHead(401, {'Content-Type': 'application/json', 'X-LeafSeamer-Contract': selection.contract_id,
      'X-LeafSeamer-Contract-Digest': mode === 'wrong-selection' ? 'sha256:' + '0'.repeat(64) : selection.contract_digest});
    res.end(JSON.stringify(errorBody));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/services/test-controller`;
  const make = options => createClient('controller', selection, createFetchTransport({authority: 'controller', baseUrl,
    allowInsecureLoopback: true, timeoutMs: 1000, ...options}));
  const assertFailure = async (client, state) => {
    const before = requests.length;
    await assert.rejects(client.call('createRequestContext', {body: context}), e => e instanceof ClientError && e.state === state);
    assert.equal(requests.length, before + 1);
  };
  try {
    await t.test('真实收发与类型化错误响应', async () => {
      const client = make();
      assert.equal((await client.call('discoverContracts')).status, '429');
      const result = await client.call('createRequestContext', {body: context});
      assert.equal(result.status, '401'); assert.deepEqual(result.body, errorBody);
      assert.equal(result.authorization_granted, false);
      assert.deepEqual(requests.map(x => x.url), ['/services/test-controller/.well-known/leafseamer-contracts', '/services/test-controller/api/v1/request-contexts']);
      assert.deepEqual(JSON.parse(requests[1].body), context);
      assert.equal(requests[1].headers['x-leafseamer-contract-digest'], selection.contract_digest);
      assert.equal(requests[1].headers['content-length'], String(requests[1].body.byteLength));
    });
    await t.test('旧选择响应不能成为有效业务结果', async () => { mode = 'wrong-selection'; await assertFailure(make(), 'response_rejected'); });
    await t.test('重定向目标零请求', async () => { mode = 'redirect'; await assertFailure(make(), 'outcome_unknown'); assert.equal(redirectHits, 0); });
    await t.test('服务器收包后断线为未知，不重试', async () => { mode = 'drop'; await assertFailure(make(), 'outcome_unknown'); });
    await t.test('声明超预算立即拒绝', async () => { mode = 'declared-large'; await assertFailure(make(), 'outcome_unknown'); });
    await t.test('无Content-Length也限制累计正文', async () => { mode = 'chunked-large'; await assertFailure(make({maxResponseBytes: 100}), 'outcome_unknown'); });
    await t.test('超时覆盖等待响应头', async () => { mode = 'hang'; await assertFailure(make({timeoutMs: 100}), 'outcome_unknown'); });
    await t.test('超时覆盖响应正文', async () => { mode = 'hang-body'; await assertFailure(make({timeoutMs: 100}), 'outcome_unknown'); });
    await t.test('发送后取消仍是未知', async () => {
      mode = 'hang'; const controller = new AbortController();
      const arrived = new Promise(resolve => { received = resolve; });
      const pending = make().call('createRequestContext', {body: context}, {signal: controller.signal});
      const rejected = assert.rejects(pending, e => e.state === 'outcome_unknown');
      await Promise.race([arrived, pending]); controller.abort(); await rejected;
    });
    await t.test('发送前取消不会访问服务', async () => {
      const before = requests.length, controller = new AbortController(); controller.abort();
      await assert.rejects(make().call('createRequestContext', {body: context}, {signal: controller.signal}), e => e.state === 'not_sent');
      assert.equal(requests.length, before);
    });
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});

test('端点、authority及目标在发送前固定', async () => {
  for (const baseUrl of ['http://example.com', 'https://user:secret@example.com', 'https://example.com/other', 'https://example.com/?x=1']) {
    assert.throws(() => createFetchTransport({authority: 'controller', baseUrl, allowInsecureLoopback: true}), TransportError);
  }
  assert.throws(() => createFetchTransport({authority: 'controller', baseUrl: 'http://127.0.0.1'}), TransportError);
  let sent = 0;
  const transport = createFetchTransport({authority: 'controller', baseUrl: 'https://service.invalid/services/one', fetchImpl: async () => { sent++; throw new Error('SECRET'); }});
  const packet = {authority: 'controller', method: 'POST', target: '/api/v1/test', body: new Uint8Array(), headers: []};
  for (const target of ['//elsewhere.invalid/path', '/../../other', '/%2e%2e/other', '/test#fragment', '/test\\elsewhere']) {
    await assert.rejects(transport({...packet, target}), TransportError);
  }
  await assert.rejects(transport({...packet, authority: 'seamer'}), TransportError);
  await assert.rejects(transport({...packet, headers: [['Host', 'elsewhere.invalid']]}), TransportError);
  assert.equal(sent, 0);
  await assert.rejects(transport(packet), e => e.message === 'network_failure' && !e.message.includes('SECRET'));
  assert.equal(sent, 1);
});

test('浏览器兼容的fetch配置及超预算流取消', async () => {
  let cancelled = false, options;
  const transport = createFetchTransport({authority: 'seamer', baseUrl: 'https://example.invalid', maxResponseBytes: 4,
    fetchImpl: async (_url, config) => {
      options = config;
      return new Response(new ReadableStream({start(c) { c.enqueue(new Uint8Array(5)); }, cancel() { cancelled = true; }}));
    }});
  await assert.rejects(transport({authority: 'seamer', method: 'POST', target: '/api/v1/test', headers: [['Content-Length', '0']], body: new Uint8Array()}), e => e.code === 'response_budget');
  assert.equal(cancelled, true); assert.equal(options.headers.has('content-length'), false);
  assert.equal(options.redirect, 'error'); assert.equal(options.cache, 'no-store'); assert.equal(options.credentials, 'same-origin');
});
