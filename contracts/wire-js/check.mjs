import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
import {decodeWire,compileSchema,profile,defaultProfile,WireError} from './wire.mjs';

const root=path.dirname(fileURLToPath(import.meta.url)),sdk=path.resolve(root,'../..');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const own=['README.md','package.json','package-lock.json','dependencies.json','sources.json','wire.mjs','schema.mjs','oracle.py','check.mjs'];
function inputs() { return Object.fromEntries([...own.map(n=>'contracts/wire-js/'+n),...Object.keys(read(path.join(root,'sources.json')).inputs)].sort().map(p=>[p,hash(fs.readFileSync(path.join(sdk,p)))])); }
const checks=[];
function check(name,value,expected=true) { assert.deepEqual(value,expected,name);checks.push({name,passed:true}); }
async function reject(name,fn,reason) {
  try { await fn(); } catch(e) {
    assert(e instanceof WireError,name+':未脱敏错误');check(name,e.reason,reason);
    check(name+'错误白名单',Object.keys(e.public()).every(k=>['stage','reason_code','byte_offset'].includes(k)));return e;
  }
  throw new Error(name+':未拒绝');
}
const bytes=s=>new TextEncoder().encode(s),broad=compileSchema(true),slow=profile({parse_deadline_ms:5000});

async function run() {
  const pkg=read(path.join(root,'package.json')),sources=read(path.join(root,'sources.json'));
  check('固定Node',process.version,'v'+pkg.engines.node);
  for(const [p,digest] of Object.entries(sources.inputs))check('固定输入:'+p,hash(fs.readFileSync(path.join(sdk,p))),digest);
  const dependencies=read(path.join(root,'dependencies.json'));
  check('固定Node制品',hash(fs.readFileSync(process.execPath)),dependencies.runtime.executable_sha256);
  for(const [p,digest] of Object.entries(dependencies.files))check('已安装依赖:'+p,hash(fs.readFileSync(path.join(root,'node_modules',p))),digest);
  check('固定锁摘要',hash(fs.readFileSync(path.join(root,'package-lock.json'))),dependencies.lock_sha256);
  const fixture=read(path.join(sdk,'contracts/wire-json/source/decoder-design-cases.json'));
  check('候选预算保持',Object.fromEntries(Object.keys(defaultProfile).map(k=>[k,fixture.base.profiles[0][k]])),defaultProfile);
  const cases=fixture.raw_cases_planned.map(c=>({id:c.id,hex:c.raw_hex??Buffer.from(c.raw).toString('hex'),
    schema:c.test_schema??(c.root==='integer_array'?{type:'array',items:{type:'integer'}}:{type:c.root}),expected:c.accept,reason:c.reason}));
  for(const c of cases) {
    const raw=Buffer.from(c.hex,'hex'),compiled=compileSchema(c.schema);
    if(c.expected) { await decodeWire(raw,compiled);check(c.id,true); }
    else await reject(c.id,()=>decodeWire(raw,compiled),c.reason);
  }
  const syntax=['',' ','[','{','[1,]','{"a" 1}','{"a":}','[01]','1.','1e','+1','.1','--1','truefalse','nullx','/*x*/1','"x\n"','"\\x12"','"\\u12g4"'];
  for(const [i,raw] of syntax.entries())cases.push({id:'syntax'+i,hex:Buffer.from(raw).toString('hex'),schema:true});
  for(const [i,raw] of ['"\\udc00"','"\\ud800x"','"\\ufdd0"','"\\ufffe"','"\\uffff"','"\\ud83f\\udffe"'].entries())cases.push({id:'scalar'+i,hex:Buffer.from(raw).toString('hex'),schema:true});
  for(const raw of ['22eda08022','22f490808022','228022','22e28222'])cases.push({id:'utf8'+raw,hex:raw,schema:true});
  const budgets=[
    ['message',{max_message_bytes:8,max_key_utf8_bytes:1,max_string_utf8_bytes:1},'0       ','0        ','message_budget'],
    ['depth',{max_depth:2},'[[]]','[[[]]]','depth_budget'],
    ['nodes',{max_value_nodes:3},'[1,2]','[1,2,3]','node_budget'],
    ['members',{max_object_members:1},'{"x":1}','{"x":1,"y":2}','member_budget'],
    ['key',{max_key_utf8_bytes:2},'{"é":1}','{"中":1}','key_budget'],
    ['string',{max_key_utf8_bytes:1,max_string_utf8_bytes:4},'"😀"','"😀x"','string_budget'],
    ['number',{max_number_chars:3},'123','1234','number_budget'],
    ['exponent',{max_exponent_abs:3},'1e3','1e4','number_budget']];
  for(const [name,options,good,bad,reason] of budgets) {
    await decodeWire(bytes(good),broad,{profile:profile(options)});check(name+'等号接受',true);
    await reject(name+'超一拒绝',()=>decodeWire(bytes(bad),broad,{profile:profile(options)}),reason);
    for(const raw of [good,bad])cases.push({id:name+raw,hex:Buffer.from(raw).toString('hex'),schema:true,profile:options});
  }
  for(const key of Object.keys(defaultProfile))for(const value of [0,true,Infinity,null])
    await reject(key+'非法预算'+String(value),()=>profile({[key]:value}),'profile_bounds');
  const branches=[
    {type:['integer','null']},{type:['integer','number']},{oneOf:[{type:'integer'},{type:'number'}]},
    {allOf:[{type:'number'},{type:'integer'}]},{not:{type:'integer'}},
    {if:{type:'integer'},then:false,else:true},
    {$schema:'https://json-schema.org/draft/2020-12/schema',$defs:{I:{$schema:'https://json-schema.org/draft/2020-12/schema',type:'integer'}},$ref:'#/$defs/I'},
    JSON.parse('{"type":"object","properties":{"__proto__":{"type":"integer"}},"required":["__proto__"],"additionalProperties":false}')];
  for(const [i,schema] of branches.entries())for(const number of ['1.0000000000000001','1.0','9007199254740993']) {
    const raw=i===7?'{"__proto__":'+number+'}':number;
    cases.push({id:'branch'+i+number,hex:Buffer.from(raw).toString('hex'),schema});
  }
  for(const text of ['0','-0','1','1.0','1e0','1.0000000000000001','9007199254740991','9007199254740992','9007199254740993',
    '-9007199254740991','1e20','1e-400','0e-400','1e309','5e-324','2.2250738585072014e-308','1.7976931348623157e308',
    '123000e-3','10e-1','1001e-3','0.'+'0'.repeat(100)+'1','1e4096','1'.repeat(128)+'.1'])
    for(const type of ['number','integer'])cases.push({id:'numeric'+type+text,hex:Buffer.from(text).toString('hex'),schema:{type}});
  const proto=compileSchema(branches[7]);check('__proto__约束迁移',proto.rewrites.length,1);
  await reject('__proto__不绕过整数',()=>decodeWire(bytes('{"__proto__":1.0000000000000001}'),proto),'raw_integer');
  const mixed=JSON.parse('{"properties":{"__proto__":{"type":"integer"}},"patternProperties":{"^__proto__$(?![\\\\s\\\\S])":{"minimum":2}}}');
  await reject('__proto__原pattern仍约束',()=>decodeWire(bytes('{"__proto__":1}'),compileSchema(mixed)),'schema_rejected');
  check('__proto__同时满足两约束',(await decodeWire(bytes('{"__proto__":2}'),compileSchema(mixed))).value.__proto__,2);
  const rewrites=compileSchema(mixed).rewrites;
  check('原pattern迁移身份',rewrites.some(r=>r.source.includes('/patternProperties/')&&r.derived.endsWith('/allOf/0')));
  check('原properties迁移身份',rewrites.some(r=>r.source.endsWith('/properties/__proto__')&&r.derived.endsWith('/allOf/1')));
  const frozen=(await decodeWire(bytes('{"__proto__":{"polluted":true},"x":[1]}'),broad)).value;
  check('无原型污染',Object.prototype.polluted===undefined);check('特殊键保留',Object.hasOwn(frozen,'__proto__'));
  check('递归冻结',Object.isFrozen(frozen)&&Object.isFrozen(frozen.__proto__)&&Object.isFrozen(frozen.x));
  assert.throws(()=>{frozen.x[0]=2;},TypeError);check('只读拒改',true);
  const raw=bytes('{"é":2,"a/b":{"~x":1.0000000000000001}}'),decoded=await decodeWire(raw,broad);
  for(const token of decoded.numbers)check('UTF8区间'+token.pointer,new TextDecoder().decode(raw.slice(token.start,token.end)),token.text);
  check('Pointer转义',decoded.numbers[1].pointer,'/a~1b/~0x');
  check('空键路径',(await decodeWire(bytes('{"":1}'),broad)).numbers[0].pointer,'/');
  const eof=await reject('EOF',()=>decodeWire(bytes('{"é":'),broad),'json_grammar');check('EOF字节末尾',eof.offset,bytes('{"é":').length);
  await reject('SharedArrayBuffer拒绝',()=>decodeWire(new Uint8Array(new SharedArrayBuffer(1)),broad),'shared_buffer');
  const crossShared=vm.runInNewContext('new SharedArrayBuffer(1)');
  await reject('跨realm共享缓冲拒绝',()=>decodeWire(new Uint8Array(crossShared),broad),'shared_buffer');
  await reject('DataView拒绝',()=>decodeWire(new DataView(new ArrayBuffer(1)),broad),'byte_view_required');
  await reject('Proxy视图拒绝',()=>decodeWire(new Proxy(bytes('1'),{}),broad),'byte_view_required');
  let source=bytes(' '.repeat(20)+'1'),changed=false;
  const copied=await decodeWire(source,broad,{profile:profile({slice_units:4}),yieldNow:async()=>{source.fill(50);changed=true;}});
  check('输入已变',changed);check('首await前私有副本',copied.value,1);
  await reject('入口取消',()=>decodeWire(bytes('1'),broad,{cancelled:()=>true}),'cancelled');
  let cancel=false,yields=0;
  await reject('让出执行后取消',()=>decodeWire(bytes(' '.repeat(100)+'1'),broad,{profile:profile({slice_units:8}),
    cancelled:()=>cancel,yieldNow:async()=>{if(++yields===2)cancel=true;}}),'cancelled');
  check('实际yield两次',yields,2);
  let ticks=[0,100];await reject('期限等号',()=>decodeWire(bytes('1'),broad,{clock:()=>ticks.shift()}),'deadline');
  ticks=[2,1];await reject('时钟倒退',()=>decodeWire(bytes('1'),broad,{clock:()=>ticks.shift()}),'clock_invalid');
  let now=0;await reject('yield超时不可受理',()=>decodeWire(bytes(' '.repeat(40)+'1'),broad,{clock:()=>now,
    profile:profile({slice_units:8}),yieldNow:async()=>{now=100;}}),'deadline');
  await reject('外部引用',()=>compileSchema({$ref:'https://leafseamer.invalid/private'}),'external_reference');
  await reject('未知引用',()=>compileSchema({$ref:'#/$defs/missing'}),'schema_compile');
  await reject('保留关键字',()=>compileSchema({xRawInteger:false}),'reserved_keyword');
  const literal={type:'object',properties:{type:{type:'integer'}},examples:[{$schema:'private',type:'integer'}]},before=JSON.stringify(literal);
  check('同名type属性Schema保留',compileSchema(literal).integerPaths,['/properties/type/type']);check('源Schema不改',JSON.stringify(literal),before);
  check('数据integer不作类型',compileSchema({const:{type:'integer'}}).integerPaths,[]);
  const secret=await reject('错误脱敏',()=>decodeWire(bytes('{"do-not-expose-secret":1.0000000000000001}'),compileSchema({additionalProperties:{type:'integer'}})),'raw_integer');
  check('错误不反射秘密',!JSON.stringify(secret.public()).includes('do-not-expose'));
  // 有固定种子的有效报文差分；同时比较DTO和全部数字token元数据。
  let seed=20261027;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  function randomValue(depth=0) {
    const leaves=[null,true,false,Math.floor(rand()*20000)-10000,rand(),'','é/😀~','__proto__'];
    if(depth>=3)return leaves[Math.floor(rand()*leaves.length)];
    const kind=Math.floor(rand()*3),size=Math.floor(rand()*5);
    if(kind===0)return Array.from({length:size},()=>randomValue(depth+1));
    if(kind===1)return Object.fromEntries(Array.from({length:size},(_,i)=>[i+'é',randomValue(depth+1)]));
    return leaves[Math.floor(rand()*leaves.length)];
  }
  for(let i=0;i<200;i++)cases.push({id:'generated'+i,hex:Buffer.from(JSON.stringify(randomValue())).toString('hex'),schema:true});
  const pythonIndex=process.argv.indexOf('--python'),python=pythonIndex>=0?process.argv[pythonIndex+1]:'python';
  const bridge=spawnSync(python,['-I','-B',path.join(root,'oracle.py')],{input:JSON.stringify(cases.map(c=>({...c,profile:{...c.profile,parse_deadline_ms:5000}}))),encoding:'utf8',maxBuffer:16*1024*1024});
  assert.equal(bridge.status,0,bridge.stderr);const oracle=JSON.parse(bridge.stdout);
  for(const [i,c] of cases.entries()) {
    let current;
    try { const result=await decodeWire(Buffer.from(c.hex,'hex'),compileSchema(c.schema),{profile:profile({...c.profile,parse_deadline_ms:5000})});current={accepted:true,value:result.value,numbers:result.numbers}; }
    catch(e) { assert(e instanceof WireError);current={accepted:false,error:e.public()}; }
    const expected=oracle.results[i];check('Python接受集:'+c.id,current.accepted,expected.accepted);
    if(current.accepted) { check('Python值:'+c.id,current.value,expected.value);check('Python原始token:'+c.id,current.numbers,expected.numbers); }
    else { check('Python拒绝码:'+c.id,current.error.reason_code,expected.error.reason_code);
      if(current.error.byte_offset!==undefined)check('Python字节偏移:'+c.id,current.error.byte_offset,expected.error.byte_offset); }
  }
  const shared=compileSchema({type:'array',items:{type:'integer'}});
  const parallel=await Promise.all(Array.from({length:64},async(_,i)=>{
    try { const result=await decodeWire(bytes(' '.repeat(16)+(i%2?'[1.0]':'[1.0000000000000001]')),shared,
      {profile:profile({slice_units:8,parse_deadline_ms:5000}),yieldNow:()=>new Promise(r=>setImmediate(r))});return i%2===1&&result.value[0]===1; }
    catch(e) { return i%2===0&&e instanceof WireError&&e.reason==='raw_integer'&&e.offset===17; }
  }));check('64次异步上下文隔离',parallel.every(Boolean));
  const graph=read(path.join(sdk,'contracts/event-integration/preview/models.schema.json'));
  const defs=graph.$defs,name=Object.keys(defs).find(n=>defs[n].type==='integer');
  const full=compileSchema({$schema:'https://json-schema.org/draft/2020-12/schema',$defs:defs,$ref:'#/$defs/'+name});
  check('完整图整数节点',full.integerPaths.length,146);
  await reject('完整图拒绝舍入',()=>decodeWire(bytes('1.0000000000000001'),full,{profile:slow}),'raw_integer');
  await reject('完整图拒绝越界',()=>decodeWire(bytes('9007199254740993'),full,{profile:slow}),'integer_range');
  for(const pointer of full.integerPaths) { let value={$defs:defs};for(const part of pointer.split('/').slice(1))value=value[part.replaceAll('~1','/').replaceAll('~0','~')];check('整数路径:'+pointer,value==='integer'||Array.isArray(value)&&value.includes('integer')); }
  return {format:'wire-js-check/1',all_passed:true,approved:false,runtime_ready:false,cases_passed:checks.length,checks,
    cross_language_messages:cases.length,generated_json_cases:200,async_parallel_decodes:64,full_graph_integer_nodes:146,
    node:process.version,python:oracle.python,dependency_packages:dependencies.packages.length,
    product_runtime_tests_executed:0,browser_tests_executed:0,network_tests_executed:0,device_tests_executed:0,
    limitations:['Ajv运行时编译仅用于可信安装阶段，尚无浏览器CSP静态制品','yield不提供JSON.parse或Schema库调用的硬抢占','不实现传输重组及授权或业务语义'],inputs:inputs()};
}

if(process.argv.includes('--check-report')) {
  const report=read(path.join(root,'report.json'));assert(report.all_passed);assert.deepEqual(report.inputs,inputs());
  console.log(JSON.stringify({all_passed:true,bindings:Object.keys(report.inputs).length}));
} else {
  const report=await run();
  if(process.argv.includes('--report'))fs.writeFileSync(path.join(root,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(Object.fromEntries(Object.entries(report).filter(([k])=>!['checks','inputs'].includes(k)))));
}
