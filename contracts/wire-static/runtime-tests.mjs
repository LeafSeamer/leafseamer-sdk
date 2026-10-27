import * as T from './preview/test-wire.mjs';
import * as C from './preview/contracts-wire.mjs';
const bytes=s=>new TextEncoder().encode(s);
const hex=s=>Uint8Array.from(s.match(/../g)??[],v=>parseInt(v,16));

export async function run(cases,contractCases) {
  const checks=[];
  function check(name,yes) { if(!yes)throw new Error(name);checks.push({name,passed:true}); }
  async function result(api,name,raw,options={}) {
    try {const decoded=await api.decodeWire(raw,api.getSchema(name),options);return {accepted:true,value:decoded.value,numbers:decoded.numbers};}
    catch(e) {if(!(e instanceof api.WireError))throw e;return {accepted:false,error:e.public()};}
  }
  const slowT=T.profile({parse_deadline_ms:5000}),slowC=C.profile({parse_deadline_ms:5000});
  for(const [i,c] of cases.entries()) {
    const value=await result(T,c.name,hex(c.raw_hex),{profile:slowT});
    check('固定接受集'+i+':'+c.name,value.accepted===c.expected);
    if(c.reason)check('固定拒绝码'+i,value.error?.reason_code===c.reason);
  }
  for(const [i,c] of contractCases.entries()) {
    const value=await result(C,c.name,bytes(JSON.stringify(c.value)),{profile:slowC});
    check('真实契约根'+i+':'+c.name,value.accepted);
    check('契约字段保留'+i,JSON.stringify(value.value)===JSON.stringify(c.value));
    const bad=structuredClone(c.value);bad.unregistered_extra=true;
    check('真实根额外字段拒绝'+i,!(await result(C,c.name,bytes(JSON.stringify(bad)),{profile:slowC})).accepted);
  }
  const manifest=contractCases.find(c=>c.name==='snapshot_manifest');
  const raw=JSON.stringify(manifest.value).replace(/"page_count":\d+/,'"page_count":1.0000000000000001');
  check('Manifest原始整数守卫',(await result(C,'snapshot_manifest',bytes(raw),{profile:slowC})).error?.reason_code==='raw_integer');
  const page=contractCases.find(c=>c.name==='snapshot_page');
  const pageRaw=JSON.stringify(page.value).replace(/"page_index":\d+/,'"page_index":1.0000000000000001');
  check('分页引用原始整数守卫',(await result(C,'snapshot_page',bytes(pageRaw),{profile:slowC})).error?.reason_code==='raw_integer');
  const wrong={...contractCases.find(c=>c.name==='selection').value,contract_id:'leafseamer.api.v1.integration1'};
  check('旧选择不降级',!(await result(C,'selection',bytes(JSON.stringify(wrong)),{profile:slowC})).accepted);
  for(const name of ['anything','unknown','baseline__CommandRequest']) {
    let rejected=false;try{C.getSchema(name);}catch(e){rejected=e.reason==='unregistered_model';}check('生产候选不暴露测试根:'+name,rejected);
  }
  check('没有运行时编译入口',!('compileSchema' in C)&&!('compileSchema' in T));
  const proto=await result(T,'anything',bytes('{"__proto__":{"polluted":true},"arr":[1]}'));
  check('原型保持',Object.prototype.polluted===undefined&&Object.hasOwn(proto.value,'__proto__'));
  check('递归冻结',Object.isFrozen(proto.value)&&Object.isFrozen(proto.value.__proto__)&&Object.isFrozen(proto.value.arr));
  const mutable=bytes(' '.repeat(40)+'1');let yielded=false;
  const copied=await result(T,'anything',mutable,{profile:T.profile({slice_units:8,parse_deadline_ms:5000}),yieldNow:async()=>{mutable.fill(50);yielded=true;}});
  check('复制所有权',yielded&&copied.value===1);
  let cancelled=false;
  check('yield后取消',(await result(T,'anything',bytes(' '.repeat(40)+'1'),{profile:T.profile({slice_units:8,parse_deadline_ms:5000}),
    cancelled:()=>cancelled,yieldNow:async()=>{cancelled=true;}})).error?.reason_code==='cancelled');
  let now=0;
  check('yield后超时',(await result(T,'anything',bytes(' '.repeat(40)+'1'),{profile:T.profile({slice_units:8}),clock:()=>now,yieldNow:async()=>{now=100;}})).error?.reason_code==='deadline');
  const parallel=await Promise.all(Array.from({length:64},async(_,i)=>{
    const value=await result(T,'DW28',bytes(' '.repeat(20)+(i%2?'[1e0]':'[1.0000000000000001]')),
      {profile:T.profile({slice_units:8,parse_deadline_ms:5000})});
    return i%2?value.accepted&&value.value[0]===1:!value.accepted&&value.error.reason_code==='raw_integer';
  }));check('64次静态引用异步交错',parallel.every(Boolean));
  // 固定种子语法/构值对照，静态anything仍必须先经过完整扫描。
  let seed=20261027;const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<200;i++) {
    const value={['é/'+i]:[next(),Math.floor(next()*10000),'😀~',i%2===0,null]},raw=JSON.stringify(value);
    const decoded=await result(T,'anything',bytes(raw),{profile:slowT});
    check('静态构值差分'+i,decoded.accepted&&JSON.stringify(decoded.value)===raw);
  }
  return {all_passed:true,cases_passed:checks.length,checks,contract_samples:contractCases.length,fixture_messages:cases.length,async_parallel_decodes:64,generated_messages:200};
}
