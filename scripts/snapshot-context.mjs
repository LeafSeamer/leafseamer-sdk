// 当前连接下的权威范围与原快照剩余租期；不创建或延长快照，不授予执行资格。
export function addSnapshotContext(apis,graph){
 const ref=name=>({$ref:'#/components/schemas/'+name}),object=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
 const uuid={type:'string',pattern:'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$(?![\\s\\S])'},counter=ref('channel__Counter');
 const definitions={
  snapshotContext__ClockPolicyRef:object({id:uuid,revision:counter,digest:{type:'string',pattern:'^sha256:[0-9a-f]{64}$(?![\\s\\S])'}}),
  snapshotContext__Request:object({challenge_id:uuid,expected_connection_generation:counter,snapshot_ref:ref('channel__SnapshotRef')}),
  snapshotContext__Lease:object({publisher_domain_ref:ref('snapshot__DomainRef'),observed_tick_ns:counter,valid_before_tick_ns:counter,
   clock_policy_ref:ref('snapshotContext__ClockPolicyRef'),clock_acquisition_ref:ref('snapshotContext__ClockPolicyRef'),drift_ppb:{type:'integer',minimum:0,maximum:1000000},monotonic_quantization_ns:counter}),
  snapshotContext__Response:object({format_version:{const:'snapshot-context/1'},challenge_id:uuid,delivery_binding:ref('channel__DeliveryBinding'),owner:ref('channel__ServiceOwner'),
   publisher_service_boot_id:uuid,snapshot_ref:ref('channel__SnapshotRef'),projection_profile:ref('registry__Profile'),selector:ref('registry__Selector'),lease:ref('snapshotContext__Lease')})
 };
 const local=v=>Array.isArray(v)?v.map(local):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([key,value])=>[key,key==='$ref'?value.replace('#/components/schemas/','#/$defs/'):local(value)])):v;
 for(const api of Object.values(apis)){
  Object.assign(api.components.schemas,structuredClone(definitions));
  const route=structuredClone(api.paths['/internal/subscriptions/{subscription_id}/snapshot'].get);
  route.operationId='internalQuerySnapshotContext';route.summary='核验当前快照范围并查询原剩余租期';
  route.parameters=route.parameters.filter(p=>p.in!=='query');route.requestBody={required:true,content:{'application/json':{schema:ref('snapshotContext__Request')}}};
  route.responses['200'].content['application/json'].schema=ref('snapshotContext__Response');
  route['x-response-wire-profile']={max_message_bytes:262144,max_depth:48,max_value_nodes:65536,max_object_members:65536,max_key_utf8_bytes:4096,max_string_utf8_bytes:65536,parse_deadline_ms:1000};
  route['x-composition-source']={document:'snapshot-context',source_version:'snapshot-context/1'};delete route['x-source-contract-parameters'];
  api.paths['/internal/subscriptions/{subscription_id}/snapshot-context']={post:route};
 }
 Object.assign(graph.$defs,local(definitions));return Object.keys(definitions);
}
