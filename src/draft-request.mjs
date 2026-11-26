import canonicalize from './vendor/canonicalize.mjs';
import {createHttpAdapter} from './runtime/panel-http/adapter.mjs';
import {contractSelection} from './selection.mjs';
const need=value=>{if(!value)throw new Error('draft_request_binding');};
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
// 生成原请求摘要和非秘密查原身份，不发送请求或授予写入资格。
export async function prepareDraftChange(input){
 need(input&&Object.keys(input).sort().join(',')==='body,context,definition_id,operation,scope');
 const {operation,definition_id,scope,context,body}=structuredClone(input);
 need(['createDefinition','updateDraft','updateDefinitionMetadata','publishDefinition','createRun'].includes(operation)&&
  (operation==='createDefinition'?definition_id===null:typeof definition_id==='string'));
 need(scope&&Object.keys(scope).sort().join(',')==='authority_service_id,database_instance_id');
 need(context?.context_id===body?.context?.context_id&&context.service_id===scope.authority_service_id&&context.audience===scope.authority_service_id&&
  context.operations.includes(operation)&&canonicalize(context.selection)===canonicalize(contractSelection));
 const adapter=createHttpAdapter(contractSelection),route=adapter.describe('seamer',operation),encoder=new TextEncoder();
 const handle=adapter.prepareRequest('seamer',route.method,route.path.replace('{definition_id}',encodeURIComponent(definition_id)),[
  ['Content-Type','application/json'],['X-LeafSeamer-Contract',contractSelection.contract_id],['X-LeafSeamer-Contract-Digest',contractSelection.contract_digest]]);
 const bytes=encoder.encode(JSON.stringify(body));need(bytes.length<=8388608);
 const request=(await adapter.decodeRequest(bytes,handle)).value;
 if(operation==='createRun')need(request.definition_id===definition_id);
 const semantic=Object.fromEntries(Object.entries(request).filter(([key])=>key!=='context'&&!(operation==='createRun'&&key==='definition_id')));
 const digest=await crypto.subtle.digest('SHA-256',encoder.encode(canonicalize({version:'automation-lifecycle/0.1.0-draft.1',operation_id:operation,definition_id,request:semantic})));
 return freeze({operation,definition_id,body:request,lookup:{...request.context,operation_id:operation},
  request_digest:'sha256:'+Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')});
}
