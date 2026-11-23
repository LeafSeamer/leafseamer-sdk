import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {addSnapshotContext} from '../scripts/snapshot-context.mjs';
test('product8快照上下文只增加具名只读查询，沿用精确配对权限、选择与释放复核',()=>{
 const apis=Object.fromEntries(['controller','seamer'].map(name=>[name,JSON.parse(fs.readFileSync(new URL('../dist/contract/'+name+'.openapi.json',import.meta.url)))])),graph=JSON.parse(fs.readFileSync(new URL('../dist/contract/models.schema.json',import.meta.url)));
 const before=structuredClone(apis),selection=JSON.parse(fs.readFileSync(new URL('../sdk-contract.json',import.meta.url))),names=addSnapshotContext(apis,graph);assert.equal(selection.contract_id,'leafseamer.api.v1.product9');
 for(const [name,api]of Object.entries(apis)){for(const [key,value]of Object.entries(before[name].paths))assert.deepEqual(api.paths[key],value);
  const operation=api.paths['/internal/subscriptions/{subscription_id}/snapshot-context'].post;
  assert.equal(operation.operationId,'internalQuerySnapshotContext');assert.equal(operation['x-permission'],'event.internal.subscribe');assert.equal(operation['x-owner-profile'],'service');assert.equal(operation['x-release-recheck-required'],true);assert.equal(operation.parameters.some(p=>p.in==='query'),false);
  assert.equal(operation.responses['200'].content['application/json'].schema.$ref,'#/components/schemas/snapshotContext__Response');
  for(const model of names)assert.ok(api.components.schemas[model]);
 }
 for(const model of names){const value=graph.$defs[model];assert.equal(value.additionalProperties,false);assert.deepEqual(value.required,Object.keys(value.properties));
  const visit=v=>{if(!v||typeof v!=='object')return;if(v.$ref){assert.ok(v.$ref.startsWith('#/$defs/'));assert.ok(graph.$defs[v.$ref.slice(8)],v.$ref);}for(const item of Object.values(v))visit(item);};visit(value);
 }
});
