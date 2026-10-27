import {createDecoder,WireError,profile} from '/contracts/wire-routing/decoder.mjs';
export async function run(inv,selection,workerVersion,workerExamples,samples,expected) {
  const checks=[];const check=(name,yes)=>{if(!yes)throw new Error(name);checks.push({name,passed:true});};
  const bytes=s=>new TextEncoder().encode(s),slow=profile({parse_deadline_ms:5000}),decoder=createDecoder(selection);
  async function reject(name,fn,reason) {try{await fn();}catch(e){check(name,e instanceof WireError&&e.reason===reason);return;}throw new Error(name+':未拒绝');}
  const bindings=[];
  for(const op of inv.operations) {
    bindings.push({handle:decoder.http(op.authority,op.operation_id,'request'),root:op.request});
    for(const [status,root] of Object.entries(op.responses))bindings.push({handle:decoder.http(op.authority,op.operation_id,'response',status),root});
    for(const [direction,root] of Object.entries(op.ws))bindings.push({handle:decoder.websocket(op.authority,op.operation_id,direction),root});
  }
  for(const message of inv.messages)bindings.push({handle:decoder.worker(workerVersion,message.direction,message.type),root:message.root});
  const handles=new Map();let empty=0,json=0;
  for(const [i,b] of bindings.entries()) {
    check('句柄冻结:'+i,Object.isFrozen(b.handle));
    if(b.root===null) {
      empty++;check('空正文接受:'+i,decoder.assertEmpty(new Uint8Array(),b.handle));
      await reject('无正文拒绝JSON:'+i,()=>decoder.assertEmpty(bytes('{}'),b.handle),'unexpected_body');
      await reject('无正文不调用解码:'+i,()=>decoder.decode(bytes('null'),b.handle),'body_not_declared');
      if(typeof SharedArrayBuffer!=='undefined')await reject('空正文拒共享缓冲:'+i,()=>decoder.assertEmpty(new Uint8Array(new SharedArrayBuffer(0)),b.handle),'shared_buffer');
    } else {
      json++;handles.set(b.root,b.handle);
      await reject('JSON拒空替代:'+i,()=>decoder.assertEmpty(new Uint8Array(),b.handle),'body_required');
    }
  }
  check('全部静态根可选',handles.size===Object.keys(inv.schemas).length);
  for(const [name,handle] of handles)for(const [i,raw] of expected.corpus.entries()) {
    let accepted=false;
    try {await decoder.decode(bytes(raw),handle,{profile:slow,...(handle.transport==='http'?{contentType:'application/json'}:{})});accepted=true;}
    catch(e){if(!(e instanceof WireError))throw e;}
    check('独立接受集:'+name+':'+i,accepted===expected.results[name][i]);
  }
  for(const message of inv.messages) {
    const h=decoder.worker(workerVersion,message.direction,message.type),value=workerExamples[message.type];
    check('worker正例:'+message.type,JSON.stringify((await decoder.decode(bytes(JSON.stringify(value)),h,{profile:slow})).value)===JSON.stringify(value));
    await reject('worker方向:'+message.type,()=>decoder.worker(workerVersion,message.direction==='c2w'?'w2c':'c2w',message.type),'unknown_worker_binding');
  }
  let wsPositive=0,httpPositive=0;
  for(const op of inv.operations)for(const [direction,name] of [['client','client_frame'],['server','server_frame'],['first_server','server_frame']]) {
    if(!Object.hasOwn(op.ws,direction))continue;
    for(const c of samples.filter(v=>v.name===name&&(direction!=='first_server'||v.value.type==='contract.ready'))) {
      const h=decoder.websocket(op.authority,op.operation_id,direction);
      check('WS正例:'+wsPositive++,JSON.stringify((await decoder.decode(bytes(JSON.stringify(c.value)),h,{profile:slow})).value)===JSON.stringify(c.value));
    }
  }
  // 从固定快照样本验证其所有显式HTTP响应绑定，而非仅直接调用模型根。
  for(const op of inv.operations)for(const [status,root] of Object.entries(op.responses)) {
    const ref=inv.schemas[root]?.$ref;
    const sampleName=ref==='#/$defs/snapshot__Manifest'?'snapshot_manifest':ref==='#/$defs/snapshot__PageResponse'?'snapshot_page':null;
    for(const c of samples.filter(v=>v.name===sampleName)) {
      const h=decoder.http(op.authority,op.operation_id,'response',status);
      check('HTTP快照正例:'+httpPositive++,JSON.stringify((await decoder.decode(bytes(JSON.stringify(c.value)),h,{profile:slow,contentType:'application/json'})).value)===JSON.stringify(c.value));
    }
  }
  check('HTTP快照实际覆盖',httpPositive>0);check('四个WS实际覆盖',wsPositive>=32);
  const h=decoder.http('controller','openEvents','response','401');
  const context={audience:'controller',operations:['read'],ttl_ms:1000,max_unique_requests:1,selection};
  for(const [authority,id,value] of [['controller','login',{login:'synthetic-user',password:'synthetic-fixture-not-a-credential'}],['controller','createRequestContext',context],['seamer','createRequestContext',context]]) {
    const request=decoder.http(authority,id,'request'),raw=bytes(JSON.stringify(value));
    check('HTTP请求:'+authority+id,JSON.stringify((await decoder.decode(raw,request,{profile:slow,contentType:'application/json'})).value)===JSON.stringify(value));
  }
  const contextHandle=decoder.http('controller','createRequestContext','request');
  const invalidInteger=JSON.stringify(context).replace('"max_unique_requests":1','"max_unique_requests":1.0000000000000001');
  await reject('请求原始整数不舍入',()=>decoder.decode(bytes(invalidInteger),contextHandle,{profile:slow,contentType:'application/json'}),'raw_integer');
  let cancelled=false;
  await reject('路由解码传播取消',()=>decoder.decode(bytes(' '.repeat(40)+JSON.stringify(context)),contextHandle,
    {contentType:'application/json',profile:profile({slice_units:8,parse_deadline_ms:5000}),cancelled:()=>cancelled,yieldNow:async()=>{cancelled=true;}}),'cancelled');
  const good={code:'authentication_required',request_id:'request',retry_action:'do_not_retry'};
  check('HTTP错误正例',(await decoder.decode(bytes(JSON.stringify(good)),h,{contentType:'application/json',profile:slow})).value.code===good.code);
  await reject('HTTP错状态正文',()=>decoder.decode(bytes(JSON.stringify({...good,code:'forbidden'})),h,{contentType:'application/json',profile:slow}),'schema_rejected');
  for(const contentType of [undefined,'text/plain','application/json; charset=utf-8'])await reject('媒体类型精确:'+contentType,()=>decoder.decode(bytes('{}'),h,{contentType}),'content_type');
  await reject('伪造句柄',()=>decoder.decode(bytes('{}'),{...h},{contentType:'application/json'}),'foreign_handle');
  await reject('另一解码实例句柄',()=>createDecoder(selection).decode(bytes('{}'),h,{contentType:'application/json'}),'foreign_handle');
  await reject('原型操作',()=>decoder.http('controller','__proto__','request'),'unknown_operation');
  await reject('错服务',()=>decoder.http('other','openEvents','request'),'unknown_operation');
  await reject('Controller登录不隐式复制到Seamer',()=>decoder.http('seamer','login','request'),'unknown_operation');
  await reject('数值状态不隐式转换',()=>decoder.http('controller','openEvents','response',401),'unknown_http_binding');
  await reject('未知状态',()=>decoder.http('controller','openEvents','response','599'),'unknown_http_binding');
  await reject('请求夹带响应状态',()=>decoder.http('controller','openEvents','request','200'),'unknown_http_binding');
  await reject('非WS入口',()=>decoder.websocket('controller','submitCommand','server'),'unknown_ws_binding');
  await reject('错IPC版本',()=>decoder.worker('old','c2w',inv.messages[0].type),'ipc_version');
  await reject('未知worker',()=>decoder.worker(workerVersion,'c2w','UNKNOWN'),'unknown_worker_binding');
  const workerHandle=decoder.worker(workerVersion,'c2w','AUTH_FENCE');
  await reject('消息类型正文不可错配',()=>decoder.decode(bytes(JSON.stringify({...workerExamples.AUTH_FENCE,type:'UNKNOWN'})),workerHandle,{profile:slow}),'schema_rejected');
  await reject('旧选择',()=>createDecoder({...selection,contract_id:'leafseamer.api.v1.integration1'}),'contract_selection');
  await reject('同ID错摘要',()=>createDecoder({...selection,contract_digest:'sha256:'+'0'.repeat(64)}),'contract_selection');
  await reject('选择额外字段',()=>createDecoder({...selection,extra:true}),'contract_selection');
  const server=decoder.websocket('controller','openEvents','server'),first=decoder.websocket('controller','openEvents','first_server');
  const nonReady=samples.find(c=>c.name==='server_frame'&&c.value.type!=='contract.ready');
  await decoder.decode(bytes(JSON.stringify(nonReady.value)),server,{profile:slow});
  await reject('首帧不能用普通帧',()=>decoder.decode(bytes(JSON.stringify(nonReady.value)),first,{profile:slow}),'schema_rejected');
  await reject('WS不接HTTP媒体参数',()=>decoder.decode(bytes('{}'),server,{contentType:'application/json'}),'content_type');
  return {all_passed:true,cases_passed:checks.length,checks,operations:inv.operations.length,worker_messages:inv.messages.length,
    roots:handles.size,json_bindings:json,empty_bindings:empty,ws_positive_messages:wsPositive,http_snapshot_positive_messages:httpPositive,worker_positive_messages:inv.messages.length};
}
