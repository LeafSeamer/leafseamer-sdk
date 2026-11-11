export {createClient, ClientError} from './runtime/panel-client/client.mjs';
export type {Authority, Selection, OutboundRequest, RawResponse, Transport, Client, CallOptions, FailureState} from './runtime/panel-client/client.mjs';
export type {Inputs, Results} from './runtime/panel-client/preview/operations.js';
import type {Authority, Selection, Transport} from './runtime/panel-client/client.mjs';
export const contractSelection: Readonly<Selection>;
export class WireError extends Error {
  constructor(stage: string, reason: string, offset?: number);
  readonly stage: string;
  readonly reason: string;
  readonly offset?: number;
  public(): {stage: string; reason_code: string; byte_offset?: number};
}
export class TransportError extends Error { readonly code: string; }
export interface FetchTransportOptions {
  readonly authority: Authority;
  /** 独立服务的 origin，或套件 /services/<service_id> 固定前缀。 */
  readonly baseUrl: string;
  readonly timeoutMs?: number;
  readonly maxResponseBytes?: number;
  /** 仅供本机开发；不会允许普通 HTTP 远端。 */
  readonly allowInsecureLoopback?: boolean;
  readonly credentials?: RequestCredentials;
  readonly fetchImpl?: typeof fetch;
}
/** SDK 不重试、不跟随重定向；超时不证明服务端未执行。 */
export function createFetchTransport(options: FetchTransportOptions): Transport;

import type {Results, Inputs} from './runtime/panel-client/preview/operations.js';
export class SessionClientError extends Error { constructor(code: string); readonly code: string; }
export interface BrowserSessionClient {
  login(body: {login: string; password: string}): Promise<Results['controller']['login']>;
  refresh(clientInstanceId: string): Promise<Results['controller']['refreshSession']>;
  issueToken(body: {audience: string; requested_scopes: string[]}): Promise<Results['controller']['issueToken']>;
  current(): Promise<Results['controller']['getSession']>;
  /** 仅退出当前人员会话；202不证明远端撤销已完成，失败也清本地内存。 */
  logout(): Promise<Results['controller']['logoutSession']>;
  createRequestContext(body: {audience: string; operations: string[]; ttl_ms: number; max_unique_requests: number}): Promise<Results['controller']['createRequestContext']>;
  submitCommand(body: Inputs['controller']['submitCommand']['body']): Promise<Results['controller']['submitCommand']>;
  lookupCommandAdmission(body: Inputs['controller']['lookupCommandAdmission']['body']): Promise<Results['controller']['lookupCommandAdmission']>;
  rejectCommandAdmission(body: Inputs['controller']['rejectCommandAdmission']['body']): Promise<Results['controller']['rejectCommandAdmission']>;
  listDevices(cursor?: string): Promise<Results['controller']['listDevices']>;
  getControl(deviceId: string): Promise<Results['controller']['getControl']>;
  acquireControl(deviceId: string, body: Inputs['controller']['acquireControl']['body']): Promise<Results['controller']['acquireControl']>;
  releaseControl(deviceId: string, body: Inputs['controller']['releaseControl']['body']): Promise<Results['controller']['releaseControl']>;
  getControlOperation(operationId: string): Promise<Results['controller']['getControlOperation']>;
  lookupControlRequest(body: Inputs['controller']['lookupControlRequest']['body']): Promise<Results['controller']['lookupControlRequest']>;
  getCommand(commandId: string): Promise<Results['controller']['getCommand']>;
  getCommandEvidence(commandId: string, query: Inputs['controller']['getCommandEvidence']['query']): Promise<Results['controller']['getCommandEvidence']>;
  /** 只清除内存凭据，不撤销服务端会话或删除HttpOnly Cookie。 */
  clearLocalState(): void;
}
/** 当前会话Cookie路径为/auth；baseUrl只接受同源HTTPS根入口。 */
export function createBrowserSessionClient(options: Pick<FetchTransportOptions, 'baseUrl' | 'timeoutMs' | 'maxResponseBytes' | 'fetchImpl'>): BrowserSessionClient;
export type ControlChangeOperation = 'acquireControl' | 'releaseControl';
export type PreparedControlChange = {[K in ControlChangeOperation]: Readonly<{operation: K; device_id: string;
  body: Inputs['controller'][K]['body']; identity: Inputs['controller']['lookupControlRequest']['body']}>}[ControlChangeOperation];
export type ControlChangeInput = {[K in ControlChangeOperation]: {operation: K; device_id: string;
  scope: Inputs['controller']['lookupControlRequest']['body']['key']['target_scope'];
  context: Extract<Results['controller']['createRequestContext'], {status: '201'}>['body']['data'];
  body: Inputs['controller'][K]['body']}}[ControlChangeOperation];
export function prepareControlChange(input: ControlChangeInput): Promise<PreparedControlChange>;
