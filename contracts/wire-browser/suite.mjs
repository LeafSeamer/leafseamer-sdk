import {run} from './preview/runtime-tests.mjs';
import {createDecoder,profile,WireError} from '/contracts/wire-routing/decoder.mjs';
const assets=['/contracts/wire-routing/preview/inventory.json','/contracts/event-integration/preview/selection.json',
  '/contracts/event-integration/preview/worker-messages.json','/contracts/integration/source/frames.json',
  '/contracts/wire-static/preview/contract-cases.json','/contracts/wire-routing/oracle.json'];
export async function execute(expectedIsolation) {
  const values=await Promise.all(assets.map(async path=>{const response=await fetch(path,{cache:'no-store'});if(!response.ok)throw new Error('fixture_load');return response.json();}));
  const result=await run(values[0],values[1],values[2].ipc_version,values[3],values[4],values[5]);
  const shared=typeof SharedArrayBuffer!=='undefined';
  const extra=[];function check(name,value){if(!value)throw new Error(name);extra.push({name,passed:true});}
  check('隔离模式与实际环境一致',crossOriginIsolated===expectedIsolation);
  check('共享缓冲能力与隔离一致',shared===expectedIsolation);
  check('执行数与跳过项对账',result.cases_passed===(shared?7861:7761));
  const decoder=createDecoder(values[1]),handle=decoder.http('controller','openEvents','response','401');
  const value={code:'authentication_required',request_id:'browser_synthetic',retry_action:'do_not_retry'};
  const bytes=new TextEncoder().encode(' '.repeat(40)+JSON.stringify(value));
  const promise=decoder.decode(bytes,handle,{contentType:'application/json',profile:profile({slice_units:8,parse_deadline_ms:5000})});
  const transferred=structuredClone(bytes,{transfer:[bytes.buffer]});
  check('输入缓冲确实转移',bytes.byteLength===0&&transferred.byteLength>0);
  check('首await前复制抵抗转移',JSON.stringify((await promise).value)===JSON.stringify(value));
  let invalid=false;
  try{await decoder.decode(Uint8Array.from([0x22,0xff,0x22]),handle,{contentType:'application/json'});}
  catch(e){invalid=e instanceof WireError&&e.reason==='utf8';}
  check('浏览器UTF8不替换坏字节',invalid);
  return {...result,cases_passed:result.cases_passed+extra.length,checks:[...result.checks,...extra],
    cross_origin_isolated:crossOriginIsolated,shared_array_buffer_available:shared,skipped_shared_buffer_checks:shared?0:100};
}
