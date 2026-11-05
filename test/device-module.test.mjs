import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDeviceModuleFrame,deviceModuleProtocol} from '../dist/device-module.mjs';
const frame=()=>({version:deviceModuleProtocol,type:'CAPTURE',sequence:'1',request_id:'request',reply_to:null,
 binding:{runtime_binding_ref:{kind:'runtime_binding',authority_service_id:'controller',database_instance_id:'database',object_id:'runtime',revision:'1',digest:'sha256:'+'1'.repeat(64)},ipc_session_id:'channel',member_boot_id:'worker'},
 issued_tick_ns:'18446744073709550000',deadline_tick_ns:'18446744073709551000',body:{device_id:'device',device_session_id:'session',capture_id:'capture'}});
test('设备模块帧保持字符串tick、固定运行身份和深冻结',()=>{
 const value=validateDeviceModuleFrame(frame());assert.equal(value.issued_tick_ns,'18446744073709550000');assert.ok(Object.isFrozen(value.binding.runtime_binding_ref));
 assert.throws(()=>{value.body.device_id='other';},TypeError);
});
test('设备模块入口拒绝跨通道、错方向、额外字段、数字tick和超长窗口',()=>{
 for(const change of [f=>f.version='ipc/0.14.0-continuation-draft.1',f=>f.type='DISPATCH',f=>f.reply_to='other',f=>f.extra=true,
  f=>f.sequence='0',f=>f.request_id='request\n',f=>f.binding.runtime_binding_ref.digest+='\n',f=>f.issued_tick_ns=1,
  f=>f.deadline_tick_ns=String(BigInt(f.issued_tick_ns)+2000000001n),f=>f.body.extra=true]){
  const value=frame();change(value);assert.throws(()=>validateDeviceModuleFrame(value));
 }
});
test('采样响应必须关联请求并将采样tick限定在原窗口',()=>{
 const value={...frame(),type:'CAPTURED',reply_to:'request',body:{...frame().body,value:{level:0},captured_tick_ns:'18446744073709550001'}};
 assert.equal(validateDeviceModuleFrame(value).body.value.level,0);
 for(const tick of ['18446744073709549999','18446744073709551000'])assert.throws(()=>validateDeviceModuleFrame({...value,body:{...value.body,captured_tick_ns:tick}}));
});
