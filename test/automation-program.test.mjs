import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {validateAutomationModel,contractSelection,digestAutomationValue} from '@leafseamer/sdk/automation-program';

test('有界 JSON 摘要使用规范键序且不会执行访问器',async()=>{
 assert.equal(await digestAutomationValue({}),'sha256:44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a');
 assert.equal(await digestAutomationValue({z:[-0,'中文'],a:true}),await digestAutomationValue({a:true,z:[0,'中文']}));
 let called=false;await assert.rejects(digestAutomationValue({get x(){called=true;return 1;}}),{code:'automation_json_object'});assert.equal(called,false);
 await assert.rejects(digestAutomationValue({value:Infinity}),{code:'automation_json_number'});
});

test('automation models retain selected product definitions and literal data',async()=>{
 const product=JSON.parse(await fs.readFile(new URL('../dist/contract/models.schema.json',import.meta.url))),schema=JSON.parse(await fs.readFile(new URL('../dist/automation-program/schema.json',import.meta.url)));
 const rewrite=v=>typeof v==='string'?v.replace('#/$defs/lifecycle__Program_','#/$defs/').replace('#/$defs/lifecycle__','#/$defs/Lifecycle'):Array.isArray(v)?v.map(rewrite):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,rewrite(x)])):v;
 for(const [name,definition]of Object.entries(schema.$defs))assert.deepEqual(definition,rewrite(product.$defs[name.startsWith('Lifecycle')?'lifecycle__'+name.slice(9):'lifecycle__Program_'+name]));
 assert.equal(contractSelection.contract_id,'leafseamer.api.v1.product9');
 for(const name of ['LifecyclePublish','LifecyclePublishedVersion'])assert.ok(schema.$defs[name]);
 validateAutomationModel('LifecyclePublish',{context:{context_id:'context',idempotency_key:'publish'},expected_draft_revision:'1',expected_content_digest:'sha256:'+'a'.repeat(64),expected_selection_digest:'sha256:'+'b'.repeat(64)});
 validateAutomationModel('Value',{kind:'literal',value:{kind:'ref',binding_id:'data',nested:[null,-0,'中文']}});
 assert.throws(()=>validateAutomationModel('Condition',{kind:'literal',value:1}),{code:'automation_schema'});
 assert.throws(()=>validateAutomationModel('toString',{}),{code:'automation_model'});
});
test('reject non JSON inputs without executing getters or accepting sparse arrays',()=>{
 let reads=0;const accessor={kind:'literal',get value(){reads++;return true;}};
 assert.throws(()=>validateAutomationModel('Value',accessor),{code:'automation_json_object'});assert.equal(reads,0);
 const cycle={};cycle.self=cycle;
 const disguised=[1,2];delete disguised[1];disguised.extra=2;
 for(const value of [cycle,disguised,[,1],{[Symbol('key')]:1},new Date(),Object.create({inherited:1})])assert.throws(()=>validateAutomationModel('Value',{kind:'literal',value}),{code:'automation_json_object'});
 assert.throws(()=>validateAutomationModel('Value',{kind:'literal',value:NaN}),{code:'automation_json_number'});
 assert.throws(()=>validateAutomationModel('Value',{kind:'literal',value:'\ud800'}),{code:'automation_json_unicode'});
 assert.throws(()=>validateAutomationModel('Id','valid\n'),{code:'automation_schema'});
});
test('UTF8 byte budget measures actual JSON and enforces nesting limit',()=>{
 validateAutomationModel('Value',{kind:'literal',value:'a'.repeat(3_000_000)});
 assert.throws(()=>validateAutomationModel('Value',{kind:'literal',value:'中'.repeat(5_600_000)}),{code:'automation_json_budget'});
 let value=true;for(let i=0;i<49;i++)value=[value];
 assert.throws(()=>validateAutomationModel('Value',{kind:'literal',value}),{code:'automation_json_budget'});
});
