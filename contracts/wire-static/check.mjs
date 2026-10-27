import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {build,root,sdk,hash} from './build.mjs';
import * as previous from '../wire-js/wire.mjs';
import * as T from './preview/test-wire.mjs';
import * as C from './preview/contracts-wire.mjs';

const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const sources=read('sources.json'),checks=[];
const check=(name,value,expected=true)=>{assert.deepEqual(value,expected,name);checks.push({name,passed:true});};
function inputs() {
  const own=fs.readdirSync(root,{recursive:true}).filter(p=>fs.statSync(path.join(root,p)).isFile()&&p!=='report.json').map(p=>'contracts/wire-static/'+p.replaceAll('\\','/'));
  return Object.fromEntries([...own,...Object.keys(sources.inputs)].sort().map(p=>[p,hash(fs.readFileSync(path.join(sdk,p)))]));
}
async function outcome(api,handle,raw) {
  try {const value=await api.decodeWire(raw,handle,{profile:api.profile({parse_deadline_ms:5000})});return {accepted:true,value:value.value,numbers:value.numbers};}
  catch(e){if(!(e instanceof api.WireError))throw e;return {accepted:false,reason:e.reason};}
}
async function run() {
  const deps=JSON.parse(fs.readFileSync(path.join(sdk,'contracts/wire-js/dependencies.json'),'utf8'));
  check('固定Node版本',process.version,'v'+deps.node);
  check('固定Node制品',hash(fs.readFileSync(process.execPath)),deps.runtime.executable_sha256);
  for(const [p,digest] of Object.entries(sources.inputs))check('固定输入:'+p,hash(fs.readFileSync(path.join(sdk,p))),digest);
  const generated=build(),second=build();
  check('重复构建字节一致',generated,second);
  check('生成清单精确',fs.readdirSync(path.join(root,'preview')).sort(),Object.keys(generated).sort());
  for(const [name,body] of Object.entries(generated)) {
    check('静态制品字节:'+name,fs.readFileSync(path.join(root,'preview',name),'utf8'),body);
    if(name.endsWith('.mjs')) {
      check('无动态代码:'+name,!/\beval\s*\(|\bFunction\s*\(|\bimport\s*\(/.test(body));
      check('无Node依赖:'+name,!/['"]node:/.test(body));
      for(const [,target] of body.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g))check('封闭模块:'+name+':'+target,target.startsWith('./')&&Object.hasOwn(generated,target.slice(2)));
    }
  }
  const manifest=read('preview/manifest.json'),policy=read('policy.json');
  check('五个明确入口',Object.keys(policy.roots).sort(),['client_frame','selection','server_frame','snapshot_manifest','snapshot_page']);
  check('候选状态', [manifest.approved,manifest.runtime_ready,policy.approved,policy.runtime_ready,policy.implicit_model_fallback,policy.runtime_schema_compilation],Array(6).fill(false));
  for(const [name,digest] of Object.entries(manifest.artifacts))check('清单绑定:'+name,hash(generated[name]),digest);
  const graph=JSON.parse(fs.readFileSync(path.join(sdk,'contracts/event-integration/preview/models.schema.json'),'utf8'));
  const integerMap=read('preview/integer-map.json');check('整数映射数量',integerMap.paths.length,146);
  for(const pointer of integerMap.paths) {
    let node=graph;for(const token of pointer.split('/').slice(1))node=node[token.replaceAll('~1','/').replaceAll('~0','~')];
    check('整数映射:'+pointer,node==='integer'||Array.isArray(node)&&node.includes('integer'));
  }
  const at=process.argv.indexOf('--python'),python=at<0?'python':process.argv[at+1];
  const fixture=spawnSync(python,['-I','-B',path.join(root,'snapshot-fixtures.py')],{maxBuffer:8*1024*1024});
  assert.equal(fixture.status,0,fixture.stderr?.toString());
  check('快照夹具重建',fixture.stdout,fs.readFileSync(path.join(root,'source/snapshots.json')));
  const child=spawnSync(process.execPath,['--disallow-code-generation-from-strings',path.join(root,'node-static.mjs')],{encoding:'utf8',maxBuffer:8*1024*1024});
  assert.equal(child.status,0,child.stderr);const node=JSON.parse(child.stdout);
  check('禁动态代码的Node实际运行',node.all_passed&&node.dynamic_codegen_blocked&&node.checks.every(c=>c.passed));
  check('Node检查完整',node.cases_passed,331);check('Node明细数量',node.checks.length,331);
  const schemas=read('preview/test-schemas.json'),cases=read('preview/cases.json'),samples=read('preview/contract-cases.json');
  for(const [i,c] of cases.entries())check('静态与动态接受集及值:'+i,
    await outcome(T,T.getSchema(c.name),Buffer.from(c.raw_hex,'hex')),
    await outcome(previous,previous.compileSchema(schemas[c.name]),Buffer.from(c.raw_hex,'hex')));
  const dynamic=new Map();
  for(const [name,model] of Object.entries(policy.roots))dynamic.set(name,previous.compileSchema({$schema:graph.$schema,$defs:graph.$defs,$ref:'#/$defs/'+model}));
  for(const [i,c] of samples.entries()) {
    const raw=Buffer.from(JSON.stringify(c.value));
    check('实际入口差分:'+i,await outcome(C,C.getSchema(c.name),raw),await outcome(previous,dynamic.get(c.name),raw));
  }
  const browser=read('browser-report.json');
  check('浏览器实际验收状态',browser.report.all_passed&&browser.report.eval_blocked&&browser.report.inline_blocked);
  check('浏览器明细',browser.report.checks.length,331);check('浏览器计数',browser.report.cases_passed,331);
  check('浏览器全部通过',browser.report.checks.every(c=>c.passed));
  check('浏览器候选状态',[browser.approved,browser.runtime_ready],[false,false]);
  check('浏览器CSP',browser.csp,"default-src 'none'; script-src 'self'; connect-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'");
  for(const blocked of ['eval','inline'])check('实际CSP拦截:'+blocked,browser.report.csp_violations.some(v=>v.blocked_uri===blocked&&v.directive.startsWith('script-src')));
  for(const [p,digest] of Object.entries(browser.artifacts))check('浏览器验收制品绑定:'+p,hash(fs.readFileSync(path.join(root,p))),digest);
  check('浏览器制品集合',Object.keys(browser.artifacts).sort(),['browser.html','browser.mjs','runtime-tests.mjs',...Object.keys(generated).map(p=>'preview/'+p)].sort());
  check('浏览器清单绑定',browser.manifest_sha256,hash(generated['manifest.json']));
  const required=['/','/browser.mjs','/runtime-tests.mjs','/preview/cases.json','/preview/contract-cases.json',...Object.keys(generated).filter(p=>p.endsWith('.mjs')).map(p=>'/preview/'+p)];
  for(const p of required)check('浏览器实际加载:'+p,browser.requests.includes(p));
  return {format:'wire-static-check/1',approved:false,runtime_ready:false,all_passed:true,cases_passed:checks.length,checks,
    node_static_checks:node.cases_passed,browser_recorded_checks:browser.report.cases_passed,browser_rerun_by_checker:false,
    differential_messages:cases.length+samples.length,contract_samples:samples.length,fixture_messages:cases.length,full_graph_integer_nodes:146,
    node:process.version,product_runtime_tests_executed:0,device_tests_executed:0,
    limitations:['浏览器记录绑定已验收字节；命令行检查器不启动浏览器','五个入口静态校验不代表全部API导出或业务语义验收','扫描切片不抢占JSON.parse与Schema同步调用'],inputs:inputs()};
}
if(process.argv.includes('--check-report')) {
  const report=read('report.json');assert(report.all_passed);assert.deepEqual(report.inputs,inputs());
  console.log(JSON.stringify({all_passed:true,bindings:Object.keys(report.inputs).length,behavior_rerun:false}));
} else {
  const report=await run();if(process.argv.includes('--report'))fs.writeFileSync(path.join(root,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(Object.fromEntries(Object.entries(report).filter(([k])=>!['checks','inputs'].includes(k)))));
}
