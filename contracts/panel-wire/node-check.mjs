import fs from 'node:fs';
import {run} from './runtime-tests.mjs';
if(!process.execArgv.includes('--disallow-code-generation-from-strings'))throw new Error('必须禁止动态代码生成');
let blocked=false;try{Function('return 1')();}catch{blocked=true;}if(!blocked)throw new Error('动态代码未禁止');
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const oracle=read('./oracle.json');
const result=await run(read('./preview/inventory.json'),read('./contract/selection.json'),read('./contract/worker-messages.json').ipc_version,
  read('../integration/source/frames.json'),oracle.event_samples,oracle);
const panel=await runPanel(oracle,read('./contract/selection.json'),read('../event-integration/preview/selection.json'));
console.log(JSON.stringify({...result,checks:[...result.checks,...panel.checks],cases_passed:result.cases_passed+panel.checks.length,panel:{...panel,checks:undefined}, node:process.version,dynamic_codegen_blocked:true}));

async function runPanel(oracle,selection,previous) {
  const {createDecoder,WireError,profile}=await import('./decoder.mjs');
  const {createDecoder:oldDecoder}=await import('../wire-routing/decoder.mjs');
  const decoder=createDecoder(selection),checks=[],bytes=s=>new TextEncoder().encode(s),options={profile:profile({parse_deadline_ms:5000})};
  const check=(name,yes)=>{if(!yes)throw new Error(name);checks.push({name,passed:true});};
  async function denied(name,fn,reason) {
    try{await fn();}catch(error){check(name,error instanceof WireError&&error.reason===reason);return;}
    throw new Error(name+':未拒绝');
  }
  for(const c of oracle.panel_cases) {
    const handle=decoder.panel(c.group,c.type);let accepted=false;
    try{const result=await decoder.decode(bytes(c.raw),handle,options);accepted=true;check('面板DTO冻结:'+c.label,Object.isFrozen(result.value));}
    catch(error){if(!(error instanceof WireError))throw error;}
    check('面板接受集:'+c.label,accepted===c.accepted);
  }
  const types=new Map(oracle.panel_cases.filter(c=>c.accepted).map(c=>[c.type,c]));
  check('十九类面板正例',types.size===19);
  for(const [type,c] of types) {
    for(const group of ['window','panel','host'].filter(g=>g!==c.group))await denied('面板错组:'+type+group,()=>decoder.panel(group,type),'unknown_panel_binding');
    const handle=decoder.panel(c.group,type),wrong=JSON.parse(c.raw);wrong.type='unknown';
    await denied('面板错类型正文:'+type,()=>decoder.decode(bytes(JSON.stringify(wrong)),handle,options),'schema_rejected');
    await denied('面板不接HTTP参数:'+type,()=>decoder.decode(bytes(c.raw),handle,{...options,contentType:'application/json'}),'content_type');
  }
  await denied('新消费者拒events2',()=>createDecoder(previous),'contract_selection');
  await denied('新消费者拒panel3',()=>createDecoder(read('../panel-integration/preview/selection.json')),'contract_selection');
  await denied('新ID旧摘要拒绝',()=>createDecoder({...selection,contract_digest:previous.contract_digest}),'contract_selection');
  await denied('旧ID新摘要拒绝',()=>createDecoder({...previous,contract_digest:selection.contract_digest}),'contract_selection');
  check('旧消费者仍接受events2',typeof oldDecoder(previous).http==='function');
  let oldDenied=false;try{oldDecoder(selection);}catch(error){oldDenied=error.stage==='binding'&&error.reason==='contract_selection';}check('旧消费者仍拒panel4',oldDenied);
  const c=types.get('panel.request'),handle=decoder.panel(c.group,c.type);
  await denied('面板句柄不可跨实例',()=>createDecoder(selection).decode(bytes(c.raw),handle,options),'foreign_handle');
  await denied('面板伪造句柄拒绝',()=>decoder.decode(bytes(c.raw),{...handle},options),'foreign_handle');
  await denied('面板未知类型拒绝',()=>decoder.panel('panel','__proto__'),'unknown_panel_binding');
  // 格式检查有意不认证实际window、port或当前会话。
  const active=JSON.parse(types.get('host.active').raw);active.public_binding.panel_session_id='unrelated';
  check('格式不认证当前会话',!!(await decoder.decode(bytes(JSON.stringify(active)),decoder.panel('host','host.active'),options)).value);
  return {checks,frame_types:types.size,message_cases:oracle.panel_cases.length,production_authorization_executed:false,transport_calls:0};
}
