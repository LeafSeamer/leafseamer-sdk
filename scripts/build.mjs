import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
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
const selected = JSON.parse(await fs.readFile(path.join(root, 'contracts/panel-wire/contract/selection.json'), 'utf8'));
if (JSON.stringify(selected) !== JSON.stringify(lock.selection)) throw new Error('selection_drift');
for (const name of ['index.mjs', 'index.d.mts', 'fetch-transport.mjs', 'http.mjs', 'http.d.mts']) files.set(name, await fs.readFile(path.join(root, 'src', name)));
files.set('selection.mjs', Buffer.from('export const contractSelection = Object.freeze(' + JSON.stringify(selected) + ');\n'));
files.set('THIRD_PARTY_LICENSES.txt', files.get('runtime/panel-wire/preview/LICENSES.txt'));
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
console.log(JSON.stringify({package: '@leafseamer/sdk', artifacts: files.size, selection: selected.contract_id, final_contract: false}));
