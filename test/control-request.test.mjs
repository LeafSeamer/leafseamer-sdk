import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareControlChange,contractSelection} from '../dist/index.mjs';

function input(operation='acquireControl') {
 return {operation,device_id:'device-one',scope:{authority_service_id:'controller',database_instance_id:'database'},
  context:{context_id:'context',context_epoch:'request-epoch',service_id:'controller',audience:'controller',operations:[operation],selection:contractSelection,
   issuer_id:'issuer',issuer_epoch:'issuer-epoch',principal_id:'operator'},
  body:{context_id:'context',idempotency_key:'control-key',expected_control:{epoch:'control-epoch',version:'0'},reason:'显式人员操作'}};
}

test('控制准备在首个等待前固定内容，默认force与false同摘要且查原身份不可变',async()=>{
 const value=input(),pending=prepareControlChange(value);
 value.body.reason='后来修改';value.context.principal_id='another';value.scope.database_instance_id='another';
 const prepared=await pending,explicit=input();explicit.body.force=false;
 assert.deepEqual(prepared.identity,(await prepareControlChange(explicit)).identity);
 assert.equal(prepared.body.reason,'显式人员操作');assert.equal(prepared.identity.key.principal_id,'operator');
 assert.ok(Object.isFrozen(prepared.identity.key.target_scope));
 assert.throws(()=>{prepared.body.reason='mutation';});
});

test('设备、范围、请求代次和操作内容分别参与控制身份，释放使用独立操作',async()=>{
 const baseline=await prepareControlChange(input());
 for(const alter of [v=>{v.device_id='device-two';},v=>{v.scope.database_instance_id='database-two';},v=>{v.body.reason='新原因';}]){
  const value=input();alter(value);assert.notEqual((await prepareControlChange(value)).identity.request_digest,baseline.identity.request_digest);
 }
 const epoch=input();epoch.context.context_epoch='next-epoch';
 assert.notDeepEqual((await prepareControlChange(epoch)).identity,baseline.identity);
 const release=await prepareControlChange(input('releaseControl'));
 assert.equal(release.identity.key.operation_id,'releaseControl');assert.equal(release.body.force,undefined);
});

test('控制准备拒绝未知字段、错误上下文、跨服务和错误契约',async()=>{
 for(const alter of [v=>{v.extra=true;},v=>{v.body.extra=true;},v=>{v.context.context_id='different';},
  v=>{v.scope.authority_service_id='other';},v=>{v.context.operations=[];},v=>{v.context.selection={...contractSelection,contract_digest:'sha256:'+'0'.repeat(64)};}]){
  const value=input();alter(value);await assert.rejects(prepareControlChange(value));
 }
});
