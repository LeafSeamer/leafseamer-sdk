import http from 'node:http';
import assert from 'node:assert/strict';
import {createClient} from './client.mjs';

export async function runHttp(selection) {
  const received=[],failures=[];
  const error={request_id:'request',service_id:'service',service_boot_id:'boot',protocol_version:selection.contract_id,selection,
    error:{code:'AUTH_REQUIRED',message_key:'auth_required',request_id:'request',details:{},existing_command_id:null,retry_advice:'do_not_retry',existing_operation_id:null}};
  const server=http.createServer(async(req,res)=>{
    try {
      const chunks=[];for await(const chunk of req)chunks.push(chunk);
      received.push({method:req.method,target:req.url,headers:req.headers,body:Buffer.concat(chunks).toString('utf8')});
      if(req.url==='/.well-known/leafseamer-contracts'){res.writeHead(429);res.end();}
      else {res.writeHead(401,{'X-LeafSeamer-Contract':selection.contract_id,'X-LeafSeamer-Contract-Digest':selection.contract_digest,'Content-Type':'application/json'});res.end(JSON.stringify(error));}
    }catch(e){failures.push(e.message);res.destroy();}
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  try {
    const port=server.address().port;
    const transport=r=>new Promise((resolve,reject)=>{
      const req=http.request({hostname:'127.0.0.1',port,path:r.target,method:r.method,headers:[...r.headers,['Host','127.0.0.1:'+port]].flat(),signal:r.signal,agent:false},res=>{
        const chunks=[];res.on('data',b=>chunks.push(b));res.on('error',reject);
        res.on('end',()=>resolve({status:String(res.statusCode),headers:Array.from({length:res.rawHeaders.length/2},(_,i)=>res.rawHeaders.slice(i*2,i*2+2)),body:Buffer.concat(chunks)}));
      });req.on('error',reject);req.end(r.body);
    });
    const client=createClient('controller',selection,transport);
    const discovery=await client.call('discoverContracts');assert.equal(discovery.status,'429');assert.equal(discovery.body,null);
    const body={audience:'controller',operations:['read'],ttl_ms:1000,max_unique_requests:1,selection};
    const denied=await client.call('createRequestContext',{body});assert.equal(denied.status,'401');assert.deepEqual(denied.body,error);
    assert.deepEqual(received.map(r=>[r.method,r.target]),[['GET','/.well-known/leafseamer-contracts'],['POST','/api/v1/request-contexts']]);
    assert.deepEqual(JSON.parse(received[1].body),body);assert.equal(received[1].headers['x-leafseamer-contract-digest'],selection.contract_digest);
    assert.deepEqual(failures,[]);return {all_passed:true,loopback_http_exchanges:received.length,production_authentication_executed:false};
  }finally {server.closeAllConnections();await new Promise(r=>server.close(r));}
}
