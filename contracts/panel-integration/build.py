"""生成完整面板绑定及独立HTTP选择；保留固定来源，不安装候选。"""
import argparse,copy,hashlib,json,re
from pathlib import Path
from urllib.parse import urldefrag,urljoin
import rfc8785
ROOT=Path(__file__).resolve().parent;SDK=ROOT.parents[1]
BASE='https://leafseamer.invalid/sdk/panel-integration/0.3/'
SID=BASE+'models.schema.json';CID='leafseamer.api.v1.panel3';OLD='leafseamer.api.v1.events2'
CHANNEL='panel-channel/0.3.0-draft.1';SUBSCRIPTION='panel-subscriptions/0.2.0-draft.1'
MAP={'$defs','properties','patternProperties','dependentSchemas','schemas'}
DATA={'const','enum','default','examples','example'}
REF={'$ref','x-first-server-frame-schema','x-client-frame-schema','x-server-frame-schema','selection_schema'}
NONE={'seamer.preflightRun','seamer.previewRecovery'};INVALIDATION={'controller.listDevices','controller.getCommandEvidence'}
def load(p):return json.loads(Path(p).read_bytes())
def encoded(v):return (json.dumps(v,ensure_ascii=False,indent=2)+'\n').encode()
def sha(raw):return hashlib.sha256(raw).hexdigest()
def digest(v):return sha(rfc8785.dumps(v))
def need(v,s):
 if not v:raise ValueError(s)
def ref(n):return {'$ref':'#/$defs/'+n}
def obj(p):return dict(type='object',properties=p,required=list(p),additionalProperties=False)
def transform(v,fn,mapping=False):
 if isinstance(v,list):return [transform(x,fn) for x in v]
 if not isinstance(v,dict):return v
 if mapping:return {k:transform(x,fn) for k,x in v.items()}
 return {k:fn(x) if k in REF and isinstance(x,str) else copy.deepcopy(x) if k in DATA else transform(x,fn,k in MAP) for k,x in v.items()}
def references(v):
 found=[];transform(v,lambda r:(found.append(r) or r));return found
def versioned(v):
 result=copy.deepcopy(v)
 if result.get('properties',{}).get('protocol_version')=={'const':OLD}:result['properties']['protocol_version']={'const':CID}
 return result
def close_leaf(source,base,kind):
 """只取真实引用闭包，资源本身不嵌Registry或自己的摘要。"""
 definitions={};original=source['$defs'];base_id=base['$id']
 def follow(r):
  uri,fragment=urldefrag(r);need(fragment.startswith('/$defs/') and '/' not in fragment[7:],'非具名引用')
  n=fragment[7:]
  if uri in ['',source['$id']]:target=n;shape=original[n];current=source['$id']
  else:need(uri==base_id,'未注册来源URI');target='D__'+n;shape=versioned(base['$defs'][n]);current=base_id
  if target not in definitions:
   definitions[target]={}
   definitions[target]=transform(shape,lambda x:follow(current+x if x.startswith('#') else x))
  return '#/$defs/'+target
 for n,v in original.items():
  follow(source['$id']+'#/$defs/'+n)
 if kind=='result':definitions['MetaView']['properties']['protocol_version']={'const':CID}
 return {'$schema':source['$schema'],'$id':BASE+kind+'.schema.json','not':{},'$defs':definitions}
def typed(binding,model):return obj(dict(schema_ref={'const':binding},value=ref(model)))
def bind_branches(shape,rows):
 """只修改具名方法条件中的固定参数/结果；不遍历实例常量。"""
 value=copy.deepcopy(shape)
 for clause in value.get('allOf',[]):
  method=clause.get('if',{}).get('properties',{}).get('method',{}).get('const')
  if method not in rows:continue
  row=rows[method];props=clause.get('then',{}).get('properties',{})
  for field in ['normalized_arguments','payload','arguments']:
   if field in props:props[field]=typed(row['input_schema_ref'],'panel3__Input_'+row['input_schema_ref']['definition'])
  for field in ['projection','result','value']:
   if field in props and props[field].get('type')=='object':props[field]=typed(row['result_schema_ref'],'panel3__Result_'+row['result_schema_ref']['definition'])
 return value
def build():
 source=load(ROOT/'sources.json')
 need(source['approved'] is False and source['runtime_ready'] is False,'来源资格')
 for p,h in source['inputs'].items():need(sha((SDK/p).read_bytes())==h,'来源漂移:'+p)
 for p,item in source['copied_sources'].items():need(sha((SDK/p).read_bytes())==item['sha256'],'副本漂移:'+p)
 old=load(SDK/'contracts/event-integration/preview/models.schema.json');old_id=old['$id']
 methods=load(SDK/'contracts/panel-methods/bindings.json')['methods'];results=load(SDK/'contracts/panel-results/bindings.json')['methods']
 need(set(methods)==set(results) and len(methods)==35,'方法集合')
 leaves={kind:close_leaf(load(SDK/path),old,kind) for kind,path in [('input','contracts/panel-methods/input.schema.json'),('result','contracts/panel-results/result.schema.json')]}
 old_registry=load(ROOT/'source/method-registry-v02.json')['registry'];old_rows={r['method']:r for r in old_registry['methods']};need(set(old_rows)==set(methods),'旧Registry集合')
 rows={}
 for method,m in sorted(methods.items()):
  mode='none' if m['mode']!='panel_read' or method in NONE else 'invalidation' if method in INVALIDATION else 'projection'
  need(mode==old_rows[method]['subscription_mode'] and m['mode']==old_rows[method]['mode'],'用途漂移')
  bindings={k+'_schema_ref':dict(schema_id=leaves[k]['$id'],definition=n,schema_digest=digest(leaves[k])) for k,n in [('input',m['input_definition']),('result',results[method]['variant'])]}
  rows[method]=dict(method=method,mode=m['mode'],subscription_mode=mode,**bindings)
 registry=dict(format_version='panel-method-registry/0.3.0-draft.1',revision='1',methods=list(rows.values()))
 registry_ref=dict(revision=registry['revision'],digest=digest(registry))
 defs={n:versioned(v) for n,v in old['$defs'].items()};defs['negotiation__Selection']['properties']['contract_id']={'const':CID}
 for kind,doc in leaves.items():
  prefix='panel3__'+kind.title()+'_'
  for n,v in doc['$defs'].items():
   if n.startswith('D__'):continue
   defs[prefix+n]=transform(v,lambda r:ref(r[11:])['$ref'] if r.startswith('#/$defs/D__') else ref(prefix+r.removeprefix('#/$defs/'))['$ref'])
 # 来源的完整Channel补齐此前只从HTTP闭包引入的子集。
 channel=load(ROOT/'source/channel-v02.schema.json');bundle=load(ROOT/'source/bundle.schema.json')
 old_input=old_registry['methods'][0]['input_schema_ref']['schema_id'];old_result=old_registry['methods'][0]['result_schema_ref']['schema_id']
 resources={channel['$id']:'panel__Channel_',bundle['$id']:'panel__Bundle_',old_input:'panel3__Input_',old_result:'panel3__Result_'}
 def import_ref(r,origin):
  uri,frag=urldefrag(origin+r if r.startswith('#') else r)
  need(uri in resources and frag.startswith('/$defs/') and '/' not in frag[7:],'未知面板引用')
  return ref(resources[uri]+frag[7:])['$ref']
 for doc in [channel,bundle]:
  for n,v in doc['$defs'].items():
   value=transform(v,lambda r:import_ref(r,doc['$id']))
   if value.get('properties',{}).get('protocol_version')=={'const':'panel-channel/0.2.0-draft.1'}:value['properties']['protocol_version']={'const':CHANNEL}
   defs[resources[doc['$id']]+n]=bind_branches(value,rows)
 for n,v in list(defs.items()):
  if n.startswith(('panel__Service_','subscription__Subscription_')):defs[n]=bind_branches(v,rows)
  if n.startswith('subscription__Channel_'):
   name=n.removeprefix('subscription__Channel_');need('panel__Channel_'+name in defs,'共享通道模型缺失');defs[n]=ref('panel__Channel_'+name)
  if n.startswith(('panel__Input_','subscription__Input_')):
   defs[n]=ref('panel3__Input_'+n.split('__Input_',1)[1])
  if n.startswith(('panel__Result_','subscription__Result_')):
   name=n.split('__Result_',1)[1]
   if name.endswith('View'):defs[n]=ref('panel3__Result_'+name)
  if n.startswith('subscription__Subscription_') and defs[n].get('properties',{}).get('protocol_version')=={'const':'panel-subscriptions/0.1.0-draft.1'}:defs[n]['properties']['protocol_version']={'const':SUBSCRIPTION}
 defs['panel__Channel_MethodDescriptor']['allOf']=[{'if':{'properties':{'method':{'const':m}},'required':['method']},'then':{'properties':{k:{'const':v} for k,v in row.items() if k!='method'}}} for m,row in rows.items()]
 defs['panel__Channel_Intent']['allOf']=[{'if':{'properties':{'method':{'const':m}},'required':['method']},'then':{'properties':{'normalized_arguments':typed(row['input_schema_ref'],'panel3__Input_'+row['input_schema_ref']['definition'])}}} for m,row in rows.items()]
 # 固定Registry批准内容；Bundle的动态资源仍由宿主当前批准提供。
 for n,key in [('panel__Channel_ActivationRef','registry_ref'),('panel__Channel_PortOffer','registry_ref'),('panel__Service_PrepareActivation','expected_registry_ref'),('panel__Bundle_Manifest','registry_ref'),('panel__Bundle_Ready','registry_ref')]:
  need(key in defs[n]['properties'],'Registry绑定字段缺失:'+n);defs[n]['properties'][key]={'const':registry_ref}
 # 已受理与投影可用独立，不能把失败显示改成未受理。
 result=defs['panel__Channel_Result'];result['properties']['projection_state']={'enum':['available','unavailable','not_applicable']};result['required'].append('projection_state');result['allOf']=[]
 for method,row in rows.items():
  result['allOf'].append({'if':{'properties':{'method':{'const':method},'projection_state':{'const':'available'}},'required':['method','projection_state']},'then':{'properties':{'result':typed(row['result_schema_ref'],'panel3__Result_'+row['result_schema_ref']['definition'])}}})
 result['allOf'] += [
  {'if':{'properties':{'status':{'const':'accepted'}}},'then':{'properties':{'reason_code':{'const':'ok'},'projection_state':{'enum':['available','unavailable']}}},'else':{'properties':{'projection_state':{'const':'not_applicable'},'result':{'type':'null'}}}},
  {'if':{'properties':{'projection_state':{'const':'available'}}},'then':{'properties':{'status':{'const':'accepted'}}},'else':{'properties':{'result':{'type':'null'}}}},
  {'if':{'properties':{'status':{'const':'pending_confirmation'}}},'then':{'properties':{'method':{'enum':[m for m,r in rows.items() if r['mode']=='host_confirm']},'reason_code':{'const':'needs_host_confirmation'}}}}]
 for n,v in defs.items():
  for r in references(v):need(r.startswith('#/$defs/') and r[8:] in defs,'悬空或外部引用:'+n+':'+r)
 outputs={k+'.schema.json':v for k,v in leaves.items()}
 outputs['method-registry.json']=dict(approved=False,runtime_ready=False,registry_ref=registry_ref,registry=registry)
 graph=dict(old,**{'$id':SID,'title':CID,'$defs':defs,'x-approved':False,'x-runtime-ready':False,'x-advertisable':False});outputs['models.schema.json']=graph
 for role in ['controller','seamer']:
  api=load(SDK/f'contracts/event-integration/preview/{role}.openapi.json')
  def relocate(r):return r.replace(old_id,SID,1) if r.startswith(old_id+'#') else r
  api=transform(api,relocate);api['info']['version']=CID;api['x-canonical-model-graph']=SID
  for path,item in api['paths'].items():
   for verb,op in item.items():
    for p in op.get('parameters',[]):
     if p.get('in')=='header' and p['name']=='X-LeafSeamer-Contract':need(p['schema']=={'const':OLD},'请求选择漂移');p['schema']={'const':CID}
    for status,response in op['responses'].items():
     for name,h in response.get('headers',{}).items():
      if name=='X-LeafSeamer-Contract':need(h['schema']=={'const':OLD},'响应选择漂移');h['schema']={'const':CID}
     if status=='101':response['headers']['Sec-WebSocket-Protocol']['schema']['pattern']=r'^leafseamer\.contract\.'+re.escape(CID)+r'\.[0-9a-f]{64}(?![\s\S])'
    if 'x-offered-subprotocols' in op:op['x-offered-subprotocols']=[s.replace(OLD,CID) for s in op['x-offered-subprotocols']]
  api['components']['schemas']=transform(defs,lambda r:r.replace('#/$defs/','#/components/schemas/',1),True)
  api.update({'x-approved':False,'x-runtime-ready':False,'x-advertisable':False});outputs[role+'.openapi.json']=api
 for n in ['worker-ipc.schema.json','worker-messages.json','frames.schema.json']:
  value=load(SDK/'contracts/event-integration/preview'/n);outputs[n]=transform(value,lambda r:r.replace(old_id,SID,1) if r.startswith(old_id+'#') else r)
  if '$id' in outputs[n]:outputs[n]['$id']=BASE+n
 outputs['panel-frames.schema.json']={'$schema':old['$schema'],'$id':BASE+'panel-frames.schema.json','oneOf':[{'$ref':SID+'#/$defs/panel__Channel_'+n} for n in ['WindowFrame','PanelFrame','HostFrame']]}
 for r in references(outputs['panel-frames.schema.json']):need(r.split('/')[-1] in defs,'窗口消息根缺失:'+r)
 outputs['registry-map.json']=load(SDK/'contracts/event-integration/preview/registry-map.json')
 for n in outputs['registry-map.json']['collection_models'].values():need(defs[n]==old['$defs'][n],'既有事件投影漂移')
 changed=sorted(n for n in old['$defs'] if defs[n]!=old['$defs'][n]);added=sorted(set(defs)-set(old['$defs']))
 outputs['binding-map.json']=dict(format='panel-integration-binding/1',approved=False,runtime_ready=False,methods=rows,changed_models=changed,added_models=added,worker_semantics_unchanged=all(defs[n]==v for n,v in old['$defs'].items() if n.startswith('command__')))
 hashes={n:sha(encoded(v)) for n,v in sorted(outputs.items())};hashes['PROTOCOL.md']=sha((ROOT/'PROTOCOL.md').read_bytes())
 manifest=dict(format='sdk-contract-artifacts/1',contract_id=CID,approved=False,runtime_ready=False,advertisable=False,artifact_digest_algorithm='sha256-bytes',selection_digest_algorithm='sha256-jcs-manifest',artifacts=hashes)
 outputs['manifest.json']=manifest;outputs['selection.json']=dict(contract_id=CID,contract_digest='sha256:'+digest(manifest))
 return outputs
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--output',type=Path);a=p.parse_args();o=build()
 if a.output:
  a.output.mkdir(exist_ok=False)
  for n,v in o.items():(a.output/n).write_bytes(encoded(v))
 print(json.dumps(dict(models=len(o['models.schema.json']['$defs']),methods=35,selection=o['selection.json'])))
