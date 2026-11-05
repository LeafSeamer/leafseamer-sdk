import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import Ajv from 'ajv/dist/2020.js';
import standalone from 'ajv/dist/standalone/index.js';
import openapiTS,{astToString} from 'openapi-typescript';
import canonicalize from 'canonicalize';
const base=new URL('../',import.meta.url),read=name=>fs.readFile(new URL(name,base));
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
export async function buildCapabilityTemplate(product){
 const input=JSON.parse(product.get('contract/models.schema.json')),definitions=input.$defs;
 const action=structuredClone(definitions.baseline__ActionDescriptor);
 // footprint包含运行制品/资格身份；静态文件不能预填它或形成manifest自摘要环。
 delete action.properties.footprint;action.required=action.required.filter(name=>name!=='footprint');
 const ref=name=>({$ref:'#/$defs/'+name}),array=(name,max=128)=>({type:'array',items:ref(name),maxItems:max});
 const properties={template_version:{const:'extension-capability-template/1'},template_id:ref('baseline__Id'),device_role:ref('baseline__Id'),device_kind:ref('baseline__Id'),
  actions:array('ActionTemplate'),triggers:array('baseline__TriggerDescriptor'),state_schema:ref('baseline__SchemaDescriptor')};
 const defs={CapabilityTemplate:{type:'object',properties,required:Object.keys(properties),additionalProperties:false},ActionTemplate:action};
 const scan=value=>{if(!value||typeof value!=='object')return;for(const [key,child] of Object.entries(value)){
  if(key==='$ref'){if(!child.startsWith('#/$defs/'))throw new Error('capability_template_reference');const name=child.slice(8);
   if(!defs[name]){if(!definitions[name])throw new Error('capability_template_definition');defs[name]=structuredClone(definitions[name]);scan(defs[name]);}}
  else if(!['const','enum','default','examples'].includes(key))scan(child);
 }};scan(defs.CapabilityTemplate);scan(action);
 // 新入口使用点分版本号；旧HTTP候选的已锁定接受集不在此修改。
 defs.baseline__Version.pattern='^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(-[0-9A-Za-z.-]+)?$';
 const schema={$schema:'https://json-schema.org/draft/2020-12/schema',$id:'urn:leafseamer:capability-template:1',$defs:defs};
 const ajv=new Ajv({strict:false,ownProperties:true,allErrors:false,coerceTypes:false,useDefaults:false,removeAdditional:false,inlineRefs:false,code:{source:true,esm:true,lines:true}});
 ajv.addSchema(schema);const generated=standalone(ajv,{CapabilityTemplate:schema.$id+'#/$defs/CapabilityTemplate'});
 for(const [,name] of generated.matchAll(/require\("([^"]+)"\)/g))if(!['ajv/dist/runtime/ucs2length','ajv/dist/runtime/equal'].includes(name))throw new Error('capability_template_helper');
 const template=(await read('contracts/panel-wire/preview/registry.mjs')).toString(),start=template.indexOf('const schemas=new Map();'),end=template.indexOf('export function getSchema');
 if(start<0||end<=start)throw new Error('capability_template_registry');
 const registry=template.slice(0,start)+'const schemas=new Map();\nfor(const name of ["CapabilityTemplate"]){const handle=Object.freeze({name});schemas.set(name,handle);compiled.set(handle,validators[name]);}\n'+template.slice(end);
 const types=astToString(await openapiTS({openapi:'3.1.0',info:{title:'LeafSeamer static capability template',version:'1'},paths:{},
  components:{schemas:JSON.parse(JSON.stringify(defs).replaceAll('#/$defs/','#/components/schemas/'))}},{immutable:true,alphabetize:true,silent:true}));
 const wire=await read('contracts/panel-wire/preview/wire.mjs'),protocol=await read('contracts/capability-template/README.md');
 const manifest={format:'leafseamer-capability-template-selection/1',schema_sha256:hash(canonicalize(schema)),definition_sha256:hash(await read('scripts/capability-template-contract.mjs')),
  model_source_sha256:hash(product.get('contract/models.schema.json')),decoder_sha256:hash(await read('src/capability-template.mjs')),wire_sha256:hash(wire),protocol_sha256:hash(protocol)};
 const selection={contract_id:'leafseamer.capability-template.1',contract_digest:'sha256:'+hash(canonicalize(manifest))};
 return new Map([
  ['capability-template/schema.json',Buffer.from(JSON.stringify(schema,null,2)+'\n')],['capability-template/manifest.json',Buffer.from(JSON.stringify(manifest,null,2)+'\n')],
  ['capability-template/selection.mjs',Buffer.from('export const capabilityTemplateSelection=Object.freeze('+JSON.stringify(selection)+');\n')],
  ['capability-template/validators.mjs',Buffer.from('import {requireStatic as require} from "../runtime/panel-wire/preview/helpers.mjs";\n'+generated)],
  ['capability-template/registry.mjs',Buffer.from(registry)],['capability-template/wire.mjs',wire],['capability-template/models.d.ts',Buffer.from(types)],['capability-template/PROTOCOL.md',protocol],
  ['capability-template.mjs',await read('src/capability-template.mjs')],['capability-template.d.mts',await read('src/capability-template.d.mts')]
 ]);
}
