import http from 'node:http';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHttpAdapter} from './adapter.mjs';

const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
export async function runHttp() {
  const selection=read('../event-integration/preview/selection.json'),oracle=read('./oracle.json');
  const entry=oracle.operations.find(v=>v.request.authority==='controller'&&v.request.operation_id==='openEvents');
  const goodResponse=entry.responses.find(v=>v.status==='401'),adapter=createHttpAdapter(selection),checks=[];
  const pairs=flat=>Array.from({length:flat.length/2},(_,i)=>flat.slice(i*2,i*2+2));
  let responseMode='normal',handled=0;
  const server=http.createServer(async(req,res)=>{
    handled++;const chunks=[];
    try {
      const h=adapter.prepareRequest('controller',req.method,req.url,pairs(req.rawHeaders));
      // 验收服务仅返回固定拒绝，不实现领域操作或票据消费。
      assert.equal(h.operation_id,'openEvents');
      for await(const c of req)chunks.push(c);
      await adapter.decodeRequest(Buffer.concat(chunks),h);
      const headers=structuredClone(goodResponse.headers);
      if(responseMode==='wrong_digest')headers.find(([n])=>n==='X-LeafSeamer-Contract-Digest')[1]='sha256:'+'0'.repeat(64);
      res.writeHead(401,headers.flat());res.end(JSON.stringify({code:'authentication_required',request_id:'fixture',retry_action:'do_not_retry'}));
    } catch(e) {res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({reason:e.reason??'fixture_failure'}));}
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  async function exchange(change=()=>{},body='') {
    const request=structuredClone(entry.request);change(request);
    return new Promise((resolve,reject)=>{
      const req=http.request({host:'127.0.0.1',port:server.address().port,method:request.method,path:request.target,headers:[...request.headers,['Host','127.0.0.1']].flat()},res=>{
        const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>resolve({status:String(res.statusCode),headers:pairs(res.rawHeaders),body:Buffer.concat(chunks)}));res.on('error',reject);
      });req.on('error',reject);req.end(body);
    });
  }
  function check(name,value){assert(value,name);checks.push({name,passed:true});}
  try {
    const request=adapter.prepareRequest(entry.request.authority,entry.request.method,entry.request.target,entry.request.headers);
    const result=await exchange();assert.equal(result.status,'401',result.body.toString());const response=adapter.prepareResponse(request,result.status,result.headers);
    check('原生HTTP头与正文联接',(await adapter.decodeResponse(result.body,response)).value.code==='authentication_required');
    for(const [name,change,reason] of [
      ['重复Origin',r=>r.headers.push(['origin','https://ui.invalid']),'duplicate_header'],
      ['重复票据字段',r=>r.headers.push(['sec-websocket-protocol','other']),'duplicate_header'],
      ['缺票据',r=>{r.headers=r.headers.filter(([n])=>n!=='Sec-WebSocket-Protocol');},'ws_selection'],
      ['未知查询',r=>{r.target+='?unknown=1';},'unknown_query'],
      ['重复解码查询名',r=>{r.target+='?a=1&%61=2';},'duplicate_query'],
      ['坏UTF8路径',r=>{r.target='/api/v1/%ff';},'percent_encoding'],
      ['额外契约头摘要不匹配',r=>r.headers.push(['X-LeafSeamer-Contract',selection.contract_id],['X-LeafSeamer-Contract-Digest','sha256:'+'0'.repeat(64)]),'contract_selection']
    ]) {const r=await exchange(change);check('原生HTTP拒绝:'+name,r.status==='400'&&JSON.parse(r.body).reason===reason);}
    const bodyResult=await exchange(r=>r.headers.push(['Content-Length','2']),'{}');check('原生HTTP无正文拒多字节',bodyResult.status==='400'&&JSON.parse(bodyResult.body).reason==='unexpected_body');
    responseMode='wrong_digest';const bad=await exchange();let rejected=false;try{adapter.prepareResponse(request,bad.status,bad.headers);}catch(e){rejected=e.reason==='contract_selection';}
    check('客户端拒绝实际错误摘要响应',rejected);
    check('所有场景实际到达适配器',handled===10);
    return {all_passed:true,cases_passed:checks.length,checks,loopback_http_exchanges:handled,product_runtime_tests_executed:0,authentication_tests_executed:0,device_tests_executed:0};
  } finally {server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(JSON.stringify(await runHttp()));
