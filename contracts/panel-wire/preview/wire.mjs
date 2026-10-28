import {WireError,isSchema,validateValue} from './registry.mjs';
export {WireError,getSchema} from './registry.mjs';

const limits=Object.freeze({max_message_bytes:8388608,max_depth:64,max_value_nodes:1048576,max_object_members:65536,
  max_key_utf8_bytes:4096,max_string_utf8_bytes:8388608,max_number_chars:128,max_exponent_abs:4096,slice_units:4096,parse_deadline_ms:5000});
const defaults=Object.freeze({max_message_bytes:65536,max_depth:32,max_value_nodes:16384,max_object_members:4096,
  max_key_utf8_bytes:1024,max_string_utf8_bytes:32768,max_number_chars:128,max_exponent_abs:4096,slice_units:4096,parse_deadline_ms:100});
const profiles=new WeakSet();
export function profile(overrides={}) {
  if(Object.keys(overrides).some(k=>!Object.hasOwn(limits,k)))throw new WireError('profile','profile_bounds');
  const p={...defaults,...overrides};
  for(const [k,v] of Object.entries(p))if(!Number.isInteger(v)||v<1||v>limits[k])throw new WireError('profile','profile_bounds');
  if(!(p.max_key_utf8_bytes<=p.max_string_utf8_bytes && p.max_string_utf8_bytes<=p.max_message_bytes))throw new WireError('profile','profile_order');
  Object.freeze(p);profiles.add(p);return p;
}
export const defaultProfile=profile();
const typed=Object.getPrototypeOf(Uint8Array.prototype);
const byteLength=Object.getOwnPropertyDescriptor(typed,'byteLength').get;
const buffer=Object.getOwnPropertyDescriptor(typed,'buffer').get;
const number=/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/;

function token(text,pointer,start,end,p) {
  if(text.length>p.max_number_chars)throw new WireError('scan','number_budget',start);
  const parts=text.replace(/^-/,'').split(/[eE]/);
  let exponent=parts.length===2?Number(parts[1]):0;
  if(!Number.isFinite(exponent)||Math.abs(exponent)>p.max_exponent_abs)throw new WireError('scan','number_budget',start);
  const [whole,fraction='']=parts[0].split('.');
  let coefficient=(whole+fraction).replace(/^0+/,'');exponent-=fraction.length;
  if(coefficient) { const trimmed=coefficient.replace(/0+$/,'');exponent+=coefficient.length-trimmed.length;coefficient=trimmed; }
  else { coefficient='0';exponent=0; }
  const integer=coefficient==='0'||exponent>=0,size=coefficient.length+exponent;
  const safe=integer && (size<16 || size===16 && coefficient+'0'.repeat(exponent)<='9007199254740991');
  const value=Number(text);
  if(!Number.isFinite(value))throw new WireError('scan','nonfinite',start);
  if(value===0 && coefficient!=='0')throw new WireError('scan','number_underflow',start);
  return Object.freeze({pointer,start,end,text,negative:text.startsWith('-'),coefficient,exponent,integer,safe});
}

export async function decodeWire(input,schema,{profile:p=defaultProfile,clock=()=>performance.now(),cancelled=()=>false,
  yieldNow=()=>new Promise(resolve=>setTimeout(resolve,0))}={}) {
  if(!isSchema(schema)||!profiles.has(p))throw new WireError('input','trusted_configuration');
  if(!ArrayBuffer.isView(input)||!(input instanceof Uint8Array))throw new WireError('input','byte_view_required');
  const backing=buffer.call(input);
  let shared=false;
  if(typeof SharedArrayBuffer!=='undefined') {
    try { Object.getOwnPropertyDescriptor(SharedArrayBuffer.prototype,'byteLength').get.call(backing);shared=true; } catch {}
  }
  if(shared)throw new WireError('input','shared_buffer');
  const length=byteLength.call(input);
  if(length<1||length>p.max_message_bytes)throw new WireError('scan','message_budget');
  // 首次await前取得私有副本，后续原view变更不影响扫描/构值/校验。
  const started=clock();let previous=started,units=0;
  if(!Number.isFinite(started))throw new WireError('scan','clock_invalid');
  const bytes=new Uint8Array(length);Uint8Array.prototype.set.call(bytes,input);
  function checkpoint() {
    const now=clock();
    if(!Number.isFinite(now)||now<previous)throw new WireError('scan','clock_invalid');
    previous=now;
    if(cancelled())throw new WireError('scan','cancelled');
    if(now-started>=p.parse_deadline_ms)throw new WireError('scan','deadline');
  }
  async function pause() { units=0;checkpoint();await yieldNow();checkpoint(); }
  checkpoint();
  if(bytes[0]===239 && bytes[1]===187 && bytes[2]===191)throw new WireError('scan','bom',0);
  let text;
  try { text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes); }
  catch { throw new WireError('scan','utf8'); }
  const offsets=new Uint32Array(text.length+1);let count=0;
  for(let j=0;j<text.length;) {
    const cp=text.codePointAt(j),width=cp>65535?2:1;
    offsets[j]=count;if(width===2)offsets[j+1]=count;
    count+=cp<=127?1:cp<=2047?2:cp<=65535?3:4;j+=width;offsets[j]=count;
    if(++units>=p.slice_units)await pause();
  }
  const n=text.length,numbers=new Map(),stack=[];let i=0,nodes=0,root=false;
  function fail(reason,pos=i) { throw new WireError('scan',reason,offsets[pos]); }
  async function string(key=false) {
    const start=i++;let closed=false;
    while(i<n) {
      const c=text[i++];
      if(++units>=p.slice_units)await pause();
      if(c==='"') { closed=true;break; }
      if(c==='\\') {
        if(i>=n)fail('json_grammar');
        const e=text[i++];
        if(e==='u') { if(i+4>n||! /^[0-9a-fA-F]{4}$/.test(text.slice(i,i+4)))fail('json_grammar');i+=4; }
        else if(!'"\\/bfnrt'.includes(e))fail('json_grammar');
      } else if(c.charCodeAt(0)<32)fail('json_grammar',i-1);
    }
    if(!closed)fail('json_grammar');
    let value;
    try { value=JSON.parse(text.slice(start,i)); } catch { fail('json_grammar',start); }
    let size=0;
    for(const c of value) {
      const cp=c.codePointAt(0);
      if(cp>=0xd800&&cp<=0xdfff)fail('unicode_scalar',start);
      if(cp>=0xfdd0&&cp<=0xfdef || (cp&0xffff)>=0xfffe)fail('unicode_noncharacter',start);
      size+=cp<=127?1:cp<=2047?2:cp<=65535?3:4;
      if(++units>=p.slice_units)await pause();
    }
    if(size>(key?p.max_key_utf8_bytes:p.max_string_utf8_bytes))fail(key?'key_budget':'string_budget',start);
    return value;
  }
  for(;;) {
    if(++units>=p.slice_units)await pause();
    while(i<n && ' \t\r\n'.includes(text[i])) { i++;if(++units>=p.slice_units)await pause(); }
    if(!stack.length && root) { if(i!==n)fail('trailing_data');break; }
    let pointer='';
    if(stack.length) {
      const f=stack.at(-1);
      if(f.state==='comma') {
        if(i<n&&text[i]===(f.kind==='object'?'}':']')) { i++;stack.pop();continue; }
        if(i>=n||text[i]!==',')fail('json_grammar');
        i++;f.state=f.kind==='object'?'key_required':'value_required';continue;
      }
      if(f.kind==='object'&&['first','key_required'].includes(f.state)) {
        if(f.state==='first'&&i<n&&text[i]==='}') { i++;stack.pop();continue; }
        if(i>=n||text[i]!=='"')fail('json_grammar');
        const start=i,key=await string(true);
        if(f.keys.has(key))fail('duplicate_key',start);
        f.keys.add(key);if(f.keys.size>p.max_object_members)fail('member_budget',start);
        f.key=key;f.state='colon';continue;
      }
      if(f.state==='colon') { if(i>=n||text[i]!==':')fail('json_grammar');i++;f.state='value_required';continue; }
      if(f.kind==='array'&&f.state==='first'&&i<n&&text[i]===']') { i++;stack.pop();continue; }
      const suffix=f.kind==='object'?f.key.replaceAll('~','~0').replaceAll('/','~1'):String(f.index++);
      pointer=f.pointer+'/'+suffix;f.state='comma';
    } else root=true;
    if(++nodes>p.max_value_nodes)fail('node_budget');
    if(i>=n)fail('json_grammar');
    const c=text[i];
    if(c==='{'||c==='[') {
      if(stack.length+1>p.max_depth)fail('depth_budget');
      stack.push({kind:c==='{'?'object':'array',state:'first',keys:new Set(),index:0,pointer});i++;
    } else if(c==='"')await string();
    else if(c==='-'||c>='0'&&c<='9') {
      let tokenEnd=i;
      while(tokenEnd<n && !' \t\r\n,]}'.includes(text[tokenEnd]) && tokenEnd-i<=p.max_number_chars)tokenEnd++;
      if(tokenEnd-i>p.max_number_chars)fail('number_budget');
      const match=number.exec(text.slice(i,tokenEnd));
      if(!match)fail('json_grammar');
      const end=i+match[0].length;
      if(match[0].length>p.max_number_chars)fail('number_budget');
      if(end<n && !' \t\r\n,]}'.includes(text[end]))fail('json_grammar',end);
      numbers.set(pointer,token(match[0],pointer,offsets[i],offsets[end],p));i=end;
    } else {
      const literal=['true','false','null'].find(v=>text.startsWith(v,i));
      if(!literal)fail('json_grammar');i+=literal.length;
    }
  }
  checkpoint();let value;
  try { value=JSON.parse(text); } catch { throw new WireError('parse','parser_disagreement'); }
  checkpoint();validateValue(schema,value,numbers);checkpoint();
  // 不遍历原型，不将特殊键merge到任何其他对象；原始DTO只允许自身数据属性。
  const pending=[value];
  while(pending.length) {
    const current=pending.pop();
    if(current!==null&&typeof current==='object') {
      for(const child of Object.values(current)) { pending.push(child);if(++units>=p.slice_units)await pause(); }
      Object.freeze(current);
    }
    if(++units>=p.slice_units)await pause();
  }
  checkpoint();return Object.freeze({value,numbers:Object.freeze([...numbers.values()])});
}
