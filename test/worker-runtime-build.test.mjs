import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {workerRuntimeSchemaV02,workerRuntimeSchemaV03,workerRuntimeSchema} from '../scripts/worker-runtime-schema.mjs';
test('0.4生成保留0.2与0.3帧定义及原始输入',async()=>{
  const base=JSON.parse(await fs.readFile(new URL('../contracts/worker-runtime/base.schema.json',import.meta.url))),before=JSON.stringify(base);
  const artifact=JSON.parse(await fs.readFile(new URL('../dist/artifact-import/schema.json',import.meta.url)));
  const old=workerRuntimeSchemaV02(base),previous=workerRuntimeSchemaV03(base),current=workerRuntimeSchema(base,artifact);
  assert.equal(JSON.stringify(base),before);assert.equal(old.$defs.ControlFrame.oneOf.length,9);assert.equal(previous.$defs.ControlFrame.oneOf.length,11);assert.equal(current.$defs.ControlFrame.oneOf.length,13);
  for(const entry of old.$defs.ControlFrame.oneOf)assert.equal(old.$defs[entry.$ref.split('/').at(-1)].properties.version.const,'supervisor-control/0.2.0-draft.1');
});
