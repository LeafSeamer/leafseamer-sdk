import {createClient} from './runtime/panel-client/client.mjs';
import {createFetchTransport} from './fetch-transport.mjs';
import {contractSelection} from './selection.mjs';

export class SessionClientError extends Error {
  constructor(code) { super(code); this.name = 'SessionClientError'; this.code = code; }
}
const fail = code => { throw new SessionClientError(code); };
function csrfValue(headers) {
  const values = headers.filter(([name]) => name.toLowerCase() === 'x-csrf-token').map(([, value]) => value);
  if (values.length !== 1 || !/^[A-Za-z0-9_-]{43}$/.test(values[0])) fail('csrf_response_invalid');
  const standard = values[0].replaceAll('-', '+').replaceAll('_', '/') + '=';
  if (btoa(atob(standard)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '') !== values[0]) fail('csrf_response_invalid');
  return values[0];
}

/** Cookie由同站浏览器保管，CSRF与定向token仅保留内存；没有自动刷新或自动重试。 */
export function createBrowserSessionClient({baseUrl, timeoutMs, maxResponseBytes, fetchImpl} = {}) {
  let endpoint;
  try { endpoint = new URL(baseUrl); } catch { fail('session_endpoint'); }
  if (endpoint.protocol !== 'https:' || (globalThis.location && globalThis.location.origin !== endpoint.origin)) fail('session_origin');
  if (endpoint.pathname !== '/') fail('session_endpoint');
  const transport = createFetchTransport({authority: 'controller', baseUrl, timeoutMs, maxResponseBytes, fetchImpl, credentials: 'same-origin'});
  const origin = endpoint.origin;
  let csrf = null, token = null, busy = false, generation = 0;
  const clearLocalState = () => { generation++; csrf = null; token = null; };
  async function execute(operation, input, mode) {
    if (busy) fail('session_busy');
    if (mode === 'cookie' && csrf === null || mode === 'bearer' && token === null) fail('session_credentials_missing');
    busy = true;
    try {
      if (operation === 'login') clearLocalState();
      const currentGeneration = generation;
      let responseHeaders = [];
      const client = createClient('controller', contractSelection, async request => {
        if (generation !== currentGeneration) fail('session_state_changed');
        const extra = mode === 'cookie' ? [['X-CSRF-Token', csrf]] : mode === 'bearer' ? [['Authorization', 'Bearer ' + token],
          ...(operation === 'createRequestContext' ? [['Origin', origin]] : [])] : [];
        const response = await transport({...request, headers: [...request.headers, ...extra]});
        responseHeaders = response.headers.map(pair => [...pair]); return response;
      });
      const result = await client.call(operation, input);
      if (generation !== currentGeneration) fail('session_state_changed');
      if (result.status === '401') clearLocalState();
      if (['login', 'refreshSession'].includes(operation) && ['200', '201'].includes(result.status)) {
        // 只有完整响应已通过客户端的选择与Schema校验后才采用CSRF。
        csrf = csrfValue(responseHeaders); token = null;
      }
      if (operation === 'issueToken' && result.status === '201') {
        const value = result.body.data.access_token;
        if (!/^[A-Za-z0-9._~+/-]{16,4096}={0,2}$/.test(value)) fail('token_response_invalid');
        token = value;
      }
      return result;
    } catch (error) { clearLocalState(); throw error; }
    finally { if (operation === 'logoutSession') clearLocalState(); busy = false; }
  }
  return Object.freeze({
    login: body => execute('login', {headers: {origin}, body}, 'login'),
    refresh: clientInstanceId => execute('refreshSession', {headers: {origin}, body: {client_instance_id: clientInstanceId}}, 'cookie'),
    issueToken: ({audience, requested_scopes}) => execute('issueToken', {headers: {origin}, body: {audience, requested_scopes, extension_instance_id: null}}, 'cookie'),
    current: () => execute('getSession', {}, 'bearer'),
    logout: () => execute('logoutSession', {headers: {origin}}, 'cookie'),
    createRequestContext: body => execute('createRequestContext', {body: {...body, selection: contractSelection}}, 'bearer'),
    clearLocalState,
  });
}
