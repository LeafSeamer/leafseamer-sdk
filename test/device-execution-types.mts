import {createDeviceExecutionCodec,type DeviceExecutionFrame,deviceExecutionCapabilities,selectDeviceExecutionFeatures,assertDeviceExecutionFeatures} from '../dist/device-execution.mjs';
import {contractSelection} from '../dist/index.mjs';
const codec=createDeviceExecutionCodec(contractSelection),bytes=new Uint8Array();
const closed=await codec.decode(bytes,'c2w','CLOSE_GATE');
const id:string=closed.body.close_id;
const anyFrame:DeviceExecutionFrame=closed;
void id;void anyFrame;
const selected=selectDeviceExecutionFeatures(deviceExecutionCapabilities.known,deviceExecutionCapabilities.base);
assertDeviceExecutionFeatures(closed,selected);
const opened=await codec.decode(bytes,'c2w','OPEN_GATE');
const noTimeOpen:typeof opened={...opened,body:{...opened.body,reference_time_snapshot:null}};
const openedAck=await codec.decode(bytes,'w2c','OPEN_GATE_ACK');
const noTimeAck:typeof openedAck={...openedAck,body:{...openedAck.body,reference_time_snapshot_ref:null}};
void noTimeOpen;void noTimeAck;
// @ts-expect-error CLOSE_GATE只能从Controller发往worker。
codec.decode(bytes,'w2c','CLOSE_GATE');
// @ts-expect-error 只读模块帧不能作为执行IPC。
codec.decode(bytes,'c2w','CAPTURE');
