import {createHttpAdapter} from '../http-envelope/adapter.mjs';

const automatic=new Set(['x-leafseamer-contract','x-leafseamer-contract-digest']);
const fail=reason=>{throw new Error(reason);};
const require=(value,reason)=>{if(!value)fail(reason);};
const aborted=Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get;
const isAborted=s=>s!==undefined&&aborted.call(s);
export class ClientError extends Error {
  constructor(state,reason) {super(reason);this.name='ClientError';this.state=state;this.reason=reason;}
}

// 在首个await之前复制数据；拒绝隐式toJSON、getter、稀疏数组及JSON丢失值。
function snapshot(input) {
  const active=new Set();let nodes=0,characters=0;
  function copy(v,depth) {
    require(++nodes<=131072&&depth<=64,'input_budget');
    if(typeof v==='string') {characters+=v.length;require(characters<=8388608,'input_budget');return v;}
    if(v===null||typeof v==='boolean')return v;
    if(typeof v==='number'){require(Number.isFinite(v),'nonfinite_number');return v;}
    require(v&&typeof v==='object','non_json_value');
    require(!active.has(v),'cyclic_input');active.add(v);
    const array=Array.isArray(v),prototype=Object.getPrototypeOf(v);
    require(array?prototype===Array.prototype:prototype===Object.prototype||prototype===null,'object_prototype');
    const keys=Reflect.ownKeys(v),out=array?[]:Object.create(null);
    require(keys.length<=131072,'input_budget');
    if(array)require(keys.length===v.length+1,'sparse_or_extended_array');
    for(const k of keys) {
      if(array&&k==='length')continue;
      require(typeof k==='string','symbol_key');
      if(array)require(/^(0|[1-9][0-9]*)$/.test(k)&&Number(k)<v.length,'array_key');
      const d=Object.getOwnPropertyDescriptor(v,k);
      require(d.enumerable&&Object.hasOwn(d,'value'),'non_data_property');
      characters+=k.length;require(characters<=8388608,'input_budget');
      Object.defineProperty(out,k,{value:copy(d.value,depth+1),enumerable:true,writable:true,configurable:true});
    }
    active.delete(v);return out;
  }
  return copy(input,0);
}
function object(v) {require(v!==null&&typeof v==='object'&&!Array.isArray(v),'object_required');return v;}
function scalar(v,numeric) {
  require(numeric?typeof v==='number'&&Number.isSafeInteger(v):typeof v==='string','parameter_type');return String(v);
}
function raceSignal(promise,signal) {
  if(signal===undefined)return promise;
  return new Promise((resolve,reject)=>{
    const abort=()=>reject(new Error('cancelled'));
    signal.addEventListener('abort',abort,{once:true});
    // 同时挂接成功/失败处理器，取消后的传输结束也不会产生未处理拒绝。
    promise.then(resolve,reject).finally(()=>signal.removeEventListener('abort',abort));
    if(isAborted(signal)){signal.removeEventListener('abort',abort);abort();}
  });
}
export function createClient(authority,selection,transport) {
  require(authority==='controller'||authority==='seamer','authority');require(typeof transport==='function','transport');
  const installed=snapshot(selection),adapter=createHttpAdapter(installed);
  async function call(operationId,input={},options={}) {
    let state='not_sent';
    try {
      require(typeof operationId==='string','operation_id');
      require(options&&Object.keys(options).every(k=>k==='signal'),'call_options');
      const signal=options.signal;if(signal!==undefined)isAborted(signal);
      require(!isAborted(signal),'cancelled');
      const data=object(snapshot(input)),op=adapter.describe(authority,operationId);
      require(op.transport!=='websocket-subprotocol','websocket_transport_required');
      require(Object.keys(data).every(k=>['path','query','headers','body'].includes(k)),'unknown_input');
      const groups={path:object(Object.hasOwn(data,'path')?data.path:{}),query:object(Object.hasOwn(data,'query')?data.query:{}),header:object(Object.hasOwn(data,'headers')?data.headers:{})};
      const headers=[],pathValues=new Map(),query=[];
      for(const [location,values] of Object.entries(groups)) {
        const seen=new Set();
        for(const [original,v] of Object.entries(values)) {
          const name=location==='header'?original.toLowerCase():original;
          require(!seen.has(name),'duplicate_parameter');seen.add(name);
          require(!(location==='header'&&automatic.has(name)),'automatic_header');
          const p=op.parameters.find(p=>p.location===location&&p.name===name);require(p,'unknown_parameter');
          const text=scalar(v,p.numeric);
          if(location==='path')pathValues.set(name,encodeURIComponent(text));
          else if(location==='query')query.push(encodeURIComponent(name)+'='+encodeURIComponent(text));
          else headers.push([name,text]);
        }
      }
      const target=op.path.replace(/\{([^}]+)\}/g,(_,name)=>{require(pathValues.has(name),'required_path');return pathValues.get(name);})+(query.length?'?'+query.join('&'):'');
      if(op.transport==='http-headers')headers.push(['X-LeafSeamer-Contract',installed.contract_id],['X-LeafSeamer-Contract-Digest',installed.contract_digest]);
      require(op.body==='json'?Object.hasOwn(data,'body'):!Object.hasOwn(data,'body'),'request_body');
      const body=op.body==='json'?new TextEncoder().encode(JSON.stringify(data.body)):new Uint8Array();
      if(op.body==='json')headers.push(['Content-Type','application/json']);
      headers.push(['Content-Length',String(body.byteLength)]);
      const request=adapter.prepareRequest(authority,op.method,target,headers);
      require(request.operation_id===operationId,'route_collision');
      await adapter.decodeRequest(body,request);
      require(!isAborted(signal),'cancelled');
      const outbound=Object.freeze({authority,method:op.method,target,headers:Object.freeze(headers.map(p=>Object.freeze(p))),body,signal});
      state='outcome_unknown';
      const response=await raceSignal(Promise.resolve(transport(outbound)),signal);
      require(!isAborted(signal),'cancelled');state='response_rejected';
      const handle=adapter.prepareResponse(request,response.status,response.headers);
      const decoded=await adapter.decodeResponse(response.body,handle);
      // 收到响应后取消也不能推导服务端未执行。
      if(isAborted(signal)){state='outcome_unknown';fail('cancelled');}
      return Object.freeze({status:handle.status,body:decoded===null?null:decoded.value,headers:handle.headers,authorization_granted:false});
    } catch(error) {
      // 不把传输抛出的凭据、URL、原始响应内容拼入公共异常。
      throw new ClientError(state,state==='outcome_unknown'?'transport_or_cancellation':state==='response_rejected'?'invalid_response':'invalid_request_or_cancellation');
    }
  }
  return Object.freeze({authority,call});
}
