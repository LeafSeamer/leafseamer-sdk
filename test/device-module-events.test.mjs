import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDeviceModuleFrame,deviceModuleProtocol,deviceModuleEventProtocol} from '../dist/device-module.mjs';
const digest='sha256:'+'1'.repeat(64),identity={device_id:'device',device_session_id:'session',capture_id:'capture'};
const capture={format:'leafseamer-module-event-capture/1',...identity,event_type:'value.written',started_tick_ns:'10',baseline:{write_sequence:'0'}};
const event={event_id:'event.1',sequence:'1',event_type:'value.written',payload:{value:7,write_sequence:'1'},capture_interval:{before_tick_ns:'12',after_tick_ns:'13'}};
function frame(type,body,response=false){return {version:deviceModuleEventProtocol,type,sequence:'3',request_id:'request',reply_to:response?'prior':null,
 binding:{runtime_binding_ref:{kind:'runtime_binding',authority_service_id:'controller',database_instance_id:'database',object_id:'runtime',revision:'1',digest},ipc_session_id:'channel',member_boot_id:'worker'},issued_tick_ns:'20',deadline_tick_ns:'100',body:{...identity,...body}};}
function batch(){return frame('EVENT_BATCH',{result:{state:'active',highest_sequence:'1',failure:null,batch:{format:'leafseamer-module-event-batch/1',capture,after_sequence:'0',through_sequence:'1',events:[event]},batch_digest:digest}},true);}
test('v4显式采集帧和v3原连接并存，v3不能携带事件操作',()=>{
 const start=frame('EVENT_START',{});assert.equal(validateDeviceModuleFrame(start).version,deviceModuleEventProtocol);
 assert.throws(()=>validateDeviceModuleFrame({...start,version:deviceModuleProtocol}));
 assert.equal(validateDeviceModuleFrame({...frame('CAPTURE',{}),version:deviceModuleProtocol}).type,'CAPTURE');
 for(const [type,body,response]of [['EVENT_READ',{after_sequence:'0',max_events:32},false],['EVENT_ACK',{through_sequence:'0',batch_digest:digest},false],['EVENT_ACKED',{through_sequence:'0',batch_digest:digest},true],['EVENT_STOP',{},false]])assert.equal(validateDeviceModuleFrame(frame(type,body,response)).type,type);
 const started=frame('EVENT_STARTED',{capture:{...capture,started_tick_ns:'21'}},true);assert.ok(Object.isFrozen(validateDeviceModuleFrame(started).body.capture.baseline));
 assert.throws(()=>validateDeviceModuleFrame(frame('EVENT_STARTED',{capture},true)));
});
test('原采集区间可以早于读取请求，但批次必须连续、同代际且严格有界',()=>{
 assert.equal(validateDeviceModuleFrame(batch()).body.result.batch.events[0].capture_interval.before_tick_ns,'12');
 const changes=[v=>v.body.result.batch.capture.device_session_id='other',v=>v.body.result.batch.capture.started_tick_ns='101',v=>v.body.result.batch.after_sequence='1',v=>v.body.result.batch.events[0].sequence='2',v=>v.body.result.batch.events[0].event_type='other',v=>v.body.result.batch.events[0].capture_interval.after_tick_ns='100',v=>v.body.result.batch.events[0].payload={text:'a'.repeat(1024)},v=>v.body.result.batch.events[0].payload={value:NaN},v=>v.body.result.highest_sequence='0',v=>v.body.result.batch.events.push(structuredClone(event))];
 for(const change of changes){const v=structuredClone(batch());change(v);assert.throws(()=>validateDeviceModuleFrame(v));}
 for(const max_events of [0,33,1.5])assert.throws(()=>validateDeviceModuleFrame(frame('EVENT_READ',{after_sequence:'0',max_events})));
 const v=structuredClone(batch());let nested={};for(let i=0;i<18;i++)nested={nested};v.body.result.batch.events[0].payload=nested;assert.throws(()=>validateDeviceModuleFrame(v));
});
test('已知缺口不能被完整事件覆盖，停止数量须覆盖全部未确认事件和缺失序号',()=>{
 const v=structuredClone(batch());v.body.result.state='failed';v.body.result.highest_sequence='2';v.body.result.failure={reason:'clock',loss_extent:'known',missing_sequence:'2'};
 assert.equal(validateDeviceModuleFrame(v).body.result.failure.missing_sequence,'2');
 const bad=structuredClone(v);bad.body.result.failure.missing_sequence='1';assert.throws(()=>validateDeviceModuleFrame(bad));
 assert.throws(()=>validateDeviceModuleFrame({...v,body:{...v.body,result:{...v.body.result,state:'active'}}}));
 const closed={capture_id:'capture',last_sequence:'2',acknowledged_sequence:'0',discarded_events:1,failure:v.body.result.failure};
 assert.equal(validateDeviceModuleFrame(frame('EVENT_STOPPED',{closed},true)).body.closed.discarded_events,1);
 assert.throws(()=>validateDeviceModuleFrame(frame('EVENT_STOPPED',{closed:{...closed,discarded_events:2}},true)));
});
