import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import openapiTS,{astToString} from '../typed-client/node_modules/openapi-typescript/dist/index.mjs';
import ts from '../typed-client/node_modules/typescript/lib/typescript.js';

export const root=path.dirname(fileURLToPath(import.meta.url)),sdk=path.resolve(root,'../..');
export const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(path.join(sdk,p),'utf8'));
const require=(v,r)=>{if(!v)throw new Error(r);};
const json=v=>JSON.stringify(v,null,2)+'\n';
// TS不允许接口属性通过索引访问形成直接递归联合；提升为等价的命名类型别名。
function liftRecursive(ast,doc) {
  const hasRef=(v,ref)=>v&&typeof v==='object'&&(v.$ref===ref||Object.values(v).some(x=>hasRef(x,ref)));
  const names=new Set(Object.entries(doc.components.schemas).filter(([n,s])=>hasRef(s,'#/components/schemas/'+n)).map(([n])=>n));
  const aliases=[],found=new Set();
  const result=ast.map(decl=>{
    if(!ts.isInterfaceDeclaration(decl)||decl.name.text!=='components')return decl;
    const members=decl.members.map(group=>{
      if(group.name?.text!=='schemas')return group;
      const properties=group.type.members.map(prop=>{
        const name=prop.name.text;if(!names.has(name))return prop;
        require(/^[A-Za-z_][A-Za-z0-9_]*$/.test(name),'recursive_identifier');found.add(name);
        const alias='Recursive_'+name,reference=()=>ts.factory.createTypeReferenceNode(alias);
        const transformed=ts.transform(prop.type,[context=>{
          const visit=node=>{
            if(ts.isIndexedAccessTypeNode(node)&&ts.isLiteralTypeNode(node.indexType)&&node.indexType.literal.text===name&&
              ts.isIndexedAccessTypeNode(node.objectType)&&ts.isLiteralTypeNode(node.objectType.indexType)&&node.objectType.indexType.literal.text==='schemas'&&
              ts.isTypeReferenceNode(node.objectType.objectType)&&node.objectType.objectType.typeName.text==='components')return reference();
            return ts.visitEachChild(node,visit,context);
          };return node=>ts.visitNode(node,visit);
        }]);
        aliases.push(ts.factory.createTypeAliasDeclaration([ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],alias,undefined,transformed.transformed[0]));
        transformed.dispose();return ts.factory.updatePropertySignature(prop,prop.modifiers,prop.name,prop.questionToken,reference());
      });
      return ts.factory.updatePropertySignature(group,group.modifiers,group.name,group.questionToken,ts.factory.createTypeLiteralNode(properties));
    });return ts.factory.updateInterfaceDeclaration(decl,decl.modifiers,decl.name,decl.typeParameters,decl.heritageClauses,members);
  });
  require(found.size===names.size,'recursive_schema_coverage');return [...aliases,...result];
}
export function verifyInputs() {
  const source=read('contracts/panel-client/sources.json'),deps=read('contracts/typed-client/dependencies.json');
  require(source.approved===false&&source.runtime_ready===false,'approval');
  for(const [p,h] of Object.entries(source.inputs))require(hash(fs.readFileSync(path.join(sdk,p)))===h,'source_drift:'+p);
  for(const [p,h] of Object.entries(source.local_inputs))require(hash(fs.readFileSync(path.join(sdk,p)))===h,'local_input_drift:'+p);
  require(hash(fs.readFileSync(path.join(root,'../typed-client/package-lock.json')))===deps.lock_sha256,'lock_drift');
  for(const [p,h] of Object.entries(deps.files))require(hash(fs.readFileSync(path.join(root,'../typed-client/node_modules',p)))===h,'dependency_drift:'+p);
}
export async function build() {
  verifyInputs();const outputs={},inv=read('contracts/panel-http/preview/inventory.json'),bindings=[];
  let types='import type {operations as Controller} from "./controller.js";\nimport type {operations as Seamer} from "./seamer.js";\n';
  for(const authority of ['controller','seamer']) {
    const doc=read('contracts/panel-wire/contract/'+authority+'.openapi.json');
    function local(v) {if(v&&typeof v==='object'){if(typeof v.$ref==='string')require(v.$ref.startsWith('#/'),'external_reference');for(const x of Object.values(v))local(x);}}
    local(doc);require(doc['x-authority-role']===authority,'authority');
    const ast=await openapiTS(structuredClone(doc),{immutable:true,defaultNonNullable:false,emptyObjectsUnknown:true,alphabetize:true,silent:true});
    outputs[authority+'.d.ts']=astToString(liftRecursive(ast,doc));
    const alias=authority==='controller'?'Controller':'Seamer',inputs=[],responses=[];
    for(const op of inv.operations.filter(o=>o.authority===authority)) {
      const o=`${alias}[${JSON.stringify(op.operation_id)}]`,fields=[];
      for(const [location,key] of [['path','path'],['query','query'],['header','headers']]) {
        const pars=op.parameters.filter(p=>p.location===location&&!['x-leafseamer-contract','x-leafseamer-contract-digest'].includes(p.name));
        let type=pars.length?`NonNullable<${o}["parameters"][${JSON.stringify(location)}]>`:'never';
        if(pars.length&&location==='header')type=`Omit<${type}, "X-LeafSeamer-Contract" | "X-LeafSeamer-Contract-Digest">`;
        fields.push(`readonly ${key}${pars.some(p=>p.required)?'':'?'}: ${type};`);
      }
      fields.push(op.body==='json'?`readonly body: ${o}["requestBody"]["content"]["application/json"];`:'readonly body?: never;');
      // WS提供完整握手元数据类型；升级必须使用专门传输，不经普通HTTP call偷偷退化。
      const callable=op.transport!=='websocket-subprotocol';
      if(callable) {
        inputs.push(`${JSON.stringify(op.operation_id)}: {${fields.join('')}};`);
        const variants=Object.entries(op.responses).map(([status,r])=>`{readonly status: ${JSON.stringify(status)}; readonly body: ${r.body==='none'?'null':`${o}["responses"][${Number(status)}]["content"]["application/json"]`}; readonly headers: Readonly<Record<string,string|readonly string[]>>; readonly authorization_granted: false;}`);
        responses.push(`${JSON.stringify(op.operation_id)}: ${variants.join(' | ')};`);
      }
      bindings.push({authority,operation_id:op.operation_id,method:op.method,path:op.path,transport:op.transport,callable,responses:Object.keys(op.responses)});
    }
    types+=`export interface ${alias}Inputs {\n${inputs.join('\n')}\n}\nexport interface ${alias}Results {\n${responses.join('\n')}\n}\n`;
  }
  types+='export interface Inputs {controller:ControllerInputs;seamer:SeamerInputs;}\nexport interface Results {controller:ControllerResults;seamer:SeamerResults;}\n';
  outputs['operations.d.ts']=types;
  outputs['bindings.json']=json({format:'panel-client-bindings/1',approved:false,runtime_ready:false,operations:bindings});
  outputs['manifest.json']=json({format:'panel-client-artifacts/1',approved:false,runtime_ready:false,artifacts:Object.fromEntries(Object.entries(outputs).map(([p,b])=>[p,hash(b)]))});return outputs;
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  const at=process.argv.indexOf('--output');require(at>=0,'output_required');const output=await build(),dest=process.argv[at+1];fs.mkdirSync(dest);
  for(const [p,b] of Object.entries(output))fs.writeFileSync(path.join(dest,p),b);console.log(JSON.stringify({files:Object.keys(output).length}));
}
