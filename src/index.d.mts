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
/** 与父会话共享注销、刷新和在途代际；Seamer请求不携带Controller的Cookie或CSRF；发布使用Seamer自己的context凭据。 */
export interface BrowserDraftClient {
  issueToken(requested_scopes: string[]): Promise<Results['controller']['issueToken']>;
  createRequestContext(body: {operations: string[]; ttl_ms: number; max_unique_requests: number}): Promise<Results['seamer']['createRequestContext']>;
  createDefinition(body: Inputs['seamer']['createDefinition']['body']): Promise<Results['seamer']['createDefinition']>;
  getDraft(definitionId: string): Promise<Results['seamer']['getDraft']>;
  getRun(runId: string): Promise<Results['seamer']['getRun']>;
  createRun(body: Inputs['seamer']['createRun']['body']): Promise<Results['seamer']['createRun']>;
  updateDraft(definitionId: string, body: Inputs['seamer']['updateDraft']['body']): Promise<Results['seamer']['updateDraft']>;
  updateDefinitionMetadata(definitionId: string, body: Inputs['seamer']['updateDefinitionMetadata']['body']): Promise<Results['seamer']['updateDefinitionMetadata']>;
  lookupAutomationRequest(body: Inputs['seamer']['lookupAutomationRequest']['body']): Promise<Results['seamer']['lookupAutomationRequest']>;
  publishDefinition(definitionId: string, body: Inputs['seamer']['publishDefinition']['body']): Promise<Results['seamer']['publishDefinition']>;
  getPublishedArtifact(definitionId: string, version: string): Promise<Results['seamer']['getPublishedArtifact']>;
  getCompiledProgram(definitionId: string, version: string): Promise<Results['seamer']['getCompiledProgram']>;
  getIndependenceProof(definitionId: string, proofId: string, revision: string): Promise<Results['seamer']['getIndependenceProof']>;
  queryBindingCandidate(definitionId: string, body: Inputs['seamer']['queryBindingCandidate']['body']): Promise<Results['seamer']['queryBindingCandidate']>;
  approveDefinitionBindings(definitionId: string, body: Inputs['seamer']['approveDefinitionBindings']['body']): Promise<Results['seamer']['approveDefinitionBindings']>;
  getBindingApproval(definitionId: string, approvalId: string): Promise<Results['seamer']['getBindingApproval']>;
  revokeBindingApproval(definitionId: string, approvalId: string, body: Inputs['seamer']['revokeBindingApproval']['body']): Promise<Results['seamer']['revokeBindingApproval']>;
  lookupBindingApproval(definitionId: string, body: Inputs['seamer']['lookupBindingApproval']['body']): Promise<Results['seamer']['lookupBindingApproval']>;
  /** 只忘记该客户端的内存令牌与发布CSRF，不撤销已受理的请求。 */
  clearLocalState(): void;
}
export interface BrowserSessionClient {
  /** 固定地址及audience须由可信站点配置提供；支持HTTPS根或固定service前缀。 */
  createDraftClient(options: {baseUrl: string; audience: string}): BrowserDraftClient;
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
  getCapabilities(deviceId: string): Promise<Results['controller']['getCapabilities']>;
  getSceneCatalog(deviceId: string): Promise<Results['controller']['getSceneCatalog']>;
  getControl(deviceId: string): Promise<Results['controller']['getControl']>;
  acquireControl(deviceId: string, body: Inputs['controller']['acquireControl']['body']): Promise<Results['controller']['acquireControl']>;
  releaseControl(deviceId: string, body: Inputs['controller']['releaseControl']['body']): Promise<Results['controller']['releaseControl']>;
  getControlOperation(operationId: string): Promise<Results['controller']['getControlOperation']>;
  lookupControlRequest(body: Inputs['controller']['lookupControlRequest']['body']): Promise<Results['controller']['lookupControlRequest']>;
  getCommand(commandId: string): Promise<Results['controller']['getCommand']>;
  getCommandEvidence(commandId: string, query: Inputs['controller']['getCommandEvidence']['query']): Promise<Results['controller']['getCommandEvidence']>;
  createSubscription(body: Inputs['controller']['createSubscription']['body']): Promise<Results['controller']['createSubscription']>;
  getSubscription(subscriptionId: string): Promise<Results['controller']['getSubscription']>;
  issueWsTicket(body: Omit<Inputs['controller']['issueWsTicket']['body'], 'origin' | 'selection'>): Promise<Results['controller']['issueWsTicket']>;
  getSnapshot(subscriptionId: string, generation: string): Promise<Results['controller']['getSnapshot']>;
  getSnapshotPage(subscriptionId: string, snapshotId: string, pageIndex: number, generation: string): Promise<Results['controller']['getSnapshotPage']>;
  closeSubscription(subscriptionId: string, expectedRevision: string): Promise<Results['controller']['closeSubscription']>;
  /** 只清除内存凭据，不撤销服务端会话或删除HttpOnly Cookie。 */
  clearLocalState(): void;
}
/** 当前会话Cookie路径为/auth；baseUrl只接受同源HTTPS根入口。 */
export function createBrowserSessionClient(options: Pick<FetchTransportOptions, 'baseUrl' | 'timeoutMs' | 'maxResponseBytes' | 'fetchImpl'>): BrowserSessionClient;
import type {components as ControllerModels} from './runtime/panel-client/preview/controller.js';
export type BrowserEventFrame = ControllerModels['schemas']['channel__ServerFrame'];
export type BrowserEventInput = ControllerModels['schemas']['channel__ClientFrame'];
export type SourceProjectionRecord = Extract<ControllerModels['schemas']['snapshot__Record'], {entity_kind: 'sources'}>;
export const eventChannelProtocol: string;
export function decodeBrowserEventFrame(text: string): Promise<BrowserEventFrame>;
export function encodeBrowserEventFrame(frame: BrowserEventInput): Promise<string>;
export function projectionContentDigest(value: object): Promise<{digest: string; bytes: number}>;
export type ControlChangeOperation = 'acquireControl' | 'releaseControl';
export type DraftChangeOperation = 'createDefinition' | 'updateDraft' | 'updateDefinitionMetadata' | 'publishDefinition' | 'createRun';
export type PreparedDraftChange = {[K in DraftChangeOperation]: Readonly<{operation:K;definition_id:K extends 'createDefinition'?null:string;
  body:Inputs['seamer'][K]['body'];lookup:Inputs['seamer']['lookupAutomationRequest']['body'];request_digest:string}>}[DraftChangeOperation];
export type DraftChangeInput = {[K in DraftChangeOperation]: {operation:K;definition_id:K extends 'createDefinition'?null:string;
  scope:{authority_service_id:string;database_instance_id:string};context:Extract<Results['seamer']['createRequestContext'],{status:'201'}>['body']['data'];body:Inputs['seamer'][K]['body']}}[DraftChangeOperation];
export function prepareDraftChange(input:DraftChangeInput):Promise<PreparedDraftChange>;
export type PreparedControlChange = {[K in ControlChangeOperation]: Readonly<{operation: K; device_id: string;
  body: Inputs['controller'][K]['body']; identity: Inputs['controller']['lookupControlRequest']['body']}>}[ControlChangeOperation];
export type ControlChangeInput = {[K in ControlChangeOperation]: {operation: K; device_id: string;
  scope: Inputs['controller']['lookupControlRequest']['body']['key']['target_scope'];
  context: Extract<Results['controller']['createRequestContext'], {status: '201'}>['body']['data'];
  body: Inputs['controller'][K]['body']}}[ControlChangeOperation];
export function prepareControlChange(input: ControlChangeInput): Promise<PreparedControlChange>;
export type PreparedManualCommand = Readonly<{body: Inputs['controller']['submitCommand']['body']; identity: Inputs['controller']['lookupCommandAdmission']['body']}>;
export function prepareManualCommand(input: {
  scope: PreparedManualCommand['identity']['key']['target_scope'];
  context: Extract<Results['controller']['createRequestContext'], {status: '201'}>['body']['data'];
  body: PreparedManualCommand['body'];
}): Promise<PreparedManualCommand>;
