// 增量协商只改变新产品选择；锁定的历史契约保留原字节。
export function addExecutionNegotiation(documents){
 const messages=documents['worker-messages.json'],models=documents['models.schema.json'].$defs;
 const known=[...messages.required_features.HELLO_ACK,'protection_execution','initial_control_fence','reference_time_absent'];
 const base=['supervised_runtime_domain','shared_direction_journal','terminal_volatile_close'];
 const manual=['execution_guard','scoped_authorization_fence','clock_generation_guard','typed_obs_evidence',
  'recovery_single_consume','time_bound_evidence','per_transmission_permit','complete_transmission_fence',
  'barrier_attempt_history','scoped_gate_access','immutable_hold_ownership','fresh_gate_fence',
  'encoding_authority_before_issue','encoding_release_after_quiescence','prepare_deny_before_release'];
 const panel=['panel_execution_binding','panel_scoped_fence'];
 const automation=['automation_origin_binding','run_generation_fence','run_deny_snapshot'];
 const cancel=['command_cancel_deny','separate_cancel_execution','complete_cancel_transmission_fence'];
 const reference=['reference_bound_time','reference_time_floor','schedule_source_binding'];
 const dependencies={};
 for(const group of [panel,automation,cancel,reference])for(const feature of group)dependencies[feature]=group.filter(f=>f!==feature);
 const required={};
 const set=(names,features)=>{for(const name of names.split(' ')){if(required[name])throw new Error('execution_feature_duplicate');required[name]=[...base,...features];}};
 set('HELLO HELLO_ACK CLOSE_GATE CLOSE_GATE_ACK',[]);
 set('ENCODE_PACKET PACKET_ENCODING_FAILED PREPARE_PACKET PREPARE_PACKET_REJECTED GUARD_INSTALL GUARD_ACK DISPATCH SEND_REPORT EVIDENCE_CANDIDATE REPORT_STORED DENY_ENCODING DENY_ENCODING_ACK RELEASE_ENCODING RELEASE_ENCODING_ACK OPEN_GATE OPEN_GATE_ACK FENCE FENCE_ACK GATE_FENCE GATE_FENCE_ACK AUTH_FENCE AUTH_FENCE_ACK QUERY_BARRIER BARRIER_UNAVAILABLE BARRIER_STORED',manual);
 set('RUN_FENCE RUN_FENCE_ACK',[...manual,...automation]);
 set('TIME_FENCE TIME_FENCE_ACK',[...manual,...reference]);
 set('CANCEL_ENCODING_FAILED CANCEL_EVIDENCE_CANDIDATE CANCEL_EXECUTION_STATUS CANCEL_FENCE CANCEL_FENCE_ACK CANCEL_GUARD CANCEL_GUARD_ACK CANCEL_PREPARE_REJECTED CANCEL_REPORT_STORED CANCEL_SEND_REPORT DISPATCH_CANCEL ENCODE_CANCEL_PACKET PREPARE_CANCEL_PACKET QUERY_CANCEL_EXECUTION',[...manual,...cancel]);
 set('RESEND_DISPATCH RESEND_REJECTED RESEND_REQUEST',[...manual,'continuation_grant_binding']);
 set('CANCEL_RESEND_REJECTED CANCEL_RESEND_REQUEST',[...manual,...cancel,'continuation_grant_binding']);
 if(messages.messages.length!==Object.keys(required).length||messages.messages.some(m=>!required[m.type]))throw new Error('execution_feature_coverage');
 for(const [model,field] of [['command__S9__HELLOBody','supported_features'],['command__S9__HELLO_ACKBody','selected_features']]){
  models[model].properties[field]={type:'array',items:{enum:known},minItems:base.length,maxItems:known.length,uniqueItems:true,
   allOf:[...base.map(feature=>({contains:{const:feature}})),...Object.entries(dependencies).map(([feature,values])=>({
    if:{contains:{const:feature}},then:{allOf:values.map(value=>({contains:{const:value}}))}}))]};
 }
 messages.required_features={HELLO:base,HELLO_ACK:base};
 // 无参考时间仅允许显式null；实际是否可用还须按该会话所选能力在副作用前判定。
 const changed=['command__S9__HELLOBody','command__S9__HELLO_ACKBody'];
 for(const [name,field] of [['command__S9__OPEN_GATEBody','reference_time_snapshot'],['command__S9__OPEN_GATE_ACKBody','reference_time_snapshot_ref']]){
  models[name].properties[field]={anyOf:[models[name].properties[field],{type:'null'}]};changed.push(name);
 }
 const local=value=>Array.isArray(value)?value.map(local):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>
  [k,k==='$ref'&&typeof v==='string'?v.replace('#/$defs/','#/components/schemas/'):local(v)])):value;
 for(const api of ['controller.openapi.json','seamer.openapi.json'])for(const name of changed)
  if(documents[api].components.schemas[name])documents[api].components.schemas[name]=local(models[name]);
 documents['execution-capabilities.json']={format:'execution-capabilities/1',ipc_version:messages.ipc_version,
  known,base,manual,panel,automation,cancel,reference,initial_control:['initial_control_fence'],without_reference:['reference_time_absent'],dependencies,messages:required};
}
