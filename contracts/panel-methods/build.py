"""构建显式新版本面板输入与领域绑定；不修改当前事件选择。"""
import copy,hashlib,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent;SDK=ROOT.parents[1]
sys.path.insert(0,str(ROOT))
from policy import METHODS,RULES,HOST_FIELDS,CONFIRM
SID='https://leafseamer.invalid/sdk/panel-methods/0.3/input.schema.json'
VERSION='panel-methods/0.3.0-draft.1'
def load(p):return json.loads(Path(p).read_bytes())
def sha(v):return hashlib.sha256(v).hexdigest()
def encoded(v):return (json.dumps(v,ensure_ascii=False,indent=2)+'\n').encode()
def need(v,m):
 if not v:raise ValueError(m)
def rewrite(v,base):
 if isinstance(v,list):return [rewrite(x,base) for x in v]
 if isinstance(v,dict):return {k:base+'#/$defs/'+x.rsplit('/',1)[-1] if k=='$ref' else rewrite(x,base) for k,x in v.items()}
 return v
def resolve(v,defs):
 seen=set()
 while set(v)=={'$ref'}:
  n=v['$ref'].rsplit('/',1)[-1];need(n not in seen,'循环别名');seen.add(n);v=defs[n]
 return v
def obj(props,required):return dict(type='object',properties=props,required=required,additionalProperties=False)

def build():
 sources=load(ROOT/'sources.json')
 need(sources['approved'] is False and sources['runtime_ready'] is False,'不得自行批准')
 for p,h in sources['inputs'].items():need(sha((SDK/p).read_bytes())==h,'SDK来源漂移:'+p)
 for p,v in sources['copied_sources'].items():need(sha((SDK/p).read_bytes())==v['sha256'],'副本漂移')
 models=load(SDK/'contracts/event-integration/preview/models.schema.json');base=models['$id'];defs=models['$defs']
 legacy=load(ROOT/'source/legacy-bindings.json')['methods'];need(set(legacy)==set(METHODS),'35方法覆盖漂移')
 auth=load(SDK/'contracts/authorization/bindings.json');authops={x['key']:x for x in auth['operations']}
 apis={a:load(SDK/f'contracts/event-integration/preview/{a}.openapi.json') for a in ('controller','seamer')}
 operations={a+':'+o['operationId']:(m,p,o) for a,api in apis.items() for p,item in api['paths'].items() for m,o in item.items() if isinstance(o,dict) and 'operationId' in o}
 rows={};inputs={};changes=[]
 for method,(target,rule) in METHODS.items():
  old=legacy[method];key=old['operation_key'];a,name=key.split(':');verb,path,op=operations[key];mode=old['mode']
  need((method in CONFIRM)==(mode=='host_confirm'),'确认方法漂移')
  human=next(b for b in authops[key]['branches'] if b['profile']=='human');props={};required=[];fields={};body_schema=None
  def add(arg,shape,is_required):
   need(arg not in props or props[arg]==shape,'参数重名');props[arg]=shape
   if is_required and arg not in required:required.append(arg)
  for p in op.get('parameters',[]):
   loc,n=p['in'],p['name'];dest=loc+'.'+n
   if loc=='header':
    need(n.lower() in ['x-leafseamer-contract','x-leafseamer-contract-digest'],'未审阅头');fields[dest]=dict(owner='host_selection');continue
   need(loc in ['path','query'],'未审阅参数位置')
   owner='page_handle' if n=='cursor' else 'panel_expected';arg='page_handle' if n=='cursor' else n
   fields[dest]=dict(owner=owner,argument=arg)
   shape=rewrite({'$ref':'#/$defs/panel__Channel_Id'},base) if owner=='page_handle' else rewrite(p['schema'],base)
   add(arg,shape,p.get('required',False))
  original=op.get('requestBody',{}).get('content',{}).get('application/json',{}).get('schema')
  if original:
   body_schema=rewrite(original,base);body=resolve(original,apis[a]['components']['schemas'])
   need(body.get('type')=='object' and body.get('additionalProperties') is False,'请求不是封闭对象')
   need(set(body)<={'type','properties','required','additionalProperties','allOf'},'未审阅请求约束')
   for n,shape in body['properties'].items():
    owner=HOST_FIELDS.get(n,'panel_expected');fields['body.'+n]=dict(owner=owner)
    if owner=='panel_expected':fields['body.'+n]['argument']=n;add(n,rewrite(shape,base),n in body['required'])
    elif owner in ['member_handle','assessment_handle','recovery_handle']:
     fields['body.'+n]['argument']=owner;add(owner,rewrite({'$ref':'#/$defs/panel__Channel_Id'},base),n in body['required'])
   if 'allOf' in body:
    need(method=='controller.submitCommand' and len(body['allOf'])==3,'未审阅条件请求')
    # origin固定manual；另外两项含宿主字段的条件在完整HTTP正文验证时保留。
    conditions=[rewrite(body['allOf'][1],base)]
   else:conditions=[]
  else:conditions=[]
  schema=obj(props,required)
  if conditions:schema['allOf']=conditions
  model=method.replace('.','_');inputs[model]=schema
  old_schema=defs['panel__Input_'+model]
  current=set(props);previous=set(old_schema['properties'])
  changes.append(dict(method=method,added_arguments=sorted(current-previous),removed_arguments=sorted(previous-current),
      retained_arguments_with_changed_schema=sorted(n for n in current&previous if props[n]!=rewrite(old_schema['properties'][n],base))))
  rows[method]=dict(operation_key=key,authority=a,http_method=verb,path=path,mode=mode,target_kind=target,
    semantic_rule=rule,source_fields=fields,input_definition=model,http_body_schema=body_schema,
    permission=authops[key]['permission'],human_branch=copy.deepcopy(human),result_view=old['result_view'],
    raw_response_allowed=False,authorization_granted=False,installed=False,
    preconditions=['current_host_session','activation_and_delegation','method_capability_intersection','target_relation',rule],
    commit_boundary='confirmed_domain_transaction' if mode=='host_confirm' else 'domain_transaction' if mode=='panel_write' else 'read_or_assessment_record',
    release_checks=['current_identity','current_scope','same_activation','whitelist_projection','view_schema'])
 schema={'$schema':'https://json-schema.org/draft/2020-12/schema','$id':SID,'title':VERSION,'$defs':inputs,
    'oneOf':[obj({'method':{'const':m},'arguments':{'$ref':'#/$defs/'+r['input_definition']}},['method','arguments']) for m,r in rows.items()]}
 registry=dict(format=VERSION,approved=False,runtime_ready=False,installed=False,source_selection=auth['selection'],
    requires_new_complete_selection=True,methods=rows,semantic_rules={k:dict(owner=v[0],contract=v[1]) for k,v in RULES.items()},changes=changes)
 return {'input.schema.json':schema,'bindings.json':registry}

if __name__=='__main__':
 outputs=build()
 for n,v in outputs.items():(ROOT/n).write_bytes(encoded(v))
 print(json.dumps(dict(methods=len(outputs['bindings.json']['methods']),semantic_rules=len(RULES))))
