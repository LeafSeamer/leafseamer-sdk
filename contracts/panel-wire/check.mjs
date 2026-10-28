import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {build,inventory,relocate,root,sdk,hash} from './build.mjs';
import {routes} from './preview/routes.mjs';
const read=p=>JSON.parse(fs.readFileSync(path.join(sdk,p),'utf8'));
const sources=read('contracts/panel-wire/sources.json'),checks=[];
const check=(name,value,expected=true)=>{assert.deepEqual(value,expected,name);checks.push({name,passed:true});};
function inputs() {
  const own=fs.readdirSync(root,{recursive:true}).filter(p=>fs.statSync(path.join(root,p)).isFile()&&p!=='report.json'&&!p.includes('__pycache__')).map(p=>'contracts/panel-wire/'+p.replaceAll('\\','/'));
  return Object.fromEntries([...own,...Object.keys(sources.inputs)].sort().map(p=>[p,hash(fs.readFileSync(path.join(sdk,p)))]));
}
function rejected(name,fn) {assert.throws(fn,name);checks.push({name,passed:true});}
async function run() {
  const deps=read('contracts/wire-js/dependencies.json');check('固定Node版本',process.version,'v'+deps.node);
  check('固定Node制品',hash(fs.readFileSync(process.execPath)),deps.runtime.executable_sha256);
  for(const [p,digest] of Object.entries(sources.inputs))check('固定来源:'+p,hash(fs.readFileSync(path.join(sdk,p))),digest);
  const outputs=build(),again=build();check('两次生成相同',outputs,again);
  check('生成目录精确',fs.readdirSync(path.join(root,'preview')).sort(),Object.keys(outputs).sort());
  for(const [name,body] of Object.entries(outputs)) {
    check('生成字节:'+name,fs.readFileSync(path.join(root,'preview',name),'utf8'),body);
    if(name.endsWith('.mjs')) {
      check('运行制品无动态代码:'+name,!/\beval\s*\(|\bFunction\s*\(|\bimport\s*\(/.test(body));
      check('运行制品无Node导入:'+name,!/['"]node:/.test(body));
    }
  }
  const manifest=JSON.parse(outputs['manifest.json']);check('候选批准关闭',[manifest.approved,manifest.runtime_ready],[false,false]);
  for(const [name,digest] of Object.entries(manifest.artifacts))check('清单绑定:'+name,hash(outputs[name]),digest);
  const inv=JSON.parse(outputs['inventory.json']);check('操作数',inv.operations.length,201);check('消息数',inv.messages.length,52);check('去重正文数',Object.keys(inv.schemas).length,300);
  check('面板类型数',inv.panel.length,19);
  check('路由顶层冻结',Object.isFrozen(routes)&&Object.isFrozen(routes.selection)&&Object.isFrozen(routes.operations)&&Object.isFrozen(routes.operations[0].responses));
  rejected('路由不可替换',()=>{routes.operations[0].request='r0';});
  const graph=read('contracts/panel-wire/contract/models.schema.json'),workers=read('contracts/panel-wire/contract/worker-messages.json');
  const docs=Object.fromEntries(['controller','seamer'].map(a=>[a,read('contracts/panel-wire/contract/'+a+'.openapi.json')]));
  function mutation(name,change){const a=structuredClone(docs),w=structuredClone(workers);change(a,w);rejected(name,()=>inventory(a,graph,w));}
  mutation('未知authority',a=>{a.controller['x-authority-role']='seamer';});
  mutation('路径项元数据未裁决',a=>{a.controller.paths['/api/v1/events'].parameters=[];});
  mutation('重复操作ID',a=>{a.controller.paths['/api/v1/events'].post=structuredClone(a.controller.paths['/api/v1/events'].get);});
  mutation('未知响应媒体',a=>{a.controller.paths['/api/v1/events'].get.responses['400'].content['text/plain']={schema:{type:'string'}};});
  mutation('未知状态模式',a=>{a.controller.paths['/api/v1/events'].get.responses.default={description:'unsupported'};});
  mutation('WS漏方向',a=>{delete a.controller.paths['/api/v1/events'].get['x-client-frame-schema'];});
  mutation('WS101带正文',a=>{a.controller.paths['/api/v1/events'].get.responses['101'].content={'application/json':{schema:{type:'object'}}};});
  mutation('worker重复',(_,w)=>{w.messages.push(w.messages[0]);});
  mutation('worker方向漂移',(_,w)=>{w.messages[0].direction='both';});
  mutation('worker图外引用',(_,w)=>{w.messages[0].schema_ref='https://example.invalid/schema';});
  rejected('外部正文引用',()=>relocate({$ref:'https://example.invalid/schema'},graph.$defs));
  rejected('未登记模型',()=>relocate({$ref:'#/components/schemas/Missing'},graph.$defs));
  const oldGraph=read('contracts/panel-integration/preview/models.schema.json'),oldWorkers=read('contracts/panel-integration/preview/worker-messages.json');
  const oldDocs=Object.fromEntries(['controller','seamer'].map(a=>[a,read('contracts/panel-integration/preview/'+a+'.openapi.json')]));
  assert.throws(()=>inventory(oldDocs,oldGraph,oldWorkers),{message:'worker_reference'});check('旧panel3严格构建真实失败',true);
  const cyclic=structuredClone(graph);cyclic.$defs.panel__Channel_BundleReady={$ref:'#/$defs/panel__Channel_BundleReady'};
  assert.throws(()=>inventory(docs,cyclic,workers),{message:'panel_alias'});check('面板别名循环拒绝',true);
  const literal={const:{$ref:'literal'},examples:[{$ref:'not-a-schema'}],properties:{$ref:{const:'literal'}}};
  check('开放数据不当引用',relocate(literal,graph.$defs),literal);
  const at=process.argv.indexOf('--python'),python=at<0?'python':process.argv[at+1];
  const result=spawnSync(python,['-I','-B',path.join(root,'oracle.py')],{maxBuffer:16*1024*1024});assert.equal(result.status,0,result.stderr?.toString());
  const composition=spawnSync(python,['-I','-B',path.join(root,'check_contract.py')],{maxBuffer:16*1024*1024});assert.equal(composition.status,0,composition.stderr?.toString());
  const contract=JSON.parse(composition.stdout);check('完整候选与URI闭包',contract.all_passed&&contract.cases_passed===contract.checks.length&&contract.checks.every(c=>c.passed));
  check('Python独立原件和接受集',result.stdout,fs.readFileSync(path.join(root,'oracle.json')));
  const oracle=JSON.parse(result.stdout);check('独立逐项绑定数',oracle.binding_checks,2432);check('独立操作集合',oracle.operations,201);
  const child=spawnSync(process.execPath,['--disallow-code-generation-from-strings',path.join(root,'node-check.mjs')],{encoding:'utf8',maxBuffer:16*1024*1024});assert.equal(child.status,0,child.stderr);
  const runtime=JSON.parse(child.stdout);check('实际静态运行',runtime.all_passed&&runtime.dynamic_codegen_blocked&&runtime.checks.every(c=>c.passed));
  check('运行检查计数',runtime.checks.length,runtime.cases_passed);
  check('实际面板覆盖',runtime.panel.frame_types,19);check('面板正反例',runtime.panel.message_cases,oracle.panel_cases.length);
  return {format:'panel-wire-check/1',approved:false,runtime_ready:false,all_passed:true,cases_passed:checks.length,checks,
    contract,static_runtime:runtime,independent_binding_checks:oracle.binding_checks,cross_language_root_messages:Object.keys(inv.schemas).length*oracle.corpus.length,
    browser_tests_executed:0,network_tests_executed:0,authentication_tests_executed:0,device_tests_executed:0,
    limitations:['只验证正文路由与解码，不验证HTTP头参数身份或业务状态','本轮未运行浏览器，不继承旧五入口CSP验收','全入口绑定不等于全API客户端实现或所有业务正例'],inputs:inputs()};
}
if(process.argv.includes('--check-report')) {
  const report=read('contracts/panel-wire/report.json');assert(report.all_passed);assert.deepEqual(report.inputs,inputs());
  console.log(JSON.stringify({all_passed:true,bindings:Object.keys(report.inputs).length,behavior_rerun:false}));
} else {
  const report=await run();if(process.argv.includes('--report'))fs.writeFileSync(path.join(root,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({...Object.fromEntries(Object.entries(report).filter(([k])=>!['checks','inputs','static_runtime','contract'].includes(k))),contract:{...report.contract,checks:undefined},static_runtime:{...report.static_runtime,checks:undefined}}));
}
