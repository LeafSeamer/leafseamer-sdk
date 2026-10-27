import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {root,hash} from './build.mjs';
export function compact(raw) {
  assert.equal(raw.format,'wire-browser-result/1');assert.equal(raw.approved,false);assert.equal(raw.runtime_ready,false);
  assert.deepEqual(Object.keys(raw.reports).sort(),['isolated','plain']);
  const receipt=structuredClone(raw);receipt.format='wire-browser-receipt/1';
  for(const [mode,item] of Object.entries(receipt.reports)) {
    assert(item.report.all_passed&&item.report.worker.all_passed);assert.equal(item.report.mode,mode);
    for(const result of [item.report.page,item.report.worker.result]) {
      assert(result.all_passed&&result.checks.every(c=>c.passed===true));assert.equal(result.checks.length,result.cases_passed);
      result.checks_sha256=hash(JSON.stringify(result.checks));result.checks_count=result.checks.length;result.checks_all_passed=true;delete result.checks;
    }
  }
  return receipt;
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  if(!process.argv[2])throw new Error('raw_result_required');
  const receipt=compact(JSON.parse(fs.readFileSync(process.argv[2],'utf8')));
  fs.writeFileSync(path.join(root,'browser-report.json'),JSON.stringify(receipt,null,2)+'\n');
  console.log(JSON.stringify({all_passed:true,modes:Object.keys(receipt.reports)}));
}
