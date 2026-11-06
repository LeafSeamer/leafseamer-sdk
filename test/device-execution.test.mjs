import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import canonicalize from 'canonicalize';
import {createDeviceExecutionCodec,deviceExecutionVersion,deviceExecutionMessages,deviceExecutionCapabilities as caps,
 validateDeviceExecutionFeatures,selectDeviceExecutionFeatures,assertDeviceExecutionFeatures} from '../dist/device-execution.mjs';
import {contractSelection} from '../dist/index.mjs';
const codec=createDeviceExecutionCodec(contractSelection);
const close=()=>({ipc_version:deviceExecutionVersion,type:'CLOSE_GATE',message_id:'close.message',reply_to:null,
 ipc_session_id:'ipc',controller_boot_id:'core',worker_boot_id:'worker',seq:'1',device_id:null,
 body:{close_id:'close',reason:'test',scope:'controller'},clock_domain_id:'clock_'+'1'.repeat(64),descriptor_digest:'sha256:'+'2'.repeat(64),journal_mode:'durable'});
const bytes=value=>Buffer.from(JSON.stringify(value));
test('执行IPC入口采用产品选择及全部52种原消息方向与响应关系',()=>{
 const source=JSON.parse(fs.readFileSync(new URL('../dist/contract/worker-messages.json',import.meta.url)));
 assert.equal(deviceExecutionMessages.length,52);assert.equal(deviceExecutionVersion,source.ipc_version);
 assert.deepEqual(deviceExecutionMessages,source.messages.map(({type,direction,reply_to_types})=>({type,direction,reply_to_types})));
 assert.throws(()=>createDeviceExecutionCodec({...contractSelection,contract_digest:'sha256:'+'0'.repeat(64)}));
 assert.ok(deviceExecutionMessages.every(m=>Object.isFrozen(m.reply_to_types)));
});
test('执行IPC拒绝错方向、版本、重复键及跨通道帧',async()=>{
 const original=close();assert.deepEqual(await codec.decode(bytes(original),'c2w','CLOSE_GATE'),original);
 await assert.rejects(codec.decode(bytes(original),'w2c','CLOSE_GATE'));
 for(const value of [{...original,ipc_version:'device-module/2'},{...original,seq:'01'},{...original,extra:true}])
  await assert.rejects(codec.decode(bytes(value),'c2w','CLOSE_GATE'));
 await assert.rejects(codec.decode(Buffer.from('{"seq":"2",'+JSON.stringify(original).slice(1)),'c2w','CLOSE_GATE'));
 await assert.rejects(codec.decode(Buffer.from([0xff]),'c2w','CLOSE_GATE'));
});
test('终端紧急关闭保留null序号与controller范围，普通模式不能借此跳号',async()=>{
 const value={...close(),seq:null,journal_mode:'volatile_close'};
 assert.deepEqual(await codec.decode(bytes(value),'c2w','CLOSE_GATE'),value);
 for(const changed of [{...value,journal_mode:'durable'},{...value,seq:'1'},
  {...value,device_id:'device',body:{...value.body,scope:'device'}}])await assert.rejects(codec.decode(bytes(changed),'c2w','CLOSE_GATE'));
});
test('新版本以实际能力交集握手，旧版本与缺依赖宣告均拒绝',async()=>{
 const source={descriptor_version:'clock-domain/1',domain_kind:'supervised_runtime',authority_service_id:'controller',runtime_generation:'generation',supervisor_instance_id:'supervisor',
  clock_backend_id:'windows_interrupt_precise',clock_backend_revision:'1',tick_unit:'ns',suspend_accounting:'included',namespace_identity:'windows-global',
  os_boot_identity:{status:'unavailable'},platform_profile_id:'profile',platform_profile_revision:'1'};
 const digest='sha256:'+crypto.createHash('sha256').update(canonicalize(source)).digest('hex');
 const descriptor={...source,descriptor_digest:digest,clock_domain_id:'clock_'+digest.slice(7)};
 const hello={...close(),type:'HELLO',clock_domain_id:descriptor.clock_domain_id,descriptor_digest:digest,body:{module_id:'module',module_digest:digest,
  clock_domain_id:descriptor.clock_domain_id,descriptor_digest:digest,clock_domain_descriptor:descriptor,
  supported_ipc_versions:[deviceExecutionVersion],supported_features:caps.base}};
 assert.deepEqual(await codec.decode(bytes(hello),'w2c','HELLO'),hello);
 for(const features of [[...caps.base,'unknown'],[...caps.base,caps.base[0]],caps.base.slice(1),[...caps.base,'automation_origin_binding']]){
  assert.throws(()=>validateDeviceExecutionFeatures(features));
  await assert.rejects(codec.decode(bytes({...hello,body:{...hello.body,supported_features:features}}),'w2c','HELLO'));
 }
 await assert.rejects(codec.decode(bytes({...hello,ipc_version:'ipc/0.14.0-continuation-draft.1'}),'w2c','HELLO'));
 assert.deepEqual(selectDeviceExecutionFeatures(caps.known,[...caps.base,...caps.manual]),[...caps.base,...caps.manual]);
 assert.ok(Object.isFrozen(caps.manual));assert.ok(Object.isFrozen(validateDeviceExecutionFeatures(caps.base)));
});
test('消息目录全部绑定能力，普通路径拒绝未协商业务分支且不误读设备参数',()=>{
 const manual=[...caps.base,...caps.manual],check=(type,body={})=>assertDeviceExecutionFeatures({type,body},manual);
 assertDeviceExecutionFeatures(close(),caps.base);
 for(const message of deviceExecutionMessages){assertDeviceExecutionFeatures({type:message.type,body:{}},caps.known);
  if(!['HELLO','HELLO_ACK','CLOSE_GATE','CLOSE_GATE_ACK'].includes(message.type))assert.throws(()=>assertDeviceExecutionFeatures({type:message.type,body:{}},caps.base));}
 check('ENCODE_PACKET',{request:{origin:'manual',dispatch:{mode:'immediate'},parameters:{origin:'automation',time_required:true}}});
 for(const [type,body] of [
  ['ENCODE_PACKET',{request:{origin:'automation'}}],['ENCODE_PACKET',{request:{dispatch:{mode:'scheduled'}}}],
  ['GUARD_INSTALL',{guard:{admission_origin:'panel'}}],['GUARD_INSTALL',{guard:{time_required:true}}],
  ['FENCE',{open_transmission_intents:[{kind:'initial',intent:{origin:'automation'}}]}],
  ['FENCE',{open_transmission_intents:[{kind:'protocol_resend',intent:{origin:'manual'}}]}],
  ['FENCE',{cancel_transmissions:[{}]}],['OPEN_GATE',{run_deny_snapshot:{entries:[{}]}}],
  ['OPEN_GATE',{command_deny_snapshot:{entries:[{}]}}],['OPEN_GATE',{gate_access:{purpose:'protection'}}],
  ['ENCODE_CANCEL_PACKET',{}],['RUN_FENCE',{}],['TIME_FENCE',{}],['DISPATCH_CANCEL',{}],['RESEND_REQUEST',{}]
 ])assert.throws(()=>check(type,body),/execution_feature_missing/);
});

test('初始控制屏障协商只准许零签发首尝试，不授普通OPEN或非空账本资格',()=>{
 const selected=[...caps.base,...caps.initial_control];
 const request={type:'FENCE',body:{issued_cut_revision:'0',target_gate_revision:'1',attempt_binding:{attempt_ordinal:'1',previous_barrier_id:null},open_intents:[],open_transmission_intents:[],cancel_transmissions:[]}};
 const ack={type:'FENCE_ACK',body:{issued_cut_revision:'0',gate_revision:'1',attempt_binding:request.body.attempt_binding,coverage:[],transmission_coverage:[],cancel_coverage:[],
  ack:{all_write_exits_fenced:true,discarded_permit_ids:[],in_flight_command_ids:[],unresolved_command_ids:[]}}};
 for(const frame of [request,ack]){assertDeviceExecutionFeatures(frame,selected);assert.throws(()=>assertDeviceExecutionFeatures(frame,caps.base));}
 for(const changed of [{issued_cut_revision:'1'},{target_gate_revision:'2'},{attempt_binding:{attempt_ordinal:'2',previous_barrier_id:'prior'}},{open_intents:[{}]},{open_transmission_intents:[{}]},{cancel_transmissions:[{}]}])
  assert.throws(()=>assertDeviceExecutionFeatures({...request,body:{...request.body,...changed}},selected));
 assert.throws(()=>assertDeviceExecutionFeatures({...ack,body:{...ack.body,coverage:[{}]}},selected));
 for(const type of ['OPEN_GATE','GATE_FENCE','ENCODE_PACKET','GUARD_INSTALL','DISPATCH','AUTH_FENCE','RUN_FENCE'])assert.throws(()=>assertDeviceExecutionFeatures({type,body:{}},selected));
});

test('显式无参考时间OPEN及ACK严格解码，能力缺失或已协商参考时间时拒绝省略',async()=>{
 const hash=value=>'sha256:'+crypto.createHash('sha256').update(canonicalize(value)).digest('hex'),ref=id=>({id,revision:'1',digest:hash(id)});
 const envelope={...close(),type:'OPEN_GATE',device_id:'device'},scope={authority_service_id:'controller',database_instance_id:'database'};
 const binding={scope,controller_boot_id:envelope.controller_boot_id,worker_boot_id:envelope.worker_boot_id,ipc_session_id:envelope.ipc_session_id,
  writer_exit_id:'exit',device_id:'device',device_session_id:'session',clock_domain_id:envelope.clock_domain_id,descriptor_digest:envelope.descriptor_digest};
 const a={format_version:'gate-access/0.1.0-draft.1',access_id:'access',revision:'1',purpose:'ordinary',binding,control_authority_ref:ref('control'),
  control_epoch:'epoch',effective_version:'1',authorization_ref:ref('authorization'),resource_safety_ref:ref('resource'),gate_safety_ref:ref('gate'),
  protection:null,initial_assessment_ref:null,selected_tick_ns:'1',expires_tick_ns:'100'};
 const run={controller_scope:scope,snapshot_revision:'0',entries:[]},command={scope,device_id:'device',snapshot_revision:'0',entries:[]};
 const frame={...envelope,body:{barrier_id:'barrier',gate_token:'token',device_session_id:'session',control_epoch:'epoch',control_version:'1',gate_revision:'1',authorization_revision:'1',
  clock_domain_id:envelope.clock_domain_id,lease_until_tick_ns:'100',descriptor_digest:envelope.descriptor_digest,
  run_deny_snapshot:{...run,snapshot_digest:hash(run)},command_deny_snapshot:{...command,snapshot_digest:hash(command)},reference_time_snapshot:null,
  gate_access:{...a,access_digest:hash(a)},protection_assessment:null}};
 const ack={...frame,type:'OPEN_GATE_ACK',message_id:'ack',reply_to:frame.message_id,body:{gate_token:'token',gate_revision:'1',state:'open',
  run_deny_snapshot_revision:'0',run_deny_snapshot_digest:hash(run),command_deny_snapshot_revision:'0',command_deny_snapshot_digest:hash(command),
  reference_time_snapshot_ref:null,gate_access_ref:ref('access')}};
 const manual=[...caps.base,...caps.manual],selected=[...manual,...caps.without_reference];
 for(const [value,direction] of [[frame,'c2w'],[ack,'w2c']]){
  assert.deepEqual(await codec.decode(bytes(value),direction,value.type),value);assertDeviceExecutionFeatures(value,selected);
  assert.throws(()=>assertDeviceExecutionFeatures(value,manual),/execution_feature_missing:reference_time_absent/);
  assert.throws(()=>assertDeviceExecutionFeatures(value,[...selected,...caps.reference]),/execution_reference_snapshot_required/);
  await assert.rejects(codec.decode(bytes({...value,ipc_version:'ipc/0.15.0-negotiated-draft.1'}),direction,value.type));
 }
 const missing=structuredClone(frame);delete missing.body.reference_time_snapshot;await assert.rejects(codec.decode(bytes(missing),'c2w','OPEN_GATE'));
 for(const [type,body] of [['TIME_FENCE',{}],['GUARD_INSTALL',{guard:{time_required:true}}],['GUARD_INSTALL',{guard:{reference_time:{}}}],
  ['ENCODE_PACKET',{request:{dispatch:{mode:'scheduled'}}}]])assert.throws(()=>assertDeviceExecutionFeatures({type,body},selected),/execution_feature_missing/);
});
