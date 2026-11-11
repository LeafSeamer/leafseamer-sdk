import {prepareControlChange,createBrowserSessionClient,type ControlChangeInput} from '../dist/index.mjs';
declare const context: ControlChangeInput['context'];
const scope={authority_service_id:'controller',database_instance_id:'database'};
const body={context_id:'context',idempotency_key:'control',expected_control:{epoch:'epoch',version:'0'},reason:'操作'};
const client=createBrowserSessionClient({baseUrl:'https://controller.invalid'});
const prepared=await prepareControlChange({operation:'acquireControl',device_id:'device',scope,context,body:{...body,force:false}});
if(prepared.operation==='acquireControl')await client.acquireControl(prepared.device_id,prepared.body);
else await client.releaseControl(prepared.device_id,prepared.body);
await client.lookupControlRequest(prepared.identity);
await client.getControlOperation('operation');
// @ts-expect-error 释放不接受强制接管参数。
await prepareControlChange({operation:'releaseControl',device_id:'device',scope,context,body:{...body,force:true}});
// @ts-expect-error 请求准备只支持接管和释放。
await prepareControlChange({operation:'offerTransfer',device_id:'device',scope,context,body});
