// 设备模块的加载、只读连接与候选采样通道；设备命令仍使用独立执行IPC。
export const deviceModuleProtocol='device-module/3';
export const deviceModuleEventProtocol='device-module/4';
export class DeviceModuleError extends Error {constructor(code){super(code);this.name='DeviceModuleError';this.code=code;}}
export const moduleNeed=(ok,code='module_frame')=>{if(!ok)throw new DeviceModuleError(code);};
export const moduleExact=(value,keys)=>moduleNeed(value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join(',')===[...keys].sort().join(','));
const id=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$(?![\s\S])/.test(v);
const integer=v=>typeof v==='string'&&/^(0|[1-9][0-9]{0,19})$(?![\s\S])/.test(v);
const digest=v=>typeof v==='string'&&/^sha256:[0-9a-f]{64}$(?![\s\S])/.test(v);
const freeze=v=>{if(v&&typeof v==='object'){for(const item of Object.values(v))freeze(item);Object.freeze(v);}return v;};
const fields={LOAD:['runtime','configuration'],LOADED:['entry_id'],CONNECT:['device_id','device_session_id'],CONNECTED:['device_id','device_session_id','identity','catalog'],
 CAPTURE:['device_id','device_session_id','capture_id'],CAPTURED:['device_id','device_session_id','capture_id','value','captured_tick_ns'],
 DISCONNECT:['device_id','device_session_id'],DISCONNECTED:['device_id','device_session_id'],
 BIND_EXECUTION:['device_id','device_session_id','execution'],EXECUTION_BOUND:['device_id','device_session_id','execution_ref']};
const eventFields={EVENT_START:['device_id','device_session_id','capture_id'],EVENT_STARTED:['device_id','device_session_id','capture_id','capture'],
 EVENT_READ:['device_id','device_session_id','capture_id','after_sequence','max_events'],EVENT_BATCH:['device_id','device_session_id','capture_id','result'],
 EVENT_ACK:['device_id','device_session_id','capture_id','through_sequence','batch_digest'],EVENT_ACKED:['device_id','device_session_id','capture_id','through_sequence','batch_digest'],
 EVENT_STOP:['device_id','device_session_id','capture_id'],EVENT_STOPPED:['device_id','device_session_id','capture_id','closed']};
function json(value,depth=0,budget={nodes:0}){
 moduleNeed(depth<=16&&++budget.nodes<=4096);
 if(value===null||typeof value==='boolean')return;
 if(typeof value==='string'){moduleNeed(value.length<=1024&&!/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value));return;}
 if(typeof value==='number'){moduleNeed(Number.isFinite(value)&&!Object.is(value,-0));return;}
 moduleNeed(value&&typeof value==='object'&&(Array.isArray(value)||Object.getPrototypeOf(value)===Object.prototype));
 for(const [key,item]of Object.entries(value)){json(key,depth+1,budget);json(item,depth+1,budget);}
}
function capture(value,body){
 moduleExact(value,['format','capture_id','device_id','device_session_id','event_type','started_tick_ns','baseline']);
 moduleNeed(value.format==='leafseamer-module-event-capture/1'&&id(value.event_type)&&integer(value.started_tick_ns));
 for(const key of ['capture_id','device_id','device_session_id'])moduleNeed(value[key]===body[key]);
 json(value.baseline);moduleNeed(new TextEncoder().encode(JSON.stringify(value.baseline)).length<=1024);
}
function failure(value,highest){
 if(value===null)return;
 moduleExact(value,['reason','loss_extent','missing_sequence']);moduleNeed(['clock','capacity'].includes(value.reason)&&['none','known'].includes(value.loss_extent));
 moduleNeed(value.loss_extent==='none'?value.missing_sequence===null:integer(value.missing_sequence)&&value.missing_sequence!=='0'&&value.missing_sequence===highest&&value.reason==='clock');
}
function events(frame){
 const b=frame.body;
 if(frame.type==='EVENT_STARTED'){capture(b.capture,b);moduleNeed(BigInt(b.capture.started_tick_ns)>=BigInt(frame.issued_tick_ns)&&BigInt(b.capture.started_tick_ns)<BigInt(frame.deadline_tick_ns));}
 if(frame.type==='EVENT_READ')moduleNeed(integer(b.after_sequence)&&Number.isInteger(b.max_events)&&b.max_events>=1&&b.max_events<=32);
 if(['EVENT_ACK','EVENT_ACKED'].includes(frame.type))moduleNeed(integer(b.through_sequence)&&digest(b.batch_digest));
 if(frame.type==='EVENT_BATCH'){
  const r=b.result;moduleExact(r,['state','highest_sequence','failure','batch','batch_digest']);
  moduleNeed(['active','failed'].includes(r.state)&&integer(r.highest_sequence)&&digest(r.batch_digest)&&(r.state==='active')===(r.failure===null));failure(r.failure,r.highest_sequence);
  const batch=r.batch;moduleExact(batch,['format','capture','after_sequence','through_sequence','events']);capture(batch.capture,b);
  moduleNeed(BigInt(batch.capture.started_tick_ns)<BigInt(frame.deadline_tick_ns));
  moduleNeed(batch.format==='leafseamer-module-event-batch/1'&&integer(batch.after_sequence)&&integer(batch.through_sequence)&&Array.isArray(batch.events)&&batch.events.length<=32);
  moduleNeed(BigInt(batch.through_sequence)===BigInt(batch.after_sequence)+BigInt(batch.events.length)&&BigInt(batch.through_sequence)<=BigInt(r.highest_sequence));
  let previous=BigInt(batch.capture.started_tick_ns);const ids=new Set();
  for(let i=0;i<batch.events.length;i++){
   const event=batch.events[i];moduleExact(event,['event_id','sequence','event_type','payload','capture_interval']);
   moduleNeed(id(event.event_id)&&!ids.has(event.event_id)&&event.sequence===String(BigInt(batch.after_sequence)+BigInt(i)+1n)&&event.event_type===batch.capture.event_type);ids.add(event.event_id);
   moduleExact(event.capture_interval,['before_tick_ns','after_tick_ns']);const interval=event.capture_interval;
   moduleNeed(integer(interval.before_tick_ns)&&integer(interval.after_tick_ns)&&BigInt(interval.before_tick_ns)>=previous&&BigInt(interval.after_tick_ns)>=BigInt(interval.before_tick_ns)&&BigInt(interval.after_tick_ns)<BigInt(frame.deadline_tick_ns));previous=BigInt(interval.after_tick_ns);
   json(event.payload);moduleNeed(new TextEncoder().encode(JSON.stringify(event)).length<=1024);
  }
  if(r.failure?.loss_extent==='known')moduleNeed(BigInt(batch.through_sequence)<BigInt(r.failure.missing_sequence));
 }
 if(frame.type==='EVENT_STOPPED'){
  const c=b.closed;moduleExact(c,['capture_id','last_sequence','acknowledged_sequence','discarded_events','failure']);
  moduleNeed(c.capture_id===b.capture_id&&integer(c.last_sequence)&&integer(c.acknowledged_sequence)&&Number.isInteger(c.discarded_events)&&c.discarded_events>=0&&c.discarded_events<=128);failure(c.failure,c.last_sequence);
  moduleNeed(BigInt(c.last_sequence)-BigInt(c.acknowledged_sequence)===BigInt(c.discarded_events)+(c.failure?.loss_extent==='known'?1n:0n));
 }
}
function executionRef(value){moduleExact(value,['id','revision','digest']);moduleNeed(id(value.id)&&value.revision==='1'&&digest(value.digest));}
export function validateDeviceModuleFrame(frame){
 moduleExact(frame,['version','type','sequence','request_id','reply_to','binding','issued_tick_ns','deadline_tick_ns','body']);
 const event=Object.hasOwn(eventFields,frame.type);
 moduleNeed([deviceModuleProtocol,deviceModuleEventProtocol].includes(frame.version)&&(!event||frame.version===deviceModuleEventProtocol)&&(event||Object.hasOwn(fields,frame.type))&&integer(frame.sequence)&&frame.sequence!=='0'&&id(frame.request_id));
 const response=['LOADED','CONNECTED','CAPTURED','DISCONNECTED','EXECUTION_BOUND','EVENT_STARTED','EVENT_BATCH','EVENT_ACKED','EVENT_STOPPED'].includes(frame.type);
 moduleNeed(response?id(frame.reply_to):frame.reply_to===null);
 moduleNeed(integer(frame.issued_tick_ns)&&integer(frame.deadline_tick_ns)&&BigInt(frame.deadline_tick_ns)>BigInt(frame.issued_tick_ns)&&BigInt(frame.deadline_tick_ns)-BigInt(frame.issued_tick_ns)<=2000000000n);
 moduleExact(frame.binding,['runtime_binding_ref','ipc_session_id','member_boot_id']);moduleNeed(id(frame.binding.ipc_session_id)&&id(frame.binding.member_boot_id));
 const ref=frame.binding.runtime_binding_ref;moduleExact(ref,['kind','authority_service_id','database_instance_id','object_id','revision','digest']);
 moduleNeed(ref.kind==='runtime_binding'&&[ref.authority_service_id,ref.database_instance_id,ref.object_id].every(id)&&ref.revision==='1'&&digest(ref.digest));
 moduleExact(frame.body,(event?eventFields:fields)[frame.type]);
 for(const key of ['device_id','device_session_id','capture_id','entry_id'])if(Object.hasOwn(frame.body,key))moduleNeed(id(frame.body[key]));
 if(frame.type==='LOAD'){
  moduleNeed(frame.body.runtime&&typeof frame.body.runtime==='object');moduleExact(frame.body.configuration,['reference','value']);
  const config=frame.body.configuration.reference;moduleExact(config,['kind','authority_service_id','database_instance_id','object_id','revision','digest']);
  moduleNeed(config.kind==='configuration'&&[config.authority_service_id,config.database_instance_id,config.object_id].every(id)&&integer(config.revision)&&digest(config.digest));
 }
 if(frame.type==='CONNECTED'){
  moduleExact(frame.body.identity,['kind','model','revision']);moduleNeed(['virtual','physical'].includes(frame.body.identity.kind)&&id(frame.body.identity.model)&&id(frame.body.identity.revision));
  const proposal=frame.body.catalog;moduleExact(proposal,['catalog_revision','state_schema','action_ids','trigger_ids']);
  moduleNeed(integer(proposal.catalog_revision)&&proposal.catalog_revision!=='0');
  for(const name of ['action_ids','trigger_ids'])moduleNeed(Array.isArray(proposal[name])&&proposal[name].length<=128&&proposal[name].every((v,i)=>id(v)&&(i===0||v>proposal[name][i-1])));
  const schema=proposal.state_schema;moduleExact(schema,['schema_id','dialect','document','digest']);
  moduleNeed(id(schema.schema_id)&&schema.dialect==='https://json-schema.org/draft/2020-12/schema'&&digest(schema.digest)&&
   (typeof schema.document==='boolean'||schema.document&&typeof schema.document==='object'&&!Array.isArray(schema.document)));
 }
 if(frame.type==='CAPTURED')moduleNeed(integer(frame.body.captured_tick_ns)&&BigInt(frame.body.captured_tick_ns)>=BigInt(frame.issued_tick_ns)&&BigInt(frame.body.captured_tick_ns)<BigInt(frame.deadline_tick_ns));
 if(frame.type==='BIND_EXECUTION'){
  moduleExact(frame.body.execution,['ref','value']);executionRef(frame.body.execution.ref);
  moduleNeed(frame.body.execution.value&&typeof frame.body.execution.value==='object'&&!Array.isArray(frame.body.execution.value));
 }
 if(frame.type==='EXECUTION_BOUND')executionRef(frame.body.execution_ref);
 if(event)events(frame);
 return freeze(frame);
}
