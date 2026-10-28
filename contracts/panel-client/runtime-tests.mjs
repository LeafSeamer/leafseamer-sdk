import assert from 'node:assert/strict';
import {createClient,ClientError} from './client.mjs';

export async function run(oracle,inventory,selection) {
  const checks=[],bytes=v=>new TextEncoder().encode(JSON.stringify(v));
  const check=(name,got,want=true)=>{assert.deepEqual(got,want,name);checks.push(name);};
  const reject=async(name,fn,state)=>{await assert.rejects(fn,e=>e instanceof ClientError&&e.state===state,name);checks.push(name);};
  const empty=()=>({status:'429',headers:[],body:new Uint8Array()});
  let sent=0;
  const sink=createClient('controller',selection,()=>{sent++;return empty();});
  for(const op of inventory.operations) {
    const fixture=oracle.operations.find(c=>c.request.authority===op.authority&&c.request.operation_id===op.operation_id);
    const parts=fixture.request.target.split('?'),actual=parts[0].split('/'),template=op.path.split('/'),input={};
    for(const p of op.parameters.filter(p=>p.location!=='header'||!p.name.startsWith('x-leafseamer-contract'))) {
      let value;
      if(p.location==='path')value=decodeURIComponent(actual[template.indexOf('{'+p.name+'}')]);
      else if(p.location==='query')value=new URLSearchParams(parts[1]).get(p.name)??undefined;
      else value=fixture.request.headers.find(([n])=>n.toLowerCase()===p.name)?.[1];
      if(value!==undefined)(input[p.location==='header'?'headers':p.location]??={})[p.name]=p.numeric?Number(value):value;
    }
    let calls=0,captured;
    const client=createClient(op.authority,selection,r=>{calls++;captured=r;throw new Error('synthetic');});
    if(op.transport==='websocket-subprotocol'||op.body==='json') {
      await reject('禁止缺失正文或普通HTTP升级:'+op.authority+':'+op.operation_id,()=>client.call(op.operation_id,input),'not_sent');
      check('无发送:'+op.authority+':'+op.operation_id,calls,0);continue;
    }
    await reject('完整无正文路由:'+op.authority+':'+op.operation_id,()=>client.call(op.operation_id,input),'outcome_unknown');
    check('单次分派:'+op.authority+':'+op.operation_id,calls,1);
    check('路由身份:'+op.authority+':'+op.operation_id,[captured.authority,captured.method,captured.target],[op.authority,op.method,fixture.request.target]);
    check('请求头冻结:'+op.operation_id,Object.isFrozen(captured.headers)&&captured.headers.every(Object.isFrozen));
    for(const p of op.parameters.filter(p=>p.required&&p.location==='path')) {
      const bad=structuredClone(input);delete bad.path[p.name];
      await reject('必填路径:'+op.authority+':'+op.operation_id+':'+p.name,()=>client.call(op.operation_id,bad),'not_sent');
      check('拒绝后不再发送:'+op.operation_id,calls,1);
    }
  }
  const result=await sink.call('discoverContracts');check('空错误状态返回',[result.status,result.body,result.authorization_granted],['429',null,false]);
  check('结果不可写',Object.isFrozen(result)&&Object.isFrozen(result.headers));check('合法调用一次',sent,1);
  const badInputs=[{path:null},{query:null},{headers:null},{body:null},{unknown:1},{query:{other:'1'}},{headers:{Authorization:'secret'}},{headers:{'X-LeafSeamer-Contract':selection.contract_id}},[],new Date()];
  const getter={};Object.defineProperty(getter,'query',{enumerable:true,get(){throw new Error('getter executed');}});badInputs.push(getter);
  const circular={};circular.body=circular;badInputs.push(circular,{body:NaN},{body:Infinity},{body:1n},{body:undefined},{body:()=>1},{body:Symbol('x')},{body:new Array(2)},{body:{toJSON(){return {};}}});
  for(const [i,value] of badInputs.entries())await reject('非法输入:'+i,()=>sink.call('discoverContracts',value),'not_sent');
  check('所有非法输入零追加发送',sent,1);
  await reject('未知操作',()=>sink.call('missing'),'not_sent');
  const before=new AbortController();before.abort();await reject('发送前取消',()=>sink.call('discoverContracts',{}, {signal:before.signal}),'not_sent');check('取消前零发送',sent,1);
  await reject('伪造signal',()=>sink.call('discoverContracts',{}, {signal:{aborted:false}}),'not_sent');
  await reject('未知选项',()=>sink.call('discoverContracts',{}, {retry:3}),'not_sent');
  for(const failure of [()=>{throw new Error('secret transport text');},()=>Promise.reject(new Error('secret')),()=>{throw new ClientError('not_sent','spoof');}]) {
    let n=0;const c=createClient('controller',selection,()=>{n++;return failure();});
    try{await c.call('discoverContracts');assert.fail('must reject');}catch(e){check('传输错误状态与脱敏',[e.state,e.message],['outcome_unknown','transport_or_cancellation']);}check('传输错误无重试',n,1);
  }
  const after=new AbortController();let finish,notify;const started=new Promise(r=>{notify=r;});let n=0;
  const pending=createClient('controller',selection,()=>{n++;notify();return new Promise((_,r)=>{finish=r;});}).call('discoverContracts',{}, {signal:after.signal});
  await started;after.abort();await reject('发送后取消立即返回',()=>pending,'outcome_unknown');finish(new Error('late failure'));await new Promise(r=>setTimeout(r,0));check('取消无重试',n,1);
  const context={audience:'controller',operations:['read'],ttl_ms:1000,max_unique_requests:1,selection};
  const error={request_id:'request',service_id:'service',service_boot_id:'boot',protocol_version:selection.contract_id,selection,
    error:{code:'AUTH_REQUIRED',message_key:'auth_required',request_id:'request',details:{},existing_command_id:null,retry_advice:'do_not_retry',existing_operation_id:null}};
  const errorHeaders=[['X-LeafSeamer-Contract',selection.contract_id],['X-LeafSeamer-Contract-Digest',selection.contract_digest],['Content-Type','application/json']];
  const goodResponse=()=>({status:'401',headers:structuredClone(errorHeaders),body:bytes(error)});
  let outbound,writes=0;
  const writer=createClient('controller',selection,r=>{outbound=r;writes++;return goodResponse();});
  const body=structuredClone(context),waiting=writer.call('createRequestContext',{body});body.ttl_ms=0;
  const denied=await waiting;check('发送前快照',JSON.parse(new TextDecoder().decode(outbound.body)),context);
  check('实际写请求发送次数',writes,1);check('声明错误按状态返回',[denied.status,denied.body],['401',error]);check('JSON响应冻结',Object.isFrozen(denied.body));
  const badContext=structuredClone(context);badContext.ttl_ms=-1;
  await reject('请求Schema失败',()=>writer.call('createRequestContext',{body:badContext}),'not_sent');check('Schema失败不发送',writes,1);
  for(const mutate of [r=>{r.status='599';},r=>{r.status=401;},r=>{r.headers=[];},r=>{r.headers.push(['x-leafseamer-contract',selection.contract_id]);},r=>{r.body=bytes({...error,code:'forbidden'});},r=>{r.body=new TextEncoder().encode('{');},r=>{r.body=new Uint8Array(new SharedArrayBuffer(0));}]) {
    let count=0;const c=createClient('controller',selection,()=>{count++;const r=goodResponse();mutate(r);return r;});
    await reject('响应拒绝',()=>c.call('getCapacity'),'response_rejected');check('响应拒绝无重试',count,1);
  }
  for(const value of ['..','a/b','a%2Fb','a\\b'])await reject('路径混淆:'+value,()=>writer.call('getCommand',{path:{command_id:value}}),'not_sent');
  let encoded;
  const encodeClient=createClient('controller',selection,r=>{encoded=r.target;throw new Error('stop');});
  await reject('计数器保持字符串',()=>encodeClient.call('getCommandRevision',{path:{command_id:'command',revision:'9007199254740993'}}),'outcome_unknown');
  check('十进制精度',encoded,'/api/v1/commands/command/revisions/9007199254740993');
  await reject('计数器拒绝Number',()=>encodeClient.call('getCommandRevision',{path:{command_id:'command',revision:9007199254740992}}),'not_sent');
  return {all_passed:true,cases_passed:checks.length,checks,dynamic_codegen_blocked:process.execArgv.includes('--disallow-code-generation-from-strings')};
}
