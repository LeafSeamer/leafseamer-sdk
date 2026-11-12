import type {components} from './runtime/panel-client/preview/controller.js';
export {contractSelection} from './index.mjs';
export interface EventTimeModels {
 readonly Origin:components['schemas']['ingress__Origin'];
 readonly SourceBinding:components['schemas']['ingress__SourceBindingRef'];
 readonly SourceTimeEvidence:components['schemas']['eventTime__SourceTimeEvidence'];
 readonly AgeEvidence:components['schemas']['eventTime__AgeEvidence'];
}
export class EventTimeError extends Error {readonly code:string;}
export function validateEventTimeModel<Name extends keyof EventTimeModels>(name:Name,value:unknown):asserts value is EventTimeModels[Name];
export function digestEventTimeModel<Name extends keyof EventTimeModels>(name:Name,value:EventTimeModels[Name]):Promise<string>;
export function verifyEventOrigin(origin:EventTimeModels['Origin'],evidence?:EventTimeModels['SourceTimeEvidence']|null):Promise<Readonly<{origin:EventTimeModels['Origin'];source_time_evidence:EventTimeModels['SourceTimeEvidence']|null}>>;
