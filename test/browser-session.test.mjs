import test from 'node:test';
import assert from 'node:assert/strict';
import {createBrowserSessionClient, contractSelection as selection} from '../dist/index.mjs';
import {prepareControlChange,prepareManualCommand} from '../dist/index.mjs';
import {createHash} from 'node:crypto';
import canonicalize from 'canonicalize';

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

test('浏览器读取确认目录使用选定契约，手动命令查原身份覆盖逻辑场景引用',async()=>{
  const scope={authority_service_id:'controller',database_instance_id:'database'},context={context_id:'context',context_epoch:'epoch',
    service_id:'controller',audience:'controller',selection,operations:['submitCommand'],issuer_id:'issuer',issuer_epoch:'epoch',principal_id:'principal'};
  const body={context_id:context.context_id,idempotency_key:'synthetic-obs-1',correlation_id:'correlation',device_id:'obs_1',
    action_id:'obs.program_scene.set',capability_version:'1.0.0',parameters:{scene_ref:{collection_ref:'collection',collection_generation:'1',
      catalog_revision:'1',binding_revision:'2',scene_id:'scene_1'}},expected_control:{epoch:'epoch',version:'1'},origin:'manual',
    automation_binding:null,preconditions:[],required_completion:'effect_verified',dispatch:{mode:'immediate',max_queue_ms:5000},evidence_timeout_ms:1000};
  const prepared=await prepareManualCommand({scope,context,body});
  const {context_id,idempotency_key,correlation_id,...value}=prepared.body;
  assert.deepEqual(prepared.identity.key,{target_scope:scope,operation_id:'createCommand',issuer_id:context.issuer_id,issuer_epoch:context.issuer_epoch,
    principal_id:context.principal_id,request_epoch:context.context_epoch,idempotency_key});
  assert.equal(prepared.identity.request_digest,'sha256:'+createHash('sha256').update(canonicalize(value)).digest('hex'));
  await assert.rejects(prepareManualCommand({scope,context:{...context,audience:'other'},body}),/command_request_binding/);

  const headers={'Content-Type':'application/json','X-LeafSeamer-Contract':selection.contract_id,'X-LeafSeamer-Contract-Digest':selection.contract_digest};
  const seen=[],client=createBrowserSessionClient({baseUrl:'https://controller.invalid',fetchImpl:async(url,options)=>{
    seen.push({url:String(url),options});
    if(url.endsWith('/auth/sessions'))return response('A'.repeat(43));
    if(url.endsWith('/auth/service-tokens'))return new Response(JSON.stringify({request_id:'request',service_id:'service',service_boot_id:'boot',protocol_version:selection.contract_id,selection,
      data:{access_token:'synthetic-access-token',token_type:'Bearer',expires_in:60,audience:'controller'}}),{status:201,headers});
    return new Response('',{status:503});
  }});
  await client.login({login:'operator',password:'synthetic-password-012345'});await client.issueToken({audience:'controller',requested_scopes:['device.read']});
  await assert.rejects(client.getSceneCatalog('obs_1'));
  assert.equal(seen.length,3);assert.equal(seen[2].url,'https://controller.invalid/api/v1/devices/obs_1/scene-catalog');
  assert.equal(seen[2].options.method,'GET');assert.equal(seen[2].options.headers.get('authorization'),'Bearer synthetic-access-token');
});

test('控制写入及查原携带Origin和CSRF，操作读取仅GET，错误响应不重发',async()=>{
 const seen=[],headers={'Content-Type':'application/json','X-LeafSeamer-Contract':selection.contract_id,'X-LeafSeamer-Contract-Digest':selection.contract_digest};
 const client=createBrowserSessionClient({baseUrl:'https://controller.invalid',fetchImpl:async(url,options)=>{
  seen.push({url,options});
  if(url.endsWith('/auth/sessions'))return response('A'.repeat(43));
  if(url.endsWith('/auth/service-tokens'))return new Response(JSON.stringify({request_id:'request',service_id:'service',service_boot_id:'boot',protocol_version:selection.contract_id,selection,
   data:{access_token:'synthetic-access-token',token_type:'Bearer',expires_in:60,audience:'controller'}}),{status:201,headers});
  return new Response('',{status:503});
 }});
 const body={context_id:'context',idempotency_key:'control',expected_control:{epoch:'epoch',version:'0'},reason:'显式操作'};
 const prepared=await prepareControlChange({operation:'acquireControl',device_id:'device',scope:{authority_service_id:'controller',database_instance_id:'database'},body,
  context:{context_id:'context',context_epoch:'epoch',service_id:'controller',audience:'controller',selection,operations:['acquireControl'],issuer_id:'issuer',issuer_epoch:'epoch',principal_id:'principal'}});
 for(const operation of ['acquireControl','releaseControl','lookupControlRequest','getControlOperation']){
  await client.login({login:'operator',password:'synthetic-password-012345'});
  await client.issueToken({audience:'controller',requested_scopes:['control.read','control.acquire','control.release']});
  const start=seen.length;
  await assert.rejects(operation==='lookupControlRequest'?client[operation](prepared.identity):operation==='getControlOperation'?client[operation]('operation-one'):client[operation]('device',body));
  assert.equal(seen.length,start+1);
  const request=seen.at(-1),read=operation==='getControlOperation';
  assert.equal(request.options.method,read?'GET':'POST');
  assert.equal(request.options.headers.get('authorization'),'Bearer synthetic-access-token');
  assert.equal(request.options.headers.get('origin'),read?null:'https://controller.invalid');
  assert.equal(request.options.headers.get('x-csrf-token'),read?null:'A'.repeat(43));
  if(read)assert.equal(new URL(request.url).pathname,'/api/v1/control-operations/operation-one');
  await assert.rejects(client.getControlOperation('operation-one'),e=>e.code==='session_credentials_missing');assert.equal(seen.length,start+1);
 }
});
