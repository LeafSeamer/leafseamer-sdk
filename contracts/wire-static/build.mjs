import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import Ajv2020 from '../wire-js/node_modules/ajv/dist/2020.js';
import addFormats from '../wire-js/node_modules/ajv-formats/dist/index.js';
import standalone from '../wire-js/node_modules/ajv/dist/standalone/index.js';
import codegen from '../wire-js/node_modules/ajv/dist/compile/codegen/index.js';
import namesModule from '../wire-js/node_modules/ajv/dist/compile/names.js';
import {WireError} from '../wire-js/schema.mjs';

export const root=path.dirname(fileURLToPath(import.meta.url)),sdk=path.resolve(root,'../..');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),json=v=>JSON.stringify(v,null,2)+'\n';
export const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const { _ }=codegen,dialect='https://json-schema.org/draft/2020-12/schema';
const helpers={
  'ajv/dist/runtime/ucs2length':'ajv/dist/runtime/ucs2length.js',
  'ajv/dist/runtime/equal':'ajv/dist/runtime/equal.js',
  'fast-deep-equal':'fast-deep-equal/index.js',
  'ajv-formats/dist/formats':'ajv-formats/dist/formats.js'
};

function compile(source,refs,derive) {
  const ajv=new Ajv2020({strict:false,allErrors:true,passContext:true,ownProperties:true,coerceTypes:false,
    useDefaults:false,removeAdditional:false,validateFormats:true,code:{source:true,esm:true,lines:true},inlineRefs:false});
  addFormats(ajv);
  ajv.addKeyword({keyword:'xRawInteger',type:'number',schemaType:'boolean',errors:false,code(cxt) {
    const {gen,it}=cxt;
    const token=gen.const('rawToken',_`this && this.numbers && this.numbers.get(${namesModule.default.instancePath} + ${it.errorPath})`);
    cxt.fail(_`!${token} || !${token}.integer || !${token}.safe`);
  }});
  for(const [id,body] of Object.entries(source))ajv.addSchema(derive(body).derived,id);
  const result=standalone(ajv,refs);
  for(const [,name] of result.matchAll(/require\("([^"]+)"\)/g))if(!Object.hasOwn(helpers,name))throw new Error('未登记静态运行依赖:'+name);
  return 'import {requireStatic as require} from "./helpers.mjs";\n'+result;
}

export function build() {
  const sources=read(path.join(root,'sources.json')),policy=read(path.join(root,'policy.json'));
  if(sources.approved!==false||policy.approved!==false||policy.runtime_ready!==false)throw new Error('候选批准状态漂移');
  for(const [p,digest] of Object.entries(sources.inputs))if(hash(fs.readFileSync(path.join(sdk,p)))!==digest)throw new Error('固定输入漂移:'+p);
  const installed=read(path.join(sdk,'contracts/wire-js/dependencies.json'));
  for(const [p,digest] of Object.entries(installed.files))if(hash(fs.readFileSync(path.join(sdk,'contracts/wire-js/node_modules',p)))!==digest)throw new Error('依赖原件漂移:'+p);
  const previous=fs.readFileSync(path.join(sdk,'contracts/wire-js/schema.mjs'),'utf8');
  const begin=previous.indexOf('  const derived=structuredClone(source)'),end=previous.indexOf('  const ajv=new Ajv2020');
  if(begin<0||end<=begin)throw new Error('派生入口不匹配');
  // 构建期复用经固定摘要核验的完整转换正文；浏览器不包含Function或Schema编译器。
  const deriveBody=previous.slice(begin,end)+'return {derived,integerPaths,rewrites};';
  const derive=new Function('source','WireError','dialect','escape',deriveBody);
  const transform=source=>derive(source,WireError,dialect,s=>s.replaceAll('~','~0').replaceAll('/','~1'));
  const graph=read(path.join(sdk,'contracts/event-integration/preview/models.schema.json'));
  const graphId='urn:leafseamer:wire-static:graph:1';
  const refs=Object.fromEntries(Object.entries(policy.roots).map(([name,model])=>{
    if(!Object.hasOwn(graph.$defs,model))throw new Error('静态根不存在');return [name,graphId+'#/$defs/'+model];
  }));
  const modelGraph={$schema:dialect,$id:graphId,$defs:graph.$defs};
  const fixture=read(path.join(sdk,'contracts/wire-json/source/decoder-design-cases.json'));
  const fixtureSchemas={},testRefs={},cases=[];
  function add(name,schema,raw,expected,reason) {
    const id='urn:leafseamer:wire-static:fixture:'+name;
    fixtureSchemas[id]=schema;testRefs[name]=id;cases.push({name,raw_hex:typeof raw==='string'?Buffer.from(raw).toString('hex'):raw.hex,expected,...(reason?{reason}:{})});
  }
  for(const c of fixture.raw_cases_planned) {
    const schema=c.test_schema??(c.root==='integer_array'?{type:'array',items:{type:'integer'}}:{type:c.root});
    add(c.id,schema,c.raw_hex?{hex:c.raw_hex}:c.raw,c.accept,c.reason);
  }
  cases.push({name:'DW28',raw_hex:Buffer.from('[1.0]').toString('hex'),expected:true});
  for(const [name,schema,raw,expected,reason] of [
    ['one_of_integer',{oneOf:[{type:'integer'},{type:'number'}]},'1.0',false,'schema_rejected'],
    ['nullable',{type:['integer','null']},'null',true],
    ['raw_nested',{$schema:dialect,$defs:{I:{$schema:dialect,type:'integer'}},$ref:'#/$defs/I'},'1.0000000000000001',false,'raw_integer'],
    ['prototype',JSON.parse('{"properties":{"__proto__":{"type":"integer"}},"required":["__proto__"],"additionalProperties":false}'),'{"__proto__":1.0000000000000001}',false,'raw_integer'],
    ['string_length',{type:'string',minLength:1,maxLength:1},'"😀"',true],
    ['unique_objects',{type:'array',uniqueItems:true},'[{"x":1},{"x":1}]',false,'schema_rejected'],
    ['date_valid',{type:'string',format:'date-time'},'"2026-10-27T00:00:00Z"',true],
    ['date_invalid',{type:'string',format:'date-time'},'"2026-02-30T00:00:00Z"',false,'schema_rejected'],
    ['anything',true,'null',true],['integer',{type:'integer'},'1',true]
  ])add(name,schema,raw,expected,reason);
  const outputs={};
  outputs['contracts-validators.mjs']=compile({[graphId]:modelGraph},refs,transform);
  outputs['test-validators.mjs']=compile(fixtureSchemas,testRefs,transform);
  let helperCode='const factories=Object.create(null),cache=Object.create(null);\n';
  for(const [name,p] of Object.entries(helpers))helperCode+='factories['+JSON.stringify(name)+']=function(module,exports,require){\n'+fs.readFileSync(path.join(sdk,'contracts/wire-js/node_modules',p),'utf8')+'\n};\n';
  helperCode+='Object.freeze(factories);\nexport function requireStatic(name){if(!Object.hasOwn(factories,name))throw new Error("unknown_static_dependency");if(!Object.hasOwn(cache,name)){const module={exports:{}};cache[name]=module;factories[name](module,module.exports,requireStatic);}return cache[name].exports;}\n';
  outputs['helpers.mjs']=helperCode;
  const classCode=previous.slice(previous.indexOf('export class WireError'),previous.indexOf("const dialect="));
  const validationCode=previous.slice(previous.indexOf('export function isSchema'));
  const scanner=fs.readFileSync(path.join(sdk,'contracts/wire-js/wire.mjs'),'utf8');
  if((scanner.match(/'\.\/schema\.mjs'/g)??[]).length!==2)throw new Error('扫描器导入绑定漂移');
  for(const [kind,names] of [['contracts',Object.keys(refs)],['test',Object.keys(testRefs)]]) {
    outputs[kind+'-registry.mjs']='import * as validators from "./'+kind+'-validators.mjs";\n'+classCode+
      'const schemas=new Map();\nfor(const name of '+JSON.stringify(names)+'){const handle=Object.freeze({name});schemas.set(name,handle);compiled.set(handle,validators[name]);}\n'+
      'export function getSchema(name){const handle=schemas.get(name);if(!handle)throw new WireError("schema","unregistered_model");return handle;}\n'+validationCode;
    outputs[kind+'-wire.mjs']=scanner.replaceAll("'./schema.mjs'","'./"+kind+"-registry.mjs'").replace('WireError,compileSchema','WireError,getSchema');
  }
  outputs['cases.json']=json(cases);
  outputs['test-schemas.json']=json(Object.fromEntries(Object.entries(testRefs).map(([name,id])=>[name,fixtureSchemas[id]])));
  const selection=read(path.join(sdk,'contracts/event-integration/preview/selection.json'));
  function select(v){return Array.isArray(v)?v.map(select):v!==null&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,k==='selection'?selection:select(x)])):v;}
  const events=select(read(path.join(sdk,'contracts/event-channel/examples.json')));
  const samples=[{name:'selection',value:selection},...events.client_frames.map(value=>({name:'client_frame',value})),...events.server_frames.map(value=>({name:'server_frame',value}))];
  const snapshots=read(path.join(root,'source/snapshots.json'));
  for(const packet of Object.values(snapshots))samples.push({name:'snapshot_manifest',value:packet.manifest},...packet.pages.map(value=>({name:'snapshot_page',value})));
  outputs['contract-cases.json']=json(samples);
  outputs['integer-map.json']=json({format:'static-integer-map/1',source_transform_sha256:hash(deriveBody),paths:transform(modelGraph).integerPaths.sort()});
  const licenses=[['Ajv','ajv/LICENSE'],['ajv-formats','ajv-formats/LICENSE'],['fast-deep-equal','fast-deep-equal/LICENSE']];
  outputs['LICENSES.txt']=licenses.map(([name,p])=>name+'\n'+fs.readFileSync(path.join(sdk,'contracts/wire-js/node_modules',p),'utf8')).join('\n\n');
  outputs['manifest.json']=json({format:'wire-static-artifacts/1',approved:false,runtime_ready:false,roots:policy.roots,
    graph_source:sources.inputs['contracts/event-integration/preview/models.schema.json'],artifacts:Object.fromEntries(Object.entries(outputs).map(([p,body])=>[p,hash(body)]))});
  return outputs;
}

if(process.argv[1]===fileURLToPath(import.meta.url)) {
  const result=build(),at=process.argv.indexOf('--output');
  if(at>=0){const dest=process.argv[at+1];fs.mkdirSync(dest);for(const [name,body] of Object.entries(result))fs.writeFileSync(path.join(dest,name),body);}
  console.log(JSON.stringify({files:Object.keys(result).length,bytes:Object.values(result).reduce((n,v)=>n+Buffer.byteLength(v),0),approved:false}));
}
