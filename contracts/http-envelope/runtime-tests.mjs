import assert from 'node:assert/strict';
import {createHttpAdapter,limits,WireError} from './adapter.mjs';
import {profile} from '../wire-routing/decoder.mjs';

export async function run(oracle,selection) {
  const adapter=createHttpAdapter(selection),checks=[],handles=new Map(),bytes=v=>new TextEncoder().encode(v);
  const check=(name,got,want=true)=>{assert.deepEqual(got,want,name);checks.push({name,passed:true});};
  async function rejected(name,fn,reason) {await assert.rejects(async()=>fn(),e=>e instanceof WireError&&(!reason||e.reason===reason),name);checks.push({name,passed:true});}
  const prepare=r=>adapter.prepareRequest(r.authority,r.method,r.target,r.headers);
  const caseFor=(authority,id)=>oracle.operations.find(v=>v.request.authority===authority&&v.request.operation_id===id);
  for(const c of oracle.operations) {
    const r=c.request,h=prepare(r);handles.set(JSON.stringify([r.authority,r.operation_id]),h);
    check('完整请求路由:'+r.authority+':'+r.operation_id,[h.authority,h.operation_id,h.body,h.authorization_granted],[r.authority,r.operation_id,c.body,false]);
    check('请求元数据冻结:'+r.authority+':'+r.operation_id,Object.isFrozen(h)&&Object.isFrozen(h.parameters.query));
    if(c.body==='none')check('无请求正文:'+r.authority+':'+r.operation_id,await adapter.decodeRequest(new Uint8Array(),h),null);
    for(const response of c.responses) {
      const res=adapter.prepareResponse(h,response.status,response.headers);
      check('完整响应头:'+r.authority+':'+r.operation_id+':'+response.status,[res.status,res.body,res.authorization_granted],[response.status,response.body,false]);
      if(response.body==='none')check('无响应正文:'+r.authority+':'+r.operation_id+':'+response.status,await adapter.decodeResponse(new Uint8Array(),res),null);
      for(const name of ['set-cookie','x-csrf-token','sec-websocket-protocol'])check('秘密头不进DTO:'+r.authority+':'+r.operation_id+':'+response.status+':'+name,!Object.hasOwn(res.headers,name));
    }
    const op=adapter.describe(r.authority,r.operation_id);check('安全元数据不授资格:'+r.authority+':'+r.operation_id,Object.isFrozen(op.security)&&Object.isFrozen(op.extensions));
    for(const p of op.parameters.filter(p=>p.required&&p.location!=='path')) {
      const bad=structuredClone(r);
      if(p.location==='header')bad.headers=bad.headers.filter(([n])=>n.toLowerCase()!==p.name);
      else bad.target=bad.target.split('?')[0]+'?'+bad.target.split('?')[1].split('&').filter(s=>decodeURIComponent(s.split('=')[0])!==p.name).join('&');
      await rejected('必填不可省略:'+r.authority+':'+r.operation_id+':'+p.name,()=>prepare(bad));
    }
  }
  for(const c of oracle.parameter_variants) {
    let accepted=true;try{prepare(c.request);}catch(e){if(!(e instanceof WireError))throw e;accepted=false;}
    check('独立参数接受集:'+c.name,accepted,c.expected);
  }
  const contextCase=caseFor('controller','createRequestContext'),contextHandle=prepare(contextCase.request);
  const body={audience:'controller',operations:['read'],ttl_ms:1000,max_unique_requests:1,selection};
  const slow=profile({slice_units:8,parse_deadline_ms:5000}),good=bytes(JSON.stringify(body));
  check('正文实际解码',(await adapter.decodeRequest(good,contextHandle,{profile:slow})).value,body);
  const raw=good.slice(),pending=adapter.decodeRequest(raw,contextHandle,{profile:slow});structuredClone(raw.buffer,{transfer:[raw.buffer]});
  check('首await前复制',(await pending).value,body);check('原缓冲已转移',raw.byteLength,0);
  await rejected('原始整数不舍入',()=>adapter.decodeRequest(bytes(JSON.stringify(body).replace('"max_unique_requests":1','"max_unique_requests":1.0000000000000001')),contextHandle,{profile:slow}),'raw_integer');
  await rejected('正文媒体不可覆盖',()=>adapter.decodeRequest(good,contextHandle,{contentType:'text/plain'}),'content_type_override');
  await rejected('请求句柄不可复制',()=>adapter.decodeRequest(good,{...contextHandle}),'foreign_handle');
  await rejected('请求句柄不可跨实例',()=>createHttpAdapter(selection).decodeRequest(good,contextHandle),'foreign_handle');
  await rejected('旧选择不能安装',()=>createHttpAdapter({...selection,contract_id:'leafseamer.api.v1.integration1'}),'contract_selection');
  let cancelled=false;
  await rejected('取消传递',()=>adapter.decodeRequest(good,contextHandle,{profile:slow,cancelled:()=>cancelled,yieldNow:async()=>{cancelled=true;}}),'cancelled');
  const events=caseFor('controller','openEvents'),eventHandle=prepare(events.request),errorResponse=events.responses.find(r=>r.status==='401');
  const response=adapter.prepareResponse(eventHandle,'401',errorResponse.headers),error={code:'authentication_required',request_id:'request',retry_action:'do_not_retry'};
  check('声明错误响应实际解码',(await adapter.decodeResponse(bytes(JSON.stringify(error)),response,{profile:slow})).value,error);
  await rejected('响应不能作请求句柄',()=>adapter.decodeRequest(good,response),'foreign_handle');
  await rejected('错状态错误正文',()=>adapter.decodeResponse(bytes(JSON.stringify({...error,code:'forbidden'})),response,{profile:slow}),'schema_rejected');
  await rejected('数值状态不转换',()=>adapter.prepareResponse(eventHandle,401,errorResponse.headers),'response_status');
  await rejected('未知状态拒绝',()=>adapter.prepareResponse(eventHandle,'599',errorResponse.headers),'response_status');
  await rejected('伪造请求不能绑定响应',()=>adapter.prepareResponse({...eventHandle},'401',errorResponse.headers),'foreign_request');
  const simple=caseFor('controller','getCapacity').request;
  async function badRequest(name,mutate,reason) {const r=structuredClone(simple);mutate(r);await rejected(name,()=>prepare(r),reason);}
  for(const t of ['/api/v1/capacity/','/api//v1/capacity','/api/v1/../capacity','/api/v1/%2e%2e/capacity','/api/v1/%252e%252e/capacity','/api/v1/capacity#x','https://other.invalid/api/v1/capacity','/api/v1/capacity?x=1','/api/v1/capacity?','/api/v1/%ff','/api/v1/%','/api/v1/capacity?x=%ED%A0%80'])await badRequest('非法target:'+t,r=>{r.target=t;});
  await badRequest('方法大小写不回退',r=>{r.method='get';});
  for(const t of ['/api/v1/capacity?x=<a>','/api/v1/capacity?x="a"','/api/v1/capacity?x=[a]','/api/v1/capacity?x={a}','/api/v1/capacity?x=^a','/api/v1/capacity?x=|a','/api/v1/capacity?x=`a'])await badRequest('未编码URI非法字符:'+t,r=>{r.target=t;},'request_target');
  await badRequest('未知authority',r=>{r.authority='other';});
  await badRequest('target预算',r=>{r.target='/'+ 'a'.repeat(limits.target_bytes);},'request_target');
  for(const [name,value,reason] of [['x-leafseamer-contract',selection.contract_id,'duplicate_header'],['X-Test','a\r\nb','header_syntax'],['Bad Name','x','header_syntax'],['X-Test','a\0b','header_syntax'],['Content-Encoding','gzip','content_encoding'],['Content-Length','01','content_length']])await badRequest('非法头:'+name+':'+reason,r=>r.headers.push([name,value]),reason);
  await badRequest('合并契约头不接受',r=>{r.headers.find(([n])=>n==='X-LeafSeamer-Contract')[1]+=','+selection.contract_id;});
  await badRequest('摘要需精确相等',r=>{r.headers.find(([n])=>n==='X-LeafSeamer-Contract-Digest')[1]='sha256:'+'0'.repeat(64);},'contract_selection');
  await badRequest('CL与TE冲突',r=>r.headers.push(['Content-Length','0'],['Transfer-Encoding','chunked']),'ambiguous_framing');
  await badRequest('头行数预算',r=>r.headers.push(...Array.from({length:257},()=>['X-Test','a'])),'header_lines');
  await badRequest('头字节预算',r=>r.headers.push(['X-Test','a'.repeat(limits.header_bytes)]),'header_budget');
  const duplicate=structuredClone(caseFor('controller','getCommandEvidence').request);duplicate.target+='&%6cimit=1';await rejected('解码后重复查询名',()=>prepare(duplicate),'duplicate_query');
  const normalized=structuredClone(simple);normalized.headers=normalized.headers.map(([n,v])=>[n.toLowerCase(),' \t'+v+'\t ']);check('头大小写及OWS',prepare(normalized).operation_id,'getCapacity');
  const frozen=prepare(simple);simple.headers[0][1]='changed';check('输入头更改不影响句柄',frozen.parameters.headers['x-leafseamer-contract'],selection.contract_id);
  const lengthCase=structuredClone(contextCase.request);lengthCase.headers.push(['Content-Length',String(good.length+1)]);
  await rejected('正文长度错配',()=>adapter.decodeRequest(good,prepare(lengthCase)),'content_length_mismatch');
  const empty=prepare(caseFor('seamer','getCapacity').request);
  await rejected('无正文拒多字节',()=>adapter.decodeRequest(bytes('{}'),empty),'unexpected_body');
  await rejected('共享空缓冲拒绝',()=>adapter.decodeRequest(new Uint8Array(new SharedArrayBuffer(0)),empty),'shared_buffer');
  for(const id of ['openEvents','internalOpenEvents']) {
    const c=caseFor('controller',id),r=structuredClone(c.request);
    r.headers.find(([n])=>n==='Sec-WebSocket-Protocol')[1]+=', leafseamer.ticket.'+'z'.repeat(16);
    await rejected('WS票据数量:'+id,()=>prepare(r),'ws_selection');
    const upgrade=c.responses.find(x=>x.status==='101'),wrong=structuredClone(upgrade.headers);wrong.find(([n])=>n==='Sec-WebSocket-Protocol')[1]+=', leafseamer.ticket.'+'z'.repeat(16);
    await rejected('WS不回显票据:'+id,()=>adapter.prepareResponse(prepare(c.request),'101',wrong));
  }
  const dupResponse=structuredClone(errorResponse.headers);dupResponse.push(['x-leafseamer-contract',selection.contract_id]);
  await rejected('响应重复契约头',()=>adapter.prepareResponse(eventHandle,'401',dupResponse),'duplicate_header');
  const missingDigest=errorResponse.headers.filter(([n])=>n!=='X-LeafSeamer-Contract-Digest');await rejected('已选响应不允许丢摘要',()=>adapter.prepareResponse(eventHandle,'401',missingDigest),'required_header');
  return {all_passed:true,cases_passed:checks.length,checks,operations:oracle.operations.length,responses:oracle.operations.reduce((n,o)=>n+o.responses.length,0),parameter_variants:oracle.parameter_variants.length,dynamic_codegen_blocked:process.execArgv.includes('--disallow-code-generation-from-strings')};
}
