import fs from 'node:fs';
import {run} from './runtime-tests.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
console.log(JSON.stringify(await run(read('../panel-http/oracle.json'),read('../panel-http/preview/inventory.json'),read('../panel-wire/contract/selection.json'))));
