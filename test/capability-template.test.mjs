import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {decodeCapabilityTemplate,capabilityTemplateSelection} from '../dist/capability-template.mjs';
const fixture=()=>JSON.parse(fs.readFileSync(new URL('./fixtures/static-capability.json',import.meta.url)));
const raw=value=>Buffer.from(JSON.stringify(value));
test('静态能力独立入口保留严格原字节与产品动作字段，不携带运行footprint',async()=>{
 assert.throws(()=>new Function('return 1'),EvalError);const value=fixture(),decoded=await decodeCapabilityTemplate(raw(value));
 assert.deepEqual(decoded,value);assert.ok(Object.isFrozen(decoded.actions[0]));assert.equal(capabilityTemplateSelection.contract_id,'leafseamer.capability-template.1');
 assert.equal(decoded.actions[0].capability_version,'1.0.0');
 for(const mutate of [x=>x.actions[0].footprint={},x=>x.device_id='local-id',x=>x.actions.push(x.actions[0]),x=>x.actions.reverse(),
  x=>x.actions[0].completion.default='effect_verified',x=>x.actions[0].platforms.push(x.actions[0].platforms[0]),x=>x.actions[0].capability_version='1\\.0\\.0']){
  const invalid=fixture();mutate(invalid);await assert.rejects(decodeCapabilityTemplate(raw(invalid)));
 }
 await assert.rejects(decodeCapabilityTemplate(Buffer.from('{"template_id":"one","template_id":"two"}')));
});
