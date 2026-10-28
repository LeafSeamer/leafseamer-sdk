import fs from 'node:fs';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createClient,ClientError} from './client.mjs';
import {createHttpAdapter} from '../panel-http/adapter.mjs';

/** 合成服务仅验证已绑定请求与回执；不执行发布、权限授予或产品业务。 */
export async function runPanelHttp(selection) {
  const cases=JSON.parse(fs.readFileSync(new URL('../panel-http/panel-cases.json',import.meta.url),'utf8')).cases;
  const adapter=createHttpAdapter(selection),checks=[],failures=[];
  const check=(name,value,expected=true)=>{assert.deepEqual(value,expected,name);checks.push({name,passed:true});};
  let expected=null,mode=null,received=0,sent=0;
  const server=http.createServer(async(req,res)=>{
    try {
      received++;
      assert(expected);
      const chunks=[];for await(const chunk of req)chunks.push(chunk);
      const headers=Array.from({length:req.rawHeaders.length/2},(_,i)=>req.rawHeaders.slice(i*2,i*2+2));
      const handle=adapter.prepareRequest(expected.authority,req.method,req.url,headers);
      const decoded=await adapter.decodeRequest(Buffer.concat(chunks),handle);
      assert.equal(handle.operation_id,'invokePanelMethod');
      assert.deepEqual(decoded.value,expected.request);
      assert.equal(handle.authorization_granted,false);
      const raw=Buffer.from(JSON.stringify(expected[mode]));
      res.writeHead(200,{'Cache-Control':'no-store','Content-Type':'application/json','Content-Length':String(raw.length),
        'X-LeafSeamer-Contract':selection.contract_id,'X-LeafSeamer-Contract-Digest':selection.contract_digest});
      res.end(raw);
    }catch(error){failures.push(error.message);res.destroy();}
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  try {
    const port=server.address().port;
    const transport=r=>new Promise((resolve,reject)=>{
      sent++;
      const req=http.request({hostname:'127.0.0.1',port,path:r.target,method:r.method,
        headers:[...r.headers,['Host','127.0.0.1:'+port]].flat(),signal:r.signal,agent:false},res=>{
        const chunks=[];res.on('data',b=>chunks.push(b));res.on('error',reject);
        res.on('end',()=>resolve({status:String(res.statusCode),body:Buffer.concat(chunks),
          headers:Array.from({length:res.rawHeaders.length/2},(_,i)=>res.rawHeaders.slice(i*2,i*2+2))}));
      });req.on('error',reject);req.end(r.body);
    });
    const clients=Object.fromEntries(['controller','seamer'].map(a=>[a,createClient(a,selection,transport)]));
    for(const item of cases) {
      expected=item;
      const client=clients[item.authority],path={session_id:item.request.intent.identity.panel_session_id},headers={Origin:'https://panel.invalid'};
      for(const kind of ['response','unavailable']) {
        mode=kind;const before=sent;
        const result=await client.call('invokePanelMethod',{path,headers,body:item.request});
        check(kind+':'+item.method,[result.status,result.body,result.authorization_granted,sent-before],['200',item[kind],false,1]);
      }
      let before=sent;
      await assert.rejects(client.call('invokePanelMethod',{path,headers,body:item.old_input}),e=>e instanceof ClientError&&e.state==='not_sent');
      check('旧输入发送前拒绝:'+item.method,sent,before);
      mode='old_result';before=sent;
      await assert.rejects(client.call('invokePanelMethod',{path,headers,body:item.request}),e=>e instanceof ClientError&&e.state==='response_rejected');
      check('旧结果拒绝且只发送一次:'+item.method,sent-before,1);
    }
    check('服务器全部验证',failures,[]);check('收发一致',received,sent);check('完整收发次数',received,105);
    return {all_passed:true,cases_passed:checks.length,checks,methods:cases.length,loopback_http_exchanges:received,
      synthetic_service:true,production_authorization_executed:false,product_business_executed:false};
  }finally {server.closeAllConnections();await new Promise(r=>server.close(r));}
}
