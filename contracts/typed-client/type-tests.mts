import {createClient,type Transport} from './client.mjs';
import type {components,operations} from './preview/controller.js';
declare const transport:Transport;
const selection={contract_id:'leafseamer.api.v1.events2',contract_digest:'sha256:'+'0'.repeat(64)} as const;
const c=createClient('controller',selection,transport);
const s=createClient('seamer',selection,transport);
c.call('discoverContracts');
s.call('discoverContracts');
c.call('getCommandRevision',{path:{command_id:'command',revision:'9007199254740993'}});
c.call('getCommandEvidence',{path:{command_id:'command'},query:{state_revision:'1',limit:10}});
c.call('createRequestContext',{body:{audience:'controller',operations:['read'],ttl_ms:1000,max_unique_requests:1,selection}});
const result=await c.call('discoverContracts');
if(result.status==='200') {
  const role:'controller'|'seamer'=result.body.authority_role;
  const noAuthorization:false=result.authorization_granted;
  void [role,noAuthorization];
} else {const empty:null=result.body;void empty;}
const recursive:components['schemas']['baseline__JsonValue']={nested:[null,true,'value',1,{other:[]}]};
declare const ws:operations['openEvents'];
void [recursive,ws];
