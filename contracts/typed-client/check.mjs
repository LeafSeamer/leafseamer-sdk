import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import ts from './node_modules/typescript/lib/typescript.js';
import {build,root,sdk,hash} from './build.mjs';
import {runHttp} from './http-check.mjs';

const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const checks=[];
function check(name,got,want=true){assert.deepEqual(got,want,name);checks.push(name);}
const first=await build(),second=await build();
check('两次完整生成相同',first,second);
for(const [p,b] of Object.entries(first))check('生成预览一致:'+p,fs.readFileSync(path.join(root,'preview',p),'utf8'),b);
const inventory=read('../http-envelope/preview/inventory.json'),bindings=read('preview/bindings.json');
const types=fs.readFileSync(path.join(root,'preview/operations.d.ts'),'utf8');
const options={noEmit:true,strict:true,exactOptionalPropertyTypes:true,noUncheckedIndexedAccess:true,module:ts.ModuleKind.NodeNext,target:ts.ScriptTarget.ES2023,skipLibCheck:false};
const virtual=path.join(root,'all-operation-tests.mts');
let coverage="import {createClient,type Transport} from './client.mjs';\nimport type {Inputs,Results} from './preview/operations.js';\ndeclare const transport:Transport;\nconst c=createClient('controller',{contract_id:'',contract_digest:''},transport);\nconst s=createClient('seamer',{contract_id:'',contract_digest:''},transport);\n";
let callable=0,responseBindings=0;
for(const authority of ['controller','seamer']) {
  const doc=read('../event-integration/preview/'+authority+'.openapi.json');
  const file=ts.createSourceFile('types.d.ts',first[authority+'.d.ts'],ts.ScriptTarget.Latest,true);
  const components=file.statements.find(s=>ts.isInterfaceDeclaration(s)&&s.name.text==='components');
  const schemas=components.members.find(m=>m.name.text==='schemas').type.members.map(m=>m.name.text).sort();
  check('完整Schema名称:'+authority,schemas,Object.keys(doc.components.schemas).sort());
  const operations=file.statements.find(s=>ts.isInterfaceDeclaration(s)&&s.name.text==='operations');
  const expected=Object.values(doc.paths).flatMap(item=>Object.values(item).filter(v=>v?.operationId).map(o=>o.operationId)).sort();
  check('完整操作名称:'+authority,operations.members.map(m=>m.name.text).sort(),expected);
  check('Schema数量:'+authority,schemas.length,1351);
}
for(const [i,op] of inventory.operations.entries()) {
  const b=bindings.operations[i];
  check('操作绑定:'+i,b,{authority:op.authority,operation_id:op.operation_id,method:op.method,path:op.path,transport:op.transport,callable:op.transport!=='websocket-subprotocol',responses:Object.keys(op.responses)});
  responseBindings+=b.responses.length;
  if(!b.callable)continue;callable++;
  const a=JSON.stringify(op.authority),id=JSON.stringify(op.operation_id);
  coverage+=`declare const p${i}:Inputs[${a}][${id}];const r${i}:Promise<Results[${a}][${id}]>=${op.authority==='controller'?'c':'s'}.call(${id},p${i});\n`;
}
check('全部普通HTTP调用',callable,197);check('全部响应绑定',responseBindings,2148);
function compile(extra) {
  const host=ts.createCompilerHost(options),originalRead=host.readFile.bind(host),originalExists=host.fileExists.bind(host);
  host.readFile=p=>path.resolve(p)===virtual?extra:originalRead(p);
  host.fileExists=p=>path.resolve(p)===virtual||originalExists(p);
  const program=ts.createProgram([path.join(root,'type-tests.mts'),virtual],options,host);
  return ts.getPreEmitDiagnostics(program);
}
function detail(ds){return ds.map(d=>({code:d.code,file:d.file?path.basename(d.file.fileName):null,line:d.file&&d.start!==undefined?d.file.getLineAndCharacterOfPosition(d.start).line+1:null,message:ts.flattenDiagnosticMessageText(d.messageText,' ')}));}
check('严格编译全部调用与递归类型',detail(compile(coverage)),[]);
const negative=read('type-negative.json'),prelude="import {createClient,type Transport} from './client.mjs';\nimport type {components} from './preview/controller.js';\ndeclare const transport:Transport;const selection={contract_id:'leafseamer.api.v1.events2',contract_digest:''} as const;const c=createClient('controller',selection,transport);const result=await c.call('discoverContracts');\n";
const diagnostics=detail(compile(prelude+negative.join('\n')+'\n'));
check('负例全部产生对应行诊断',[...new Set(diagnostics.map(d=>d.line))].sort((a,b)=>a-b),negative.map((_,i)=>i+4));
check('负例没有旁支声明错误',diagnostics.every(d=>d.file==='all-operation-tests.mts'));
const child=spawnSync(process.execPath,['--disallow-code-generation-from-strings',path.join(root,'node-check.mjs')],{encoding:'utf8',maxBuffer:8*1024*1024,timeout:60000,windowsHide:true});
check('禁止动态代码生成运行退出',child.status,0);check('运行无stderr',child.stderr,'');
const runtime=JSON.parse(child.stdout);check('运行全部通过',runtime.all_passed);check('禁止动态代码生成已启用',runtime.dynamic_codegen_blocked);
const loopback=process.argv.includes('--http')?await runHttp(read('../event-integration/preview/selection.json')):null;
if(loopback)check('实际HTTP收发',loopback.loopback_http_exchanges,2);
const inputs={...read('sources.json').inputs};
function collect(dir) {for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {if(entry.name==='node_modules'||entry.name==='report.json')continue;const p=path.join(dir,entry.name);if(entry.isDirectory())collect(p);else inputs[path.relative(sdk,p).split(path.sep).join('/')]=hash(fs.readFileSync(p));}}
collect(root);
const report={format:'typed-client-validation/1',approved:false,runtime_ready:false,all_passed:true,checks,operations:201,http_callable:callable,websocket_metadata_only:4,response_bindings:responseBindings,schemas_per_authority:1351,type_negative_cases:negative.length,type_negative_diagnostics:diagnostics.map(({code,line})=>({code,line})),runtime,loopback_http:loopback,inputs,production_authentication_executed:false,browser_executed:false,device_executed:false};
if(process.argv.includes('--write-report'))fs.writeFileSync(path.join(root,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({all_passed:true,checks:checks.length,runtime_checks:runtime.cases_passed,type_negative_cases:negative.length,http_callable:callable,loopback_http_exchanges:loopback?.loopback_http_exchanges??0}));
