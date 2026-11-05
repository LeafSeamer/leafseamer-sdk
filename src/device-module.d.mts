export const deviceModuleProtocol:'device-module/1';
export type Json= null|boolean|number|string|Json[]|{[key:string]:Json};
export type ModuleIdentity={kind:'virtual'|'physical';model:string;revision:string};
export interface DeviceModuleContext {readonly configuration:Json;readonly device_ids:readonly string[];readonly signal:AbortSignal;tick():bigint;}
export interface DeviceModule {
 readonly api_version:'leafseamer-device-module/1';
 connectReadOnly(input:{device_id:string;device_session_id:string;signal:AbortSignal}):Promise<ModuleIdentity>;
 captureBaseline(input:{device_id:string;device_session_id:string;capture_id:string;signal:AbortSignal}):Promise<Json>;
 stopReadOnly(input:{device_id:string;device_session_id:string;signal:AbortSignal}):Promise<void>;
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
export interface DeviceModuleBodies {
 LOAD:{readonly runtime:object;readonly configuration:{readonly reference:ModuleReference<'configuration'>;readonly value:unknown}};
 LOADED:{readonly entry_id:string};
 CONNECT:ModuleSession;
 CONNECTED:ModuleSession&{readonly identity:Readonly<ModuleIdentity>};
 CAPTURE:ModuleCapture;
 CAPTURED:ModuleCapture&{readonly value:unknown;readonly captured_tick_ns:string};
 DISCONNECT:ModuleSession;
 DISCONNECTED:ModuleSession;
}
export type DeviceModuleType=keyof DeviceModuleBodies;
export type DeviceModuleFrame<T extends DeviceModuleType=DeviceModuleType> = {
 [K in T]:{
  readonly version:typeof deviceModuleProtocol;readonly type:K;readonly sequence:string;
  readonly request_id:string;readonly reply_to:K extends 'LOADED'|'CONNECTED'|'CAPTURED'|'DISCONNECTED'?string:null;
  readonly binding:ModuleBinding;readonly issued_tick_ns:string;readonly deadline_tick_ns:string;
  readonly body:DeviceModuleBodies[K];
 }
}[T];
// 验证帧结构并冻结；载荷语义、规范JSON字节和当前运行权威由宿主核验。
export function validateDeviceModuleFrame(value:unknown):DeviceModuleFrame;
