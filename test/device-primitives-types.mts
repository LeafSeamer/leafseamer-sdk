import type {DeviceModule,DevicePrimitiveExecutor,ModuleSession} from '../dist/device-module.mjs';
declare const module:DeviceModule,session:ModuleSession,signal:AbortSignal;
if(module.execution){
 const bytes:Uint8Array=await module.execution.encodePrimitive({...session,signal,primitive_id:'virtual.set',parameters:{value:1}});
 const result=await module.execution.writePrimitive({...session,signal,bytes});
 const count:number=result.bytes_written;void count;
 // @ts-expect-error 原始传输观察不能充当命令完成证据。
 result.command_succeeded;
 // @ts-expect-error 编码输入不能由完成回调替代。
 module.execution.encodePrimitive({...session,signal,primitive_id:'virtual.set',parameters:()=>true});
}
const executor:DevicePrimitiveExecutor={api_version:'leafseamer-device-primitives/1',
 async encodePrimitive(){return new Uint8Array(1);},async writePrimitive(){return {bytes_written:1,response:null};}};
void executor;
