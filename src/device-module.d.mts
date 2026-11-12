export const deviceModuleProtocol:'device-module/3';
export const deviceModuleEventProtocol:'device-module/4';
export type Json= null|boolean|number|string|Json[]|{[key:string]:Json};
export type ModuleIdentity={kind:'virtual'|'physical';model:string;revision:string};
export interface ModuleCatalogProposal {
 readonly catalog_revision:string;readonly state_schema:Readonly<{schema_id:string;dialect:string;digest:string;document:Json}>;
 readonly action_ids:readonly string[];readonly trigger_ids:readonly string[];
}
export interface DeviceModuleContext {readonly configuration:Json;readonly device_ids:readonly string[];readonly signal:AbortSignal;tick():bigint;}
export interface DeviceModule {
 readonly api_version:'leafseamer-device-module/2';
 readonly execution?:DevicePrimitiveExecutor;
 readonly events?:DeviceEventCapture;
 connectReadOnly(input:{device_id:string;device_session_id:string;signal:AbortSignal}):Promise<ModuleIdentity>;
 proposeCatalog(input:{device_id:string;device_session_id:string;identity:Readonly<ModuleIdentity>;signal:AbortSignal}):Promise<ModuleCatalogProposal>;
 captureBaseline(input:{device_id:string;device_session_id:string;capture_id:string;signal:AbortSignal}):Promise<Json>;
 stopReadOnly(input:{device_id:string;device_session_id:string;signal:AbortSignal}):Promise<void>;
}
// 模块仅实现编码和一次传输。固定worker在调用writePrimitive前核验并消费IPC的逐传输permit。
// 模块返回值是原始传输观察，不能自行签发完成、资源释放或控制资格。
export interface DevicePrimitiveExecutor {
 readonly api_version:'leafseamer-device-primitives/1';
 encodePrimitive(input:ModuleSession&{readonly primitive_id:string;readonly parameters:Json;readonly signal:AbortSignal}):Promise<Uint8Array>;
 writePrimitive(input:ModuleSession&{readonly bytes:Uint8Array;readonly signal:AbortSignal}):Promise<PrimitiveWriteObservation>;
}
export interface PrimitiveWriteObservation {
 readonly bytes_written:number;
 readonly response:Json;
}
export type DeviceModuleFactory=(context:DeviceModuleContext)=>DeviceModule|Promise<DeviceModule>;
export class DeviceModuleError extends Error {readonly code:string;}
export function moduleNeed(ok:unknown,code?:string):asserts ok;
export function moduleExact(value:unknown,keys:string[]):void;
export interface ModuleReference<K extends string> {
 readonly kind:K;readonly authority_service_id:string;readonly database_instance_id:string;
 readonly object_id:string;readonly revision:string;readonly digest:string;
}
export interface ModuleBinding {
 readonly runtime_binding_ref:ModuleReference<'runtime_binding'>&{readonly revision:'1'};
 readonly ipc_session_id:string;readonly member_boot_id:string;
}
export interface ModuleSession {readonly device_id:string;readonly device_session_id:string;}
export interface ModuleCapture extends ModuleSession {readonly capture_id:string;}
export interface ModuleEventCapture extends ModuleCapture {readonly format:'leafseamer-module-event-capture/1';readonly event_type:string;readonly started_tick_ns:string;readonly baseline:Json;}
export interface ModuleCapturedEvent {readonly event_id:string;readonly sequence:string;readonly event_type:string;readonly payload:Json;readonly capture_interval:{readonly before_tick_ns:string;readonly after_tick_ns:string};}
export type ModuleEventFailure={readonly reason:'clock'|'capacity';readonly loss_extent:'none';readonly missing_sequence:null}|{readonly reason:'clock';readonly loss_extent:'known';readonly missing_sequence:string};
export interface ModuleEventBatch {readonly format:'leafseamer-module-event-batch/1';readonly capture:ModuleEventCapture;readonly after_sequence:string;readonly through_sequence:string;readonly events:readonly ModuleCapturedEvent[];}
export interface ModuleEventRead {readonly state:'active'|'failed';readonly highest_sequence:string;readonly failure:ModuleEventFailure|null;readonly batch:ModuleEventBatch;readonly batch_digest:string;}
export interface ModuleEventReceipt {readonly capture_id:string;readonly through_sequence:string;readonly batch_digest:string;}
export interface ModuleEventClosed {readonly capture_id:string;readonly last_sequence:string;readonly acknowledged_sequence:string;readonly discarded_events:number;readonly failure:ModuleEventFailure|null;}
export interface DeviceEventCapture {
 readonly api_version:'leafseamer-device-event-capture/1';
 start(input:ModuleCapture&{readonly signal:AbortSignal}):ModuleEventCapture|Promise<ModuleEventCapture>;
 read(input:ModuleCapture&{readonly signal:AbortSignal;readonly after_sequence:string;readonly max_events:number}):ModuleEventRead|Promise<ModuleEventRead>;
 acknowledge(input:ModuleCapture&ModuleEventReceipt&{readonly signal:AbortSignal}):ModuleEventReceipt|Promise<ModuleEventReceipt>;
 stop(input:ModuleCapture&{readonly signal:AbortSignal}):ModuleEventClosed|Promise<ModuleEventClosed>;
}
export interface ModuleExecutionReference {readonly id:string;readonly revision:'1';readonly digest:string;}
export interface DeviceModuleBodies {
 LOAD:{readonly runtime:object;readonly configuration:{readonly reference:ModuleReference<'configuration'>;readonly value:unknown}};
 LOADED:{readonly entry_id:string};
 CONNECT:ModuleSession;
 CONNECTED:ModuleSession&{readonly identity:Readonly<ModuleIdentity>;readonly catalog:ModuleCatalogProposal};
 CAPTURE:ModuleCapture;
 CAPTURED:ModuleCapture&{readonly value:unknown;readonly captured_tick_ns:string};
 DISCONNECT:ModuleSession;
 DISCONNECTED:ModuleSession;
 BIND_EXECUTION:ModuleSession&{readonly execution:{readonly ref:ModuleExecutionReference;readonly value:object}};
 EXECUTION_BOUND:ModuleSession&{readonly execution_ref:ModuleExecutionReference};
 EVENT_START:ModuleCapture;
 EVENT_STARTED:ModuleCapture&{readonly capture:ModuleEventCapture};
 EVENT_READ:ModuleCapture&{readonly after_sequence:string;readonly max_events:number};
 EVENT_BATCH:ModuleCapture&{readonly result:ModuleEventRead};
 EVENT_ACK:ModuleSession&ModuleEventReceipt;
 EVENT_ACKED:ModuleSession&ModuleEventReceipt;
 EVENT_STOP:ModuleCapture;
 EVENT_STOPPED:ModuleCapture&{readonly closed:ModuleEventClosed};
}
export type DeviceModuleType=keyof DeviceModuleBodies;
export type DeviceModuleFrame<T extends DeviceModuleType=DeviceModuleType> = {
 [K in T]:{
  readonly version:K extends `EVENT_${string}`?typeof deviceModuleEventProtocol:typeof deviceModuleProtocol|typeof deviceModuleEventProtocol;readonly type:K;readonly sequence:string;
  readonly request_id:string;readonly reply_to:K extends 'LOADED'|'CONNECTED'|'CAPTURED'|'DISCONNECTED'|'EXECUTION_BOUND'|'EVENT_STARTED'|'EVENT_BATCH'|'EVENT_ACKED'|'EVENT_STOPPED'?string:null;
  readonly binding:ModuleBinding;readonly issued_tick_ns:string;readonly deadline_tick_ns:string;
  readonly body:DeviceModuleBodies[K];
 }
}[T];
// 验证帧结构并冻结；载荷语义、规范JSON字节和当前运行权威由宿主核验。
export function validateDeviceModuleFrame(value:unknown):DeviceModuleFrame;
