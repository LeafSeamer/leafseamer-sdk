import {decodeWire,getSchema,profile,WireError} from './capability-template/wire.mjs';
export {capabilityTemplateSelection} from './capability-template/selection.mjs';
export {WireError as CapabilityTemplateWireError};
const budget=profile({max_message_bytes:1048576,max_depth:32,max_value_nodes:65536,max_object_members:4096,max_key_utf8_bytes:1024,max_string_utf8_bytes:1048576,parse_deadline_ms:2000});
const need=(ok,code)=>{if(!ok)throw new WireError('binding',code);};
const sorted=values=>values.every((value,i)=>i===0||value>values[i-1]);
export async function decodeCapabilityTemplate(bytes){
 const value=(await decodeWire(bytes,getSchema('CapabilityTemplate'),{profile:budget,yieldNow:()=>new Promise(resolve=>typeof setImmediate==='function'?setImmediate(resolve):setTimeout(resolve,0))})).value;
 need(sorted(value.actions.map(action=>action.action_id))&&sorted(value.triggers.map(trigger=>trigger.trigger_id)),'capability_identity');
 for(const action of value.actions){
  need(action.completion.supported.includes(action.completion.default)&&sorted(action.completion.supported),'capability_completion');
  for(const field of ['resources','dependencies'])need(sorted(action[field]),'capability_order');
  need(sorted(action.platforms.map(platform=>platform.os+'/'+platform.arch)),'capability_order');
  for(const field of ['read_set','write_set'])if(Array.isArray(action[field]))need(sorted(action[field]),'capability_order');
 }
 return value;
}
