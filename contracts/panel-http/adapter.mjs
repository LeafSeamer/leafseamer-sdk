import {catalog} from './preview/catalog.mjs';
import * as validators from './preview/validators.mjs';
import {createDecoder,WireError} from '../panel-wire/decoder.mjs';

export {WireError};
export const limits=Object.freeze({target_bytes:16384,header_bytes:65536,header_lines:256,query_pairs:128});
const fail=reason=>{throw new WireError('http_envelope',reason);};
const require=(ok,reason)=>{if(!ok)fail(reason);};
const freeze=v=>{if(v&&typeof v==='object'){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;};
const key=(...v)=>JSON.stringify(v),token=/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
const singleton=new Set(['host','authorization','cookie','origin','content-type','content-length','transfer-encoding','content-encoding','x-csrf-token','x-leafseamer-contract','x-leafseamer-contract-digest','sec-websocket-protocol']);
const secret=new Set(['authorization','cookie','set-cookie','x-csrf-token','sec-websocket-protocol']);
const typed=Object.getPrototypeOf(Uint8Array.prototype),byteLength=Object.getOwnPropertyDescriptor(typed,'byteLength').get;
function headers(lines) {
  require(Array.isArray(lines)&&lines.length<=limits.header_lines,'header_lines');
  const map=new Map();let size=0;
  for(const pair of lines) {
    require(Array.isArray(pair)&&pair.length===2,'header_pair');const [name,value]=pair;
    require(typeof name==='string'&&token.test(name)&&typeof value==='string'&&!/[^\t\x20-\x7e\x80-\xff]/.test(value),'header_syntax');
    size+=name.length+value.length+4;require(size<=limits.header_bytes,'header_budget');
    const lower=name.toLowerCase(),values=map.get(lower)??[];require(!singleton.has(lower)||values.length===0,'duplicate_header');
    values.push(value.replace(/^[ \t]+|[ \t]+$/g,''));map.set(lower,values);
  }
  require(!(map.has('content-length')&&map.has('transfer-encoding')),'ambiguous_framing');
  if(map.has('content-length'))require(/^(0|[1-9][0-9]*)$/.test(map.get('content-length')[0])&&Number.isSafeInteger(Number(map.get('content-length')[0])),'content_length');
  if(map.has('content-encoding'))require(map.get('content-encoding')[0].toLowerCase()==='identity','content_encoding');
  return map;
}
function component(raw,query=false) {
  let value;try{value=decodeURIComponent(query?raw.replaceAll('+',' '):raw);}catch{fail('percent_encoding');}
  require(!/[\x00-\x1f\x7f]/.test(value),'component_control');return value;
}
function target(raw) {
  require(typeof raw==='string'&&raw.length<=limits.target_bytes&&raw.startsWith('/')&&!/[^A-Za-z0-9._~!$&'()*+,;=:@/?%\-]/.test(raw),'request_target');
  const at=raw.indexOf('?'),p=at<0?raw:raw.slice(0,at),q=at<0?null:raw.slice(at+1);
  const segments=p.split('/').slice(1).map(v=>component(v));
  require(segments.every(v=>v!==''&&v!=='.'&&v!=='..'&&!/[\\/%]/.test(v)),'path_segment');
  const query=new Map();
  if(q!==null) {
    require(q.length>0,'empty_query');const pairs=q.split('&');require(pairs.length<=limits.query_pairs,'query_budget');
    for(const pair of pairs) {
      const eq=pair.indexOf('=');require(eq>0,'query_pair');const name=component(pair.slice(0,eq),true),value=component(pair.slice(eq+1),true);
      require(!query.has(name),'duplicate_query');query.set(name,value);
    }
  }
  return {segments,query};
}
function value(raw,p) {
  require(typeof raw==='string','parameter_value');const validate=validators[p.validator];
  // 三种有界integer参数才转Number；十进制字符串计数器保持原始精度与词法。
  let v=raw;
  if(p.numeric) {require(/^(0|[1-9][0-9]*)$/.test(raw)&&Number.isSafeInteger(Number(raw)),'integer_lexeme');v=Number(raw);}
  require(validate(v),'parameter_schema');return v;
}
function declaredHeaders(map,items,selected) {
  const result=Object.create(null);
  for(const h of items) {
    const values=map.get(h.name);
    require(values!==undefined||!(h.required||(selected&&h.after_selection)),'required_header');
    if(values===undefined)continue;
    require(values.length===1||h.name==='set-cookie','duplicate_header');
    const parsed=values.map(v=>value(v,h));if(!secret.has(h.name))result[h.name]=parsed.length===1?parsed[0]:parsed;
  }
  return result;
}
function media(map,body) {
  const type=map.get('content-type')?.[0];
  if(body==='json')require(typeof type==='string'&&/^application\/json(?:[ \t]*;[ \t]*charset[ \t]*=[ \t]*(?:utf-8|"utf-8"))?$/i.test(type),'content_type');
  else require(type===undefined,'empty_content_type');
}
export function createHttpAdapter(selection) {
  const decoder=createDecoder(selection),requests=new WeakMap(),responses=new WeakMap();
  const operations=new Map(catalog.operations.map(op=>[key(op.authority,op.operation_id),op]));
  const contractToken='leafseamer.contract.'+catalog.selection.contract_id+'.'+catalog.selection.contract_digest.slice(7);
  function select(map) {
    require(map.get('x-leafseamer-contract')?.[0]===catalog.selection.contract_id&&map.get('x-leafseamer-contract-digest')?.[0]===catalog.selection.contract_digest,'contract_selection');
  }
  function describe(authority,id) {const op=operations.get(key(authority,id));require(op,'unknown_operation');return op;}
  function prepareRequest(authority,method,rawTarget,rawHeaders) {
    require(['controller','seamer'].includes(authority)&&typeof method==='string','authority_method');
    const url=target(rawTarget),map=headers(rawHeaders),matches=[];
    for(const op of catalog.operations) {
      if(op.authority!==authority||op.method!==method)continue;const parts=op.path.split('/').slice(1);
      if(parts.length!==url.segments.length)continue;const params=Object.create(null);let score=0,match=true;
      for(let i=0;i<parts.length;i++) {
        if(parts[i].startsWith('{'))params[parts[i].slice(1,-1)]=url.segments[i];
        else if(parts[i]===url.segments[i])score++;else{match=false;break;}
      }
      if(match)matches.push({op,params,score});
    }
    matches.sort((a,b)=>b.score-a.score);require(matches.length&&(!matches[1]||matches[0].score!==matches[1].score),'unknown_or_ambiguous_route');
    const {op,params}=matches[0],parsed={path:Object.create(null),query:Object.create(null),headers:Object.create(null)};
    for(const name of url.query.keys())require(op.parameters.some(p=>p.location==='query'&&p.name===name),'unknown_query');
    for(const p of op.parameters) {
      const raw=p.location==='path'?params[p.name]:p.location==='query'?url.query.get(p.name):map.get(p.name)?.[0];
      require(raw!==undefined||!p.required,'required_parameter');
      if(p.location==='header'&&map.has(p.name))require(map.get(p.name).length===1,'duplicate_header');
      if(raw!==undefined&&!secret.has(p.name))parsed[p.location==='header'?'headers':p.location][p.name]=value(raw,p);
    }
    if(op.transport==='http-headers')select(map);
    if(op.transport==='websocket-subprotocol') {
      const offered=map.get('sec-websocket-protocol')?.[0]?.split(',').map(v=>v.trim())??[];
      require(offered.length===op.extensions['x-subprotocol-count']&&offered.filter(v=>v===contractToken).length===1,'ws_selection');
      if(op.extensions['x-secret-ticket-required'])require(offered.filter(v=>/^leafseamer\.ticket\.[A-Za-z0-9_-]{16,4096}$/.test(v)).length===1,'ws_ticket_format');
      if(map.has('x-leafseamer-contract')||map.has('x-leafseamer-contract-digest'))select(map);
    }
    media(map,op.body);
    const handle=freeze({authority,operation_id:op.operation_id,method:op.method,path_template:op.path,parameters:parsed,body:op.body,authorization_granted:false});
    requests.set(handle,{op,map,binding:decoder.http(authority,op.operation_id,'request')});return handle;
  }
  function prepareResponse(request,status,rawHeaders) {
    require(requests.has(request),'foreign_request');const {op}=requests.get(request);
    require(typeof status==='string'&&Object.hasOwn(op.responses,status),'response_status');
    const map=headers(rawHeaders),r=op.responses[status],selected=op.transport!=='discovery';
    const parsed=declaredHeaders(map,r.headers,selected);
    if(selected&&status!=='101')select(map);
    if(status==='101')require(op.transport==='websocket-subprotocol'&&map.get('sec-websocket-protocol')?.[0]===contractToken,'ws_echo');
    media(map,r.body);
    const handle=freeze({authority:op.authority,operation_id:op.operation_id,status,headers:parsed,body:r.body,authorization_granted:false});
    responses.set(handle,{op,map,binding:decoder.http(op.authority,op.operation_id,'response',status)});return handle;
  }
  async function decode(input,handle,bindings,options) {
    require(bindings.has(handle),'foreign_handle');const {map,binding}=bindings.get(handle);
    require(ArrayBuffer.isView(input)&&input instanceof Uint8Array,'byte_view_required');
    if(map.has('content-length'))require(byteLength.call(input)===Number(map.get('content-length')[0]),'content_length_mismatch');
    require(!Object.hasOwn(options,'contentType'),'content_type_override');
    if(handle.body==='none'){decoder.assertEmpty(input,binding);return null;}
    // 无任何前置await，底层扫描器在调用返回前复制bytes；调用者随后转移buffer不影响结果。
    return decoder.decode(input,binding,{...options,contentType:'application/json'});
  }
  return Object.freeze({describe,prepareRequest,prepareResponse,
    decodeRequest:(input,handle,options={})=>decode(input,handle,requests,options),
    decodeResponse:(input,handle,options={})=>decode(input,handle,responses,options)});
}
