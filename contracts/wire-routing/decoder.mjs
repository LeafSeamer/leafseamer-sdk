import {routes} from './preview/routes.mjs';
import {getSchema,decodeWire,WireError,profile,defaultProfile} from './preview/wire.mjs';
export {WireError,profile,defaultProfile};
const fail=reason=>{throw new WireError('binding',reason);};
const key=(...parts)=>JSON.stringify(parts);
const operations=new Map(routes.operations.map(op=>[key(op.authority,op.operation_id),op]));
const messages=new Map(routes.messages.map(m=>[key(m.direction,m.type),m]));
const typed=Object.getPrototypeOf(Uint8Array.prototype),length=Object.getOwnPropertyDescriptor(typed,'byteLength').get,buffer=Object.getOwnPropertyDescriptor(typed,'buffer').get;
export function createDecoder(selection) {
  if(!selection||Object.keys(selection).sort().join()!=='contract_digest,contract_id'||
     selection.contract_id!==routes.selection.contract_id||selection.contract_digest!==routes.selection.contract_digest)fail('contract_selection');
  const handles=new WeakMap();
  function bind(root,info) {const handle=Object.freeze({...info,body:root===null?'none':'json'});handles.set(handle,root===null?null:getSchema(root));return handle;}
  function operation(authority,id) {if(typeof authority!=='string'||typeof id!=='string')fail('unknown_operation');const op=operations.get(key(authority,id));if(!op)fail('unknown_operation');return op;}
  function http(authority,id,phase,status) {
    const op=operation(authority,id);let root;
    if(phase==='request'&&status===undefined)root=op.request;
    else if(phase==='response'&&typeof status==='string'&&Object.hasOwn(op.responses,status))root=op.responses[status];
    else fail('unknown_http_binding');
    return bind(root,{transport:'http',authority,operation_id:id,phase,...(status===undefined?{}:{status})});
  }
  function websocket(authority,id,direction) {
    const op=operation(authority,id);if(typeof direction!=='string'||!Object.hasOwn(op.ws,direction))fail('unknown_ws_binding');
    return bind(op.ws[direction],{transport:'ws',authority,operation_id:id,direction});
  }
  function worker(version,direction,type) {
    if(version!==routes.ipc_version)fail('ipc_version');
    if(typeof direction!=='string'||typeof type!=='string')fail('unknown_worker_binding');
    const message=messages.get(key(direction,type));if(!message)fail('unknown_worker_binding');
    return bind(message.root,{transport:'worker',direction,type});
  }
  async function decode(input,handle,{contentType,...options}={}) {
    if(!handles.has(handle))fail('foreign_handle');const schema=handles.get(handle);if(schema===null)fail('body_not_declared');
    if(handle.transport==='http'?contentType!=='application/json':contentType!==undefined)fail('content_type');
    return decodeWire(input,schema,options);
  }
  function assertEmpty(input,handle) {
    if(!handles.has(handle))fail('foreign_handle');if(handles.get(handle)!==null)fail('body_required');
    if(!ArrayBuffer.isView(input)||!(input instanceof Uint8Array))fail('byte_view_required');
    const backing=buffer.call(input);let shared=false;
    if(typeof SharedArrayBuffer!=='undefined')try{Object.getOwnPropertyDescriptor(SharedArrayBuffer.prototype,'byteLength').get.call(backing);shared=true;}catch{}
    if(shared)fail('shared_buffer');if(length.call(input)!==0)fail('unexpected_body');return true;
  }
  return Object.freeze({http,websocket,worker,decode,assertEmpty});
}
