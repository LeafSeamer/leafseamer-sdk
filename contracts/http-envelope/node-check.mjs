import fs from 'node:fs';
import {run} from './runtime-tests.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const r=await run(read('./oracle.json'),read('../event-integration/preview/selection.json'));
console.log(JSON.stringify(r));
