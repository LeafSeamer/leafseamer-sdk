// C05第17/19节与DF03第20节的产品选择归并；历史输入保持原字节。
export function addEventTime(documents){
 const graph=documents['models.schema.json'],base=graph.$defs;
 const r=name=>({$ref:'#/$defs/'+name}),e=name=>r('eventTime__'+name);
 const object=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
 const nullable=value=>({anyOf:[value,{type:'null'}]});
 const id=r('lifecycle__Id'),revision=r('time_internal__S11__Positive'),digest=r('lifecycle__Digest'),scope=r('lifecycle__Scope');
 const tick=r('time_internal__S11__UInt'),domain=r('time_internal__S11__Domain'),ref=r('time_internal__S11__Ref');
 const owned=kind=>object({kind:{const:kind},scope,object_id:id,revision,digest});
 const definitions={
  SourceTimeRef:owned('source_time_evidence'),
  DataSourceRef:owned('data_source'),SourceRuntimeRef:owned('runtime_binding'),ObservationBindingRef:owned('source_observation_binding'),
  UtcInterval:r('time_internal__S11__Interval'),
  SourceTimeEvidence:object({id,revision,digest,source_key:r('ingress__SourceKey'),binding_ref:r('ingress__SourceBindingRef'),event_id:id,
   source_sequence:revision,payload_digest:digest,capture_semantics:{enum:['sampled_observation','event_occurrence']},
   capture_evidence_ref:ref,capture_domain:domain,capture_start_tick_ns:tick,capture_end_tick_ns:tick,elapsed_profile_ref:ref,
   reference_context_ref:nullable(ref),utc_interval:nullable(e('UtcInterval'))}),
  OriginRef:object({source_key:r('ingress__SourceKey'),event_id:id})
 };
 definitions.SourceTimeEvidence.allOf=[{if:{properties:{reference_context_ref:{type:'null'}},required:['reference_context_ref']},
  then:{properties:{utc_interval:{type:'null'}}},else:{properties:{utc_interval:e('UtcInterval')}}}];
 const common={id,revision,digest,origin_ref:e('OriginRef'),origin_digest:digest,receiver_domain:domain,first_receive_tick_ns:tick,evaluated_tick_ns:tick,
  elapsed_profile_ref:ref,lower_age_ms:{type:'integer',minimum:0,maximum:9007199254740991},upper_age_ms:{type:'integer',minimum:0,maximum:9007199254740991},
  qualification_refs:{type:'array',items:ref,minItems:1,maxItems:64,uniqueItems:true},reason_codes:{type:'array',items:id,maxItems:64,uniqueItems:true}};
 const branches={
  trusted_utc:{source_time_ref:e('SourceTimeRef'),source_reference_context_ref:ref,receiver_reference_context_ref:ref,first_receive_utc:e('UtcInterval'),initial_age_ns:e('UtcInterval')},
  causal_capture:{pending_capture_ref:ref,capture_receipt_ref:ref,challenge_sent_tick_ns:tick,received_tick_ns:tick,lower_age_ms:{const:0}},
  local_capture:{source_time_ref:e('SourceTimeRef'),capture_start_tick_ns:tick,capture_end_tick_ns:tick},
  unproven:{elapsed_profile_ref:nullable(ref),lower_age_ms:{type:'null'},upper_age_ms:{type:'null'},qualification_refs:{...common.qualification_refs,minItems:0},reason_codes:{...common.reason_codes,minItems:1}}
 };
 definitions.AgeEvidence={oneOf:Object.entries(branches).map(([basis,fields])=>object({...common,basis:{const:basis},...fields}))};
 const binding=structuredClone(base.ingress__SourceBindingRef),p=binding.properties;
 // 事件来源沿用运行、设备及程序对象的统一Id；不重命名真实成员或设备以迁就旧摄取草案。
 for(const key of ['registration_id','owner_service_id','database_instance_id','provider_id','provider_boot_id','capture_policy_id'])p[key]=id;
 const sourceKey=structuredClone(base.ingress__SourceKey);for(const key of Object.keys(sourceKey.properties))sourceKey.properties[key]=id;
 const device=object({kind:{const:'device'},device_id:id,trigger_id:id,capability_version:p.capability_version});
 for(const key of ['device_id','trigger_id','capability_version']){delete p[key];binding.required=binding.required.filter(v=>v!==key);}
 p.target={oneOf:[device,object({kind:{const:'data_source'},source_ref:e('DataSourceRef'),source_runtime_binding_ref:e('SourceRuntimeRef'),observation_binding_ref:e('ObservationBindingRef')})]};
 binding.required.push('target');binding.allOf=[{if:{properties:{target:{properties:{kind:{const:'data_source'}},required:['kind']}},required:['target']},then:{properties:{delivery_semantics:{const:'sampled'}}}}];
 const origin=structuredClone(base.ingress__Origin);origin.properties.event_id=id;origin.properties.source_time_ref=nullable(e('SourceTimeRef'));origin.required.push('source_time_ref');
 const first=structuredClone(base.ingress__FirstObservation);first.properties.age_evidence_ref=r('lifecycle__AgeEvidenceRef');
 const models={...Object.fromEntries(Object.entries(definitions).map(([k,v])=>['eventTime__'+k,v])),ingress__SourceKey:sourceKey,ingress__SourceBindingRef:binding,ingress__Origin:origin,ingress__FirstObservation:first};
 const convert=(value,prefix)=>typeof value==='string'?value.replaceAll('#/$defs/',prefix):Array.isArray(value)?value.map(v=>convert(v,prefix)):
  value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,convert(v,prefix)])):value;
 for(const document of Object.values(documents)){
  const defs=document?.$defs??document?.components?.schemas;if(!defs)continue;
  if(!defs.ingress__Origin)continue;
  Object.assign(defs,convert(models,document.$defs?'#/$defs/':'#/components/schemas/'));
 }
 for(const authority of ['controller','seamer']){
  const api=documents[authority+'.openapi.json'];
  for(const [suffix,operation,model] of [['source-times','getSourceTimeEvidence','SourceTimeEvidence'],['age-evidence','getEventAgeEvidence','AgeEvidence']]){
   const route=structuredClone(api.paths['/internal/reference-time/bundles/{id}/{revision}'].get);
   route.operationId=operation;route['x-permission']='events.internal.read';
   route['x-composition-source']={document:'event-time',source_version:'event-time/1'};
   delete route['x-source-contract-parameters'];
   route.responses['200'].content['application/json'].schema={$ref:'#/components/schemas/eventTime__'+model};
   api.paths['/internal/events/'+suffix+'/{id}/{revision}']={get:route};
  }
 }
 return Object.keys(definitions).map(name=>'eventTime__'+name);
}
