import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {build,served,csp,root,sdk,hash} from './build.mjs';
import {compact} from './record.mjs';
const read=p=>JSON.parse(fs.readFileSync(path.join(sdk,p),'utf8'));
const sources=read('contracts/wire-browser/sources.json');
const extraNames=['隔离模式与实际环境一致','共享缓冲能力与隔离一致','执行数与跳过项对账','输入缓冲确实转移','首await前复制抵抗转移','浏览器UTF8不替换坏字节'];
const baseChecks=read('contracts/wire-routing/report.json').static_runtime.checks;
function expectedChecks(isolated) {return [...baseChecks.filter(c=>isolated||!c.name.startsWith('空正文拒共享缓冲:')),...extraNames.map(name=>({name,passed:true}))];}
export function verify(receipt) {
  assert.equal(receipt.format,'wire-browser-receipt/1');assert.equal(receipt.approved,false);assert.equal(receipt.runtime_ready,false);
  assert.deepEqual(Object.keys(receipt.reports).sort(),['isolated','plain']);
  const assets=served(),expectedArtifacts=Object.fromEntries(Object.values(assets).map(v=>[v.path,hash(v.bytes)]));
  assert.deepEqual(receipt.artifacts,expectedArtifacts);
  for(const [mode,item] of Object.entries(receipt.reports)) {
    const isolated=mode==='isolated',report=item.report;
    assert(report.all_passed&&report.eval_blocked&&report.inline_blocked&&report.worker.all_passed&&report.worker.eval_blocked);
    assert.equal(report.mode,mode);assert.equal(typeof report.user_agent,'string');assert(report.user_agent.length>0);
    assert.equal(report.worker.user_agent,report.user_agent);
    assert.deepEqual(item.headers,{'Content-Security-Policy':csp,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
      ...(isolated?{'Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'require-corp','Cross-Origin-Resource-Policy':'same-origin'}:{})});
    for(const kind of ['eval','inline'])assert(report.csp_violations.some(v=>v.blocked_uri===kind&&v.directive.startsWith('script-src')));
    for(const target of Object.keys(assets))assert(item.requests.includes(target),'未实际加载:'+target);
    assert(item.requests.every(p=>Object.hasOwn(assets,p)));
    for(const context of [report.page,report.worker.result]) {
      const expected=expectedChecks(isolated);
      assert(context.all_passed&&context.checks_all_passed);assert.equal(context.cases_passed,expected.length);assert.equal(context.checks_count,expected.length);
      assert.equal(context.checks_sha256,hash(JSON.stringify(expected)));
      assert.equal(context.cross_origin_isolated,isolated);assert.equal(context.shared_array_buffer_available,isolated);
      assert.equal(context.skipped_shared_buffer_checks,isolated?0:100);
      for(const [key,value] of Object.entries({operations:201,worker_messages:52,roots:281,json_bindings:2313,empty_bindings:100,ws_positive_messages:36,http_snapshot_positive_messages:36,worker_positive_messages:52}))assert.equal(context[key],value);
    }
  }
  return true;
}
function inputs() {
  const own=fs.readdirSync(root,{recursive:true}).filter(p=>fs.statSync(path.join(root,p)).isFile()&&p!=='report.json').map(p=>'contracts/wire-browser/'+p.replaceAll('\\','/'));
  return Object.fromEntries([...own,...Object.keys(sources.inputs)].sort().map(p=>[p,hash(fs.readFileSync(path.join(sdk,p)))]));
}
function run() {
  const checks=[];const check=(name,fn)=>{fn();checks.push({name,passed:true});};
  for(const [p,digest] of Object.entries(sources.inputs))check('固定来源:'+p,()=>assert.equal(hash(fs.readFileSync(path.join(sdk,p))),digest));
  const outputs=build();check('两次适配生成一致',()=>assert.deepEqual(outputs,build()));
  for(const [p,b] of Object.entries(outputs))check('仅测试能力检测适配:'+p,()=>assert.equal(fs.readFileSync(path.join(root,'preview',p),'utf8'),b));
  const receipt=read('contracts/wire-browser/browser-report.json');check('四个真实浏览器上下文及字节绑定',()=>assert(verify(receipt)));
  function bad(name,change) {const value=structuredClone(receipt);change(value);check(name,()=>assert.throws(()=>verify(value)));}
  bad('缺模式拒绝',r=>{delete r.reports.plain;});
  bad('验收字节漂移拒绝',r=>{r.artifacts[Object.keys(r.artifacts)[0]]='0'.repeat(64);});
  bad('CSP放宽拒绝',r=>{r.reports.plain.headers['Content-Security-Policy']+="; script-src 'unsafe-eval'";});
  bad('缺内联阻止证据',r=>{r.reports.plain.report.csp_violations=r.reports.plain.report.csp_violations.filter(v=>v.blocked_uri!=='inline');});
  bad('Worker失败不可忽略',r=>{r.reports.isolated.report.worker.all_passed=false;});
  bad('执行计数漂移拒绝',r=>{r.reports.plain.report.page.cases_passed++;});
  bad('普通页面跳过项不可算通过',r=>{r.reports.plain.report.page.skipped_shared_buffer_checks=0;});
  bad('执行明细摘要错配',r=>{r.reports.isolated.report.page.checks_sha256='0'.repeat(64);});
  bad('隔离条件不可伪称',r=>{r.reports.isolated.report.worker.result.cross_origin_isolated=false;});
  bad('缺静态验证器加载',r=>{r.reports.plain.requests=r.reports.plain.requests.filter(p=>!p.endsWith('/validators.mjs'));});
  bad('未知资产访问',r=>{r.reports.plain.requests.push('/not-allowed');});
  const raw=structuredClone(receipt);raw.format='wire-browser-result/1';
  for(const [mode,item] of Object.entries(raw.reports))for(const context of [item.report.page,item.report.worker.result]) {
    context.checks=expectedChecks(mode==='isolated');delete context.checks_sha256;delete context.checks_count;delete context.checks_all_passed;
  }
  check('摘要收据保留完整断言身份',()=>assert.deepEqual(compact(raw),receipt));
  raw.reports.plain.report.page.checks[0].passed=false;check('失败原始记录不可封存成功',()=>assert.throws(()=>compact(raw)));
  return {format:'wire-browser-check/1',approved:false,runtime_ready:false,all_passed:true,cases_passed:checks.length,checks,
    browser_contexts_recorded:4,plain_checks_per_context:7767,isolated_checks_per_context:7867,plain_skipped_per_context:100,
    recorded_checks_total:31268,browser_rerun_by_checker:false,product_network_tests_executed:0,device_tests_executed:0,
    limitations:['浏览器记录来自固定Windows Chromium环境，不证明其他浏览器和平台','回环资产获取不是产品HTTP或WS会话验收','普通页面每个上下文跳过100项不可构造的共享缓冲检查'],inputs:inputs()};
}
if(process.argv.includes('--check-report')) {
  const report=read('contracts/wire-browser/report.json');assert(report.all_passed);assert.deepEqual(report.inputs,inputs());
  console.log(JSON.stringify({all_passed:true,bindings:Object.keys(report.inputs).length,behavior_rerun:false}));
}else {
  const report=run();if(process.argv.includes('--report'))fs.writeFileSync(path.join(root,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(Object.fromEntries(Object.entries(report).filter(([k])=>!['checks','inputs'].includes(k)))));
}
