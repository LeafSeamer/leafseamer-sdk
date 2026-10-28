import type {Inputs,Results} from './preview/operations.js';
export type Authority=keyof Inputs;
export interface Selection {readonly contract_id:string;readonly contract_digest:string;}
export interface OutboundRequest {
  readonly authority:Authority;
  readonly method:string;
  readonly target:string;
  readonly headers:readonly (readonly [string,string])[];
  readonly body:Uint8Array;
  readonly signal:AbortSignal|undefined;
}
export interface RawResponse {readonly status:string;readonly headers:readonly (readonly [string,string])[];readonly body:Uint8Array;}
/** 每次调用只发一次，禁止自动重试/重定向；传输负责真实认证、定向端点与HTTP分帧。 */
export type Transport=(request:OutboundRequest)=>RawResponse|PromiseLike<RawResponse>;
export interface CallOptions {readonly signal?:AbortSignal;}
export type FailureState='not_sent'|'outcome_unknown'|'response_rejected';
export class ClientError extends Error {readonly state:FailureState;readonly reason:string;constructor(state:FailureState,reason:string);}
export interface Client<A extends Authority> {
  readonly authority:A;
  call<K extends keyof Inputs[A] & keyof Results[A]>(operationId:K,...args:{} extends Inputs[A][K]
    ? [input?:NoInfer<Inputs[A][K]>,options?:CallOptions]
    : [input:NoInfer<Inputs[A][K]>,options?:CallOptions]):Promise<Results[A][K]>;
}
export function createClient<A extends Authority>(authority:A,selection:Selection,transport:Transport):Client<A>;
