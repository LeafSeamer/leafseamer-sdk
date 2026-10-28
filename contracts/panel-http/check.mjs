import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {build,inventory,root,sdk,hash} from './build.mjs';

const read=p=>JSON.parse(fs.readFileSync(path.join(sdk,p),'utf8')),checks=[];
const check=(name,value,expected=true)=>{assert.deepEqual(value,expected,name);checks.push({name,passed:true});};
const sources=read('contracts/panel-http/sources.json');
function inputs() {
  const own=fs.readdirSync(root,{recursive:true}).filter(p=>fs.statSync(path.join(root,p)).isFile()&&p!=='report.json').map(p=>'contracts/panel-http/'+p.replaceAll('\\','/'));
  const dependencies=Object.keys(read('contracts/wire-js/dependencies.json').files).map(p=>'contracts/wire-js/node_modules/'+p);
  return Object.fromEntries([...new Set([...own,...Object.keys(sources.inputs),...dependencies])].sort().map(p=>[p,hash(fs.readFileSync(path.join(sdk,p)))]));
}
function node(name) {
  const r=spawnSync(process.execPath,['--disallow-code-generation-from-strings',path.join(root,name)],{cwd:sdk,encoding:'utf8',maxBuffer:20*1024*1024,timeout:60000});
  assert.equal(r.status,0,r.stderr||r.error?.message);return JSON.parse(r.stdout);
}
async function run() {
  const deps=read('contracts/wire-js/dependencies.json');check('固定Node版本',process.version,'v'+deps.node);check('固定Node制品',hash(fs.readFileSync(process.execPath)),deps.runtime.executable_sha256);
  for(const [p,h] of Object.entries(sources.inputs))check('固定来源:'+p,hash(fs.readFileSync(path.join(sdk,p))),h);
  const first=build();check('重复构建一致',first,build());check('生成目录精确',fs.readdirSync(path.join(root,'preview')).sort(),Object.keys(first).sort());
  for(const [name,raw] of Object.entries(first))check('生成字节:'+name,fs.readFileSync(path.join(root,'preview',name),'utf8'),raw);
  for(const name of ['preview/catalog.mjs','preview/validators.mjs','adapter.mjs'])check('运行无动态代码:'+name,!/\beval\s*\(|\bFunction\s*\(|\bimport\s*\(/.test(fs.readFileSync(path.join(root,name),'utf8')));
  const docs=Object.fromEntries(['controller','seamer'].map(a=>[a,read('contracts/panel-wire/contract/'+a+'.openapi.json')])),body=read('contracts/panel-wire/preview/inventory.json'),selection=read('contracts/panel-wire/contract/selection.json');
  function mutation(name,change) {const d=structuredClone(docs),b=structuredClone(body);change(d,b);assert.throws(()=>inventory(d,b,selection),name);checks.push({name,passed:true});}
  mutation('未知参数序列化失败',d=>{d.controller.paths['/api/v1/commands/{command_id}/evidence'].get.parameters[1].style='deepObject';});
  mutation('参数重复失败',d=>{const op=d.controller.paths['/api/v1/commands/{command_id}/evidence'].get;op.parameters.push(op.parameters[0]);});
  mutation('路径缺字段失败',d=>{d.controller.paths['/api/v1/commands/{command_id}/evidence'].get.parameters.shift();});
  mutation('未知标量类型失败',d=>{d.controller.paths['/api/v1/commands/{command_id}/evidence'].get.parameters[2].schema={type:'array',items:{type:'string'}};});
  mutation('未知标量关键字失败',d=>{d.controller.paths['/api/v1/commands/{command_id}/evidence'].get.parameters[2].schema={type:'string',allOf:[]};});
  mutation('外部Schema失败',d=>{d.controller.paths['/api/v1/commands/{command_id}/evidence'].get.parameters[0].schema={$ref:'https://example.invalid/schema'};});
  mutation('参数别名循环失败',d=>{d.controller.components.schemas.command__V__S0_Id={$ref:'#/components/schemas/command__V__S0_Id'};});
  mutation('正文路由漂移失败',(_d,b)=>{b.operations[0].method='PATCH';});
  mutation('安全引用缺失失败',d=>{d.controller.paths['/api/v1/capacity'].get.security=[{unknown:[]}];});
  mutation('路径级元数据不丢弃',d=>{d.controller.paths['/api/v1/capacity'].parameters=[];});
  mutation('响应头大小写冲突失败',d=>{const h=d.controller.paths['/api/v1/capacity'].get.responses['200'].headers;h['x-leafseamer-contract']=h['X-LeafSeamer-Contract'];});
  mutation('WS票据需求漂移失败',d=>{d.controller.paths['/api/v1/events'].get['x-subprotocol-count']=1;});
  const at=process.argv.indexOf('--python');assert(at>=0,'需要--python');
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'leafseamer-panel-http-')),output=path.join(temp,'oracle.json');let oracle;
  try {
    const r=spawnSync(process.argv[at+1],['-I','-B',path.join(root,'oracle.py'),'--output',output],{cwd:sdk,encoding:'utf8',timeout:60000});
    assert.equal(r.status,0,r.stderr||r.error?.message);oracle=JSON.parse(r.stdout);
    check('独立Python对照原件',fs.readFileSync(output,'utf8'),fs.readFileSync(path.join(root,'oracle.json'),'utf8'));
  } finally {if(fs.existsSync(output))fs.unlinkSync(output);fs.rmdirSync(temp);}
  check('完整操作数',oracle.operations,201);check('完整响应状态数',oracle.responses,2148);check('完整参数定义数',oracle.distinct_parameters,58);
  const panelCases=spawnSync(process.argv[at+1],['-I','-B',path.join(root,'panel_cases.py')],{maxBuffer:16*1024*1024});assert.equal(panelCases.status,0,panelCases.stderr?.toString());
  check('独立当前服务正反例',panelCases.stdout,fs.readFileSync(path.join(root,'panel-cases.json')));
  const panel=node('panel-check.mjs');check('当前面板服务静态运行',panel.all_passed&&panel.cases_passed===panel.checks.length&&panel.checks.every(c=>c.passed)&&panel.methods===35&&panel.transport_calls===0);
  const runtime=node('node-check.mjs'),http=node('http-check.mjs');
  check('运行断言完整',runtime.all_passed&&runtime.dynamic_codegen_blocked&&runtime.cases_passed===runtime.checks.length&&runtime.checks.every(c=>c.passed));
  check('独立接受集数量',runtime.parameter_variants,oracle.parameter_variants);
  check('真实回环场景',http.all_passed&&http.cases_passed===http.checks.length&&http.checks.every(c=>c.passed)&&http.loopback_http_exchanges===10);
  return {format:'panel-http-report/1',approved:false,runtime_ready:false,all_passed:true,cases_passed:checks.length,checks,
    operations:201,response_bindings:2148,parameter_definitions:58,independent_binding_checks:oracle.binding_checks,parameter_variants:oracle.parameter_variants,
    static_runtime:runtime,panel_runtime:panel,loopback_http:http,product_runtime_tests_executed:0,authentication_tests_executed:0,browser_tests_executed:0,device_tests_executed:0,inputs:inputs()};
}
if(process.argv.includes('--check-report')) {
  const r=read('contracts/panel-http/report.json');assert(r.all_passed);assert.deepEqual(r.inputs,inputs());console.log(JSON.stringify({all_passed:true,bindings:Object.keys(r.inputs).length,behavior_rerun:false}));
} else {
  const r=await run();if(process.argv.includes('--report'))fs.writeFileSync(path.join(root,'report.json'),JSON.stringify(r,null,2)+'\n');
  console.log(JSON.stringify({all_passed:r.all_passed,cases_passed:r.cases_passed,operations:r.operations,response_bindings:r.response_bindings,independent_binding_checks:r.independent_binding_checks,parameter_variants:r.parameter_variants,runtime_checks:r.static_runtime.cases_passed,loopback_http_exchanges:r.loopback_http.loopback_http_exchanges}));
}
