// 本地编译用途批准的公共开发接口；不授予订阅、发布或运行资格。
export function addBindingApprovals(apis,graph){
 const ref=n=>({$ref:'#/components/schemas/'+n}),object=p=>({type:'object',properties:p,required:Object.keys(p),additionalProperties:false});
 const uuid={type:'string',pattern:'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',minLength:36,maxLength:36};
 const r=n=>ref('bindingApproval__'+n),digest=ref('lifecycle__Digest'),json=ref('baseline__JsonValue'),content=ref('lifecycle__Program_ContentRef');
 const definitions={
  SourceScope:object({format:{const:'leafseamer.device-binding-scope/1'},authority_service_id:uuid,database_instance_id:uuid,device_ids:{type:'array',items:uuid,minItems:1,maxItems:64,uniqueItems:true}}),
  SourceQuery:object({binding_id:uuid,scope:r('SourceScope'),device_id:uuid,expected_registration_ref:{anyOf:[ref('lifecycle__SourceRegistrationRef'),{type:'null'}]}}),
  Binding:{oneOf:['input','action'].map(kind=>object({kind:{const:kind},binding_id:ref('lifecycle__Id'),content_ref:content,value:ref('lifecycle__Program_'+(kind==='input'?'InputBinding':'ActionBinding'))}))},
  Bundle:object({registration_ref:ref('lifecycle__SourceRegistrationRef'),registration:json,bindings:{type:'array',items:r('Binding'),minItems:1,maxItems:4096},
   schemas:{type:'array',maxItems:4096,items:object({binding_id:ref('lifecycle__Id'),schema_ref:content,document:json})},
   input_schemas:{type:'array',maxItems:4096,items:object({schema_ref:content,document:json})},
   result_schema:object({schema_ref:content,document:json,projections:{type:'array',maxItems:4096,items:json}}),alias_table:ref('lifecycle__Program_AliasTable')}),
  Candidate:object({definition_id:uuid,bundle_digest:digest,bundle:r('Bundle')}),
  Context:object({context_id:uuid}),
  Approve:object({context:r('Context'),source:r('SourceQuery'),request_id:uuid,approval_id:uuid,expected_bundle_digest:digest}),
  Revoke:object({context:r('Context'),request_id:uuid,expected_revision:{const:'1'}}),
  View:object({scope:ref('lifecycle__Scope'),approval_ref:content,definition_id:uuid,state:{enum:['approved','revoked']},purpose:{const:'definition_compile'},registration_ref:ref('lifecycle__SourceRegistrationRef'),bundle_digest:digest,bundle:r('Bundle')}),
  Lookup:object({request_id:uuid,request_digest:digest}),
  LookupResult:object({request_id:uuid,request_digest:digest,definition_id:uuid,result:{anyOf:[r('View'),{type:'null'}]}})
 };
 const named=Object.fromEntries(Object.entries(definitions).map(([k,v])=>['bindingApproval__'+k,v]));
 const local=v=>Array.isArray(v)?v.map(local):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,k==='$ref'?x.replace('#/components/schemas/','#/$defs/'):local(x)])):v;
 for(const api of Object.values(apis))Object.assign(api.components.schemas,structuredClone(named));Object.assign(graph.$defs,local(named));
 const base=apis.seamer.paths['/api/v1/definitions/{definition_id}/publish'].post;
 for(const [op,method,suffix,input,output,permission,write] of [
  ['queryBindingCandidate','post','binding-candidates/query','SourceQuery','Candidate','auth.read',false],
  ['approveDefinitionBindings','post','binding-approvals','Approve','View','auth.manage',true],
  ['getBindingApproval','get','binding-approvals/{approval_id}',null,'View','auth.read',false],
  ['revokeBindingApproval','post','binding-approvals/{approval_id}/revoke','Revoke','View','auth.manage',true],
  ['lookupBindingApproval','post','binding-approval-requests/lookup','Lookup','LookupResult','request.read',false]
 ]){
  const route=structuredClone(base);route.operationId=op;route.summary=op;route['x-permission']=permission;route['x-subject-kinds']=write?['human']:['human','service'];
  route['x-response-wire-profile']={max_message_bytes:524288,max_depth:48,max_value_nodes:131072,max_object_members:65536,max_key_utf8_bytes:4096,max_string_utf8_bytes:262144,parse_deadline_ms:1000};
  route['x-composition-source']={document:'binding-approval',source_version:'binding-approval/1'};delete route['x-source-contract-parameters'];
  if(!write)route.security=structuredClone(apis.seamer.paths['/api/v1/definitions/{definition_id}/draft'].get.security);
  if(suffix.includes('{approval_id}'))route.parameters.unshift({name:'approval_id',in:'path',required:true,schema:uuid});
  if(input)route.requestBody.content['application/json'].schema=r(input);else delete route.requestBody;
  const response=route.responses['201'];delete route.responses['201'];response.content['application/json'].schema=r(output);route.responses[op==='approveDefinitionBindings'?'201':'200']=response;
  apis.seamer.paths['/api/v1/definitions/{definition_id}/'+suffix]={[method]:route};
 }
}

// 历史适配器保持原字节；产品构建只为具名响应采用契约内的有界预算。
export function bindingHttpRuntime(source){
 for(const [before,after] of [
  ["import {createDecoder,WireError}","import {createDecoder,WireError,profile}"],
  ["const {map,binding}=bindings.get(handle);","const {op,map,binding}=bindings.get(handle);"],
  ["return decoder.decode(input,binding,{...options,contentType:'application/json'});","const selected=Object.hasOwn(handle,'status')?op.extensions['x-response-wire-profile']:null;\n    return decoder.decode(input,binding,{...options,...(selected&&!Object.hasOwn(options,'profile')?{profile:profile(selected)}:{}),contentType:'application/json'});"]
 ]){if(source.split(before).length!==2)throw new Error('binding_http_runtime_baseline');source=source.replace(before,after);}
 return source;
}
