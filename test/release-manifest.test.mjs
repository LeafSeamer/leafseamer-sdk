import test from 'node:test';
import assert from 'node:assert/strict';
import {decodeReleaseManifest, decodeReleaseRevocations, decodeReleaseExtensionBinding, releaseManifestSelection} from '../dist/release-manifest.mjs';
import {contractSelection} from '../dist/index.mjs';
import {releaseFixture} from './fixtures/release-manifest.mjs';
const bytes = value => Buffer.from(JSON.stringify(value));
test('新版完整发行选择保留原HTTP摘要、完整五仓及不同存储profile，序号不转Number', async () => {
  const value = releaseFixture(); assert.deepEqual(await decodeReleaseManifest(bytes(value)),value);
  assert.equal((await decodeReleaseManifest(bytes(releaseFixture('linux')))).target.libc,'glibc');
  assert.equal(releaseManifestSelection.contract_id,'leafseamer.release-manifest.1');
  assert.equal(contractSelection.contract_digest,'sha256:b7101ca292511299a0940b5dd4cc3c29d022afcdc2a2e3489d1ce4300ee2e5c9');
  assert.equal(value.release_sequence,'9007199254740993');
});
test('发行严格字节与新版本拒绝重复键、未知字段、错误日期、旧格式及非安全文件数字', async () => {
  const value = releaseFixture();
  await assert.rejects(decodeReleaseManifest(Buffer.from(JSON.stringify(value).replace('{','{"release_id":"other",'))));
  await assert.rejects(decodeReleaseManifest(Buffer.from([0xc0,0x80])));
  for (const mutate of [v=>v.extra=true,v=>v.manifest_schema='native-release/0.1.0-draft.1',v=>v.created_at='2020-02-30T00:00:00Z',v=>v.artifacts[0].size_bytes=9007199254740992]) {
    const v=releaseFixture();mutate(v);await assert.rejects(decodeReleaseManifest(bytes(v)));
  }
});
test('发行语义拒绝路径别名、缺引用、依赖环、跨组件缺依赖、ABI错配及部署漏项', async () => {
  const changes = [
    v=>v.artifacts[1].path=v.artifacts[0].path.toUpperCase(),v=>v.artifacts[0].path='con.dll',
    v=>v.artifacts[1].path=v.artifacts[0].path+'/child',v=>v.artifacts[0].requires=['missing'],
    v=>v.artifacts[0].requires=['node'],v=>v.entrypoints[0].requires=['controller'],
    v=>v.component_bindings.find(c=>c.component_id==='leafseamer-controller').requires=['leafseamer-sdk'],
    v=>v.artifacts.find(a=>a.artifact_id==='driver').abi.napi_version=9,
    v=>v.deployment_profiles[0].runtime_refs=[],v=>v.deployment_profiles[0].protocol_refs=[],
    v=>v.deployment_profiles[0].artifact_refs.splice(0,1),v=>v.deployment_profiles[0].component_refs=['leafseamer-controller'],
    v=>v.component_bindings[0].component_id=v.component_bindings[1].component_id
  ];
  for (const [index,mutate] of changes.entries()) {const v=releaseFixture();mutate(v);await assert.rejects(decodeReleaseManifest(bytes(v)),String(index));}
});
test('通道选择、双向端点和数据库连接/迁移闭包不会由同名ID自动视作兼容', async () => {
  const changes = [
    v=>v.protocol_bindings[1].contract_digest='sha256:'+'2'.repeat(64),
    v=>v.protocol_bindings[0].endpoints[0].direction='send',
    v=>v.protocol_bindings[0].endpoints[0].peer_endpoint_ref='client',
    v=>v.protocol_bindings[0].endpoints[0].contract_id='other',
    v=>v.protocol_bindings[0].schema_artifact_ref='report',
    v=>v.storage_bindings[2].connection_profile_ref='business',
    v=>v.storage_bindings[0].write_schema_revisions=['2'],
    v=>v.storage_bindings[0].owner_component='leafseamer',
    v=>v.storage_bindings[0].migration_refs=['missing'],
    v=>v.channel='stable'
  ];
  for (const [index,mutate] of changes.entries()) {const v=releaseFixture();mutate(v);await assert.rejects(decodeReleaseManifest(bytes(v)),String(index));}
});
test('多镜像清单保留配置与有序层身份，错平台及缺部署镜像引用拒绝', async () => {
  const v=releaseFixture('linux'), hash='sha256:'+'2'.repeat(64);
  for (const [index,entrypoint_ref] of ['controller','seamer'].entries()) {
    const id='image'+index;
    v.artifacts.push({artifact_id:id,path:id+'.tar',size_bytes:10,sha256:hash,role:'image_archive',component:'leafseamer-suite',abi:{kind:'none'},requires:[],dynamic_dependencies:[]});
    v.component_bindings.find(c=>c.component_id==='leafseamer-suite').artifact_refs.push(id);v.deployment_profiles[0].artifact_refs.push(id);
    v.container_bindings.push({image_id:id,image_archive_ref:id,config_digest:hash,rootfs_diff_ids:[hash,'sha256:'+'3'.repeat(64),hash],platform:{os:'linux',arch:'x64',libc:'glibc'},
      entrypoint_ref,components:[entrypoint_ref==='controller'?'leafseamer-controller':'leafseamer'],environment_report_ref:'report',registry_manifest_digest:null,tags:['synthetic:'+id]});
  }
  v.deployment_profiles[0].kind='compose';v.deployment_profiles[0].container_refs=['image0','image1'];
  assert.deepEqual((await decodeReleaseManifest(bytes(v))).container_bindings[0].rootfs_diff_ids,v.container_bindings[0].rootfs_diff_ids);
  const changed=structuredClone(v);changed.container_bindings[0].platform.os='windows';await assert.rejects(decodeReleaseManifest(bytes(changed)));
  changed.container_bindings[0].platform.os='linux';changed.deployment_profiles[0].entrypoint_refs=['seamer'];await assert.rejects(decodeReleaseManifest(bytes(changed)));
});
test('撤销快照保留大修订并拒绝重复对象，不将格式通过当作可信来源', async () => {
  const value={format:'release-revocations/1',revision:'18446744073709551616',revoked_release_ids:['synthetic.release'],revoked_manifest_digests:[],revoked_artifact_digests:[]};
  assert.deepEqual(await decodeReleaseRevocations(bytes(value)),value);value.revoked_release_ids.push('synthetic.release');await assert.rejects(decodeReleaseRevocations(bytes(value)));
});
test('受签扩展目标绑定完整发行原字节与独立扩展清单，不接收任意URL或字段', async () => {
  const value = {format:'leafseamer.release-extension/1',release_manifest:{target_path:'releases/full.json',size_bytes:100,digest:'sha256:'+'1'.repeat(64)},
    artifact_id:'extension',deployment_profile_id:'all',extension_manifest_digest:'sha256:'+'2'.repeat(64)};
  assert.deepEqual(await decodeReleaseExtensionBinding(bytes(value)),value);
  for (const target_path of ['../full.json','releases//full.json','releases/./full.json','https://other.invalid/a','releases/full.json\n'])
    await assert.rejects(decodeReleaseExtensionBinding(bytes({...value,release_manifest:{...value.release_manifest,target_path}})));
  await assert.rejects(decodeReleaseExtensionBinding(bytes({...value,approved:true})));
});
