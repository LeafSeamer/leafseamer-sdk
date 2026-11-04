import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {decodeBootstrap, decodeProtectedLaunchIntent, bootstrapVersion} from '../dist/bootstrap.mjs';
const bytes = value => Buffer.from(JSON.stringify(value));
const digest = 'sha256:' + '1'.repeat(64), domain = {clock_domain_id: 'clock_' + '1'.repeat(64), descriptor_digest: digest};
const artifact = {manifest_id: 'artifact', revision: '1', digest};
const common = {bootstrap_version: bootstrapVersion, bootstrap_id: 'bootstrap', launch_id: 'launch', launch_intent_digest: digest,
  member_id: 'core', member_boot_id: 'boot', role: 'core', artifact_manifest_ref: artifact, channel_binding_id: 'channel', challenge_id: 'challenge'};
const descriptor = {descriptor_version: 'clock-domain/1', domain_kind: 'supervised_runtime', authority_service_id: 'service', runtime_generation: 'generation',
  supervisor_instance_id: 'supervisor', clock_backend_id: 'windows_interrupt_precise', clock_backend_revision: '1', tick_unit: 'ns', suspend_accounting: 'included',
  namespace_identity: 'windows', os_boot_identity: {status: 'unavailable'}, platform_profile_id: 'profile', platform_profile_revision: '1', ...domain};
const assignment = {version: bootstrapVersion, type: 'ASSIGNMENT', payload: {...common, clock_domain_descriptor: descriptor,
  challenge_nonce: 'A'.repeat(43), issued_tick_ns: '9007199254740993', expires_tick_ns: '9007199254741993', secret: 'A'.repeat(43)}};
test('独立bootstrap入口保留完整字段、大整数与深冻结，不扩大HTTP选择', async () => {
  const value = await decodeBootstrap(bytes(assignment), 'ASSIGNMENT');
  assert.equal(value.payload.issued_tick_ns, '9007199254740993'); assert(Object.isFrozen(value.payload.clock_domain_descriptor));
  assert.equal(JSON.parse(fs.readFileSync(new URL('../dist/contract/selection.json', import.meta.url))).contract_id, 'leafseamer.api.v1.product1');
});
test('四种bootstrap帧与独立core意图均由同源Schema约束', async () => {
  const {bootstrap_version: _v, challenge_id: _c, ...receipt} = common;
  const containment = {group_id: 'group', generation: 'generation', backend: 'windows_job'};
  const frames = [assignment,
    {version: bootstrapVersion, type: 'PROOF', payload: {...common, ...domain, proof: 'A'.repeat(43)}},
    {version: bootstrapVersion, type: 'ADMISSION', payload: {...receipt, receipt_id: 'receipt', domain_ref: domain,
      containment_ref: containment, os_observation_ref: 'observation', admitted_tick_ns: '1', gate_state: 'closed'}},
    {version: bootstrapVersion, type: 'REJECT', payload: {code: 'expired', retry_action: 'query_only'}}];
  for (const frame of frames) assert.deepEqual(await decodeBootstrap(bytes(frame), frame.type), frame);
  const intent = {launch_id: 'launch', service_id: 'service', supervisor_instance_id: 'supervisor', runtime_generation: 'generation', member_id: 'core',
    role: 'core', artifact_manifest_ref: artifact, containment_ref: containment, device_ids: [], policy_revision: '1'};
  assert.deepEqual(await decodeProtectedLaunchIntent(bytes(intent)), intent);
  await assert.rejects(decodeProtectedLaunchIntent(bytes({...intent, device_ids: ['device']})));
});
test('重复解码键、错误方向、额外秘密字段与容量越界在使用前拒绝', async () => {
  await assert.rejects(decodeBootstrap(Buffer.from('{"version":"x","\\u0076ersion":"y"}'), 'ASSIGNMENT'), e => e.reason === 'duplicate_key');
  await assert.rejects(decodeBootstrap(bytes(assignment), 'PROOF'), e => e.reason === 'bootstrap_direction');
  await assert.rejects(decodeBootstrap(bytes({...assignment, password: 'not-allowed'}), 'ASSIGNMENT'));
  await assert.rejects(decodeBootstrap(bytes({...assignment, payload: {...assignment.payload, secret: 'A'.repeat(42) + 'B'}}), 'ASSIGNMENT'));
  await assert.rejects(decodeBootstrap(new Uint8Array(16385), 'ASSIGNMENT'));
});
test('bootstrap来源闭包可追踪到固定输入且产物摘要吻合', () => {
  const source = JSON.parse(fs.readFileSync(new URL('../dist/bootstrap/source.json', import.meta.url)));
  const schema = fs.readFileSync(new URL('../dist/bootstrap/schema.json', import.meta.url));
  assert.equal(crypto.createHash('sha256').update(schema).digest('hex'), source.schema_sha256);
  const graph = JSON.parse(schema); assert.equal(Object.keys(source.definition_sources).length, Object.keys(graph.$defs).length);
  assert.equal(source.runtime_approved, false);
});
