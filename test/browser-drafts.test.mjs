import test from 'node:test';
import assert from 'node:assert/strict';
import {createBrowserSessionClient,prepareDraftChange, contractSelection as selection} from '../dist/index.mjs';
import {createHash} from 'node:crypto';
import canonicalize from 'canonicalize';

test('发布查原摘要绑定定义与原修订，context不进入语义摘要',async()=>{
 const scope={authority_service_id:'seamer',database_instance_id:'database'},context={context_id:'context',service_id:'seamer',audience:'seamer',operations:['publishDefinition'],selection};
 const body={context:{context_id:'context',idempotency_key:'key'},expected_draft_revision:'2',expected_content_digest:'sha256:'+'a'.repeat(64),expected_selection_digest:'sha256:'+'b'.repeat(64)};
 const input={operation:'publishDefinition',definition_id:'definition',scope,context,body},prepared=await prepareDraftChange(input);
 const {context:unused,...semantic}=body;
 assert.equal(prepared.request_digest,'sha256:'+createHash('sha256').update(canonicalize({version:'automation-lifecycle/0.1.0-draft.1',operation_id:'publishDefinition',definition_id:'definition',request:semantic})).digest('hex'));
 assert.equal((await prepareDraftChange({...input,body:{...body,context:{...body.context,idempotency_key:'another'}}})).request_digest,prepared.request_digest);
 assert.notEqual((await prepareDraftChange({...input,definition_id:'other'})).request_digest,prepared.request_digest);
 await assert.rejects(prepareDraftChange({...input,context:{...context,operations:['updateDraft']}}));
 await assert.rejects(prepareDraftChange({...input,body:{...body,expected_content_digest:'invalid'}}));
 assert.equal(Object.isFrozen(prepared.lookup),true);
});

const headers = {'Content-Type':'application/json','X-LeafSeamer-Contract':selection.contract_id,'X-LeafSeamer-Contract-Digest':selection.contract_digest};
const envelope = data => ({request_id:'request',service_id:'controller',service_boot_id:'boot',protocol_version:selection.contract_id,selection,data});
const session = {principal_id:'person',session_id:'session',issuer_id:'issuer',issuer_epoch:'epoch',authorization_revision:'1',permissions:['session.read'],
  validity:{not_before:'2026-01-01T00:00:00.000Z',not_after:'2026-01-01T01:00:00.000Z',authorization_policy_revision:'1'}};
function fixture() {
  const calls=[];let tokenAudience=null, pending=null, enter=null, contextSeq=0;
  const client=createBrowserSessionClient({baseUrl:'https://controller.invalid',fetchImpl:async(url,options)=>{
    calls.push({url,options});
    if(url.endsWith('/auth/sessions')||url.endsWith('/auth/sessions/refresh'))return new Response(JSON.stringify(envelope(session)),{status:url.endsWith('/refresh')?200:201,headers:{...headers,'X-CSRF-Token':'A'.repeat(43)}});
    if(url.endsWith('/auth/service-tokens')){
      const body=JSON.parse(new TextDecoder().decode(options.body));
      if(pending){enter();await pending;}
      return new Response(JSON.stringify(envelope({access_token:'synthetic-token-'+body.audience,token_type:'Bearer',expires_in:60,audience:tokenAudience??body.audience})),{status:201,headers});
    }
    if(url.endsWith('/request-contexts')){
      const body=JSON.parse(new TextDecoder().decode(options.body));
      return new Response(JSON.stringify({...envelope({context_id:body.operations.some(op=>['approveDefinitionBindings','revokeBindingApproval'].includes(op))?'10000000-0000-4000-8000-'+String(++contextSeq).padStart(12,'0'):'context-'+ ++contextSeq,service_id:body.audience,issuer_id:'issuer',issuer_epoch:'epoch',principal_id:'person',audience:body.audience,operations:body.operations,context_epoch:'epoch',issued_at:'2026-01-01T00:00:00.000Z',expires_at:'2026-01-01T00:00:30.000Z',ttl_ms:30000,max_unique_requests:8,selection}),service_id:body.audience}),{status:201,headers:{...headers,'X-CSRF-Token':'Q'.repeat(43)}});
    }
    return new Response(JSON.stringify({code:'PERMISSION_DENIED',correlation_id:'request',diagnostics:[]}),{status:403,headers});
  }});
  return {client,calls,login:()=>client.login({login:'person',password:'synthetic-password-123'}),wrongAudience:()=>{tokenAudience='other';},delay:()=>{let finish;pending=new Promise(resolve=>{finish=resolve;});return {finish,entered:new Promise(resolve=>{enter=resolve;})};}};
}

test('草稿客户端固定服务目标，签发只到Controller，Seamer只收到自己的内存token',async()=>{
  const f=fixture(),a=f.client.createDraftClient({baseUrl:'https://seamer-a.invalid',audience:'seamer-a'}),b=f.client.createDraftClient({baseUrl:'https://seamer-b.invalid/services/b',audience:'seamer-b'});
  await f.login();await a.issueToken(['definition.read']);await b.issueToken(['definition.read']);
  for(const [draft,origin,token]of [[a,'https://seamer-a.invalid','seamer-a'],[b,'https://seamer-b.invalid/services/b','seamer-b']]){
    assert.equal((await draft.getDraft('definition')).status,'403');
    const call=f.calls.at(-1);assert.equal(call.url,origin+'/api/v1/definitions/definition/draft');
    assert.equal(call.options.credentials,'omit');assert.equal(call.options.redirect,'error');assert.equal(call.options.cache,'no-store');
    assert.equal(call.options.headers.get('authorization'),'Bearer synthetic-token-'+token);
    assert.equal(call.options.headers.get('x-csrf-token'),null);assert.equal(call.options.headers.get('cookie'),null);
    assert.equal(call.options.headers.get('origin'),'https://controller.invalid');
  }
  const issued=f.calls.filter(c=>c.url.endsWith('/auth/service-tokens'));assert.equal(issued.length,2);
  for(const call of issued){assert.equal(new URL(call.url).origin,'https://controller.invalid');assert.equal(call.options.credentials,'same-origin');assert.equal(call.options.headers.get('x-csrf-token'),'A'.repeat(43));assert.equal(call.options.headers.get('authorization'),null);}
  await assert.rejects(f.client.current(),{code:'session_credentials_missing'});
  a.clearLocalState();await assert.rejects(a.getDraft('definition'),{code:'session_credentials_missing'});assert.equal((await b.getDraft('definition')).status,'403');
  f.client.clearLocalState();await assert.rejects(b.getDraft('definition'),{code:'session_credentials_missing'});
});

test('错audience和清理后的迟到签发不能建立草稿凭据，并发操作不重复发送',async()=>{
  const f=fixture(),draft=f.client.createDraftClient({baseUrl:'https://seamer.invalid',audience:'seamer'});
  await f.login();f.wrongAudience();await assert.rejects(draft.issueToken(['definition.read']),{code:'token_audience'});
  await assert.rejects(draft.getDraft('definition'),{code:'session_credentials_missing'});
  const g=fixture(),remote=g.client.createDraftClient({baseUrl:'https://seamer.invalid',audience:'seamer'});
  await g.login();const {finish,entered}=g.delay(),pending=remote.issueToken(['definition.read']);await entered;
  await assert.rejects(remote.issueToken(['definition.read']),{code:'session_busy'});
  remote.clearLocalState();finish();await assert.rejects(pending,{code:'session_state_changed'});
  await assert.rejects(remote.getDraft('definition'),{code:'session_credentials_missing'});assert.equal(g.calls.length,2);
});

test('运行读取使用 Seamer 的定向令牌，不携带 Cookie 或写入凭据',async()=>{
 const f=fixture(),remote=f.client.createDraftClient({baseUrl:'https://seamer.invalid/services/seamer',audience:'seamer'});
 await f.login();await remote.issueToken(['run.read']);
 assert.equal((await remote.getRun('run-one')).status,'403');
 const {url,options}=f.calls.at(-1);
 assert.equal(url,'https://seamer.invalid/services/seamer/api/v1/runs/run-one');
 assert.equal(options.method,'GET');
 assert.equal(options.credentials,'omit');
 assert.equal(options.headers.get('authorization'),'Bearer synthetic-token-seamer');
 assert.equal(options.headers.get('x-csrf-token'),null);
 assert.equal(options.headers.get('cookie'),null);
 remote.clearLocalState();
 await assert.rejects(remote.getRun('run-one'),{code:'session_credentials_missing'});
});

test('草稿目标拒绝明文、凭据URL及可变路径',()=>{
  const {client}=fixture();
  for(const baseUrl of ['http://127.0.0.1:8000','https://user:secret@seamer.invalid','https://seamer.invalid/?target=x','https://seamer.invalid/arbitrary'])assert.throws(()=>client.createDraftClient({baseUrl,audience:'seamer'}));
  assert.throws(()=>client.createDraftClient({baseUrl:'https://seamer.invalid',audience:'seamer\n'}),{code:'seamer_audience'});
});

test('父会话刷新使所有旧草稿令牌失效，须显式重新签发',async()=>{
  const f=fixture(),draft=f.client.createDraftClient({baseUrl:'https://seamer.invalid',audience:'seamer'});
  await f.login();await draft.issueToken(['definition.read']);assert.equal((await f.client.refresh('client')).status,'200');
  const count=f.calls.length;await assert.rejects(draft.getDraft('definition'),{code:'session_credentials_missing'});assert.equal(f.calls.length,count);
  await draft.issueToken(['definition.read']);assert.equal((await draft.getDraft('definition')).status,'403');
});

test('发布只使用Seamer独立context CSRF，不能搬用其它context或跨令牌刷新',async()=>{
 const f=fixture(),draft=f.client.createDraftClient({baseUrl:'https://seamer.invalid',audience:'seamer'});
 await f.login();await draft.issueToken(['definition.publish','request.create']);
 const context=(await draft.createRequestContext({operations:['publishDefinition'],ttl_ms:30000,max_unique_requests:8})).body.data;
 const body={context:{context_id:context.context_id,idempotency_key:'publish'},expected_draft_revision:'1',expected_content_digest:'sha256:'+'a'.repeat(64),expected_selection_digest:'sha256:'+'b'.repeat(64)};
 assert.equal((await draft.publishDefinition('definition',body)).status,'403');
 let call=f.calls.at(-1);assert.equal(call.options.headers.get('x-csrf-token'),'Q'.repeat(43));assert.equal(call.options.headers.get('cookie'),null);assert.equal(call.options.credentials,'omit');
 const before=f.calls.length;await assert.rejects(draft.publishDefinition('definition',{...body,context:{...body.context,context_id:'other'}}),{code:'session_credentials_missing'});assert.equal(f.calls.length,before);
 await draft.getCompiledProgram('definition','1');assert.equal(f.calls.at(-1).options.headers.get('x-csrf-token'),null);
 await draft.issueToken(['definition.publish']);await assert.rejects(draft.publishDefinition('definition',body),{code:'session_credentials_missing'});
 await draft.createRequestContext({operations:['publishDefinition'],ttl_ms:30000,max_unique_requests:8});await f.client.refresh('client');await draft.issueToken(['definition.publish']);
 await assert.rejects(draft.publishDefinition('definition',{...body,context:{...body.context,context_id:'context-2'}}),{code:'session_credentials_missing'});
});


test('绑定批准与撤销使用Seamer上下文CSRF，三类读取不携带写凭据且不自动重试',async()=>{
 const f=fixture(),draft=f.client.createDraftClient({baseUrl:'https://seamer.invalid',audience:'seamer'}),id='10000000-0000-4000-8000-000000000123';
 await f.login();await draft.issueToken(['auth.manage','auth.read','request.read','request.create']);
 const context=(await draft.createRequestContext({operations:['approveDefinitionBindings','revokeBindingApproval'],ttl_ms:30000,max_unique_requests:2})).body.data;
 const source={binding_id:id,device_id:id,scope:{format:'leafseamer.device-binding-scope/1',authority_service_id:id,database_instance_id:id,device_ids:[id]},expected_registration_ref:null};
 const body={context:{context_id:context.context_id},source,request_id:id,approval_id:id,expected_bundle_digest:'sha256:'+'a'.repeat(64)};
 for(const call of [()=>draft.approveDefinitionBindings(id,body),()=>draft.revokeBindingApproval(id,id,{context:body.context,request_id:id,expected_revision:'1'})]){
  const before=f.calls.length;assert.equal((await call()).status,'403');assert.equal(f.calls.length,before+1);assert.equal(f.calls.at(-1).options.headers.get('x-csrf-token'),'Q'.repeat(43));assert.equal(f.calls.at(-1).options.credentials,'omit');
 }
 for(const call of [()=>draft.queryBindingCandidate(id,source),()=>draft.getBindingApproval(id,id),()=>draft.lookupBindingApproval(id,{request_id:id,request_digest:body.expected_bundle_digest})]){
  assert.equal((await call()).status,'403');assert.equal(f.calls.at(-1).options.headers.get('x-csrf-token'),null);
 }
 await draft.issueToken(['auth.manage']);const before=f.calls.length;await assert.rejects(draft.approveDefinitionBindings(id,body),{code:'session_credentials_missing'});assert.equal(f.calls.length,before);
});
