import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
import Ajv from '../wire-js/node_modules/ajv/dist/2020.js';
import formats from '../wire-js/node_modules/ajv-formats/dist/index.js';
import standalone from '../wire-js/node_modules/ajv/dist/standalone/index.js';
import codegen from '../wire-js/node_modules/ajv/dist/compile/codegen/index.js';
import names from '../wire-js/node_modules/ajv/dist/compile/names.js';
import {WireError} from '../wire-js/schema.mjs';
import {build as baseBuild} from '../wire-static/build.mjs';

export const root=path.dirname(fileURLToPath(import.meta.url)),sdk=path.resolve(root,'../..');
export const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(path.join(sdk,p),'utf8'));
const json=v=>JSON.stringify(v,null,2)+'\n';
const require=(ok,why)=>{if(!ok)throw new Error(why);};
const maps=new Set(['$defs','definitions','properties','patternProperties','dependentSchemas']);
const singles=new Set(['not','if','then','else','items','contains','additionalProperties','unevaluatedProperties','unevaluatedItems','propertyNames','additionalItems','contentSchema']);
const arrays=new Set(['allOf','anyOf','oneOf','prefixItems']);
export function relocate(node,defs) {
  if(typeof node==='boolean')return node;
  require(node&&typeof node==='object'&&!Array.isArray(node),'schema_shape');
  const out={};
  for(const [k,v] of Object.entries(node)) {
    if(k==='$ref') {
      require(typeof v==='string'&&v.startsWith('#/components/schemas/'),'external_reference');
      const name=v.slice('#/components/schemas/'.length);require(Object.hasOwn(defs,name),'missing_model');out[k]='#/$defs/'+name;
    } else if(k==='$dynamicRef'||k==='$id'||k==='$anchor'||k==='$dynamicAnchor')throw new Error('unsupported_schema_identity');
    else if(maps.has(k))out[k]=Object.fromEntries(Object.entries(v).map(([name,s])=>[name,relocate(s,defs)]));
    else if(singles.has(k))out[k]=relocate(v,defs);
    else if(arrays.has(k))out[k]=v.map(s=>relocate(s,defs));
    else out[k]=structuredClone(v);
  }
  return out;
}
export function inventory(documents,graph,workers) {
  const defs=graph.$defs,schemas={},byBody=new Map(),operations=[],messages=[];
  const add=s=>{const body=JSON.stringify(s);if(byBody.has(body))return byBody.get(body);const name='r'+byBody.size;byBody.set(body,name);schemas[name]=s;return name;};
  function media(container) {
    if(!Object.hasOwn(container,'content'))return null;
    require(Object.keys(container.content).join() ==='application/json','unsupported_media');
    const value=container.content['application/json'];require(Object.hasOwn(value,'schema'),'missing_schema');
    return add(relocate(value.schema,defs));
  }
  for(const [authority,api] of Object.entries(documents)) {
    require(['controller','seamer'].includes(authority)&&api['x-authority-role']===authority,'authority_mismatch');
    const seen=new Set();
    for(const [route,item] of Object.entries(api.paths))for(const [method,op] of Object.entries(item)) {
      require(['get','post','put','patch','delete','head','options','trace'].includes(method),'unsupported_path_item');
      require(typeof op.operationId==='string'&&!seen.has(op.operationId),'duplicate_operation');seen.add(op.operationId);
      require(op['x-contract-selection']!==undefined,'missing_selection_metadata');
      const responses={};
      for(const [status,response] of Object.entries(op.responses)) {
        require(/^[1-5][0-9]{2}$/.test(status),'unsupported_status');responses[status]=media(response);
      }
      require(Object.keys(responses).length>0,'empty_responses');
      if(op.requestBody)require(op.requestBody.required===true,'optional_body_needs_policy');
      const ws={};
      for(const [direction,key] of [['client','x-client-frame-schema'],['server','x-server-frame-schema'],['first_server','x-first-server-frame-schema']]) {
        if(Object.hasOwn(op,key))ws[direction]=add(relocate({$ref:op[key]},defs));
      }
      require(Object.hasOwn(responses,'101')?Object.keys(ws).length===3&&responses['101']===null:Object.keys(ws).length===0,'websocket_inventory');
      operations.push({authority,operation_id:op.operationId,method:method.toUpperCase(),path:route,
        request:op.requestBody?media(op.requestBody):null,responses,ws,
        source:'contracts/event-integration/preview/'+authority+'.openapi.json',pointer:'/paths/'+route.replaceAll('~','~0').replaceAll('/','~1')+'/'+method});
    }
  }
  const seen=new Set();
  for(const message of workers.messages) {
    require(['c2w','w2c'].includes(message.direction)&&!seen.has(message.type),'worker_identity');seen.add(message.type);
    const prefix=graph.$id+'#/$defs/';require(message.schema_ref.startsWith(prefix),'worker_reference');
    const name=message.schema_ref.slice(prefix.length);require(Object.hasOwn(defs,name),'worker_model');
    messages.push({...message,root:add({$ref:'#/$defs/'+name})});
  }
  return {format:'wire-routing-inventory/1',approved:false,runtime_ready:false,operations,messages,schemas};
}
export function build() {
  const sources=read('contracts/wire-routing/sources.json');
  for(const [p,digest] of Object.entries(sources.inputs))require(hash(fs.readFileSync(path.join(sdk,p)))===digest,'source_drift:'+p);
  const base=baseBuild(),graph=read('contracts/event-integration/preview/models.schema.json');
  const inv=inventory(Object.fromEntries(['controller','seamer'].map(a=>[a,read('contracts/event-integration/preview/'+a+'.openapi.json')])),graph,read('contracts/event-integration/preview/worker-messages.json'));
  const previous=fs.readFileSync(path.join(sdk,'contracts/wire-js/schema.mjs'),'utf8');
  const begin=previous.indexOf('  const derived=structuredClone(source)'),end=previous.indexOf('  const ajv=new Ajv2020');
  require(begin>=0&&end>begin,'transform_boundary');
  const derive=new Function('source','WireError','dialect','escape',previous.slice(begin,end)+'return derived;');
  const defs=structuredClone(graph.$defs),refs={},id='urn:leafseamer:wire-routing:1';
  for(const [name,schema] of Object.entries(inv.schemas)) {const key='wire_route__'+name;require(!Object.hasOwn(defs,key),'root_collision');defs[key]=schema;refs[name]=id+'#/$defs/'+key;}
  const source={$id:id,$schema:graph.$schema,$defs:defs};
  const derived=derive(source,WireError,graph.$schema,s=>s.replaceAll('~','~0').replaceAll('/','~1'));
  const ajv=new Ajv({strict:false,allErrors:true,passContext:true,ownProperties:true,coerceTypes:false,useDefaults:false,removeAdditional:false,validateFormats:true,code:{source:true,esm:true,lines:true},inlineRefs:false});
  formats(ajv);const {_}=codegen;
  ajv.addKeyword({keyword:'xRawInteger',type:'number',schemaType:'boolean',errors:false,code(cxt){const {gen,it}=cxt;
    const token=gen.const('rawToken',_`this && this.numbers && this.numbers.get(${names.default.instancePath} + ${it.errorPath})`);
    cxt.fail(_`!${token} || !${token}.integer || !${token}.safe`);
  }});ajv.addSchema(derived,id);
  const validators=standalone(ajv,refs),allowed=['ajv/dist/runtime/ucs2length','ajv/dist/runtime/equal','ajv-formats/dist/formats','fast-deep-equal'];
  for(const [,name] of validators.matchAll(/require\("([^"]+)"\)/g))require(allowed.includes(name),'unknown_helper');
  const classCode=previous.slice(previous.indexOf('export class WireError'),previous.indexOf('const dialect='));
  const validationCode=previous.slice(previous.indexOf('export function isSchema'));
  const registry='import * as validators from "./validators.mjs";\n'+classCode+
    'const schemas=new Map();\nfor(const name of '+JSON.stringify(Object.keys(refs))+'){const handle=Object.freeze({name});schemas.set(name,handle);compiled.set(handle,validators[name]);}\n'+
    'export function getSchema(name){const handle=schemas.get(name);if(!handle)throw new WireError("schema","unregistered_model");return handle;}\n'+validationCode;
  const outputs={'validators.mjs':'import {requireStatic as require} from "./helpers.mjs";\n'+validators,'registry.mjs':registry,
    'wire.mjs':base['contracts-wire.mjs'].replaceAll('./contracts-registry.mjs','./registry.mjs'),
    'helpers.mjs':base['helpers.mjs'],'LICENSES.txt':base['LICENSES.txt'],'inventory.json':json(inv),
    'routes.mjs':'function freeze(value){if(value&&typeof value==="object"){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;}\nexport const routes=freeze('+JSON.stringify({selection:read('contracts/event-integration/preview/selection.json'),ipc_version:read('contracts/event-integration/preview/worker-messages.json').ipc_version,operations:inv.operations,messages:inv.messages})+');\n'};
  outputs['manifest.json']=json({format:'wire-routing-artifacts/1',approved:false,runtime_ready:false,artifacts:Object.fromEntries(Object.entries(outputs).map(([p,b])=>[p,hash(b)]))});
  return outputs;
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  const at=process.argv.indexOf('--output');require(at>=0,'output_required');const outputs=build(),dest=process.argv[at+1];fs.mkdirSync(dest);
  for(const [p,b] of Object.entries(outputs))fs.writeFileSync(path.join(dest,p),b);
  console.log(JSON.stringify({files:Object.keys(outputs).length,bytes:Object.values(outputs).reduce((n,b)=>n+Buffer.byteLength(b),0)}));
}
