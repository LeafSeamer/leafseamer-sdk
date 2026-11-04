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
