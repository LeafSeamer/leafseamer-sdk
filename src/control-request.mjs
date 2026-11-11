import canonicalize from './vendor/canonicalize.mjs';
import {createHttpAdapter} from './runtime/panel-http/adapter.mjs';
import {contractSelection} from './selection.mjs';

const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const need=value=>{if(!value)throw new Error('control_request_binding');};
// 构造已验证的请求和查原身份；本函数不发送请求，也不签发任何控制资格。
export async function prepareControlChange(input){
 need(input&&Object.keys(input).sort().join(',')==='body,context,device_id,operation,scope');
 const {operation,device_id,scope,context,body}=structuredClone(input);
 need(['acquireControl','releaseControl'].includes(operation)&&typeof device_id==='string');
 need(scope&&Object.keys(scope).sort().join(',')==='authority_service_id,database_instance_id');
 need(context?.context_id===body?.context_id&&context.service_id===scope.authority_service_id&&context.audience===scope.authority_service_id&&
  context.operations.includes(operation)&&canonicalize(context.selection)===canonicalize(contractSelection));
 const adapter=createHttpAdapter(contractSelection),encoder=new TextEncoder();
 async function validate(method,path,value){
  const route=adapter.describe('controller',method),bytes=encoder.encode(JSON.stringify(value));need(bytes.byteLength<=16384);
  const handle=adapter.prepareRequest('controller','POST',path??route.path,[['Content-Type','application/json'],
   ['X-LeafSeamer-Contract',contractSelection.contract_id],['X-LeafSeamer-Contract-Digest',contractSelection.contract_digest]]);
  return (await adapter.decodeRequest(bytes,handle)).value;
 }
 const route=adapter.describe('controller',operation),request=await validate(operation,route.path.replace('{device_id}',encodeURIComponent(device_id)),body);
 const {context_id,idempotency_key,...normalized}=request;
 if(operation==='acquireControl')normalized.force??=false;
 const content={operation_id:operation,scope,device_id,transfer_id:null,input:normalized};
 const hash=await crypto.subtle.digest('SHA-256',encoder.encode(canonicalize(content)));
 const identity={key:{target_scope:scope,issuer_id:context.issuer_id,issuer_epoch:context.issuer_epoch,principal_id:context.principal_id,
  request_epoch:context.context_epoch,operation_id:operation,idempotency_key},request_digest:'sha256:'+Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('')};
 await validate('lookupControlRequest',null,identity);
 return freeze({operation,device_id,body:request,identity});
}
