import test from 'node:test';
import assert from 'node:assert/strict';
import {createHttpAdapter} from '../dist/http.mjs';
import {contractSelection as selection} from '../dist/index.mjs';
const headers=[['content-type','application/json'],['x-leafseamer-contract',selection.contract_id],['x-leafseamer-contract-digest',selection.contract_digest]];
const snapshot={snapshot_id:'snapshot',issuer_id:'issuer',issuer_epoch:'epoch',issuer_revision:'7',audience:'target',principal_kind:'human',principal_id:'person',
 session_id:'session',credential_id:'credential',subject_revision:'1',session_revision:'1',policy_revision:'2',permissions:['auth.read'],scope_digest:'sha256:'+'a'.repeat(64),
 challenge_id:'challenge',validity:{not_before:'2026-11-11T00:00:00.000Z',expires_at:'2026-11-11T00:00:02.000Z'},fresh_for_ms:2000,state:'active'};
const recent={format:'issuer-recent-authentication/1',session_id:'session',session_revision:'1',not_before:'2026-11-10T23:55:00.000Z',expires_at:'2026-11-11T00:00:00.000Z'};
async function response(data){
 const adapter=createHttpAdapter(selection),request=adapter.prepareRequest('controller','POST','/internal/auth/introspect',[...headers,['x-leafseamer-pairing','binding']]);
 const body={request_id:'request',service_id:'issuer_service',service_boot_id:'boot',protocol_version:selection.contract_id,selection,data};
 return adapter.decodeResponse(Buffer.from(JSON.stringify(body)),adapter.prepareResponse(request,'200',headers));
}
test('product5人员核验必须携带近期认证原区间；过期区间不伪造当前管理资格',async()=>{
 assert.equal(selection.contract_id,'leafseamer.api.v1.product9');
 const value={active:true,snapshot,recent_authentication:recent};assert.deepEqual((await response(value)).value.data,value);
 for(const data of [{active:true,snapshot},{...value,recent_authentication:null},{...value,recent_authentication:{...recent,expires_at:undefined}},{...value,recent_authentication:{...recent,extend_ms:5000}}])await assert.rejects(response(data));
});
test('服务及inactive核验不带人员认证，配对选择器必填且旧选择拒绝',async()=>{
 const service={...snapshot,principal_kind:'service',session_id:null,session_revision:null};
 assert.equal((await response({active:true,snapshot:service,recent_authentication:null})).value.data.active,true);
 await assert.rejects(response({active:true,snapshot:service,recent_authentication:recent}));
 assert.deepEqual((await response({active:false,snapshot:null,recent_authentication:null})).value.data,{active:false,snapshot:null,recent_authentication:null});
 await assert.rejects(response({active:false,snapshot:null,recent_authentication:recent}));
 const adapter=createHttpAdapter(selection);
 assert.throws(()=>adapter.prepareRequest('controller','POST','/internal/auth/introspect',headers));
 assert.throws(()=>adapter.prepareRequest('controller','POST','/internal/auth/introspect',[...headers,['x-leafseamer-pairing','binding'],['x-leafseamer-pairing','other']]));
 assert.throws(()=>adapter.prepareRequest('controller','POST','/internal/auth/introspect',[...headers.map(([k,v])=>[k,k==='x-leafseamer-contract'?'leafseamer.api.v1.product4':v]),['x-leafseamer-pairing','binding']]));
});
