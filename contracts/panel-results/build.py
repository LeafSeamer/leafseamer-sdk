"""当前21结果视图的显式候选；只验证设计来源，不执行真实投影。"""
import copy,hashlib,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent;SDK=ROOT.parents[1]
sys.path.insert(0,str(ROOT))
from catalog import PLANS,PROVIDERS
SID='https://leafseamer.invalid/sdk/panel-results/0.3/result.schema.json'
def load(p):return json.loads(Path(p).read_bytes())
def encoded(v):return (json.dumps(v,ensure_ascii=False,indent=2)+'\n').encode()
def sha(v):return hashlib.sha256(v).hexdigest()
def need(v,s):
 if not v:raise ValueError(s)
def obj(p):return dict(type='object',properties=p,required=list(p),additionalProperties=False)
def ref(n):return {'$ref':'#/$defs/'+n}
def nullable(s):return {'anyOf':[s,{'type':'null'}]}
def array(s,n=256):return dict(type='array',items=s,maxItems=n)
def resolve(shape,defs):
 seen=set()
 while set(shape)=={'$ref'}:
  n=shape['$ref'].rsplit('/',1)[-1];need(n not in seen,'循环引用');seen.add(n);shape=defs[n]
 return shape
def path_shape(model,path,defs):
 shape=defs[model]
 for part in path.split('.'):
  shape=resolve(shape,defs);need(part in shape.get('properties',{}),'不存在来源字段:'+model+':'+path);shape=shape['properties'][part]
 return shape
def external(v,base):
 if isinstance(v,list):return [external(x,base) for x in v]
 if isinstance(v,dict):return {k:base+'#/$defs/'+x.rsplit('/',1)[-1] if k=='$ref' else external(x,base) for k,x in v.items()}
 return v

def build():
 source=load(ROOT/'sources.json')
 need(source['approved'] is False and source['runtime_ready'] is False,'候选资格')
 for p,h in source['inputs'].items():need(sha((SDK/p).read_bytes())==h,'来源漂移:'+p)
 for p,item in source['copied_sources'].items():need(sha((SDK/p).read_bytes())==item['sha256'],'夹具来源漂移')
 models=load(SDK/'contracts/event-integration/preview/models.schema.json');defs=models['$defs'];base=models['$id']
 methods=load(SDK/'contracts/panel-methods/bindings.json')['methods'];views=sorted({x['result_view'] for x in methods.values()})
 d={v:external(copy.deepcopy(defs['panel__Result_'+v]),base) for v in views}
 E=lambda n:external({'$ref':'#/$defs/'+n},base)
 field=lambda model,p:external(copy.deepcopy(path_shape(model,p,defs)),base)
 ID=E('panel__Result_Id');COUNTER=E('lifecycle__Revision');remaining=nullable(dict(type='integer',minimum=0,maximum=9007199254740991))
 d['TargetStatus']=obj(dict(service_alias=ID,state={'enum':['pending','applied','closing','closed','unknown']}))
 d['TargetSet']=obj(dict(items=array(ref('TargetStatus')),has_hidden=dict(type='boolean')))
 d['GrantTarget']=obj(dict(service_alias=ID,state=field('lifecycle__PreparationTarget','state'),baseline_grant_id=nullable(ID),target_grant_id=nullable(ID)))
 d['GrantSet']=obj(dict(items=array(ref('GrantTarget')),has_hidden=dict(type='boolean')))
 d['ExecutionSummary']=obj(dict(execution_id=ID,phase=field('lifecycle__ExecutionRecord','phase'),outcome=field('lifecycle__ExecutionRecord','outcome')))
 d['CheckSummary']=obj(dict(service_alias=ID,status={'enum':['passed','failed','unknown']},reason_code=ID))
 d['RecoveryItem']=obj(dict(step_id=ID,disposition=field('lifecycle__RecoveryPlanItem','disposition'),previous_command_id=nullable(ID),has_hidden_previous=dict(type='boolean'),evidence_summaries=array(E('panel__Result_QualifiedValue'),4096),parameters_summary=nullable(E('panel__Result_QualifiedValue'))))
 d['CommandSet']=obj(dict(visible_command_ids=dict(array(ID,4096),uniqueItems=True),has_hidden=dict(type='boolean')))
 for name in ['ClockView','ClockAssessmentView']:
  d[name]=obj({f:field(PLANS[name]['model'],p) for f,p in PLANS[name]['direct'].items()})
  d[name]['allOf']=[{'if':{'properties':{'status':{'const':'conditional'}}},'then':{'properties':{'reference_utc':E('time_public__S12__Interval'),'estimated_utc_ns':E('time_public__S12__Signed'),'error_radius_ns':E('time_public__S12__UInt'),'reasons':{'maxItems':0}}},'else':{'properties':{'reference_utc':{'type':'null'},'estimated_utc_ns':{'type':'null'},'error_radius_ns':{'type':'null'},'reasons':{'minItems':1}}}}]
 for name in ['CancelView','LifecycleMutationView','DraftDefinitionView','PublishedDefinitionView','PreflightView','RecoveryPlanView','RecoveryOperationView']:
  plan=PLANS[name];d[name]=obj({f:field(plan['model'],p) for f,p in plan['direct'].items()})
 def add(name,**p):
  d[name]['properties'].update(p);d[name]['required']=list(d[name]['properties'])
 add('CancelView',reason_code=nullable(ID))
 add('CommandView',state_ref=field('command__V__S0_CommandRecord','state_ref'))
 add('TransferView',remaining_ms=remaining);del d['TransferView']['properties']['expires_at'];d['TransferView']['required'].remove('expires_at')
 d['GrantMutationView']=copy.deepcopy(d['MutationView']);add('GrantMutationView',kind={'const':'grant_revocation'})
 add('LifecycleMutationView',target_status_summary=ref('TargetSet'));d['LifecycleMutationView']['properties']['kind']={'enum':['arm','pause']}
 d['MutationView']={'oneOf':[ref('GrantMutationView'),ref('LifecycleMutationView')]}
 for name,kind in [('DraftDefinitionView','draft'),('PublishedDefinitionView','published')]:
  add(name,kind={'const':kind},content=E('lifecycle__DraftContent'),metadata=E('lifecycle__DefinitionMetadata'),proof_summaries=array(E('panel__Result_ProofSummary')))
 d['DefinitionView']={'oneOf':[ref('DraftDefinitionView'),ref('PublishedDefinitionView')]}
 add('RunView',artifact_ref=E('lifecycle__ArtifactRef'),slot_revision=COUNTER,business_state=field('lifecycle__RunRecord','business_state'),definition_version=COUNTER,execution_summary=nullable(ref('ExecutionSummary')),grant_summaries=ref('GrantSet'))
 add('IndependenceView',definition_version=COUNTER,proof_revision=COUNTER)
 add('PreflightView',checks=array(ref('CheckSummary')),remaining_ms=remaining,assessment_handle=ID)
 add('RecoveryPlanView',recovery_handle=ID,remaining_ms=remaining,items=array(ref('RecoveryItem'),4096),unresolved=ref('CommandSet'))
 add('RecoveryOperationView',visible_new_command_ids=dict(array(ID,4096),uniqueItems=True),has_hidden_commands=dict(type='boolean'),target_status_summary=ref('TargetSet'))
 # 每一个顶层输出字段必须有来源或具名提供者，不能靠同名字段猜测。
 plans={}
 for name,p in PLANS.items():
  shape=d[name];fields={};need(set(shape['properties'])==set(p['direct'])|set(p['derived']),'输出字段未完整登记:'+name)
  for out,path in p['direct'].items():
   shape['properties'][out]=field(p['model'],path);fields[out]=dict(kind='source',path=path)
   if name=='LifecycleMutationView' and out=='kind':shape['properties'][out]={'enum':['arm','pause']}
  for out,item in p['derived'].items():
   need(item['provider'] in PROVIDERS,'未知提供者')
   for path in item['paths']:path_shape(p['model'],path,defs)
   fields[out]=dict(kind='provider',**item)
  plans[name]=dict(source_model=p['model'],relation=p['relation'],fields=fields)
 bindings={}
 for method,m in methods.items():
  view=m['result_view'];variant=view
  if view=='DefinitionView':variant='PublishedDefinitionView' if method=='seamer.publishDefinition' else 'DraftDefinitionView'
  if view=='MutationView':variant='GrantMutationView' if method=='controller.revokeRunGrant' else 'LifecycleMutationView'
  bindings[method]=dict(view=view,variant=variant,operation_key=m['operation_key'],authority=m['authority'],mode=m['mode'],
    source_model=plans[variant]['source_model'],ready_for_installation=False,raw_response_allowed=False)
 schema={'$schema':'https://json-schema.org/draft/2020-12/schema','$id':SID,'title':'panel-results/0.3.0-draft.1','$defs':d,
  'oneOf':[obj(dict(method={'const':m},value=ref(b['variant']))) for m,b in bindings.items()]}
 inventory=dict(format='panel-result-bindings/1',approved=False,runtime_ready=False,installed=False,requires_new_complete_selection=True,
  source_selection=load(SDK/'contracts/event-integration/preview/selection.json'),providers=PROVIDERS,views=views,plans=plans,methods=bindings,
  output_field_count=sum(len(p['fields']) for p in plans.values()),coverage_unit='variant_top_level_output_field')
 return {'result.schema.json':schema,'bindings.json':inventory}

if __name__=='__main__':
 outputs=build()
 for n,v in outputs.items():(ROOT/n).write_bytes(encoded(v))
 b=outputs['bindings.json'];print(json.dumps(dict(views=len(b['views']),variants=len(b['plans']),fields=b['output_field_count'])))
