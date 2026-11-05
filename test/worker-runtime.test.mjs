import test from 'node:test';
import assert from 'node:assert/strict';
import {decodeWorkerIntent, decodeWorkerLoadMaterials, decodeWorkerControl, decodeSourceWorker, decodeSourceBinding, decodeSourceRuntimeBinding, workerControlVersion, workerRuntimeSelection} from '../dist/worker-runtime.mjs';
const digest = 'sha256:' + '1'.repeat(64), bytes = value => Buffer.from(JSON.stringify(value));
const context = {authority: 'controller', service_id: 'service', database_instance_id: 'database'};
const ref = kind => ({kind, authority_service_id: 'service', database_instance_id: 'database', object_id: kind, revision: '1', digest});
function intent() {
  return {launch_id: 'worker', service_id: 'service', supervisor_instance_id: 'supervisor', runtime_generation: 'generation', member_id: 'member', role: 'worker',
    artifact_manifest_ref: {manifest_id: 'bundle', revision: '1', digest}, containment_ref: {group_id: 'group', generation: 'generation', backend: 'windows_job'},
    object_scope: {kind: 'devices', device_ids: ['device.a', 'device.b']}, policy_revision: '1',
    extension_binding: {installation_ref: ref('installation'), approval_ref: ref('approval'), review_ref: ref('review'), role_resolution_ref: ref('role_resolution'),
      configuration_ref: ref('configuration'), intake_ref: ref('intake'), platform_profile_ref: ref('platform_profile'), host_installation_id: 'host', host_trust_epoch: '1',
      manifest_digest: digest, artifact_set_digest: digest, entry_id: 'simulator', permissions_digest: digest}};
}
test('完整worker意图保留扩展绑定与两种对象范围，旧字段和跨权威范围拒绝', async () => {
  const value = intent(); assert.deepEqual(await decodeWorkerIntent(bytes(value), context), value);
  assert.equal(workerRuntimeSelection.control_version, workerControlVersion);
  const {object_scope, ...old} = value;
  await assert.rejects(decodeWorkerIntent(bytes({...old, device_ids: object_scope.device_ids}), context));
  await assert.rejects(decodeWorkerIntent(bytes({...value, role: 'core'}), context));
  await assert.rejects(decodeWorkerIntent(bytes({...value, extension_binding: {...value.extension_binding, approval_ref: {...ref('approval'), database_instance_id: 'other'}}}), context));
  for (const device_ids of [[], ['z', 'a'], ['a', 'a']]) await assert.rejects(decodeWorkerIntent(bytes({...value, object_scope: {kind: 'devices', device_ids}}), context));
  const source = {...value, object_scope: {kind: 'data_sources', source_refs: [ref('source')], data_object_refs: [ref('data_object')]}};
  assert.deepEqual(await decodeWorkerIntent(bytes(source), {...context, authority: 'seamer'}), source);
  await assert.rejects(decodeWorkerIntent(bytes(source), context));
  await assert.rejects(decodeWorkerIntent(bytes(value), {...context, authority: 'seamer'}));
  await assert.rejects(decodeWorkerIntent(bytes({...source, object_scope: {...source.object_scope, source_refs: [ref('source'), {...ref('source'), revision: '2'}]}}), {...context, authority: 'seamer'}));
});

test('新版监督通道不回退旧版本，注册报文包含完整新意图', async () => {
  const domain = {clock_domain_id: 'clock_' + '1'.repeat(64), descriptor_digest: digest};
  const grant = {authorization_ref: ref('launch_authorization'), launch_id: 'worker', launch_intent_digest: digest, installation_ref: ref('installation'),
    approval_ref: ref('approval'), role_resolution_ref: ref('role_resolution'), permissions_digest: digest, supervisor_instance_id: 'supervisor', fence_revision: '1',
    lifetime: {clock: domain, issued_tick: '1', deadline_tick: '2000000001'}};
  const frame = {version: workerControlVersion, type: 'LAUNCH_REGISTER', scope: {service_id: 'service', database_instance_id: 'database', supervisor_instance_id: 'supervisor', domain_ref: domain},
    channel_id: 'channel', sequence: '1', message_id: 'message', reply_to: null, payload: {intent: intent(), authorization: grant}};
  assert.deepEqual(await decodeWorkerControl(bytes(frame), 'LAUNCH_REGISTER'), frame);
  await assert.rejects(decodeWorkerControl(bytes({...frame, version: 'supervisor-control/0.1.0-draft.1'}), 'LAUNCH_REGISTER'));
  await assert.rejects(decodeWorkerControl(bytes(frame), 'LAUNCH_CREATE'));
  await assert.rejects(decodeWorkerControl(bytes({...frame, payload: {...frame.payload, intent: {...intent(), device_ids: ['device.a']}}}), 'LAUNCH_REGISTER'));
});

test('物化观察三种状态及完整本地域寿命严格校验', async () => {
  const domain = {clock_domain_id: 'clock_' + '1'.repeat(64), descriptor_digest: digest};
  const request = {key: {launch_id: 'worker', launch_intent_digest: digest}, observation_request_id: 'observation'};
  const frame = {version: workerControlVersion, type: 'LAUNCH_MATERIALIZE',
    scope: {service_id: 'service', database_instance_id: 'database', supervisor_instance_id: 'supervisor', domain_ref: domain},
    channel_id: 'channel', sequence: '1', message_id: 'message', reply_to: null, payload: request};
  assert.deepEqual(await decodeWorkerControl(bytes(frame), frame.type), frame);
  await assert.rejects(decodeWorkerControl(bytes({...frame, version: 'supervisor-control/0.2.0-draft.1'}), frame.type));
  const observation = {materialization_evidence_id: 'evidence', materialization_challenge_id: 'challenge',
    lifetime: {clock: domain, issued_tick: '1', deadline_tick: '5000000001'}};
  const response = {...frame, type: 'MATERIALIZATION_RESULT', reply_to: 'request', payload: {...request, status: 'verified', observation}};
  assert.deepEqual(await decodeWorkerControl(bytes(response), response.type), response);
  for (const status of ['pending', 'unavailable']) {
    const value = {...response, payload: {...request, status, observation: null}};
    assert.deepEqual(await decodeWorkerControl(bytes(value), value.type), value);
    await assert.rejects(decodeWorkerControl(bytes({...value, payload: {...value.payload, observation}}), value.type));
  }
  for (const lifetime of [{...observation.lifetime, deadline_tick: '5000000002'}, {...observation.lifetime, deadline_tick: '1'},
    {...observation.lifetime, clock: {...domain, descriptor_digest: 'sha256:' + '2'.repeat(64)}}]) {
    await assert.rejects(decodeWorkerControl(bytes({...response, payload: {...response.payload, observation: {...observation, lifetime}}}), response.type));
  }
  await assert.rejects(decodeWorkerControl(bytes({...response, payload: {...response.payload, observation: null}}), response.type));
});

function sourceFrames() {
  const capture = {capture_id: 'capture', capture_ordinal: '1'}, bound = {...capture, request_digest: digest};
  const domain = {clock_domain_id: 'clock_' + '1'.repeat(64), descriptor_digest: digest};
  const bodies = {
    CAPTURE: {...capture, source_ref: ref('source'), purpose: 'sampled_observation', query_ref: ref('source_query'), mapping_ref: ref('mapping'), capture_policy_ref: ref('capture_policy'),
      domain_ref: domain, issued_tick: '1', deadline_tick: '10000000001', result_budget: {max_rows: 10000, max_response_bytes: 8388608}},
    CAPTURE_RESULT: {...bound, started_tick: '1', finished_tick: '2', raw_response: {encoding: 'base64', bytes: 'AA==', digest, byte_length: 1},
      metadata: {content_type: 'application/json', source_revision: null}, coherence: 'single_response', complete: true, content_digest: digest},
    CAPTURE_FAILED: {...bound, reason: 'outcome_unavailable', last_stage: 'queued'},
    CAPTURE_ACK: {...bound, receipt_ref: ref('capture_receipt')},
    CANCEL: {...bound, cancel_id: 'cancel'},
    CANCEL_ACK: {...bound, cancel_id: 'cancel', state: 'pending', result_digest: null},
    STOP: {stop_id: 'stop', last_capture_sender_sequence: '1', capture_set_digest: digest},
    STOP_ACK: {stop_id: 'stop', capture_set_digest: digest, captures: [{...capture, state: 'awaiting_ack'}]},
  };
  return Object.entries(bodies).map(([type, body]) => ({protocol: 'source-worker/1', runtime_binding_ref: ref('source_runtime_binding'), ipc_session_id: 'session', sender_sequence: '1', type, body}));
}
test('八种来源采集帧严格隔离方向、容量、固定截止和规范原始字节封装', async () => {
  const frames = sourceFrames();
  for (const frame of frames) assert.deepEqual(await decodeSourceWorker(bytes(frame), frame.type), frame);
  assert.equal((await decodeSourceWorker(bytes({...frames[1], body: {...frames[1].body, metadata: {...frames[1].body.metadata, source_revision: 'W/"revision"'}}}), 'CAPTURE_RESULT')).body.metadata.source_revision, 'W/"revision"');
  await assert.rejects(decodeSourceWorker(bytes(frames[0]), 'CAPTURE_RESULT'));
  await assert.rejects(decodeSourceWorker(bytes({...frames[0], body: {...frames[0].body, deadline_tick: '10000000002'}}), 'CAPTURE'));
  await assert.rejects(decodeSourceWorker(bytes({...frames[2], body: {...frames[2].body, error: 'private exception'}}), 'CAPTURE_FAILED'));
  for (const bad of ['AB==', 'A===', 'AA', 'AA\n=']) await assert.rejects(decodeSourceWorker(bytes({...frames[1], body: {...frames[1].body, raw_response: {...frames[1].body.raw_response, bytes: bad}}}), 'CAPTURE_RESULT'));
  const stop = frames[7];
  await assert.rejects(decodeSourceWorker(bytes({...stop, body: {...stop.body, captures: [...stop.body.captures, {...stop.body.captures[0], capture_ordinal: '2'}]}}), 'STOP_ACK'));
  const large = {...frames[1], body: {...frames[1].body, raw_response: {...frames[1].body.raw_response, bytes: Buffer.alloc(8388608).toString('base64'), byte_length: 8388608}}};
  assert.equal((await decodeSourceWorker(bytes(large), 'CAPTURE_RESULT')).body.raw_response.byte_length, 8388608);
  await assert.rejects(decodeSourceWorker(new Uint8Array(16777217), 'CAPTURE_RESULT'));
});

test('来源运行绑定与C05身份分支使用同权威Ref，数据源不能伪造设备身份', async () => {
  const runtime = {binding_id: 'binding', revision: '1', scope: {authority_service_id: 'service', database_instance_id: 'database'}, source_ref: ref('source'),
    configuration_ref: ref('configuration'), mapping_ref: ref('mapping'), capture_policy_ref: ref('capture_policy'), launch_intent_ref: ref('launch_intent'), launch_record_ref: ref('launch_record'),
    installation_ref: ref('installation'), approval_ref: ref('approval'), role_resolution_ref: ref('role_resolution'), permissions_digest: digest,
    member_id: 'member', member_boot_id: 'member-boot', provider_id: 'provider', provider_boot_id: 'provider-boot', runtime_generation: 'generation',
    clock_domain_id: 'clock_' + '1'.repeat(64), descriptor_digest: digest, entry_id: 'entry', binding_digest: digest};
  assert.deepEqual(await decodeSourceRuntimeBinding(bytes(runtime)), runtime);
  await assert.rejects(decodeSourceRuntimeBinding(bytes({...runtime, source_ref: {...ref('source'), authority_service_id: 'other'}})));
  const source = {registration_id: 'registration', revision: '1', owner_service_id: 'service', database_instance_id: 'database', provider_id: 'provider', provider_boot_id: 'boot',
    capture_policy_id: 'policy', capture_policy_revision: '1', delivery_semantics: 'sampled', target: {kind: 'data_source', source_ref: ref('source'),
      source_runtime_binding_ref: ref('source_runtime_binding'), observation_binding_ref: ref('source_observation_binding')}};
  assert.deepEqual(await decodeSourceBinding(bytes(source)), source);
  await assert.rejects(decodeSourceBinding(bytes({...source, delivery_semantics: 'discrete'})));
  await assert.rejects(decodeSourceBinding(bytes({...source, device_id: 'invented'})));
  await assert.rejects(decodeSourceBinding(bytes({...source, target: {...source.target, source_ref: {...ref('source'), database_instance_id: 'other'}}})));
});


test('加载分片拒绝旧通道、非规范base64、错状态根身份和越限长度', async () => {
  const domain={clock_domain_id:'clock_'+ '1'.repeat(64),descriptor_digest:digest};
  const frame={version:workerControlVersion,type:'LAUNCH_LOAD',scope:{service_id:'service',database_instance_id:'database',supervisor_instance_id:'supervisor',domain_ref:domain},
    channel_id:'channel',sequence:'1',message_id:'message',reply_to:null,
    payload:{key:{launch_id:'worker',launch_intent_digest:digest},load_id:'load',operation:'chunk',offset:0,bytes:'YQ=='}};
  assert.deepEqual(await decodeWorkerControl(bytes(frame),frame.type),frame);
  for(const data of ['YR==','YQ=','YQ===','YQ==\n','!Q=='])await assert.rejects(decodeWorkerControl(bytes({...frame,payload:{...frame.payload,bytes:data}}),frame.type));
  await assert.rejects(decodeWorkerControl(bytes({...frame,version:'supervisor-control/0.3.0-draft.1'}),frame.type));
  const {key,load_id}=frame.payload;
  const begin={key,load_id,operation:'begin',materials_digest:digest,byte_length:8388608,materialization_evidence_id:'evidence',materialization_challenge_id:'challenge'};
  await decodeWorkerControl(bytes({...frame,payload:begin}),frame.type);
  for(const byte_length of [0,8388609,'1'])await assert.rejects(decodeWorkerControl(bytes({...frame,payload:{...begin,byte_length}}),frame.type));
  const response={...frame,type:'LOAD_RESULT',reply_to:'request',payload:{key,load_id,status:'ready',received_bytes:'1',root_identity:'1'.repeat(48)}};
  await decodeWorkerControl(bytes(response),response.type);
  for(const patch of [{root_identity:null},{status:'pending'},{root_identity:'X'.repeat(48)}])await assert.rejects(decodeWorkerControl(bytes({...response,payload:{...response.payload,...patch}}),response.type));
});


test('加载材料复用完整安装类型并拒绝重复文件身份和路径', async () => {
  const inventory={inventory_version:'extension-files/1',files:[{file_id:'worker',path:'payload/main.mjs',size_bytes:'1',digest,role:'module',executable:false}]};
  const manifest={manifest_version:'extension-artifact/0.1.0-draft.1',extension_id:'extension.synthetic',extension_version:'1',kind:'device_module',
    publisher_id:'publisher.synthetic',source_revision:'source.synthetic',inventory_digest:digest,dependency_lock_file_id:'lock',license_file_ids:['license'],
    capability_template_file_ids:[],configuration_schema_file_id:'config',platforms:['windows-x64'],api_versions:['api.synthetic'],ipc_versions:['ipc.synthetic'],required_features:[],
    entrypoints:[{entry_id:'worker',kind:'worker',file_id:'worker',loader:'node_module',io_policy_file_id:'policy'}],roles:[],permission_templates:[]};
  const value={format:'leafseamer-worker-load/1',root_path:'C:\\synthetic',root_identity:'1'.repeat(48),manifest,inventory};
  assert.deepEqual(await decodeWorkerLoadMaterials(bytes(value)),value);
  for(const patch of [{format:'unknown'},{root_identity:'1'.repeat(47)},{extra:true},{manifest:{...manifest,extra:true}}])await assert.rejects(decodeWorkerLoadMaterials(bytes({...value,...patch})));
  for(const second of [{...inventory.files[0]},{...inventory.files[0],file_id:'z',path:'PAYLOAD/MAIN.MJS'}])await assert.rejects(decodeWorkerLoadMaterials(bytes({...value,inventory:{...inventory,files:[...inventory.files,second]}})));
  await assert.rejects(decodeWorkerLoadMaterials(Buffer.from(JSON.stringify(value).replace('{','{"root_identity":"'+ '2'.repeat(48)+'",'))));
});
