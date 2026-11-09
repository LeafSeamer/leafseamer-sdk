import test from 'node:test';
import assert from 'node:assert/strict';
import {createBrowserSessionClient, contractSelection as selection} from '../dist/index.mjs';

function response(csrf, digest = selection.contract_digest) {
  return new Response(JSON.stringify({request_id: 'request', service_id: 'service', service_boot_id: 'boot', protocol_version: selection.contract_id, selection,
    data: {principal_id: 'principal', session_id: 'session', issuer_id: 'issuer', issuer_epoch: 'epoch', authorization_revision: '1',
      permissions: ['session.read'], validity: {not_before: '2026-01-01T00:00:00.000Z', not_after: '2026-01-01T01:00:00.000Z', authorization_policy_revision: '1'}}}),
  {status: 201, headers: {'Content-Type': 'application/json', 'X-LeafSeamer-Contract': selection.contract_id, 'X-LeafSeamer-Contract-Digest': digest, 'X-CSRF-Token': csrf}});
}

test('CSRF只从已验证响应采用，错误选择与非规范秘密不能建立会话状态', async () => {
  for (const [csrf, digest] of [['B'.repeat(43), selection.contract_digest], ['A'.repeat(43), 'sha256:' + '0'.repeat(64)]]) {
    let requests = 0;
    const client = createBrowserSessionClient({baseUrl: 'https://controller.invalid', fetchImpl: async () => { requests++; return response(csrf, digest); }});
    await assert.rejects(client.login({login: 'operator', password: 'synthetic-password-012345'}));
    await assert.rejects(client.refresh('client'), e => e.code === 'session_credentials_missing');
    await assert.rejects(client.current(), e => e.code === 'session_credentials_missing');
    assert.equal(requests, 1);
  }
});

test('会话客户端必须HTTPS，刷新只使用同源Cookie和内存CSRF', async () => {
  assert.throws(() => createBrowserSessionClient({baseUrl: 'http://127.0.0.1:8000'}), e => e.code === 'session_origin');
  assert.throws(() => createBrowserSessionClient({baseUrl: 'https://controller.invalid/services/controller-one'}), e => e.code === 'session_endpoint');
  const seen = [];
  const client = createBrowserSessionClient({baseUrl: 'https://controller.invalid', fetchImpl: async (url, options) => {
    seen.push({url, options}); return seen.length === 1 ? response('A'.repeat(43)) : new Response('', {status: 503});
  }});
  assert.equal((await client.login({login: 'operator', password: 'synthetic-password-012345'})).status, '201');
  await assert.rejects(client.refresh('client')); // 缺契约的响应不能被当作刷新成功。
  assert.equal(seen.length, 2); assert.equal(seen[1].options.credentials, 'same-origin');
  assert.equal(seen[1].options.headers.get('x-csrf-token'), 'A'.repeat(43)); assert.equal(seen[1].options.headers.get('cookie'), null);
  await assert.rejects(client.refresh('client'), e => e.code === 'session_credentials_missing'); assert.equal(seen.length, 2);
});

test('命令与证据查询采用定向令牌，GET路径和固定修订参数无重试', async () => {
  const seen = [];
  const headers = {'Content-Type':'application/json','X-LeafSeamer-Contract':selection.contract_id,'X-LeafSeamer-Contract-Digest':selection.contract_digest};
  const client = createBrowserSessionClient({baseUrl:'https://controller.invalid',fetchImpl:async (url,options)=>{
    seen.push({url,options});
    if(url.endsWith('/auth/sessions'))return response('A'.repeat(43));
    if(url.endsWith('/auth/service-tokens'))return new Response(JSON.stringify({request_id:'request',service_id:'service',service_boot_id:'boot',protocol_version:selection.contract_id,selection,
      data:{access_token:'synthetic-access-token',token_type:'Bearer',expires_in:60,audience:'controller'}}),{status:201,headers});
    // 非合约响应必须失败，并清空客户端凭据。
    return new Response('',{status:503});
  }});
  for (const evidence of [false,true]) {
    await client.login({login:'operator',password:'synthetic-password-012345'});
    await client.issueToken({audience:'controller',requested_scopes:[evidence?'command.evidence.read':'command.read']});
    const start=seen.length;
    await assert.rejects(evidence?client.getCommandEvidence('command_a',{state_revision:'9007199254740993',limit:32,cursor:'next_page_cursor_1'}):client.getCommand('command_a'));
    assert.equal(seen.length,start+1);
    const request=seen.at(-1),url=new URL(request.url);
    assert.equal(request.options.method,'GET');assert.equal(request.options.headers.get('authorization'),'Bearer synthetic-access-token');
    assert.equal(url.pathname,evidence?'/api/v1/commands/command_a/evidence':'/api/v1/commands/command_a');
    if(evidence)assert.deepEqual(Object.fromEntries(url.searchParams),{cursor:'next_page_cursor_1',limit:'32',state_revision:'9007199254740993'});
    await assert.rejects(client.getCommand('command_a'),e=>e.code==='session_credentials_missing');
    assert.equal(seen.length,start+1);
  }
});
