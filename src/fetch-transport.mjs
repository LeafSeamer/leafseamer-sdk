export class TransportError extends Error {
  constructor(code) { super(code); this.name = 'TransportError'; this.code = code; }
}
const require = (ok, code) => { if (!ok) throw new TransportError(code); };
const safeInteger = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;

export function createFetchTransport({authority, baseUrl, timeoutMs = 10000, maxResponseBytes = 65536,
  allowInsecureLoopback = false, credentials = 'same-origin', fetchImpl = globalThis.fetch} = {}) {
  require(authority === 'controller' || authority === 'seamer', 'authority');
  require(typeof baseUrl === 'string', 'endpoint');
  let endpoint;
  try { endpoint = new URL(baseUrl); } catch { throw new TransportError('endpoint'); }
  const loopback = ['127.0.0.1', '[::1]', 'localhost'].includes(endpoint.hostname);
  require(endpoint.protocol === 'https:' || (endpoint.protocol === 'http:' && loopback && allowInsecureLoopback === true), 'endpoint_scheme');
  require(!endpoint.username && !endpoint.password && !endpoint.search && !endpoint.hash, 'endpoint');
  require(endpoint.pathname === '/' || /^\/services\/[A-Za-z0-9_-]+\/?$/.test(endpoint.pathname), 'endpoint_path');
  require(safeInteger(timeoutMs, 1, 300000) && safeInteger(maxResponseBytes, 1, 8388608), 'transport_budget');
  require(['omit', 'same-origin', 'include'].includes(credentials) && typeof fetchImpl === 'function', 'transport_options');
  const prefix = endpoint.pathname.replace(/\/$/, '');
  const origin = endpoint.origin;
  return async function transport(request) {
    require(request?.authority === authority, 'authority');
    require(typeof request.target === 'string' && request.target.startsWith('/') && !request.target.startsWith('//') &&
      !/[\\#\x00-\x20\x7f]/.test(request.target), 'request_target');
    const url = new URL(origin + prefix + request.target);
    // URL解析会折叠点段；不能让规范化悄悄改变已经校验的请求目标。
    require(url.origin === origin && url.pathname + url.search === prefix + request.target, 'request_target');
    require(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(request.method), 'method');
    require(request.body instanceof Uint8Array && request.body.byteLength <= 8388608 && Array.isArray(request.headers), 'request');
    const body = new Uint8Array(request.body);
    require(!['GET', 'HEAD'].includes(request.method) || body.length === 0, 'request_body');
    const headers = new Headers();
    const seen = new Set();
    for (const pair of request.headers) {
      require(Array.isArray(pair) && pair.length === 2 && pair.every(v => typeof v === 'string'), 'request_headers');
      const [name, value] = pair, lower = name.toLowerCase();
      require(!seen.has(lower), 'request_headers'); seen.add(lower);
      require(!['host', 'connection', 'transfer-encoding', 'proxy-authorization', 'proxy-connection', 'upgrade'].includes(lower), 'request_headers');
      if (lower === 'content-length') {
        require(value === String(body.byteLength), 'content_length');
        continue; // 由浏览器／Node fetch生成HTTP分帧，不设置浏览器禁止的头。
      }
      try { headers.append(name, value); } catch { throw new TransportError('request_headers'); }
    }
    if (request.signal !== undefined) {
      try { AbortSignal.prototype.throwIfAborted.call(request.signal); }
      catch { throw new TransportError('cancelled'); }
    }
    const deadline = new AbortController();
    const signal = request.signal === undefined ? deadline.signal : AbortSignal.any([request.signal, deadline.signal]);
    const timer = setTimeout(() => deadline.abort(), timeoutMs);
    let reader, complete = false;
    try {
      const response = await fetchImpl(url.href, {method: request.method, headers,
        body: body.length === 0 ? undefined : body, credentials, redirect: 'error', cache: 'no-store',
        referrerPolicy: 'no-referrer', signal});
      require(!response.redirected && response.type !== 'opaqueredirect' && response.type !== 'opaque', 'redirect_or_opaque');
      if (response.url) require(response.url === url.href, 'response_endpoint');
      const length = response.headers.get('content-length');
      if (length !== null) require(/^(0|[1-9][0-9]*)$/.test(length) && Number(length) <= maxResponseBytes, 'response_budget');
      const chunks = []; let size = 0;
      if (response.body !== null) {
        reader = response.body.getReader();
        while (true) {
          signal.throwIfAborted();
          const {done, value} = await reader.read();
          if (done) break;
          size += value.byteLength; require(size <= maxResponseBytes, 'response_budget');
          chunks.push(new Uint8Array(value));
        }
      }
      signal.throwIfAborted(); complete = true;
      const bytes = new Uint8Array(size); let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      return {status: String(response.status), headers: Array.from(response.headers.entries()), body: bytes};
    } catch (error) {
      if (error instanceof TransportError) throw error;
      throw new TransportError(signal.aborted ? 'cancelled_or_deadline' : 'network_failure');
    } finally {
      clearTimeout(timer);
      if (reader) {
        if (!complete) void reader.cancel().catch(() => {});
        reader.releaseLock();
      }
      if (!complete) deadline.abort();
    }
  };
}
