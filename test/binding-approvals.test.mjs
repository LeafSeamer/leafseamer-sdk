import test from 'node:test';
import assert from 'node:assert/strict';
import {createHttpAdapter} from '../dist/http.mjs';
import {contractSelection} from '../dist/index.mjs';
import {defaultProfile} from '../dist/runtime/panel-wire/decoder.mjs';
const id='10000000-0000-4000-8000-000000000001',adapter=createHttpAdapter(contractSelection);
const headers=[['content-type','application/json'],['x-leafseamer-contract',contractSelection.contract_id],['x-leafseamer-contract-digest',contractSelection.contract_digest]];
const error=JSON.stringify({code:'WORKER_NOT_READY',correlation_id:'request',diagnostics:[]});
function response(binding=true){const request=adapter.prepareRequest('seamer',binding?'POST':'GET','/api/v1/definitions/'+id+(binding?'/binding-approval-requests/lookup':'/draft'),binding?headers:headers.filter(([key])=>key!=='content-type'));return adapter.prepareResponse(request,'503',headers);}
test('具名绑定响应采用固定预算，旧操作和显式较严预算保持原限',async()=>{
 const bytes=Buffer.from(error+' '.repeat(70000));assert.equal((await adapter.decodeResponse(bytes,response(),{clock:()=>0})).value.code,'WORKER_NOT_READY');
 await assert.rejects(adapter.decodeResponse(bytes,response(false),{clock:()=>0}),{reason:'message_budget'});
 await assert.rejects(adapter.decodeResponse(bytes,response(),{clock:()=>0,profile:defaultProfile}),{reason:'message_budget'});
 await assert.rejects(adapter.decodeResponse(Buffer.from(error+' '.repeat(524288)),response(),{clock:()=>0}),{reason:'message_budget'});
});
test('响应解析期限精确拒绝等号，不扩大其它操作的100毫秒默认值',async()=>{
 const bytes=Buffer.from(error),clock=after=>{let first=true;return()=>{if(first){first=false;return 0;}return after;};};
 assert.equal((await adapter.decodeResponse(bytes,response(),{clock:clock(999)})).value.code,'WORKER_NOT_READY');
 await assert.rejects(adapter.decodeResponse(bytes,response(),{clock:clock(1000)}),{reason:'deadline'});
 await assert.rejects(adapter.decodeResponse(bytes,response(false),{clock:clock(100)}),{reason:'deadline'});
});
test('新增批准入口不接受客户端自报批准正文或旧选择',async()=>{
 const request=adapter.prepareRequest('seamer','POST','/api/v1/definitions/'+id+'/binding-candidates/query',headers);
 const query={binding_id:id,device_id:id,scope:{format:'leafseamer.device-binding-scope/1',authority_service_id:id,database_instance_id:id,device_ids:[id]},expected_registration_ref:null};
 await adapter.decodeRequest(Buffer.from(JSON.stringify(query)),request);
 await assert.rejects(adapter.decodeRequest(Buffer.from(JSON.stringify({...query,bundle:{approved:true}})),request));
 assert.throws(()=>adapter.prepareRequest('seamer','POST','/api/v1/definitions/'+id+'/binding-candidates/query',headers.map(([key,value])=>[key,key==='x-leafseamer-contract'?'leafseamer.api.v1.product5':value])));
});
