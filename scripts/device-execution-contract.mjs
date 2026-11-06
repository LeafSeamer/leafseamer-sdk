// 类型与运行消息目录来自同一产品生成图；不人工维护第二份52消息联合。
export function buildDeviceExecution(productFiles){
 const messages=JSON.parse(productFiles.get('contract/worker-messages.json'));
 const graph=JSON.parse(productFiles.get('contract/models.schema.json'));
 const fields=[];
 for(const message of messages.messages){
  const name=message.schema_ref.slice(message.schema_ref.lastIndexOf('/')+1);
  if(!Object.hasOwn(graph.$defs,name)||!['c2w','w2c'].includes(message.direction))throw new Error('execution_model_binding');
  fields.push(` readonly ${JSON.stringify(message.type)}: {readonly direction:${JSON.stringify(message.direction)};readonly frame:components['schemas'][${JSON.stringify(name)}]};`);
 }
 const text=`import type {components} from './runtime/panel-client/preview/controller.js';
export interface DeviceExecutionMap {\n${fields.join('\n')}\n}
export type DeviceExecutionType=keyof DeviceExecutionMap;
export type DeviceExecutionFrame=DeviceExecutionMap[DeviceExecutionType]['frame'];
export type DeviceExecutionDirection='c2w'|'w2c';
export const deviceExecutionVersion:${JSON.stringify(messages.ipc_version)};
export const deviceExecutionMessages:readonly Readonly<{type:DeviceExecutionType;direction:DeviceExecutionDirection;reply_to_types:readonly DeviceExecutionType[]}>[];
export const deviceExecutionCapabilities:Readonly<{known:readonly string[];base:readonly string[];manual:readonly string[];panel:readonly string[];automation:readonly string[];cancel:readonly string[];reference:readonly string[];initial_control:readonly string[];without_reference:readonly string[]}>;
export function validateDeviceExecutionFeatures(features:readonly string[]):readonly string[];
export function selectDeviceExecutionFeatures(offered:readonly string[],implemented:readonly string[]):readonly string[];
/** 在严格解码之后、领域副作用之前检查；不替代Schema或授权。 */
export function assertDeviceExecutionFeatures(frame:Readonly<{type:DeviceExecutionType;body:unknown;journal_mode?:string}>,selected:readonly string[]):void;
export function createDeviceExecutionCodec(selection:Readonly<{contract_id:string;contract_digest:string}>):Readonly<{
 selection:Readonly<{contract_id:string;contract_digest:string}>;version:typeof deviceExecutionVersion;messages:typeof deviceExecutionMessages;
 decode<T extends DeviceExecutionType>(bytes:Uint8Array,direction:DeviceExecutionMap[NoInfer<T>]['direction'],type:T):Promise<DeviceExecutionMap[T]['frame']>;
}>;
`;
 return new Map([['device-execution.d.mts',Buffer.from(text)],['execution-capabilities.mjs',Buffer.from(
  'export const capabilities='+productFiles.get('contract/execution-capabilities.json').toString().trim()+';\n')]]);
}
