import {createClient} from './runtime/panel-client/client.mjs';
import {createFetchTransport} from './fetch-transport.mjs';
import {contractSelection} from './selection.mjs';

export class SessionClientError extends Error {
  constructor(code) { super(code); this.name = 'SessionClientError'; this.code = code; }
}
const seamerWrites=new Set(['publishDefinition','approveDefinitionBindings','revokeBindingApproval']);
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
  let csrf = null, token = null, busy = false, generation = 0, remoteTokens = new WeakMap(), remoteCsrf = new WeakMap();
  const clearLocalState = () => { generation++; remoteTokens = new WeakMap(); remoteCsrf = new WeakMap(); csrf = null; token = null; };
  async function execute(operation, input, mode, remote = null) {
    if (busy) fail('session_busy');
    const accessToken = remote ? remoteTokens.get(remote) ?? null : token;
    if (mode === 'cookie' && csrf === null || mode === 'bearer' && accessToken === null) fail('session_credentials_missing');
    const publicationCsrf=remote&&seamerWrites.has(operation)?remoteCsrf.get(remote)?.get(input.body?.context?.context_id):null;
    if(remote&&seamerWrites.has(operation)&&!publicationCsrf)fail('session_credentials_missing');
    busy = true;
    try {
      if (operation === 'login') clearLocalState();
      // 新签发一旦开始即废弃原内存token，失败不恢复旧凭据。
      if (operation === 'issueToken') { if (remote) {remoteTokens.delete(remote);remoteCsrf.delete(remote);} else token = null; }
      const currentGeneration = generation;
      const remoteGeneration = remote?.generation;
      let responseHeaders = [];
      const directed = remote !== null && operation !== 'issueToken';
      const client = createClient(directed ? 'seamer' : 'controller', contractSelection, async request => {
        if (generation !== currentGeneration || remote && remote.generation !== remoteGeneration) fail('session_state_changed');
        const extra = mode === 'cookie' ? [['X-CSRF-Token', csrf]] : mode === 'bearer' ? [['Authorization', 'Bearer ' + accessToken],
          ...(directed || ['createRequestContext', 'submitCommand', 'lookupCommandAdmission', 'rejectCommandAdmission', 'acquireControl', 'releaseControl', 'lookupControlRequest'].includes(operation) ? [['Origin', origin]] : []),
          ...(publicationCsrf ? [['X-CSRF-Token', publicationCsrf]] : []),
          ...(!directed && ['acquireControl', 'releaseControl', 'lookupControlRequest'].includes(operation) ? [['X-CSRF-Token', csrf]] : [])] : [];
        const response = await (directed ? remote.transport : transport)({...request, headers: [...request.headers, ...extra]});
        responseHeaders = response.headers.map(pair => [...pair]); return response;
      });
      const result = await client.call(operation, input);
      if (generation !== currentGeneration || remote && remote.generation !== remoteGeneration) fail('session_state_changed');
      if (result.status === '401') clearLocalState();
      if (['login', 'refreshSession'].includes(operation) && ['200', '201'].includes(result.status)) {
        // 只有完整响应已通过客户端的选择与Schema校验后才采用CSRF。
        csrf = csrfValue(responseHeaders); token = null; remoteTokens = new WeakMap(); remoteCsrf = new WeakMap();
      }
      if (operation === 'issueToken' && result.status === '201') {
        const value = result.body.data.access_token;
        if (!/^[A-Za-z0-9._~+/-]{16,4096}={0,2}$/.test(value)) fail('token_response_invalid');
        if (result.body.data.audience !== input.body.audience) fail('token_audience');
        if (remote) remoteTokens.set(remote, value); else token = value;
      }
      if(remote&&operation==='createRequestContext'&&result.status==='201'&&input.body.operations.some(op=>seamerWrites.has(op))){
        const value=csrfValue(responseHeaders),contexts=remoteCsrf.get(remote)??new Map();
        if(contexts.size>=256)contexts.delete(contexts.keys().next().value);
        contexts.set(result.body.data.context_id,value);remoteCsrf.set(remote,contexts);
      }
      return result;
    } catch (error) { clearLocalState(); throw error; }
    finally { if (operation === 'logoutSession') clearLocalState(); busy = false; }
  }
  return Object.freeze({
    /** 地址与audience来自可信站点配置；不从草稿、URL参数或响应重定向派生。 */
    createDraftClient({baseUrl: seamerUrl, audience}) {
      if (typeof audience !== 'string' || !/^[A-Za-z0-9._:/-]{1,256}$/.test(audience)) fail('seamer_audience');
      const remote = {generation: 0, transport: createFetchTransport({authority: 'seamer', baseUrl: seamerUrl,
        timeoutMs, maxResponseBytes, fetchImpl, credentials: 'omit'})};
      return Object.freeze({
        issueToken: requested_scopes => execute('issueToken', {headers: {origin}, body: {audience, requested_scopes, extension_instance_id: null}}, 'cookie', remote),
        createRequestContext: body => execute('createRequestContext', {body: {...body, audience, selection: contractSelection}}, 'bearer', remote),
        createDefinition: body => execute('createDefinition', {body}, 'bearer', remote),
        getDraft: definition_id => execute('getDraft', {path: {definition_id}}, 'bearer', remote),
        updateDraft: (definition_id, body) => execute('updateDraft', {path: {definition_id}, body}, 'bearer', remote),
        updateDefinitionMetadata: (definition_id, body) => execute('updateDefinitionMetadata', {path: {definition_id}, body}, 'bearer', remote),
        lookupAutomationRequest: body => execute('lookupAutomationRequest', {body}, 'bearer', remote),
        publishDefinition: (definition_id, body) => execute('publishDefinition', {path: {definition_id}, body}, 'bearer', remote),
        getPublishedArtifact: (definition_id, definition_version) => execute('getPublishedArtifact', {path: {definition_id, definition_version}}, 'bearer', remote),
        getCompiledProgram: (definition_id, definition_version) => execute('getCompiledProgram', {path: {definition_id, definition_version}}, 'bearer', remote),
        getIndependenceProof: (definition_id, proof_id, revision) => execute('getIndependenceProof', {path: {definition_id, proof_id}, query: {revision}}, 'bearer', remote),
        queryBindingCandidate: (definition_id, body) => execute('queryBindingCandidate', {path:{definition_id},body}, 'bearer', remote),
        approveDefinitionBindings: (definition_id, body) => execute('approveDefinitionBindings', {path:{definition_id},body}, 'bearer', remote),
        getBindingApproval: (definition_id, approval_id) => execute('getBindingApproval', {path:{definition_id,approval_id}}, 'bearer', remote),
        revokeBindingApproval: (definition_id, approval_id, body) => execute('revokeBindingApproval', {path:{definition_id,approval_id},body}, 'bearer', remote),
        lookupBindingApproval: (definition_id, body) => execute('lookupBindingApproval', {path:{definition_id},body}, 'bearer', remote),
        clearLocalState: () => { remote.generation++; remoteTokens.delete(remote);remoteCsrf.delete(remote); },
      });
    },
    login: body => execute('login', {headers: {origin}, body}, 'login'),
    refresh: clientInstanceId => execute('refreshSession', {headers: {origin}, body: {client_instance_id: clientInstanceId}}, 'cookie'),
    issueToken: ({audience, requested_scopes}) => execute('issueToken', {headers: {origin}, body: {audience, requested_scopes, extension_instance_id: null}}, 'cookie'),
    current: () => execute('getSession', {}, 'bearer'),
    logout: () => execute('logoutSession', {headers: {origin}}, 'cookie'),
    createRequestContext: body => execute('createRequestContext', {body: {...body, selection: contractSelection}}, 'bearer'),
    submitCommand: body => execute('submitCommand', {body}, 'bearer'),
    lookupCommandAdmission: body => execute('lookupCommandAdmission', {body}, 'bearer'),
    rejectCommandAdmission: body => execute('rejectCommandAdmission', {body}, 'bearer'),
    listDevices: cursor => execute('listDevices', cursor === undefined ? {} : {query: {cursor}}, 'bearer'),
    getCapabilities: deviceId => execute('getCapabilities', {path: {device_id: deviceId}}, 'bearer'),
    getSceneCatalog: deviceId => execute('getSceneCatalog', {path: {device_id: deviceId}}, 'bearer'),
    getControl: deviceId => execute('getControl', {path: {device_id: deviceId}}, 'bearer'),
    acquireControl: (deviceId, body) => execute('acquireControl', {path: {device_id: deviceId}, body}, 'bearer'),
    releaseControl: (deviceId, body) => execute('releaseControl', {path: {device_id: deviceId}, body}, 'bearer'),
    getControlOperation: operationId => execute('getControlOperation', {path: {operation_id: operationId}}, 'bearer'),
    lookupControlRequest: body => execute('lookupControlRequest', {body}, 'bearer'),
    getCommand: commandId => execute('getCommand', {path: {command_id: commandId}}, 'bearer'),
    getCommandEvidence: (commandId, query) => execute('getCommandEvidence', {path: {command_id: commandId}, query}, 'bearer'),
    clearLocalState,
  });
}
