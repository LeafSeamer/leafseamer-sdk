import fs from 'node:fs';
import {run} from './runtime-tests.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
console.log(JSON.stringify(await run(read('../http-envelope/oracle.json'),read('../http-envelope/preview/inventory.json'),read('../event-integration/preview/selection.json'))));
