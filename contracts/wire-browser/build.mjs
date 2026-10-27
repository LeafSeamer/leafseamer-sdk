import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
export const root=path.dirname(fileURLToPath(import.meta.url)),sdk=path.resolve(root,'../..');
export const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
export const csp="default-src 'none'; script-src 'self'; worker-src 'self'; connect-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'";
export const ownAssets=['browser.html','browser.mjs','suite.mjs','worker.mjs','preview/runtime-tests.mjs'];
export const sdkAssets=['contracts/wire-routing/decoder.mjs',...['routes.mjs','wire.mjs','registry.mjs','validators.mjs','helpers.mjs','inventory.json'].map(n=>'contracts/wire-routing/preview/'+n),
  'contracts/wire-routing/oracle.json','contracts/event-integration/preview/selection.json','contracts/event-integration/preview/worker-messages.json',
  'contracts/integration/source/frames.json','contracts/wire-static/preview/contract-cases.json'];
export function build() {
  const sources=JSON.parse(fs.readFileSync(path.join(root,'sources.json'),'utf8'));
  for(const [p,digest] of Object.entries(sources.inputs))if(hash(fs.readFileSync(path.join(sdk,p)))!==digest)throw new Error('source_drift:'+p);
  let text=fs.readFileSync(path.join(sdk,'contracts/wire-routing/runtime-tests.mjs'),'utf8');
  const old="      await reject('空正文拒共享缓冲:'+i,()=>decoder.assertEmpty(new Uint8Array(new SharedArrayBuffer(0)),b.handle),'shared_buffer');";
  if(text.split(old).length!==2||text.split("from './decoder.mjs'").length!==2)throw new Error('test_transform_boundary');
  text=text.replace("from './decoder.mjs'","from '/contracts/wire-routing/decoder.mjs'").replace(old,
    "      if(typeof SharedArrayBuffer!=='undefined')"+old.trim());
  return {'runtime-tests.mjs':text};
}
export function served() {
  return Object.fromEntries([...ownAssets.map(p=>['/'+p,{path:'contracts/wire-browser/'+p,bytes:fs.readFileSync(path.join(root,p))}]),
    ...sdkAssets.map(p=>['/'+p,{path:p,bytes:fs.readFileSync(path.join(sdk,p))}])]);
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  const at=process.argv.indexOf('--output');if(at<0)throw new Error('output_required');const dest=process.argv[at+1];fs.mkdirSync(dest);
  for(const [p,b] of Object.entries(build()))fs.writeFileSync(path.join(dest,p),b);
}
