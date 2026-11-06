import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHttpAdapter} from '../dist/http.mjs';
import {contractSelection as selection} from '../dist/index.mjs';

const scope={authority_service_id:'controller_test',database_instance_id:'database_test'};
const digest='sha256:'+'a'.repeat(64),ref=id=>({id,revision:'1',digest});
function record(){
 const state={command_id:'command_test',scope,revision:'1',phase:'queued',outcome:'pending',effect_status:'not_sent',resource_status:'clear',
  automation_continuation:'eligible',reason_code:null,terminal_revision:null,resolution_ref:null,completion_evidence_refs:[],resource_evidence_refs:[],attempt_ids:[]};
 return {command_id:state.command_id,scope,revision:'1',initial_command_ref:{kind:'command',scope,object_id:state.command_id,revision:'1',digest},
  request_identity:{key:{target_scope:scope,issuer_id:'issuer_test',issuer_epoch:'1',principal_id:'person_test',request_epoch:'1',operation_id:'createCommand',idempotency_key:'request_test'},request_digest:digest},
  target:{device_id:'device_test',action_id:'value.set',capability_version:'1.0.0'},
  actor:{principal_id:'person_test',session_id:'session_test',authorization_revision:'1',issuer_id:'issuer_test',issuer_epoch:'1',local_subject_id:'person_test'},
  origin:'manual',run_binding:null,automation_binding:null,accepted_at:null,dispatch:{mode:'immediate',max_queue_ms:1000},control_binding:{epoch:'epoch_test',version:'1'},
  policy:{command_id:state.command_id,scope,device_id:'device_test',admission_ref:ref('admission'),required_completion:'sent',completion_policy_ref:ref('completion'),
   release_policy_ref:ref('release'),retry_policy_ref:null,max_attempts:1,original_deadline_ref:ref('deadline'),conflict_scope:'whole_device'},
  state_ref:ref('state'),state,completion:{required:'sent',achieved:null,policy_ref:ref('completion'),evidence_refs:[]},attempts:[],cancellation:null,
  evidence_index:{snapshot_ref:ref('snapshot'),state_ref:ref('state'),total:'0'},record_digest:digest};
}
async function decode(value){
 const adapter=createHttpAdapter(selection),headers=[['x-leafseamer-contract',selection.contract_id],['x-leafseamer-contract-digest',selection.contract_digest]];
 const request=adapter.prepareRequest('controller','GET','/api/v1/commands/command_test',headers);
 return adapter.decodeResponse(Buffer.from(JSON.stringify({view:'current',record:value})),adapter.prepareResponse(request,'200',[...headers,['content-type','application/json']]));
}
test('product4即时命令明确缺少参考时间，时间字段不得缺失或伪造格式',async()=>{
 assert.equal(selection.contract_id,'leafseamer.api.v1.product4');
 const value=record();assert.equal((await decode(value)).value.record.accepted_at,null);
 const {accepted_at,...missing}=value;await assert.rejects(decode(missing));
 await assert.rejects(decode({...value,accepted_at:'unavailable'}));
 assert.equal((await decode({...value,accepted_at:'2026-11-06T00:00:00.000Z'})).value.record.accepted_at,'2026-11-06T00:00:00.000Z');
 const scheduled={...value,dispatch:{mode:'scheduled',occurrence_id:'occurrence_test',not_before:'2026-11-06T00:00:01.000Z',not_after:'2026-11-06T00:00:02.000Z',clock_policy_revision:'1',max_queue_ms:1000}};
 await assert.rejects(decode(scheduled));await decode({...scheduled,accepted_at:'2026-11-06T00:00:00.000Z'});
});
test('命令快照与面板投影保留null，历史基线未改写',()=>{
 const read=name=>JSON.parse(fs.readFileSync(new URL(name,import.meta.url)));
 for(const file of ['models','result']){
  const models=read('../dist/contract/'+file+'.schema.json').$defs;
  for(const name of ['snapshot__CommandSnapshotView','panel3__Result_CommandView'])if(models[name])
   assert.ok(models[name].properties.accepted_at.anyOf.some(v=>v.type==='null'));
 }
 const old=read('../contracts/panel-wire/contract/models.schema.json').$defs;
 assert.equal(old.command__V__S0_CommandRecord.properties.accepted_at.anyOf,undefined);
});
