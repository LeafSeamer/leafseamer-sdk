import fs from 'node:fs/promises';
import Ajv from 'ajv/dist/2020.js';
import standalone from 'ajv/dist/standalone/index.js';
import openapiTS,{astToString} from 'openapi-typescript';
export async function buildAutomationProgram(product){
 const definitions=JSON.parse(product.get('contract/models.schema.json')).$defs,prefix='lifecycle__Program_';
 const names=new Set(Object.keys(definitions).filter(name=>name.startsWith(prefix)));
 const lifecycle=['Scope','Context','DraftContent','DefinitionMetadata','DraftRecord','CreateDefinition','UpdateDraft','UpdateMetadata','Publish','PublishedVersion'];
 const collect=name=>{if(names.has(name))return;if(!definitions[name])throw new Error('automation_model_missing');names.add(name);walk(definitions[name]);};
 const walk=value=>{if(Array.isArray(value)){for(const item of value)walk(item);}else if(value&&typeof value==='object'){for(const [key,child]of Object.entries(value)){if(key==='$ref'){if(typeof child!=='string'||!child.startsWith('#/$defs/lifecycle__'))throw new Error('automation_external_reference');collect(child.slice('#/$defs/'.length));}else walk(child);}}};
 for(const name of lifecycle)collect('lifecycle__'+name);
 const exported=name=>name.startsWith(prefix)?name.slice(prefix.length):'Lifecycle'+name.slice('lifecycle__'.length);
 const rewrite=value=>typeof value==='string'&&value.startsWith('#/$defs/lifecycle__')?'#/$defs/'+exported(value.slice('#/$defs/'.length)):
  Array.isArray(value)?value.map(rewrite):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([key,child])=>[key,rewrite(child)])):value;
 const defs=Object.fromEntries([...names].map(name=>[exported(name),rewrite(definitions[name])]));
 const schema={$schema:'https://json-schema.org/draft/2020-12/schema',$id:'urn:leafseamer:automation-program:1',$defs:defs};
 const ajv=new Ajv({strict:false,ownProperties:true,allErrors:false,coerceTypes:false,useDefaults:false,removeAdditional:false,inlineRefs:false,code:{source:true,esm:true,lines:true}});
 ajv.addSchema(schema);const generated=standalone(ajv,Object.fromEntries(Object.keys(defs).map(name=>[name,schema.$id+'#/$defs/'+name])));
 for(const [,name]of generated.matchAll(/require\("([^"]+)"\)/g))if(!['ajv/dist/runtime/ucs2length','ajv/dist/runtime/equal'].includes(name))throw new Error('automation_helper');
 const types=astToString(await openapiTS({openapi:'3.1.0',info:{title:'LeafSeamer automation program',version:'1'},paths:{},components:{schemas:JSON.parse(JSON.stringify(defs).replaceAll('#/$defs/','#/components/schemas/'))}},{immutable:true,alphabetize:true,silent:true}));
 return new Map([['automation-program/schema.json',Buffer.from(JSON.stringify(schema,null,2)+'\n')],['automation-program/models.d.ts',Buffer.from(types)],
  ['automation-program/validators.mjs',Buffer.from('import {requireStatic as require} from "../runtime/panel-wire/preview/helpers.mjs";\n'+generated)],
  ...await Promise.all(['automation-program.mjs','automation-program.d.mts'].map(async name=>[name,await fs.readFile(new URL('../src/'+name,import.meta.url))]))]);
}
