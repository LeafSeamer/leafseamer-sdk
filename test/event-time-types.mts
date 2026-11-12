import {validateEventTimeModel,verifyEventOrigin,digestEventTimeModel,type EventTimeModels} from '../dist/event-time.mjs';
declare const input:unknown;
validateEventTimeModel('SourceTimeEvidence',input);
const exact:EventTimeModels['SourceTimeEvidence']=input;
void digestEventTimeModel('SourceTimeEvidence',exact);
declare const origin:EventTimeModels['Origin'];
void verifyEventOrigin(origin,exact);
declare const age:EventTimeModels['AgeEvidence'];
if(age.basis==='unproven'){
 const absent:null=age.upper_age_ms;void absent;
 // @ts-expect-error 未证明分支没有来源时间引用。
 void age.source_time_ref;
}
if(origin.binding_ref.target.kind==='device'){
 const device:string=origin.binding_ref.target.device_id;void device;
 // @ts-expect-error 设备分支不能混入数据源引用。
 void origin.binding_ref.target.source_ref;
}
// @ts-expect-error 不接受未知的时间模型。
validateEventTimeModel('Unknown',input);
