import canonicalize from './vendor/canonicalize.mjs';
import * as validators from './automation-program/validators.mjs';
export {contractSelection} from './selection.mjs';
export class AutomationModelError extends Error {constructor(code,path=''){super(code);this.name='AutomationModelError';this.code=code;this.path=path;}}
export function validateAutomationModel(name,value){
 const validator=Object.hasOwn(validators,name)?validators[name]:null;if(typeof validator!=='function')throw new AutomationModelError('automation_model');
 let nodes=0,bytes=0;const active=new Set(),encoder=new TextEncoder();
 function visit(v,depth){
  if(++nodes>1048576||depth>48)throw new AutomationModelError('automation_json_budget');
  if(v===null||typeof v==='boolean'){bytes+=JSON.stringify(v).length;return;}
  if(typeof v==='number'){if(!Number.isFinite(v))throw new AutomationModelError('automation_json_number');bytes+=JSON.stringify(v).length;return;}
  if(typeof v==='string'){if(!v.isWellFormed())throw new AutomationModelError('automation_json_unicode');bytes+=encoder.encode(JSON.stringify(v)).length;if(bytes>16777216)throw new AutomationModelError('automation_json_budget');return;}
  if(!v||typeof v!=='object'||active.has(v)||!([Object.prototype,null].includes(Object.getPrototypeOf(v))||Array.isArray(v)&&Object.getPrototypeOf(v)===Array.prototype))throw new AutomationModelError('automation_json_object');
  active.add(v);const descriptors=Object.getOwnPropertyDescriptors(v),keys=Reflect.ownKeys(descriptors);
  if(keys.some(key=>typeof key!=='string')||Array.isArray(v)&&(keys.length!==v.length+1||keys.some(key=>key!=='length'&&(!/^(0|[1-9][0-9]*)$(?![\s\S])/.test(key)||Number(key)>=v.length))))throw new AutomationModelError('automation_json_object');
  bytes+=2+Math.max(0,keys.length-(Array.isArray(v)?2:1));
  for(const key of keys){if(Array.isArray(v)&&key==='length')continue;const entry=descriptors[key];if(!entry.enumerable||!Object.hasOwn(entry,'value')||!key.isWellFormed())throw new AutomationModelError('automation_json_object');if(!Array.isArray(v))bytes+=encoder.encode(JSON.stringify(key)).length+1;visit(entry.value,depth+1);}
  active.delete(v);if(bytes>16777216)throw new AutomationModelError('automation_json_budget');
 }
 visit(value,1);if(!validator(value))throw new AutomationModelError('automation_schema',validator.errors?.[0]?.instancePath??'');
}

/** 仅对有界JSON原件计算JCS摘要；摘要匹配不授予来源、发布或执行资格。 */
export async function digestAutomationValue(value){
 validateAutomationModel('Value',{kind:'literal',value});
 const bytes=new TextEncoder().encode(canonicalize(value)),result=await crypto.subtle.digest('SHA-256',bytes);
 return 'sha256:'+Array.from(new Uint8Array(result),byte=>byte.toString(16).padStart(2,'0')).join('');
}
