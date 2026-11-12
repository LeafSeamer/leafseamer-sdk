import fs from 'node:fs/promises';
import Ajv from 'ajv/dist/2020.js';
import standalone from 'ajv/dist/standalone/index.js';
export async function buildEventTime(product){
 const source=JSON.parse(product.get('contract/models.schema.json')).$defs,defs={};
 const models={Origin:'ingress__Origin',SourceBinding:'ingress__SourceBindingRef',SourceTimeEvidence:'eventTime__SourceTimeEvidence',AgeEvidence:'eventTime__AgeEvidence'};
 function collect(name){if(Object.hasOwn(defs,name))return;if(!source[name])throw new Error('event_time_model:'+name);defs[name]=source[name];walk(source[name]);}
 function walk(value){if(!value||typeof value!=='object')return;for(const [key,child]of Object.entries(value)){
  if(key==='$ref'){if(!child.startsWith('#/$defs/'))throw new Error('event_time_ref');collect(child.slice(8));}else walk(child);
 }}
 Object.values(models).forEach(collect);
 const schema={$schema:'https://json-schema.org/draft/2020-12/schema',$id:'urn:leafseamer:event-time:1',$defs:defs};
 const ajv=new Ajv({strict:false,ownProperties:true,allErrors:false,coerceTypes:false,useDefaults:false,removeAdditional:false,inlineRefs:false,code:{source:true,esm:true,lines:true}});ajv.addSchema(schema);
 const generated=standalone(ajv,Object.fromEntries(Object.entries(models).map(([name,definition])=>[name,schema.$id+'#/$defs/'+definition])));
 for(const [,name]of generated.matchAll(/require\("([^"]+)"\)/g))if(!['ajv/dist/runtime/ucs2length','ajv/dist/runtime/equal'].includes(name))throw new Error('event_time_helper');
 return new Map([['event-time/schema.json',Buffer.from(JSON.stringify(schema,null,2)+'\n')],
  ['event-time/validators.mjs',Buffer.from('import {requireStatic as require} from "../runtime/panel-wire/preview/helpers.mjs";\n'+generated)],
  ...await Promise.all(['event-time.mjs','event-time.d.mts'].map(async name=>[name,await fs.readFile(new URL('../src/'+name,import.meta.url))]))]);
}
