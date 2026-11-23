import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import canonicalize from 'canonicalize';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const sdkRoot=process.env.LEAFSEAMER_SDK_RUNTIME_UNDER_TEST??fileURLToPath(new URL('../dist/',import.meta.url));assert.ok(path.isAbsolute(sdkRoot));
const load=name=>import(pathToFileURL(path.join(sdkRoot,name)));
const {validateEventTimeModel:validate,digestEventTimeModel:digest,verifyEventOrigin}=await load('event-time.mjs');
const {createHttpAdapter}=await load('http.mjs'),{contractSelection}=await load('index.mjs');
const {createDecoder}=await load('runtime/panel-wire/decoder.mjs');
const hash=v=>'sha256:'+crypto.createHash('sha256').update(canonicalize(v)).digest('hex'),zero='sha256:'+'0'.repeat(64);
const ref={id:'proof',revision:'1',digest:zero},scope={authority_service_id:'controller',database_instance_id:'db'};
const domain={...scope,provider_id:'provider',provider_boot_id:'boot',runtime_binding_ref:ref,clock_domain_id:'clock_'+'1'.repeat(64),descriptor_digest:zero,clock_generation:'1'};
const key={...scope,registration_id:'registration',source_stream_id:'stream',source_epoch:'epoch'};
const binding={registration_id:'registration',revision:'1',owner_service_id:'controller',database_instance_id:'db',provider_id:'provider',provider_boot_id:'boot',
 capture_policy_id:'policy',capture_policy_revision:'1',delivery_semantics:'discrete',target:{kind:'device',device_id:'device',trigger_id:'written',capability_version:'1.0.0'}};
const origin=()=>({source_key:structuredClone(key),binding_ref:structuredClone(binding),event_id:'event',source_sequence:'1',payload:{schema_ref:{kind:'schema',scope,object_id:'schema',revision:'1',digest:zero},value:{value:7}},source_time_ref:null});
async function evidencePair(){const o=origin(),e={id:'source-time',revision:'1',digest:zero,source_key:o.source_key,binding_ref:o.binding_ref,event_id:o.event_id,source_sequence:o.source_sequence,
 payload_digest:hash(o.payload),capture_semantics:'event_occurrence',capture_evidence_ref:ref,capture_domain:structuredClone(domain),capture_start_tick_ns:'100',capture_end_tick_ns:'101',elapsed_profile_ref:ref,reference_context_ref:null,utc_interval:null};
 e.digest=await digest('SourceTimeEvidence',e);o.source_time_ref={kind:'source_time_evidence',scope,object_id:e.id,revision:e.revision,digest:e.digest};return {o,e};}
test('内部来源帧传完整 Origin，公开通道维持原投影',async()=>{
 const codec=createDecoder(contractSelection);
 const envelope={format_version:'snapshot-projection/0.2.0-draft.1',type:'server.data',cursor:'1',previous_cursor:'0',delivery_mode:'reconcile',
  binding:{subscription_id:'subscription',publisher_service_id:'controller',publisher_database_instance_id:'db',stream_id:'stream',stream_epoch:'epoch',scope_digest:'a'.repeat(64),authorization_revision:'1',connection_generation:'1'}};
 for(const authority of ['controller','seamer']){
  const internal=codec.websocket(authority,'internalOpenEvents','server'),external=codec.websocket(authority,'openEvents','server');
  const decode=(value,root)=>codec.decode(Buffer.from(JSON.stringify(value)),root);
  const projectedEntry={entry_kind:'source.event',payload:{source_key:key,event_id:'event',source_sequence:'1',trigger_id:'written',capability_version:'1.0.0',
   occurred_at:null,observed_at:'2026-11-23T00:00:00.000Z',origin_digest:hash(origin()).slice(7),
   age_evidence_ref:{...scope,entity_kind:'age',entity_id:'evidence',entity_epoch:'epoch',revision:'1',content_digest:'b'.repeat(64)},
   payload:{schema_ref:{schema_id:'schema',definition:'value',schema_digest:'a'.repeat(64)},value:{value:7}}}};
  const projected={...envelope,entry:projectedEntry,payload_digest:hash(projectedEntry).slice(7)};
  assert.deepEqual((await decode(projected,external)).value.entry,projectedEntry);
  await assert.rejects(decode(projected,internal));
  for(const original of [origin(),(await evidencePair()).o]){
   const entry={entry_kind:'source.event',payload:{origin:original,origin_digest:hash(original)}};
   const frame={...envelope,entry,payload_digest:hash(entry).slice(7)};
   assert.deepEqual((await decode(frame,internal)).value.entry,entry);
   await assert.rejects(decode(frame,external));
   const missing=structuredClone(frame);delete missing.entry.payload.origin.source_time_ref;
   await assert.rejects(decode(missing,internal));
   const injected=structuredClone(frame);injected.entry.payload.age_evidence_ref=ref;
   await assert.rejects(decode(injected,internal));
  }
 }
 assert.throws(()=>createDecoder({contract_id:'leafseamer.api.v1.product8',contract_digest:'sha256:7a58cc7162a8d2ea39eb92b29118aa5a718ec55668210f67e974614af3d4cffa'}));
});
function age(basis){return {id:'age',revision:'1',digest:zero,origin_ref:{source_key:key,event_id:'event'},origin_digest:hash(origin()),receiver_domain:structuredClone(domain),
 first_receive_tick_ns:'110',evaluated_tick_ns:'120',elapsed_profile_ref:ref,lower_age_ms:0,upper_age_ms:1,qualification_refs:[ref],reason_codes:[],basis,
 ...({trusted_utc:{source_time_ref:{kind:'source_time_evidence',scope,object_id:'source-time',revision:'1',digest:zero},source_reference_context_ref:ref,receiver_reference_context_ref:ref,first_receive_utc:{lower_ns:'200',upper_ns:'201'},initial_age_ns:{lower_ns:'0',upper_ns:'2'}},
 causal_capture:{pending_capture_ref:ref,capture_receipt_ref:ref,challenge_sent_tick_ns:'90',received_tick_ns:'110'},
 local_capture:{source_time_ref:{kind:'source_time_evidence',scope,object_id:'source-time',revision:'1',digest:zero},capture_start_tick_ns:'100',capture_end_tick_ns:'101'},
 unproven:{elapsed_profile_ref:null,lower_age_ms:null,upper_age_ms:null,qualification_refs:[],reason_codes:['reference_unavailable']}}[basis])};}
test('Origin显式保留空时间引用，设备与数据源绑定分支封闭且原摘要包含全部字段',async()=>{
 const value=origin();validate('Origin',value);assert.equal(await digest('Origin',value),hash(value));await verifyEventOrigin(value);
 const omitted=structuredClone(value);delete omitted.source_time_ref;assert.throws(()=>validate('Origin',omitted));
 const old=structuredClone(value);Object.assign(old.binding_ref,old.binding_ref.target);delete old.binding_ref.target;assert.throws(()=>validate('Origin',old));
 const data=structuredClone(value),owned=kind=>({kind,scope,object_id:kind,revision:'1',digest:zero});
 data.binding_ref.target={kind:'data_source',source_ref:owned('data_source'),source_runtime_binding_ref:owned('runtime_binding'),observation_binding_ref:owned('source_observation_binding')};
 assert.throws(()=>validate('Origin',data));data.binding_ref.delivery_semantics='sampled';validate('Origin',data);
 data.binding_ref.target.device_id='device';assert.throws(()=>validate('Origin',data));delete data.binding_ref.target.device_id;
 data.binding_ref.target.source_ref={...data.binding_ref.target.source_ref,scope:{...scope,database_instance_id:'other'}};assert.throws(()=>validate('Origin',data));
});
test('事件来源保留真实设备及运行成员Id，拒绝非法字符或超长标识',()=>{
 const value=origin();value.binding_ref.provider_id='worker.member';value.binding_ref.target.device_id='device.synthetic';value.source_key.source_stream_id='stream:device.synthetic';value.event_id='event.1';validate('Origin',value);
 for(const bad of ['bad/id','bad\n','x'.repeat(129)]){const changed=structuredClone(value);changed.binding_ref.provider_id=bad;assert.throws(()=>validate('Origin',changed));}
});
test('来源时间原件没有摘要循环，错payload与重算摘要后的错身份均拒绝',async()=>{
 const {o,e}=await evidencePair();await verifyEventOrigin(o,e);const {digest:ignored,...body}=e;assert.equal(e.digest,hash(body));assert.equal(await digest('Origin',o),hash(o));
 assert.notEqual(hash(o),hash({...o,source_time_ref:null}));await assert.rejects(verifyEventOrigin(o),{code:'event_time_missing_evidence'});
 const changed=structuredClone(o);changed.payload.value.value=8;await assert.rejects(verifyEventOrigin(changed,e),{code:'event_time_evidence_binding'});
 const wrong=structuredClone(e);wrong.event_id='other';wrong.digest=await digest('SourceTimeEvidence',wrong);
 await assert.rejects(verifyEventOrigin({...o,source_time_ref:{...o.source_time_ref,digest:wrong.digest}},wrong),{code:'event_time_evidence_binding'});
 const foreign=structuredClone(o);foreign.source_time_ref.scope={...scope,authority_service_id:'other'};assert.throws(()=>validate('Origin',foreign));
});
test('来源捕获保留同域有序区间，UTC与参考原件成对存在且不接受零序号',async()=>{
 const {e}=await evidencePair();for(const change of [v=>{v.capture_end_tick_ns='99';},v=>{v.capture_domain.database_instance_id='other';},v=>{v.source_sequence='0';},
  v=>{v.reference_context_ref=ref;},v=>{v.utc_interval={lower_ns:'1',upper_ns:'2'};},v=>{v.reference_context_ref=ref;v.utc_interval={lower_ns:'2',upper_ns:'1'};}]){
  const changed=structuredClone(e);change(changed);assert.throws(()=>validate('SourceTimeEvidence',changed));
 }
 const utc={...e,reference_context_ref:ref,utc_interval:{lower_ns:'-2',upper_ns:'1'}};validate('SourceTimeEvidence',utc);
});
test('异步核验固定调用时原件，返回深冻结副本供消费，不受调用方随后修改影响',async()=>{
 const {o,e}=await evidencePair(),pending=verifyEventOrigin(o,e);o.payload.value.value=99;e.event_id='changed';
 const checked=await pending;assert.equal(checked.origin.payload.value.value,7);assert.equal(checked.source_time_evidence.event_id,'event');
 assert.ok(Object.isFrozen(checked));assert.ok(Object.isFrozen(checked.origin.payload.value));assert.ok(Object.isFrozen(checked.source_time_evidence.capture_domain));
 const invalid=await evidencePair();invalid.o.payload.value.value=99;const rejected=verifyEventOrigin(invalid.o,invalid.e);invalid.o.payload.value.value=7;
 await assert.rejects(rejected,{code:'event_time_evidence_binding'});
});
test('四种年龄依据不混用，未知年龄不补零，跨域与时间倒序拒绝',()=>{
 for(const basis of ['trusted_utc','causal_capture','local_capture','unproven'])validate('AgeEvidence',age(basis));
 for(const [basis,change]of [['unproven',v=>{v.upper_age_ms=0;}],['unproven',v=>{v.reason_codes=[];}],['unproven',v=>{v.capture_start_tick_ns='1';}],
  ['trusted_utc',v=>{v.initial_age_ns.lower_ns='-1';}],['causal_capture',v=>{v.challenge_sent_tick_ns='111';}],['causal_capture',v=>{v.received_tick_ns='121';}],
  ['local_capture',v=>{v.receiver_domain.database_instance_id='other';}],['local_capture',v=>{v.capture_end_tick_ns='111';}],
  ['local_capture',v=>{v.upper_age_ms=-0;}],['local_capture',v=>{v.lower_age_ms=2;}],['causal_capture',v=>{v.lower_age_ms=1;}],['unproven',v=>{v.evaluated_tick_ns='109';}]]){
  const value=age(basis);change(value);assert.throws(()=>validate('AgeEvidence',value));
 }
});
test('双方事件证据读取采用配对mTLS、精确摘要和no-store，实际HTTP编解码采用新选择',async()=>{
 const adapter=createHttpAdapter(contractSelection),{e}=await evidencePair();
 for(const authority of ['controller','seamer']){
  const api=JSON.parse(fs.readFileSync(path.join(sdkRoot,'contract',authority+'.openapi.json')));
  for(const [route,operation,body]of [['source-times','getSourceTimeEvidence',e],['age-evidence','getEventAgeEvidence',age('unproven')]]){
   const op=api.paths['/internal/events/'+route+'/{id}/{revision}'].get;assert.equal(op.operationId,operation);assert.equal(op['x-permission'],'events.internal.read');
   assert.deepEqual(op.security,[{'time_internal__pairedMTLS':[]}]);assert.equal(op.parameters.find(p=>p.name==='digest').required,true);
   assert.equal(op.responses['200'].headers['Cache-Control'].schema.const,'no-store');
   const headers=[['X-LeafSeamer-Contract',contractSelection.contract_id],['X-LeafSeamer-Contract-Digest',contractSelection.contract_digest]],url='/internal/events/'+route+'/'+body.id+'/1?digest='+encodeURIComponent(body.digest);
   const request=adapter.prepareRequest(authority,'GET',url,headers),response=adapter.prepareResponse(request,'200',[...headers,['Content-Type','application/json'],['Cache-Control','no-store']]);
   assert.deepEqual((await adapter.decodeResponse(Buffer.from(JSON.stringify(body)),response)).value,body);
  }
 }
});
