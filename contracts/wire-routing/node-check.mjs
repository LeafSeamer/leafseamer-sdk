import fs from 'node:fs';
import {run} from './runtime-tests.mjs';
if(!process.execArgv.includes('--disallow-code-generation-from-strings'))throw new Error('必须禁止动态代码生成');
let blocked=false;try{Function('return 1')();}catch{blocked=true;}if(!blocked)throw new Error('动态代码未禁止');
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const result=await run(read('./preview/inventory.json'),read('../event-integration/preview/selection.json'),read('../event-integration/preview/worker-messages.json').ipc_version,
  read('../integration/source/frames.json'),read('../wire-static/preview/contract-cases.json'),read('./oracle.json'));
console.log(JSON.stringify({...result,node:process.version,dynamic_codegen_blocked:true}));
