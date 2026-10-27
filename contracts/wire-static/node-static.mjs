import fs from 'node:fs';
import {run} from './runtime-tests.mjs';
if(!process.execArgv.includes('--disallow-code-generation-from-strings'))throw new Error('缺少动态代码禁用开关');
let blocked=false;try{Function('return 1')();}catch{blocked=true;}
if(!blocked)throw new Error('动态代码未被禁止');
const read=name=>JSON.parse(fs.readFileSync(new URL('./preview/'+name,import.meta.url),'utf8'));
const result=await run(read('cases.json'),read('contract-cases.json'));
console.log(JSON.stringify({...result,dynamic_codegen_blocked:true,node:process.version}));
