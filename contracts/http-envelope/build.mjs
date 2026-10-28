import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import Ajv from '../wire-js/node_modules/ajv/dist/2020.js';
import formats from '../wire-js/node_modules/ajv-formats/dist/index.js';
import standalone from '../wire-js/node_modules/ajv/dist/standalone/index.js';

export const root=path.dirname(fileURLToPath(import.meta.url)),sdk=path.resolve(root,'../..');
export const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(path.join(sdk,p),'utf8'));
const require=(v,r)=>{if(!v)throw new Error(r);};
const json=v=>JSON.stringify(v,null,2)+'\n';
export function inventory(documents,bodyInventory,selection) {
  const operations=[],schemas={},bySchema=new Map(),routeKeys=new Set();
  function scalar(s,defs,seen=new Set()) {
    if(s.$ref) {
      require(Object.keys(s).length===1&&s.$ref.startsWith('#/components/schemas/')&&!seen.has(s.$ref),'scalar_reference');
      const name=s.$ref.slice(21);require(Object.hasOwn(defs,name),'scalar_missing');
      return scalar(defs[name],defs,new Set([...seen,s.$ref]));
    }
    require(Object.keys(s).every(k=>['type','const','pattern','minLength','maxLength','minimum','maximum','format','description'].includes(k)),'scalar_keyword');
    const type=s.type??(typeof s.const==='string'?'string':null);
    require(['string','integer'].includes(type)&&(!s.format||s.format==='uri'),'scalar_type');
    if(type==='integer')require(Number.isSafeInteger(s.minimum)&&Number.isSafeInteger(s.maximum)&&s.minimum>=0,'integer_bounds');
    return structuredClone(s);
  }
  function add(s,defs) {
    const schema=scalar(s,defs),key=JSON.stringify(schema);
    if(!bySchema.has(key)){const id='p'+bySchema.size;bySchema.set(key,id);schemas[id]=schema;}
    return bySchema.get(key);
  }
  for(const authority of ['controller','seamer']) {
    const doc=documents[authority];require(doc['x-authority-role']===authority,'authority');
    for(const [url,item] of Object.entries(doc.paths))for(const [method,op] of Object.entries(item)) {
      require(['get','post','put','patch','delete'].includes(method),'path_item_metadata');
      const key=JSON.stringify([authority,method,url.replace(/\{[^}]+\}/g,'{}')]);require(!routeKeys.has(key),'ambiguous_route');routeKeys.add(key);
      const body=bodyInventory.operations.find(v=>v.authority===authority&&v.operation_id===op.operationId);
      require(body&&body.method===method.toUpperCase()&&body.path===url,'body_binding');
      const parameters=[],identities=new Set();
      for(const p of op.parameters??[]) {
        require(Object.keys(p).every(k=>['name','in','required','schema','description','style','explode','allowReserved'].includes(k)),'parameter_keyword');
        require(['path','query','header'].includes(p.in)&&typeof p.name==='string'&&p.name.length>0,'parameter_location');
        require(p.required===undefined||typeof p.required==='boolean','parameter_required');
        require((p.style??(p.in==='query'?'form':'simple'))===(p.in==='query'?'form':'simple')&&
          (p.explode??(p.in==='query'))===(p.in==='query')&&!p.allowReserved,'parameter_serialization');
        const name=p.in==='header'?p.name.toLowerCase():p.name,id=p.in+':'+name;
        require(!identities.has(id),'duplicate_parameter');identities.add(id);
        require(p.in!=='path'||p.required===true,'optional_path');
        const validator=add(p.schema,doc.components.schemas);
        parameters.push({name,location:p.in,required:p.required===true,validator,numeric:schemas[validator].type==='integer',source_schema:p.schema});
      }
      const pathNames=[...url.matchAll(/\{([^}]+)\}/g)].map(m=>m[1]);
      require(new Set(pathNames).size===pathNames.length&&JSON.stringify(pathNames.slice().sort())===JSON.stringify(parameters.filter(p=>p.location==='path').map(p=>p.name).sort()),'path_parameters');
      const responses={};
      for(const [status,r] of Object.entries(op.responses)) {
        require(Object.hasOwn(body.responses,status),'response_binding');const headers=[],names=new Set();
        for(const [name,h] of Object.entries(r.headers??{})) {
          const lower=name.toLowerCase();require(!names.has(lower),'duplicate_response_header');names.add(lower);
          require(Object.keys(h).every(k=>['schema','required','x-required-after-selection','description'].includes(k)),'header_keyword');
          require([undefined,true,false].includes(h.required)&&[undefined,true,false].includes(h['x-required-after-selection']),'header_required');
          headers.push({name:lower,required:h.required===true,after_selection:h['x-required-after-selection']===true,validator:add(h.schema,doc.components.schemas),source_schema:h.schema});
        }
        responses[status]={headers,body:body.responses[status]===null?'none':'json'};
      }
      require(Object.keys(responses).length===Object.keys(body.responses).length,'missing_response');
      const transport=op['x-contract-selection']?.transport;require(['http-headers','websocket-subprotocol','discovery'].includes(transport),'selection_transport');
      if(transport==='websocket-subprotocol')require(op['x-subprotocol-count']===(op['x-secret-ticket-required']?2:1),'ws_selection');
      require(Array.isArray(op.security),'explicit_security');
      for(const group of op.security)for(const name of Object.keys(group))require(Object.hasOwn(doc.components.securitySchemes,name),'missing_security_scheme');
      require(body.request===null?!op.requestBody:op.requestBody?.required===true,'body_required');
      operations.push({authority,operation_id:op.operationId,method:method.toUpperCase(),path:url,parameters,responses,
        body:body.request===null?'none':'json',transport,security:op.security,
        security_schemes:Object.fromEntries([...new Set(op.security.flatMap(s=>Object.keys(s)))].map(n=>[n,doc.components.securitySchemes[n]])),
        extensions:Object.fromEntries(Object.entries(op).filter(([k])=>k.startsWith('x-')))});
    }
  }
  require(operations.length===bodyInventory.operations.length,'operation_coverage');
  return {format:'http-envelope-inventory/1',approved:false,runtime_ready:false,selection,operations,schemas};
}
export function build() {
  const sources=read('contracts/http-envelope/sources.json');
  require(sources.approved===false&&sources.runtime_ready===false,'approval');
  for(const [p,h] of Object.entries(sources.inputs))require(hash(fs.readFileSync(path.join(sdk,p)))===h,'source_drift:'+p);
  const deps=read('contracts/wire-js/dependencies.json');
  for(const [p,h] of Object.entries(deps.files))require(hash(fs.readFileSync(path.join(sdk,'contracts/wire-js/node_modules',p)))===h,'dependency_drift');
  const inv=inventory(Object.fromEntries(['controller','seamer'].map(a=>[a,read('contracts/event-integration/preview/'+a+'.openapi.json')])),read('contracts/wire-routing/preview/inventory.json'),read('contracts/event-integration/preview/selection.json'));
  const ajv=new Ajv({strict:false,allErrors:true,ownProperties:true,coerceTypes:false,useDefaults:false,removeAdditional:false,validateFormats:true,code:{source:true,esm:true,lines:true}});
  formats(ajv);const refs={};for(const [name,schema] of Object.entries(inv.schemas)){refs[name]='urn:leafseamer:http-envelope:'+name;ajv.addSchema(schema,refs[name]);}
  const generated=standalone(ajv,refs);
  for(const [,name] of generated.matchAll(/require\("([^"]+)"\)/g))require(['ajv/dist/runtime/ucs2length','ajv-formats/dist/formats'].includes(name),'helper');
  const runtime={...inv};delete runtime.schemas;
  const outputs={'inventory.json':json(inv),'catalog.mjs':'function freeze(v){if(v&&typeof v==="object"){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;}\nexport const catalog=freeze('+JSON.stringify(runtime)+');\n',
    'validators.mjs':'import {requireStatic as require} from "../../wire-routing/preview/helpers.mjs";\n'+generated};
  outputs['manifest.json']=json({format:'http-envelope-artifacts/1',approved:false,runtime_ready:false,artifacts:Object.fromEntries(Object.entries(outputs).map(([p,b])=>[p,hash(b)]))});return outputs;
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  const at=process.argv.indexOf('--output');require(at>=0,'output_required');const out=build(),dest=process.argv[at+1];fs.mkdirSync(dest);
  for(const [p,b] of Object.entries(out))fs.writeFileSync(path.join(dest,p),b);console.log(JSON.stringify({files:Object.keys(out).length}));
}
