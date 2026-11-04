import type {Authority, Selection} from './runtime/panel-client/client.mjs';
export {WireError} from './index.mjs';
export const limits: Readonly<{target_bytes: number; header_bytes: number; header_lines: number; query_pairs: number}>;
export type HeaderPairs = readonly (readonly [string, string])[];
export interface RequestHandle {
  readonly authority: Authority;
  readonly operation_id: string;
  readonly method: string;
  readonly path_template: string;
  readonly parameters: Readonly<{path: Readonly<Record<string, unknown>>; query: Readonly<Record<string, unknown>>; headers: Readonly<Record<string, unknown>>}>;
  readonly body: 'json' | 'none';
  readonly authorization_granted: false;
}
export interface ResponseHandle {
  readonly authority: Authority;
  readonly operation_id: string;
  readonly status: string;
  readonly headers: Readonly<Record<string, unknown>>;
  readonly body: 'json' | 'none';
  readonly authorization_granted: false;
}
export interface HttpAdapter {
  describe(authority: Authority, operationId: string): Readonly<Record<string, unknown>>;
  prepareRequest(authority: Authority, method: string, rawTarget: string, headers: HeaderPairs): RequestHandle;
  prepareResponse(request: RequestHandle, status: string, headers: HeaderPairs): ResponseHandle;
  decodeRequest(bytes: Uint8Array, request: RequestHandle): Promise<unknown>;
  decodeResponse(bytes: Uint8Array, response: ResponseHandle): Promise<unknown>;
}
/** 只校验协议结构。返回值未知类型，业务代码须按操作收窄；不授予权限。 */
export function createHttpAdapter(selection: Selection): HttpAdapter;
