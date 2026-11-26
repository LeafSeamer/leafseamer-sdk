import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {buildContract} from './contract.mjs';
import {buildWorkerRuntime} from './worker-runtime-contract.mjs';
import {buildArtifactImport} from './artifact-import-contract.mjs';
import {buildReleaseManifest} from './release-manifest-contract.mjs';
import {buildSupervisorControl} from './supervisor-control-contract.mjs';
import {buildBootstrap} from './bootstrap-contract.mjs';
import {buildCapabilityTemplate} from './capability-template-contract.mjs';
import {buildDeviceExecution} from './device-execution-contract.mjs';
import {buildAutomationProgram} from './automation-program-contract.mjs';
import {bindingHttpRuntime} from './binding-approvals.mjs';
import {buildEventTime} from './event-time-runtime.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const lock = JSON.parse(await fs.readFile(path.join(root, 'sdk-inputs.json'), 'utf8'));
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const files = new Map();
for (const [name, digest] of Object.entries(lock.files)) {
  if (!name.startsWith('contracts/') || name.includes('..') || !/^[a-zA-Z0-9/_.-]+$/.test(name)) throw new Error('input_path');
  const bytes = await fs.readFile(path.join(root, name));
  if (hash(bytes) !== digest) throw new Error('input_drift:' + name);
  files.set(name.replace(/^contracts\//, 'runtime/'), bytes);
}
const baseline = JSON.parse(await fs.readFile(path.join(root, 'contracts/panel-wire/contract/selection.json'), 'utf8'));
if (JSON.stringify(baseline) !== JSON.stringify(lock.selection)) throw new Error('selection_drift');
const product = await buildContract(), selected = product.selection;
for (const [name, bytes] of product.files) files.set(name, bytes);
files.set('runtime/panel-http/adapter.mjs',Buffer.from(bindingHttpRuntime(files.get('runtime/panel-http/adapter.mjs').toString('utf8'))));
for (const [name, bytes] of buildDeviceExecution(product.files)) files.set(name, bytes);
for (const [name, bytes] of await buildAutomationProgram(product.files)) files.set(name, bytes);
for (const [name, bytes] of await buildEventTime(product.files)) files.set(name, bytes);
for (const [name, bytes] of await buildCapabilityTemplate(product.files)) files.set(name, bytes);
for (const [name, bytes] of await buildBootstrap()) files.set(name, bytes);
for (const [name, bytes] of await buildSupervisorControl()) files.set(name, bytes);
const artifactFiles=await buildArtifactImport();
for (const [name, bytes] of artifactFiles) files.set(name, bytes);
for (const [name, bytes] of await buildWorkerRuntime(JSON.parse(artifactFiles.get('artifact-import/schema.json')))) files.set(name, bytes);
for (const [name, bytes] of await buildReleaseManifest()) files.set(name, bytes);
for (const name of ['device-execution.mjs','device-module.mjs','device-module.d.mts','index.mjs', 'index.d.mts', 'fetch-transport.mjs', 'browser-session.mjs', 'browser-event-channel.mjs', 'control-request.mjs', 'draft-request.mjs', 'command-request.mjs', 'http.mjs', 'http.d.mts']) files.set(name, await fs.readFile(path.join(root, 'src', name)));
const canonicalRoot=path.join(root,'node_modules/canonicalize');
if(JSON.parse(await fs.readFile(path.join(canonicalRoot,'package.json'),'utf8')).version!=='5.1.0')throw new Error('canonicalize_version');
files.set('vendor/canonicalize.mjs',await fs.readFile(path.join(canonicalRoot,'lib/canonicalize.js')));
files.set('selection.mjs', Buffer.from('export const contractSelection = Object.freeze(' + JSON.stringify(selected) + ');\n'));
files.set('THIRD_PARTY_LICENSES.txt', Buffer.concat([files.get('runtime/panel-wire/preview/LICENSES.txt'),
 Buffer.from('\n\ncanonicalize 5.1.0\n\n'),await fs.readFile(path.join(canonicalRoot,'LICENSE'))]));
files.set('build-manifest.json', Buffer.from(JSON.stringify({format: 'leafseamer-sdk-build/1', selection: selected,
  source_commit: lock.source_commit, final_contract: false,
  artifacts: Object.fromEntries([...files].sort(([a], [b]) => a.localeCompare(b, 'en')).map(([n, b]) => [n, hash(b)]))}, null, 2) + '\n'));
// dist是唯一受本构建器管理的输出。先验证全部输入，再清除旧输出。
const output = path.resolve(root, 'dist');
if (path.dirname(output) !== path.resolve(root)) throw new Error('output_path');
await fs.rm(output, {recursive: true, force: true});
for (const [name, bytes] of files) {
  const target = path.join(output, name);
  await fs.mkdir(path.dirname(target), {recursive: true}); await fs.writeFile(target, bytes);
}
console.log(JSON.stringify({package: '@leafseamer/sdk', artifacts: files.size, operations: product.operations, selection: selected.contract_id, final_contract: false}));
