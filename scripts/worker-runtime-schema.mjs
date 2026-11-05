// 已定启动范围与来源通道的产品生成定义；历史安装0.2输入保持不变。
export function workerRuntimeSchemaV02(base) {
  const schema = structuredClone(base), d = schema.$defs;
  schema.$id = 'urn:leafseamer:worker-runtime:1'; delete schema.oneOf;
  const ref = name => ({$ref: '#/$defs/' + name});
  const obj = properties => ({type: 'object', properties, required: Object.keys(properties), additionalProperties: false});
  const constant = value => ({const: value}), enumeration = (...values) => ({enum: values});
  const list = (items, min, max) => ({type: 'array', items, minItems: min, maxItems: max, uniqueItems: true});
  const nullable = type => ({anyOf: [type, {type: 'null'}]});
  const id = ref('installation2_Id'), u20 = ref('installation2_U20'), digest = ref('installation2_Digest');
  const positive = {type: 'string', maxLength: 20, pattern: '^[1-9][0-9]*(?![\\s\\S])'};
  const typedRef = kind => obj({...d.installation2_RuntimeBindingRef.properties, kind: constant(kind)});
  d.ObjectScope = {oneOf: [
    obj({kind: constant('devices'), device_ids: list(id, 1, 64)}),
    obj({kind: constant('data_sources'), source_refs: list(ref('installation2_SourceRef'), 1, 64), data_object_refs: list(ref('installation2_DataObjectRef'), 0, 128)}),
  ]};
  const intent = d.installation2_ExtensionLaunchIntent;
  delete intent.properties.device_ids; intent.properties.object_scope = ref('ObjectScope');
  intent.required = intent.required.map(name => name === 'device_ids' ? 'object_scope' : name);
  const controlTypes = ['FENCE_PUT', 'FENCE_RESULT', 'LAUNCH_REGISTER', 'LAUNCH_CREATE', 'LAUNCH_QUERY', 'LAUNCH_RESULT', 'RETIRE_REQUEST', 'RETIRE_RESULT', 'ERROR'];
  for (const type of controlTypes) d['supervisor_' + type].properties.version = constant('supervisor-control/0.2.0-draft.1');
  d.ControlFrame = {oneOf: controlTypes.map(type => ref('supervisor_' + type))};
  for (const [name, kind] of Object.entries({SourceRuntimeBindingRef: 'source_runtime_binding', ObservationBindingRef: 'source_observation_binding',
    MappingRef: 'mapping', CapturePolicyRef: 'capture_policy', QueryRef: 'source_query', LaunchIntentRef: 'launch_intent', LaunchRecordRef: 'launch_record', CaptureReceiptRef: 'capture_receipt'})) d[name] = typedRef(kind);
  d.SourceScope = obj({authority_service_id: id, database_instance_id: id});
  d.SourceRuntimeBinding = obj({binding_id: id, revision: u20, scope: ref('SourceScope'), source_ref: ref('installation2_SourceRef'),
    configuration_ref: ref('installation2_ConfigurationRef'), mapping_ref: ref('MappingRef'), capture_policy_ref: ref('CapturePolicyRef'),
    launch_intent_ref: ref('LaunchIntentRef'), launch_record_ref: ref('LaunchRecordRef'), installation_ref: ref('installation2_InstallationRef'),
    approval_ref: ref('installation2_ApprovalRef'), role_resolution_ref: ref('installation2_RoleResolutionRef'), permissions_digest: digest,
    member_id: id, member_boot_id: id, provider_id: id, provider_boot_id: id, runtime_generation: id,
    clock_domain_id: id, descriptor_digest: digest, entry_id: id, binding_digest: digest});
  const sourceCommon = {registration_id: id, revision: u20, owner_service_id: id, database_instance_id: id, provider_id: id,
    provider_boot_id: id, capture_policy_id: id, capture_policy_revision: u20};
  d.SourceBinding = {oneOf: [
    obj({...sourceCommon, delivery_semantics: enumeration('sampled', 'discrete'), target: obj({kind: constant('device'), device_id: id,
      trigger_id: id, capability_version: {type: 'string', maxLength: 128, pattern: '^[0-9A-Za-z.+-]{1,128}(?![\\s\\S])'}})}),
    obj({...sourceCommon, delivery_semantics: constant('sampled'), target: obj({kind: constant('data_source'), source_ref: ref('installation2_SourceRef'),
      source_runtime_binding_ref: ref('SourceRuntimeBindingRef'), observation_binding_ref: ref('ObservationBindingRef')})}),
  ]};
  d.SourceBindingRef = ref('SourceBinding');
  const capture = {capture_id: id, capture_ordinal: positive};
  const boundCapture = {...capture, request_digest: digest};
  const bodies = {
    CAPTURE: obj({...capture, source_ref: ref('installation2_SourceRef'), purpose: enumeration('import_snapshot', 'sampled_observation'),
      query_ref: ref('QueryRef'), mapping_ref: ref('MappingRef'), capture_policy_ref: ref('CapturePolicyRef'),
      domain_ref: ref('supervisor_ClockDomainRef'), issued_tick: u20, deadline_tick: u20,
      result_budget: obj({max_rows: {type: 'integer', minimum: 1, maximum: 10000}, max_response_bytes: {type: 'integer', minimum: 1, maximum: 8388608}})}),
    CAPTURE_RESULT: obj({...boundCapture, started_tick: u20, finished_tick: u20,
      raw_response: obj({encoding: constant('base64'), bytes: {type: 'string', maxLength: 11184812}, digest, byte_length: {type: 'integer', minimum: 0, maximum: 8388608}}),
      metadata: obj({content_type: {type: 'string', maxLength: 128, pattern: '^[A-Za-z0-9.+/-]{1,128}(?![\\s\\S])'}, source_revision: nullable({type: 'string', minLength: 1, maxLength: 1024})}),
      coherence: enumeration('transaction_snapshot', 'single_response', 'unproven'), complete: {type: 'boolean'}, content_digest: digest}),
    CAPTURE_FAILED: obj({...boundCapture, reason: enumeration('timeout', 'source_unavailable', 'budget_exceeded', 'cancelled', 'outcome_unavailable', 'invalid_response', 'policy_rejected'),
      last_stage: enumeration('queued', 'connecting', 'querying', 'receiving', 'validating')}),
    CAPTURE_ACK: obj({...boundCapture, receipt_ref: ref('CaptureReceiptRef')}),
    CANCEL: obj({...boundCapture, cancel_id: id}),
    CANCEL_ACK: obj({...boundCapture, cancel_id: id, state: enumeration('stopped', 'pending', 'already_reported'), result_digest: nullable(digest)}),
    STOP: obj({stop_id: id, last_capture_sender_sequence: u20, capture_set_digest: digest}),
    STOP_ACK: obj({stop_id: id, capture_set_digest: digest, captures: list(obj({...capture, state: enumeration('executing', 'awaiting_ack')}), 0, 64)}),
  };
  for (const [type, body] of Object.entries(bodies)) {
    d['source_' + type] = obj({protocol: constant('source-worker/1'), runtime_binding_ref: ref('SourceRuntimeBindingRef'), ipc_session_id: id,
      sender_sequence: positive, type: constant(type), body});
  }
  d.SourceFrame = {oneOf: Object.keys(bodies).map(type => ref('source_' + type))};
  return schema;
}

// 0.3在CREATE前增加监督器持有的物化观察步骤；0.2生成定义仍可独立复现。
export function workerRuntimeSchemaV03(base){
  const schema=workerRuntimeSchemaV02(base),d=schema.$defs;schema.$id='urn:leafseamer:worker-runtime:2';
  const ref=name=>({$ref:'#/$defs/'+name}),obj=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
  d.MaterializationRequest=obj({key:ref('supervisor_LaunchKey'),observation_request_id:ref('installation2_Id')});
  const observation=obj({materialization_evidence_id:ref('installation2_Id'),materialization_challenge_id:ref('installation2_Id'),lifetime:ref('installation2_Lifetime')});
  d.MaterializationPreparation=obj({key:ref('supervisor_LaunchKey'),observation_request_id:ref('installation2_Id'),
    status:{enum:['pending','verified','unavailable']},observation:{anyOf:[observation,{type:'null'}]}});
  d.MaterializationPreparation.allOf=[{if:{properties:{status:{const:'verified'}}},then:{properties:{observation}},else:{properties:{observation:{type:'null'}}}}];
  d.supervisor_LAUNCH_MATERIALIZE=structuredClone(d.supervisor_LAUNCH_QUERY);
  d.supervisor_LAUNCH_MATERIALIZE.properties.type={const:'LAUNCH_MATERIALIZE'};
  d.supervisor_LAUNCH_MATERIALIZE.properties.payload=ref('MaterializationRequest');
  d.supervisor_MATERIALIZATION_RESULT=structuredClone(d.supervisor_LAUNCH_RESULT);
  d.supervisor_MATERIALIZATION_RESULT.properties.type={const:'MATERIALIZATION_RESULT'};
  d.supervisor_MATERIALIZATION_RESULT.properties.payload=ref('MaterializationPreparation');
  d.ControlFrame.oneOf.push(ref('supervisor_LAUNCH_MATERIALIZE'),ref('supervisor_MATERIALIZATION_RESULT'));
  for(const entry of d.ControlFrame.oneOf)d[entry.$ref.split('/').at(-1)].properties.version={const:'supervisor-control/0.3.0-draft.1'};
  return schema;
}

// 0.4传输完整加载材料；分片只交付数据，不能替代当前fence、物化证明或创建授权。
export function workerRuntimeSchema(base,artifactSchema){
 const schema=workerRuntimeSchemaV03(base),d=schema.$defs;schema.$id='urn:leafseamer:worker-runtime:3';
 const ref=name=>({$ref:'#/$defs/'+name}),obj=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
 const id=ref('installation2_Id'),digest=ref('installation2_Digest'),u20=ref('installation2_U20'),key=ref('supervisor_LaunchKey');
 const common={key,load_id:id},finish=obj({...common,operation:{const:'finish'}}),release=obj({...common,operation:{const:'release'}});
 const begin=obj({...common,operation:{const:'begin'},materials_digest:digest,byte_length:{type:'integer',minimum:1,maximum:8388608},
  materialization_evidence_id:id,materialization_challenge_id:id});
 const chunk=obj({...common,operation:{const:'chunk'},offset:{type:'integer',minimum:0,maximum:8388607},
  bytes:{type:'string',minLength:4,maxLength:65536,pattern:'^[A-Za-z0-9+/]+={0,2}(?![\\s\\S])'}});
 d.WorkerLoadRequest={oneOf:[begin,chunk,finish,release]};
 d.WorkerLoadResult=obj({...common,status:{enum:['receiving','pending','ready','released','unavailable']},received_bytes:u20,
  root_identity:{anyOf:[{type:'string',pattern:'^[0-9a-f]{48}(?![\\s\\S])'},{type:'null'}]}});
 d.WorkerLoadResult.allOf=[{if:{properties:{status:{const:'ready'}}},then:{properties:{root_identity:{type:'string'}}},else:{properties:{root_identity:{type:'null'}}}}];
 for(const [type,body,source] of [['LAUNCH_LOAD','WorkerLoadRequest','supervisor_LAUNCH_QUERY'],['LOAD_RESULT','WorkerLoadResult','supervisor_LAUNCH_RESULT']]){
  d['supervisor_'+type]=structuredClone(d[source]);d['supervisor_'+type].properties.type={const:type};d['supervisor_'+type].properties.payload=ref(body);
  d.ControlFrame.oneOf.push(ref('supervisor_'+type));
 }
 const payload=d.supervisor_LAUNCH_CREATE.properties.payload;
 const create=payload.$ref?d[payload.$ref.split('/').at(-1)]:payload;
 create.properties.load_id=id;create.required.push('load_id');
 for(const entry of d.ControlFrame.oneOf)d[entry.$ref.split('/').at(-1)].properties.version={const:'supervisor-control/0.4.0-draft.1'};
 const convert=value=>{if(Array.isArray(value))return value.map(convert);if(!value||typeof value!=='object')return value;
  return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,k==='$ref'?v.replace('#/$defs/','#/$defs/load_'):['const','enum','default','examples'].includes(k)?v:convert(v)]));};
 const copy=name=>{if(d['load_'+name])return;const value=artifactSchema.$defs[name];if(!value)throw new Error('worker_load_definition');d['load_'+name]=convert(value);
  const scan=v=>{if(!v||typeof v!=='object')return;for(const [k,c] of Object.entries(v)){if(k==='$ref')copy(c.split('/').at(-1));else if(!['const','enum','default','examples'].includes(k))scan(c);}};scan(value);};
 copy('artifact_Manifest');copy('artifact_FileInventory');
 d.WorkerLoadMaterials=obj({format:{const:'leafseamer-worker-load/1'},root_path:{type:'string',minLength:1,maxLength:32760},
  root_identity:{type:'string',pattern:'^[0-9a-f]{48}(?![\\s\\S])'},manifest:ref('load_artifact_Manifest'),inventory:ref('load_artifact_FileInventory')});
 return schema;
}
