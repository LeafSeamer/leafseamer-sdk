import test from 'node:test';
import assert from 'node:assert/strict';
import {decodeArtifactDocument, decodeImportFrame, artifactImportVersion, artifactImportSelection} from '../dist/artifact-import.mjs';
import {contractSelection} from '../dist/index.mjs';
const hash = 'sha256:' + '1'.repeat(64), encoded = value => Buffer.from(JSON.stringify(value));
const identity = {host_installation_id: 'host.synthetic', client_registration_id: 'client.synthetic', import_request_id: 'request.synthetic'};
const ref = kind => ({kind, authority_service_id: 'host.synthetic', database_instance_id: 'db.synthetic', object_id: kind, revision: '1', digest: hash});
const request = {identity, target_authority_service_id: 'controller.synthetic', source_attachment_id: 'attachment.synthetic', package_digest: hash,
  package_bytes: '100', expected_manifest_digest: hash, host_trust_epoch: '1', release_authorization_ref: ref('release_authorization'), validation_policy_ref: ref('validation_policy')};
const inventory = {inventory_version: 'extension-files/1', files: [{file_id: 'a', path: 'payload/a.mjs', size_bytes: '1', digest: hash, role: 'module', executable: false}]};
test('独立安装选择保留HTTP摘要，严格解码拒绝重复键、未知字段、畸形UTF8和超限文档', async () => {
  assert.equal(contractSelection.contract_digest, 'sha256:b7101ca292511299a0940b5dd4cc3c29d022afcdc2a2e3489d1ce4300ee2e5c9');
  assert.equal(artifactImportSelection.contract_id, 'leafseamer.artifact-import.1');
  assert.deepEqual(await decodeArtifactDocument(encoded(request), 'ImportBegin'), request);
  await assert.rejects(decodeArtifactDocument(Buffer.from(JSON.stringify(request).replace('{', '{"host_trust_epoch":"2",')), 'ImportBegin'));
  await assert.rejects(decodeArtifactDocument(encoded({...request, source_path: '/unsafe'}), 'ImportBegin'));
  await assert.rejects(decodeArtifactDocument(Buffer.from([0xff]), 'ImportBegin'));
  await assert.rejects(decodeArtifactDocument(Buffer.alloc(4194305, 32), 'FileInventory'));
});
test('文件库存核完整身份顺序、路径碰撞、保留文件名和字节容量', async () => {
  assert.deepEqual(await decodeArtifactDocument(encoded(inventory), 'FileInventory'), inventory);
  for (const path of ['../a', 'CON', 'a\\b', 'Files.Json', 'extension.json', 'a:b', 'a.', '资源/a']) {
    const value = structuredClone(inventory); value.files[0].path = path; await assert.rejects(decodeArtifactDocument(encoded(value), 'FileInventory'));
  }
  for (const second of [{file_id: 'a'}, {file_id: 'b', path: 'PAYLOAD/A.MJS'}, {file_id: 'b', path: 'payload'}]) {
    const value = structuredClone(inventory); value.files.push({...value.files[0], ...second}); await assert.rejects(decodeArtifactDocument(encoded(value), 'FileInventory'));
  }
  const value = structuredClone(inventory); value.files[0].size_bytes = '268435457'; await assert.rejects(decodeArtifactDocument(encoded(value), 'FileInventory'));
});
test('九种导入帧闭合字段与方向校验，物化结果仅为结构不授信任', async () => {
  const verify = {intake_id: 'intake.synthetic', target_authority_service_id: 'controller.synthetic', manifest_digest: hash, artifact_set_digest: hash,
    host_trust_epoch: '1', challenge_id: 'challenge.synthetic', launch_intent_digest: hash};
  const payloads = {
    IMPORT_BEGIN: request, IMPORT_QUERY: identity, IMPORT_CANCEL: identity,
    IMPORT_STATUS: {identity, intent_digest: hash, operation_id: 'operation.synthetic', state: 'accepted', target_authority_service_id: 'controller.synthetic', package_digest: hash, receipt: null, reason_code: null},
    INTAKE_QUERY: {intake_id: 'intake.synthetic', target_authority_service_id: 'controller.synthetic'},
    INTAKE_RESULT: {intake_id: 'intake.synthetic', status: 'unavailable', receipt: null}, VERIFY_MATERIALIZATION: verify,
    MATERIALIZATION_RESULT: {request: verify, result: 'unavailable', evidence_id: null, observer_domain: {clock_domain_id: 'clock.synthetic', descriptor_digest: hash}, observed_tick: '1'},
    ERROR: {code: 'invalid_request', operation_id: null}
  };
  for (const [type, payload] of Object.entries(payloads)) {
    const frame = {ipc_version: artifactImportVersion, type, channel_id: 'channel.synthetic', sequence: '1', message_id: 'message.synthetic',
      reply_to: ['IMPORT_STATUS', 'INTAKE_RESULT', 'MATERIALIZATION_RESULT', 'ERROR'].includes(type) ? 'request.synthetic' : null, payload};
    assert.deepEqual(await decodeImportFrame(encoded(frame), type), frame);
    await assert.rejects(decodeImportFrame(encoded(frame), type === 'ERROR' ? 'IMPORT_BEGIN' : 'ERROR'));
    await assert.rejects(decodeImportFrame(encoded({...frame, extra: true}), type));
  }
});
