import test from 'node:test';
import assert from 'node:assert/strict';
import {decodeSupervisorControl, supervisorControlVersion} from '../dist/supervisor-control.mjs';
import {contractSelection} from '../dist/index.mjs';
const scope = {service_id: 'service', database_instance_id: 'database', supervisor_instance_id: 'supervisor',
  domain_ref: {clock_domain_id: 'clock_' + '1'.repeat(64), descriptor_digest: 'sha256:' + '1'.repeat(64)}};
const key = {launch_id: 'launch', launch_intent_digest: 'sha256:' + '2'.repeat(64)};
const query = {version: supervisorControlVersion, type: 'LAUNCH_QUERY', scope, channel_id: 'channel', sequence: '9007199254740993',
  message_id: 'message', reply_to: null, payload: key};
const bytes = value => Buffer.from(JSON.stringify(value));
test('独立监督查询入口保持精确序号、方向和既有HTTP选择', async () => {
  const parsed = await decodeSupervisorControl(bytes(query), 'LAUNCH_QUERY');
  assert.equal(parsed.sequence, '9007199254740993'); assert(Object.isFrozen(parsed.scope.domain_ref));
  assert.deepEqual(await decodeSupervisorControl(bytes({...query, type: 'LAUNCH_RESULT', reply_to: 'request', payload: {key, record: null}}), 'LAUNCH_RESULT'),
    {...query, type: 'LAUNCH_RESULT', reply_to: 'request', payload: {key, record: null}});
  assert.equal((await decodeSupervisorControl(bytes({...query, type: 'ERROR', reply_to: 'request', payload: {code: 'identity_conflict', retry_action: 'query_only'}}), 'ERROR')).payload.retry_action, 'query_only');
  assert.equal(contractSelection.contract_digest, 'sha256:b7101ca292511299a0940b5dd4cc3c29d022afcdc2a2e3489d1ce4300ee2e5c9');
});
test('错误消息、重复键、额外字段与容量在采用前拒绝，查询入口不冒充启动写协议', async () => {
  await assert.rejects(decodeSupervisorControl(bytes(query), 'LAUNCH_RESULT'));
  await assert.rejects(decodeSupervisorControl(bytes(query), 'LAUNCH_CREATE'));
  await assert.rejects(decodeSupervisorControl(bytes({...query, secret: 'A'.repeat(43)}), 'LAUNCH_QUERY'));
  await assert.rejects(decodeSupervisorControl(Buffer.from('{"type":"LAUNCH_QUERY","type":"ERROR"}'), 'LAUNCH_QUERY'), e => e.reason === 'duplicate_key');
  await assert.rejects(decodeSupervisorControl(new Uint8Array(65537), 'LAUNCH_QUERY'));
});
