// 设备模块的加载、只读连接与候选采样通道；设备命令仍使用独立执行IPC。
export const deviceModuleProtocol='device-module/1';
export class DeviceModuleError extends Error {constructor(code){super(code);this.name='DeviceModuleError';this.code=code;}}
export const moduleNeed=(ok,code='module_frame')=>{if(!ok)throw new DeviceModuleError(code);};
export const moduleExact=(value,keys)=>moduleNeed(value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join(',')===[...keys].sort().join(','));
const id=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$(?![\s\S])/.test(v);
const integer=v=>typeof v==='string'&&/^(0|[1-9][0-9]{0,19})$(?![\s\S])/.test(v);
const digest=v=>typeof v==='string'&&/^sha256:[0-9a-f]{64}$(?![\s\S])/.test(v);
const freeze=v=>{if(v&&typeof v==='object'){for(const item of Object.values(v))freeze(item);Object.freeze(v);}return v;};
const fields={LOAD:['runtime','configuration'],LOADED:['entry_id'],CONNECT:['device_id','device_session_id'],CONNECTED:['device_id','device_session_id','identity'],
 CAPTURE:['device_id','device_session_id','capture_id'],CAPTURED:['device_id','device_session_id','capture_id','value','captured_tick_ns'],
 DISCONNECT:['device_id','device_session_id'],DISCONNECTED:['device_id','device_session_id']};
export function validateDeviceModuleFrame(frame){
 moduleExact(frame,['version','type','sequence','request_id','reply_to','binding','issued_tick_ns','deadline_tick_ns','body']);
 moduleNeed(frame.version===deviceModuleProtocol&&Object.hasOwn(fields,frame.type)&&integer(frame.sequence)&&frame.sequence!=='0'&&id(frame.request_id));
 const response=['LOADED','CONNECTED','CAPTURED','DISCONNECTED'].includes(frame.type);
 moduleNeed(response?id(frame.reply_to):frame.reply_to===null);
 moduleNeed(integer(frame.issued_tick_ns)&&integer(frame.deadline_tick_ns)&&BigInt(frame.deadline_tick_ns)>BigInt(frame.issued_tick_ns)&&BigInt(frame.deadline_tick_ns)-BigInt(frame.issued_tick_ns)<=2000000000n);
 moduleExact(frame.binding,['runtime_binding_ref','ipc_session_id','member_boot_id']);moduleNeed(id(frame.binding.ipc_session_id)&&id(frame.binding.member_boot_id));
 const ref=frame.binding.runtime_binding_ref;moduleExact(ref,['kind','authority_service_id','database_instance_id','object_id','revision','digest']);
 moduleNeed(ref.kind==='runtime_binding'&&[ref.authority_service_id,ref.database_instance_id,ref.object_id].every(id)&&ref.revision==='1'&&digest(ref.digest));
 moduleExact(frame.body,fields[frame.type]);
 for(const key of ['device_id','device_session_id','capture_id','entry_id'])if(Object.hasOwn(frame.body,key))moduleNeed(id(frame.body[key]));
 if(frame.type==='LOAD'){
  moduleNeed(frame.body.runtime&&typeof frame.body.runtime==='object');moduleExact(frame.body.configuration,['reference','value']);
  const config=frame.body.configuration.reference;moduleExact(config,['kind','authority_service_id','database_instance_id','object_id','revision','digest']);
  moduleNeed(config.kind==='configuration'&&[config.authority_service_id,config.database_instance_id,config.object_id].every(id)&&integer(config.revision)&&digest(config.digest));
 }
 if(frame.type==='CONNECTED'){moduleExact(frame.body.identity,['kind','model','revision']);moduleNeed(['virtual','physical'].includes(frame.body.identity.kind)&&id(frame.body.identity.model)&&id(frame.body.identity.revision));}
 if(frame.type==='CAPTURED')moduleNeed(integer(frame.body.captured_tick_ns)&&BigInt(frame.body.captured_tick_ns)>=BigInt(frame.issued_tick_ns)&&BigInt(frame.body.captured_tick_ns)<BigInt(frame.deadline_tick_ns));
 return freeze(frame);
}
