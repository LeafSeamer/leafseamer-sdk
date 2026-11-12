import {deviceModuleProtocol,deviceModuleEventProtocol,type DeviceModuleFrame,type DeviceEventCapture} from '../dist/device-module.mjs';
declare const start:DeviceModuleFrame<'EVENT_START'>;
const selected:typeof deviceModuleEventProtocol=start.version;
// @ts-expect-error 事件操作不能声称旧协议。
const old:typeof deviceModuleProtocol=start.version;
declare const capture:DeviceEventCapture;
const result=capture.read({device_id:'device',device_session_id:'session',capture_id:'capture',signal:new AbortController().signal,after_sequence:'0',max_events:32});
void selected;void old;void result;
