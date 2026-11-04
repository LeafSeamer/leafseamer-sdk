import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
import Ajv from 'ajv/dist/2020.js';
import formats from 'ajv-formats/dist/index.js';
import standalone from 'ajv/dist/standalone/index.js';
import codegen from 'ajv/dist/compile/codegen/index.js';
import names from 'ajv/dist/compile/names.js';
import {derive} from './schema.mjs';


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
        source:'contract/'+authority+'.openapi.json',pointer:'/paths/'+route.replaceAll('~','~0').replaceAll('/','~1')+'/'+method});
    }
  }
  const seen=new Set();
  for(const message of workers.messages) {
    require(['c2w','w2c'].includes(message.direction)&&!seen.has(message.type),'worker_identity');seen.add(message.type);
    const prefix=graph.$id+'#/$defs/';require(message.schema_ref.startsWith(prefix),'worker_reference');
    const name=message.schema_ref.slice(prefix.length);require(Object.hasOwn(defs,name),'worker_model');
    messages.push({...message,root:add({$ref:'#/$defs/'+name})});
  }
  const panel=[];
  for(const [group,model] of [['window','WindowFrame'],['panel','PanelFrame'],['host','HostFrame']]) {
    const union=defs['panel__Channel_'+model];require(Array.isArray(union.oneOf),'panel_union');
    for(const branch of union.oneOf) {
      require(Object.keys(branch).join()==='$ref'&&branch.$ref.startsWith('#/$defs/'),'panel_branch');
      const definition=branch.$ref.slice(8),seen=new Set();let schema=defs[definition];
      while(schema&&Object.keys(schema).join()==='$ref') {
        require(typeof schema.$ref==='string'&&schema.$ref.startsWith('#/$defs/')&&!seen.has(schema.$ref),'panel_alias');
        seen.add(schema.$ref);schema=defs[schema.$ref.slice(8)];
      }
      const type=schema?.properties?.type?.const;
      require(typeof type==='string'&&!panel.some(p=>p.type===type),'panel_type');
      panel.push({group,type,definition,root:add(branch)});
    }
  }
  return {format:'panel-wire-inventory/1',approved:false,runtime_ready:false,operations,messages,panel,schemas};
}
export function build(documents, graph, workers, selection) {
  const inv = inventory(documents, graph, workers), defs = structuredClone(graph.$defs), refs = {}, id = 'urn:leafseamer:product-wire:1';
  for (const [name, schema] of Object.entries(inv.schemas)) {
    const key = 'wire_route__' + name; require(!Object.hasOwn(defs, key), 'root_collision');
    defs[key] = schema; refs[name] = id + '#/$defs/' + key;
  }
  const source = derive({$id: id, $schema: graph.$schema, $defs: defs});
  const ajv = new Ajv({strict: false, allErrors: true, passContext: true, ownProperties: true, coerceTypes: false,
    useDefaults: false, removeAdditional: false, validateFormats: true, code: {source: true, esm: true, lines: true}, inlineRefs: false});
  formats(ajv); const {_} = codegen;
  ajv.addKeyword({keyword: 'xRawInteger', type: 'number', schemaType: 'boolean', errors: false, code(cxt) {
    const {gen, it} = cxt;
    const token = gen.const('rawToken', _`this && this.numbers && this.numbers.get(${names.default.instancePath} + ${it.errorPath})`);
    cxt.fail(_`!${token} || !${token}.integer || !${token}.safe`);
  }});
  ajv.addSchema(source, id);
  const generated = standalone(ajv, refs);
  for (const [, name] of generated.matchAll(/require\("([^"]+)"\)/g)) require(['ajv/dist/runtime/ucs2length', 'ajv/dist/runtime/equal', 'ajv-formats/dist/formats', 'fast-deep-equal'].includes(name), 'unknown_helper');
  const registry = fs.readFileSync(path.join(sdk, 'contracts/panel-wire/preview/registry.mjs'), 'utf8');
  const start = registry.indexOf('const schemas=new Map();'), end = registry.indexOf('export function getSchema');
  require(start >= 0 && end > start, 'registry_template');
  const outputs = {
    'validators.mjs': 'import {requireStatic as require} from "./helpers.mjs";\n' + generated,
    'registry.mjs': registry.slice(0, start) + 'const schemas=new Map();\nfor(const name of ' + JSON.stringify(Object.keys(refs)) + '){const handle=Object.freeze({name});schemas.set(name,handle);compiled.set(handle,validators[name]);}\n' + registry.slice(end),
    'routes.mjs': 'function freeze(v){if(v&&typeof v==="object"){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;}\nexport const routes=freeze(' + JSON.stringify({selection, ipc_version: workers.ipc_version, operations: inv.operations, messages: inv.messages, panel: inv.panel}) + ');\n',
    'inventory.json': json(inv),
  };
  return {inventory: inv, outputs};
}
