import canonicalize from './vendor/canonicalize.mjs';
import {validateAutomationModel} from './automation-program.mjs';
import * as validators from './event-time/validators.mjs';
export {contractSelection} from './selection.mjs';
export class EventTimeError extends Error {constructor(code){super(code);this.name='EventTimeError';this.code=code;}}
const need=(ok,code)=>{if(!ok)throw new EventTimeError('event_time_'+code);};
const same=(a,b)=>canonicalize(a)===canonicalize(b);
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const owner=(scope,key)=>scope.authority_service_id===key.authority_service_id&&scope.database_instance_id===key.database_instance_id;
function identity(value){const {source_key:key,binding_ref:binding}=value;
 need(key.registration_id===binding.registration_id&&key.authority_service_id===binding.owner_service_id&&key.database_instance_id===binding.database_instance_id,'source_binding');
 if(binding.target.kind==='data_source')for(const name of ['source_ref','source_runtime_binding_ref','observation_binding_ref'])need(owner(binding.target[name].scope,key),'source_owner');
}
function interval(value,nonnegative=false){need(BigInt(value.lower_ns)<=BigInt(value.upper_ns)&&(!nonnegative||BigInt(value.lower_ns)>=0n),'interval');}
/** 只核验正文结构与可本地证明的关联，不证明引用当前、平台可信或可触发。 */
export function validateEventTimeModel(name,value){
 try{validateAutomationModel('Value',{kind:'literal',value});}catch{throw new EventTimeError('event_time_json');}
 need(Object.hasOwn(validators,name)&&validators[name](value),'schema');
 if(name==='SourceBinding'&&value.target.kind==='data_source'){
  const key={authority_service_id:value.owner_service_id,database_instance_id:value.database_instance_id};
  for(const name of ['source_ref','source_runtime_binding_ref','observation_binding_ref'])need(owner(value.target[name].scope,key),'source_owner');
 }
 if(name==='Origin'||name==='SourceTimeEvidence')identity(value);
 if(name==='Origin'&&value.source_time_ref)need(owner(value.source_time_ref.scope,value.source_key),'source_owner');
 if(name==='SourceTimeEvidence'){
  const domain=value.capture_domain,binding=value.binding_ref;
  need(owner(domain,value.source_key),'capture_domain');
  need(BigInt(value.capture_start_tick_ns)<=BigInt(value.capture_end_tick_ns),'capture_interval');
  if(value.utc_interval)interval(value.utc_interval);
  if(binding.delivery_semantics==='sampled')need(value.capture_semantics==='sampled_observation','capture_semantics');
 }
 if(name==='AgeEvidence'){
  need(BigInt(value.first_receive_tick_ns)<=BigInt(value.evaluated_tick_ns),'evaluation_order');
  if(value.basis!=='unproven')need(value.lower_age_ms<=value.upper_age_ms&&!Object.is(value.lower_age_ms,-0)&&!Object.is(value.upper_age_ms,-0),'age_interval');
  if(value.basis==='trusted_utc'){interval(value.first_receive_utc);interval(value.initial_age_ns,true);need(owner(value.source_time_ref.scope,value.origin_ref.source_key),'source_owner');}
  if(value.basis==='causal_capture')need(BigInt(value.challenge_sent_tick_ns)<=BigInt(value.received_tick_ns)&&BigInt(value.received_tick_ns)<=BigInt(value.evaluated_tick_ns),'capture_order');
  if(value.basis==='local_capture')need(owner(value.source_time_ref.scope,value.receiver_domain)&&owner(value.receiver_domain,value.origin_ref.source_key)&&
   BigInt(value.capture_start_tick_ns)<=BigInt(value.capture_end_tick_ns)&&BigInt(value.capture_end_tick_ns)<=BigInt(value.first_receive_tick_ns),'local_capture');
 }
}
const hash=async value=>'sha256:'+Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonicalize(value)))),v=>v.toString(16).padStart(2,'0')).join('');
/** Origin全正文参与摘要；时间原件仅排除自身digest，避免自引用循环。 */
export async function digestEventTimeModel(name,value){validateEventTimeModel(name,value);if(name==='Origin'||name==='SourceBinding')return hash(value);const {digest,...body}=value;return hash(body);}
/** 核对来源正文与所引用原件的精确身份及摘要；调用方仍须解析并核验全部资格。 */
export async function verifyEventOrigin(origin,evidence=null){
 validateEventTimeModel('Origin',origin);origin=structuredClone(origin);const ref=origin.source_time_ref;
 if(ref===null){need(evidence===null,'unexpected_evidence');return freeze({origin,source_time_evidence:null});}
 need(evidence!==null,'missing_evidence');validateEventTimeModel('SourceTimeEvidence',evidence);evidence=structuredClone(evidence);
 need(ref.object_id===evidence.id&&ref.revision===evidence.revision&&ref.digest===evidence.digest&&
  evidence.digest===await digestEventTimeModel('SourceTimeEvidence',evidence),'evidence_digest');
 need(same(origin.source_key,evidence.source_key)&&same(origin.binding_ref,evidence.binding_ref)&&origin.event_id===evidence.event_id&&
  origin.source_sequence===evidence.source_sequence&&evidence.payload_digest===await hash(origin.payload),'evidence_binding');
 return freeze({origin,source_time_evidence:evidence});
}
