import {createDecoder,WireError,profile} from './runtime/panel-wire/decoder.mjs';
import {routes} from './runtime/panel-wire/preview/routes.mjs';
import {contractSelection} from './selection.mjs';
import {capabilities} from './execution-capabilities.mjs';

// 执行IPC与只读模块通道独立；复用产品选择的完整消息接受集，不另造帧格式。
export const deviceExecutionVersion=routes.ipc_version;
export const deviceExecutionMessages=Object.freeze(routes.messages.map(({type,direction,reply_to_types})=>
 Object.freeze({type,direction,reply_to_types:Object.freeze([...reply_to_types])})));
const budget=profile({max_message_bytes:262144,max_depth:48,max_value_nodes:65536,max_object_members:4096,
 max_key_utf8_bytes:256,max_string_utf8_bytes:131072,parse_deadline_ms:2000});
const yieldNow=()=>new Promise(resolve=>{if(typeof setImmediate==='function')setImmediate(resolve);else setTimeout(resolve,0);});
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
export const deviceExecutionCapabilities=freeze(capabilities);
const requireFeatures=(selected,required)=>{for(const feature of required)if(!selected.has(feature))throw new WireError('binding','execution_feature_missing:'+feature);};
export function validateDeviceExecutionFeatures(features){
 if(!Array.isArray(features)||features.length>capabilities.known.length||new Set(features).size!==features.length||
  features.some(feature=>!capabilities.known.includes(feature)))throw new WireError('binding','execution_features');
 const selected=new Set(features);requireFeatures(selected,capabilities.base);
 for(const feature of features)requireFeatures(selected,capabilities.dependencies[feature]??[]);
 return Object.freeze([...features]);
}
export function selectDeviceExecutionFeatures(offered,implemented){
 const remote=new Set(validateDeviceExecutionFeatures(offered)),local=validateDeviceExecutionFeatures(implemented);
 return validateDeviceExecutionFeatures(local.filter(feature=>remote.has(feature)));
}
export function assertDeviceExecutionFeatures(frame,features){
 const selected=new Set(validateDeviceExecutionFeatures(features)),required=capabilities.messages[frame.type];
 if(!required)throw new WireError('binding','unknown_worker_binding');
 const body=frame.body;
 const absent=(frame.type==='OPEN_GATE'&&body?.reference_time_snapshot===null)||(frame.type==='OPEN_GATE_ACK'&&body?.reference_time_snapshot_ref===null);
 if(absent){
  requireFeatures(selected,capabilities.without_reference);
  if(capabilities.reference.some(feature=>selected.has(feature)))throw new WireError('binding','execution_reference_snapshot_required');
 }
 const empty=value=>Array.isArray(value)&&value.length===0;
 // 独立的初始关闭屏障只覆盖零签发、空账本及首个尝试；不能借此OPEN或处理非空切点。
 const initial=body?.issued_cut_revision==='0'&&body.attempt_binding?.attempt_ordinal==='1'&&body.attempt_binding.previous_barrier_id===null&&
  (frame.type==='FENCE'&&body.target_gate_revision==='1'&&[body.open_intents,body.open_transmission_intents,body.cancel_transmissions].every(empty)||
   frame.type==='FENCE_ACK'&&body.gate_revision==='1'&&body.ack?.all_write_exits_fenced===true&&
   [body.coverage,body.transmission_coverage,body.cancel_coverage,body.ack.discarded_permit_ids,body.ack.in_flight_command_ids,body.ack.unresolved_command_ids].every(empty));
 requireFeatures(selected,initial&&selected.has('initial_control_fence')?[...capabilities.base,'initial_control_fence']:required);
 // 只看协议承诺字段，不扫描parameters、设备观测payload或其他用户数据中的同名键。
 const transmissions=[body?.permit?.transmission,...(body?.open_transmission_intents??[])].filter(Boolean);
 const nodes=[body?.request,body?.guard,body?.permit,...(body?.open_intents??[]),...transmissions.map(item=>item.intent)];
 for(const node of nodes){if(!node)continue;
  if(node.origin==='automation'||node.binding?.origin==='automation'||node.automation_binding!=null)requireFeatures(selected,capabilities.automation);
  if(node.admission_origin==='panel'||node.panel_binding!=null||node.panel_binding_digest!=null)requireFeatures(selected,capabilities.panel);
  if(node.time_required===true||node.reference_time!=null)requireFeatures(selected,capabilities.reference);
  if(node.transmission&&node.transmission.kind!=='initial')requireFeatures(selected,['continuation_grant_binding']);
  for(const dispatch of [node.dispatch,node.deadline_policy])if(dispatch&&dispatch.mode!=='immediate')requireFeatures(selected,capabilities.reference);
 }
 if(transmissions.some(item=>item.kind!=='initial'))requireFeatures(selected,['continuation_grant_binding']);
 if(body?.encoding_authorization?.target?.kind==='cancel')requireFeatures(selected,capabilities.cancel);
 if(body?.selector?.kind?.startsWith('panel'))requireFeatures(selected,capabilities.panel);
 if(body?.schedule_guard!=null||body?.reference_context!=null)requireFeatures(selected,capabilities.reference);
 if(body?.cancel_transmissions?.length||body?.cancel_coverage?.length)requireFeatures(selected,capabilities.cancel);
 if(body?.run_deny_snapshot?.entries?.length)requireFeatures(selected,capabilities.automation);
 if(body?.command_deny_snapshot?.entries?.length)requireFeatures(selected,capabilities.cancel);
 if(body?.gate_access?.purpose==='protection'||body?.protection_assessment!=null)requireFeatures(selected,['protection_execution']);
}
export function createDeviceExecutionCodec(selection){
 const decoder=createDecoder(selection),handles=new Map();
 for(const message of deviceExecutionMessages)handles.set(message.direction+':'+message.type,
  decoder.worker(deviceExecutionVersion,message.direction,message.type));
 return Object.freeze({
  selection:contractSelection,version:deviceExecutionVersion,messages:deviceExecutionMessages,
  async decode(bytes,direction,type){
   const handle=handles.get(direction+':'+type);if(!handle)throw new WireError('binding','unknown_worker_binding');
   return (await decoder.decode(bytes,handle,{profile:budget,yieldNow})).value;
  }
 });
}
