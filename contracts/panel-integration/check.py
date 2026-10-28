"""验证完整绑定和全部方法结构，不模拟真实授权或投影提供者。"""
import argparse,copy,importlib.util,json,re
from pathlib import Path
from importlib.metadata import version
from jsonschema import Draft202012Validator,FormatChecker
from referencing import Registry,Resource
from openapi_spec_validator import validate
ROOT=Path(__file__).resolve().parent
def module(name,path):
 s=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
B=module('panel_integration_build',ROOT/'build.py')
def run():
 outputs=B.build();checks=[]
 def check(n,v=True):B.need(v,n);checks.append(dict(name=n,passed=True))
 for n,v in outputs.items():check('确定性生成:'+n,(ROOT/'preview'/n).read_bytes()==B.encoded(v))
 old=B.load(B.SDK/'contracts/event-integration/preview/models.schema.json');graph=outputs['models.schema.json'];defs=graph['$defs'];old_defs=old['$defs']
 rows=outputs['binding-map.json']['methods'];reg=outputs['method-registry.json']
 resource=Registry().with_resources([(v['$id'],Resource.from_contents(v)) for v in outputs.values() if '$schema' in v])
 old_row=B.load(ROOT/'source/method-registry-v02.json')['registry']['methods'][0]
 for n,v in defs.items():check('无旧固定SchemaRef:'+n,all(old_row[k]['schema_id'] not in json.dumps(v) for k in ['input_schema_ref','result_schema_ref']))
 for n,v in outputs.items():
  if '$schema' in v:Draft202012Validator.check_schema(v);check('Schema有效:'+n)
 def validator(name,doc=graph):return Draft202012Validator({'$ref':doc['$id']+'#/$defs/'+name},registry=resource,format_checker=FormatChecker())
 def valid(name,v,doc=graph):return validator(name,doc).is_valid(v)
 def positive(name,v,label):
  errors=list(validator(name).iter_errors(v));check(label,not errors or B.need(False,label+':'+errors[0].message[:180]))
 def bad(name,v,mutate,label):
  v=copy.deepcopy(v);mutate(v);check('拒绝:'+label,not valid(name,v))
 check('完整选择摘要',outputs['selection.json']['contract_digest']=='sha256:'+B.digest(outputs['manifest.json']))
 check('Registry摘要',reg['registry_ref']['digest']==B.digest(reg['registry']))
 check('完整清单无自指',set(outputs['manifest.json']['artifacts'])==set(outputs)-{'manifest.json','selection.json'}|{'PROTOCOL.md'})
 check('未批准未广告',not any(outputs['manifest.json'][k] for k in ['approved','runtime_ready','advertisable']))
 for n,h in outputs['manifest.json']['artifacts'].items():check('制品摘要:'+n,h==B.sha((ROOT/n).read_bytes() if n=='PROTOCOL.md' else B.encoded(outputs[n])))
 # 逐项校验许可变更范围；其他领域及worker必须保持。
 for n,v in old_defs.items():
  if n.startswith(('panel__','subscription__')):continue
  expected=copy.deepcopy(v)
  if expected.get('properties',{}).get('protocol_version')=={'const':B.OLD}:expected['properties']['protocol_version']={'const':B.CID}
  if n=='negotiation__Selection':expected['properties']['contract_id']={'const':B.CID}
  check('其他领域保留:'+n,defs[n]==expected)
 for n in outputs['registry-map.json']['collection_models'].values():
  pending=[n];seen=set()
  while pending:
   item=pending.pop()
   if item in seen:continue
   seen.add(item);check('事件闭包保留:'+item,defs[item]==old_defs[item]);pending.extend(r.removeprefix('#/$defs/') for r in B.references(defs[item]))
 op_count=0;ws=0
 for role in ['controller','seamer']:
  api=outputs[role+'.openapi.json'];base=B.load(B.SDK/f'contracts/event-integration/preview/{role}.openapi.json');validate(api);check('完整OpenAPI:'+role)
  check('完整路由集合:'+role,{(p,m) for p,x in api['paths'].items() for m in x}=={(p,m) for p,x in base['paths'].items() for m in x})
  check('认证方案原样:'+role,api['components']['securitySchemes']==base['components']['securitySchemes'])
  for path,item in api['paths'].items():
   for verb,op in item.items():
    op_count+=1;restored=B.transform(op,lambda r:r.replace(B.SID,old['$id'],1) if r.startswith(B.SID+'#') else r)
    for p in restored.get('parameters',[]):
     if p.get('in')=='header' and p['name']=='X-LeafSeamer-Contract':check('请求新选择:'+role+op['operationId'],p['schema']=={'const':B.CID});p['schema']={'const':B.OLD}
    for status,response in restored['responses'].items():
     for name,h in response.get('headers',{}).items():
      if name=='X-LeafSeamer-Contract':check('响应新选择:'+role+op['operationId']+status,h['schema']=={'const':B.CID});h['schema']={'const':B.OLD}
     if status=='101':
      ws+=1;pattern=response['headers']['Sec-WebSocket-Protocol']['schema']['pattern'];check('WS新token:'+role+op['operationId'],re.fullmatch(pattern,'leafseamer.contract.'+B.CID+'.'+'1'*64) is not None and re.fullmatch(pattern,'leafseamer.contract.'+B.OLD+'.'+'1'*64) is None)
      response['headers']['Sec-WebSocket-Protocol']['schema']['pattern']=pattern.replace(re.escape(B.CID),re.escape(B.OLD))
    if 'x-offered-subprotocols' in restored:restored['x-offered-subprotocols']=[s.replace(B.CID,B.OLD) for s in restored['x-offered-subprotocols']]
    check('操作其他语义保留:'+role+op['operationId'],restored==base['paths'][path][verb])
 check('201操作四WS',op_count==201 and ws==4)
 for n in ['worker-ipc.schema.json','worker-messages.json','frames.schema.json']:
  v=B.transform(outputs[n],lambda r:r.replace(B.SID,old['$id'],1) if r.startswith(B.SID+'#') else r);base=B.load(B.SDK/'contracts/event-integration/preview'/n)
  if '$id' in v:v['$id']=base['$id']
  check('原消息图语义保留:'+n,v==base)
 input_examples=module('panel_current_inputs',B.SDK/'contracts/panel-methods/fixtures.py').examples()
 result_examples=module('panel_current_results',B.SDK/'contracts/panel-results/fixtures.py').examples();result_examples['MetaView']['protocol_version']=B.CID
 result_bindings=B.load(B.SDK/'contracts/panel-results/bindings.json')['methods']
 cases=B.load(ROOT/'source/channel-v02-cases.json');frames=cases['frames']
 activation=copy.deepcopy(cases['context']['activation_ref']);activation['registry_ref']=reg['registry_ref']
 bundle_manifest=copy.deepcopy(cases['bundle']['manifest']);bundle_manifest['registry_ref']=reg['registry_ref'];bundle_manifest['manifest_digest']=B.digest({k:v for k,v in bundle_manifest.items() if k!='manifest_digest'})
 activation['bundle_ref']['manifest_digest']=bundle_manifest['manifest_digest']
 def frame(v):
  v=copy.deepcopy(v);v['protocol_version']=B.CHANNEL
  if 'public_binding' in v:v['public_binding']['protocol_version']=B.CHANNEL
  if 'activation_ref' in v:v['activation_ref']=activation
  if 'registry_ref' in v:v['registry_ref']=reg['registry_ref']
  if 'manifest_digest' in v:v['manifest_digest']=bundle_manifest['manifest_digest']
  if 'manifest' in v:v['manifest']=copy.deepcopy(bundle_manifest)
  if 'methods' in v:v['methods']=[rows[m['method']] for m in v['methods']]
  return v
 identity=dict(authority_service_id='authority.fixture',database_instance_id='db.fixture',issuer_id='issuer.fixture',issuer_epoch='epoch.fixture',auth_session_id='auth.fixture',panel_session_id='session.1',document_generation='1',request_id='request.fixture')
 objref=dict(authority_service_id='authority.fixture',database_instance_id='db.fixture',entity_kind='fixture',entity_id='object.fixture',entity_epoch='epoch.fixture',revision='1',content_digest='1'*64)
 delegation=dict(authority_service_id='authority.fixture',database_instance_id='db.fixture',delegation_id='delegation.fixture',revision='1')
 projection_count=invalidation_count=0
 for method,row in rows.items():
  iv=input_examples[method];rv=result_examples[result_bindings[method]['variant']]
  inp=dict(schema_ref=row['input_schema_ref'],value=iv);out=dict(schema_ref=row['result_schema_ref'],value=rv)
  for kind,value in [('input',iv),('result',rv)]:check('固定文档:'+kind+method,valid(row[kind+'_schema_ref']['definition'],value,outputs[kind+'.schema.json']))
  positive('panel__Channel_MethodDescriptor',row,'具名描述符:'+method)
  bad('panel__Channel_MethodDescriptor',row,lambda v:v.update(subscription_mode='projection' if row['subscription_mode']!='projection' else 'none'),'错误用途:'+method)
  request=frame(frames['request:'+method]);request['payload']=inp;positive('panel__Channel_Request',request,'Request:'+method)
  bad('panel__Channel_Request',request,lambda v:v['payload']['schema_ref'].update(schema_digest='0'*64),'旧输入摘要:'+method)
  result=frame(frames['result:'+method]);result.update(result=out,projection_state='available');positive('panel__Channel_Result',result,'Result:'+method)
  bad('panel__Channel_Result',result,lambda v:v['result']['schema_ref'].update(schema_digest='0'*64),'旧结果摘要:'+method)
  intent=dict(identity=identity,delegation_ref=delegation,method=method,target_ref=objref,normalized_arguments=inp,capability_ref=None,policy_ref=objref,activation_ref=activation)
  positive('panel__Service_BoundIntent',intent,'BoundIntent:'+method)
  bad('panel__Service_BoundIntent',intent,lambda v:v['normalized_arguments']['value'].update(actor='forged'),'透传宿主字段:'+method)
  receipt=dict(identity=identity,intent_digest='1'*64,method=method,activation_ref=activation,state='accepted',reason_code='ok',accepted_result_ref=objref,projection_state='available',projection=out)
  positive('panel__Service_RequestReceipt',receipt,'回执:'+method)
  unavailable=dict(result,projection_state='unavailable',result=None);positive('panel__Channel_Result',unavailable,'已受理不可显示:'+method)
  positive('panel__Service_RequestReceipt',dict(receipt,projection_state='unavailable',projection=None),'服务已受理不可显示:'+method)
  bad('panel__Channel_Result',unavailable,lambda v:v.update(projection_state='available'),'可用不能null:'+method)
  bad('panel__Channel_Result',result,lambda v:v.update(status='rejected'),'拒绝不能带投影:'+method)
  bad('panel__Channel_Result',result,lambda v:v['activation_ref']['registry_ref'].update(digest='0'*64),'旧Registry:'+method)
  subscribe=copy.deepcopy(request);subscribe['type']='panel.subscribe';subscribe['subscription_id']='sub.fixture';subscribe.pop('request_id')
  if row['subscription_mode']=='none':check('不可订阅:'+method,not valid('panel__Channel_Subscribe',subscribe));continue
  positive('panel__Channel_Subscribe',subscribe,'订阅输入:'+method)
  sid={k:v for k,v in identity.items() if k!='request_id'};sid['subscription_id']='sub.fixture'
  subintent=dict(identity=sid,activation_ref=activation,method=method,target_handle='target.1',resource_ref=None,arguments=inp)
  positive('subscription__Subscription_CreateSubscription',dict(gui_instance_id='gui.fixture',delegation_ref=delegation,intent=subintent),'服务订阅创建:'+method)
  bad('subscription__Subscription_SubscriptionIntent',subintent,lambda v:v['arguments']['schema_ref'].update(schema_digest='0'*64),'订阅旧输入摘要:'+method)
  envelope=dict(protocol_version=B.SUBSCRIPTION,identity=sid,activation_ref=activation,projection_exit_ref=objref,source_projection_ref=objref,projection_sequence='1',method=method,kind='baseline',reason_code='ok',value=out)
  projection=frame(frames['baseline']);projection.update(method=method,value=out)
  if row['subscription_mode']=='invalidation':
   invalidation_count+=1;check('分页不能baseline:'+method,not valid('subscription__Subscription_ProjectionEnvelope',envelope));envelope.update(kind='invalidated',value=None);projection.update(kind='invalidated',value=None)
  else:projection_count+=1;bad('subscription__Subscription_ProjectionEnvelope',envelope,lambda v:v.update(projection_sequence='2'),'baseline必须首序:'+method)
  positive('subscription__Subscription_ProjectionEnvelope',envelope,'服务订阅结果:'+method);positive('panel__Channel_Projection',projection,'端口订阅结果:'+method)
 check('订阅用途完整',projection_count==17 and invalidation_count==2)
 # 另外验证剩余完整帧类型；样例中的可信上下文布尔不参与判定。
 names={'Ready':'Ready','Challenge':'Challenge','Reply':'Reply','PortOffer':'PortOffer','Close':'Close','Closed':'Closed','Ack':'Ack','active':'Active','query':'Query','projection-ack':'ProjectionAck','unsubscribe':'Unsubscribe'}
 for fixture,model in names.items():positive('panel__Channel_'+model,frame(frames[fixture]),'其他帧:'+model)
 for fixture,model in [('bundle:offer','BundleOffer'),('bundle:chunk0','BundleChunk'),('bundle:ready','BundleReady'),('bundle:revoke','BundleRevoke')]:
  value=frame(frames[fixture])
  if 'manifest' in value:value['manifest']['registry_ref']=reg['registry_ref']
  positive('panel__Channel_'+model,value,'Bundle帧:'+model)
  if 'manifest' in value:bad('panel__Channel_'+model,value,lambda v:v['manifest']['registry_ref'].update(digest='0'*64),'Bundle旧Registry')
 check('Schema实例数据不改写',B.transform({'const':{'$ref':'fake'},'properties':{'$ref':{'const':'literal'}}},lambda r:'changed')=={'const':{'$ref':'fake'},'properties':{'$ref':{'const':'literal'}}})
 # 静态通过仍不能证明实际安装或当前认证；不构造授权通过声明。
 forged=frame(frames['active']);forged['public_binding']['panel_session_id']='unrelated'
 check('格式不证明当前会话',valid('panel__Channel_Active',forged))
 paths=sorted(p for p in ROOT.rglob('*') if p.is_file() and p.name!='report.json' and '__pycache__' not in p.parts)
 inputs={p.relative_to(B.SDK).as_posix():B.sha(p.read_bytes()) for p in paths};inputs.update(B.load(ROOT/'sources.json')['inputs'])
 return dict(format='panel-integration-report/1',approved=False,runtime_ready=False,advertisable=False,all_passed=True,cases_passed=len(checks),checks=checks,models=len(defs),operations=op_count,ws_operations=ws,methods=35,projection_methods=projection_count,invalidation_methods=invalidation_count,selection=outputs['selection.json'],inputs=inputs,tools={n:version(n) for n in ['jsonschema','referencing','rfc8785','openapi-spec-validator']},runtime_projection_tests_executed=0,authority_provider_tests_executed=0,database_tests_executed=0,browser_tests_executed=0,network_tests_executed=0,device_tests_executed=0)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--report',action='store_true');a=p.parse_args();report=run()
 if a.report:(ROOT/'report.json').write_bytes(B.encoded(report))
 print(json.dumps({k:v for k,v in report.items() if k not in ['checks','inputs']},ensure_ascii=False))
