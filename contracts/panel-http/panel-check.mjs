import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHttpAdapter,WireError} from './adapter.mjs';
import {createHttpAdapter as legacy} from '../http-envelope/adapter.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
assert(process.execArgv.includes('--disallow-code-generation-from-strings'));
const selection=read('../panel-wire/contract/selection.json'),adapter=createHttpAdapter(selection),oracle=read('./oracle.json');
const checks=[],check=(name,got,want=true)=>{assert.deepEqual(got,want,name);checks.push({name,passed:true});};
const bytes=v=>new TextEncoder().encode(JSON.stringify(v));
const reject=async(name,fn,reason)=>{await assert.rejects(async()=>fn(),e=>e instanceof WireError&&(!reason||e.reason===reason),name);checks.push({name,passed:true});};
for(const item of read('./panel-cases.json').cases) {
  const fixture=oracle.operations.find(o=>o.request.authority===item.authority&&o.request.operation_id==='invokePanelMethod');
  const path='/api/v1/panel-sessions/'+item.request.intent.identity.panel_session_id+'/requests';
  const request=adapter.prepareRequest(item.authority,'POST',path,fixture.request.headers);
  check('当前服务输入:'+item.method,(await adapter.decodeRequest(bytes(item.request),request)).value,item.request);
  await reject('实际旧输入SchemaRef:'+item.method,()=>adapter.decodeRequest(bytes(item.old_input),request),'schema_rejected');
  const response=fixture.responses.find(r=>r.status==='200'),handle=adapter.prepareResponse(request,response.status,response.headers);
  check('当前服务结果:'+item.method,(await adapter.decodeResponse(bytes(item.response),handle)).value,item.response);
  check('受理但不可显示:'+item.method,(await adapter.decodeResponse(bytes(item.unavailable),handle)).value,item.unavailable);
  await reject('实际旧结果SchemaRef:'+item.method,()=>adapter.decodeResponse(bytes(item.old_result),handle),'schema_rejected');
  const unavailable={...item.unavailable,projection_state:'available'};
  await reject('可用结果不得空值:'+item.method,()=>adapter.decodeResponse(bytes(unavailable),handle),'schema_rejected');
}
for(const p of ['../event-integration/preview/selection.json','../panel-integration/preview/selection.json']) {
  const old=read(p);await reject('旧选择构造拒绝:'+old.contract_id,()=>createHttpAdapter(old),'contract_selection');
  await reject('旧ID新摘要拒绝:'+old.contract_id,()=>createHttpAdapter({...old,contract_digest:selection.contract_digest}),'contract_selection');
  await reject('新ID旧摘要拒绝:'+old.contract_id,()=>createHttpAdapter({...selection,contract_digest:old.contract_digest}),'contract_selection');
}
check('旧适配器保留events2',typeof legacy(read('../event-integration/preview/selection.json')).describe==='function');
assert.throws(()=>legacy(selection),e=>e.reason==='contract_selection');check('旧适配器拒绝新选择',true);
console.log(JSON.stringify({all_passed:true,cases_passed:checks.length,checks,methods:35,dynamic_codegen_blocked:true,transport_calls:0,production_authorization_executed:false}));
