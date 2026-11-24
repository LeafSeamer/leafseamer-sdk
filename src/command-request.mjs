import canonicalize from './vendor/canonicalize.mjs';
import {createHttpAdapter} from './runtime/panel-http/adapter.mjs';
import {contractSelection} from './selection.mjs';

const need=ok=>{if(!ok)throw new Error('command_request_binding');};
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};

// 生成查原身份供客户端在发送前保存。上下文和幂等键保留在线路正文中。
export async function prepareManualCommand(input){
  const {scope,context,body}=structuredClone(input);
  need(context&&body&&scope&&context.context_id===body.context_id&&context.service_id===scope.authority_service_id&&
    context.audience===scope.authority_service_id&&context.operations.includes('submitCommand')&&
    canonicalize(context.selection)===canonicalize(contractSelection)&&body.origin==='manual'&&body.automation_binding===null);
  const adapter=createHttpAdapter(contractSelection),encoder=new TextEncoder();
  async function validate(operation,value){
    const route=adapter.describe('controller',operation),bytes=encoder.encode(JSON.stringify(value));
    need(bytes.byteLength<=16384);
    const handle=adapter.prepareRequest('controller',route.method,route.path,[['Content-Type','application/json'],
      ['X-LeafSeamer-Contract',contractSelection.contract_id],['X-LeafSeamer-Contract-Digest',contractSelection.contract_digest]]);
    return (await adapter.decodeRequest(bytes,handle)).value;
  }
  const request=await validate('submitCommand',body),{context_id,idempotency_key,correlation_id,...content}=request;
  const bytes=await crypto.subtle.digest('SHA-256',encoder.encode(canonicalize(content)));
  const identity=await validate('lookupCommandAdmission',{key:{target_scope:scope,issuer_id:context.issuer_id,issuer_epoch:context.issuer_epoch,
    principal_id:context.principal_id,request_epoch:context.context_epoch,operation_id:'createCommand',idempotency_key},
    request_digest:'sha256:'+Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('')});
  return freeze({body:request,identity});
}
