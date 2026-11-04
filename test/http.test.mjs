import test from 'node:test';
import assert from 'node:assert/strict';
import {createHttpAdapter} from '@leafseamer/sdk/http';
import {createClient, contractSelection as selection} from '@leafseamer/sdk';

test('公开HTTP服务端出口与类型客户端使用相同选择及字节校验', async () => {
  const adapter = createHttpAdapter(selection);
  let count = 0;
  const client = createClient('controller', selection, async packet => {
    count++;
    const request = adapter.prepareRequest(packet.authority, packet.method, packet.target, packet.headers);
    assert.equal(request.operation_id, 'login'); assert.equal(request.authorization_granted, false);
    assert.deepEqual((await adapter.decodeRequest(packet.body, request)).value, {login: 'operator', password: 'password-long-enough'});
    const headers = [['content-type', 'application/json'], ['x-leafseamer-contract', selection.contract_id],
      ['x-leafseamer-contract-digest', selection.contract_digest]];
    const body = new TextEncoder().encode(JSON.stringify({request_id: 'r', service_id: 's', service_boot_id: 'b',
      protocol_version: selection.contract_id, selection, error: {code: 'WORKER_NOT_READY', message_key: 'not_ready', request_id: 'r',
        details: {}, existing_command_id: null, retry_advice: 'do_not_retry', existing_operation_id: null}}));
    const response = adapter.prepareResponse(request, '503', headers);
    await adapter.decodeResponse(body, response);
    assert.throws(() => createHttpAdapter(selection).prepareResponse(request, '503', headers));
    await assert.rejects(adapter.decodeResponse(new TextEncoder().encode('{}'), response));
    return {status: '503', headers, body};
  });
  const result = await client.call('login', {headers: {origin: 'https://controller.invalid'}, body: {login: 'operator', password: 'password-long-enough'}});
  assert.equal(result.status, '503'); assert.equal(result.body.error.retry_advice, 'do_not_retry'); assert.equal(count, 1);
});

test('服务端拒绝重复敏感头、错选择、未知字段和非严格JSON', async () => {
  const adapter = createHttpAdapter(selection);
  const headers = [['origin', 'https://controller.invalid'], ['content-type', 'application/json'],
    ['x-leafseamer-contract', selection.contract_id], ['x-leafseamer-contract-digest', selection.contract_digest]];
  for (const extra of [['cookie', 'a=1'], ['x-csrf-token', 'secret'], ['authorization', 'Bearer secret']]) {
    assert.throws(() => adapter.prepareRequest('controller', 'POST', '/auth/sessions', [...headers, extra, extra]));
  }
  assert.throws(() => adapter.prepareRequest('controller', 'POST', '/auth/sessions?extra=1', headers));
  assert.throws(() => adapter.prepareRequest('controller', 'POST', '/auth/sessions', headers.map(p => p[0] === 'x-leafseamer-contract-digest' ? [p[0], 'sha256:' + '0'.repeat(64)] : p)));
  const request = adapter.prepareRequest('controller', 'POST', '/auth/sessions', headers);
  for (const input of ['{"login":"operator","password":"password-long-enough","role":"administrator"}',
    '{"login":"operator","login":"other","password":"password-long-enough"}', '{}']) {
    await assert.rejects(adapter.decodeRequest(new TextEncoder().encode(input), request));
  }
});
