"""当前结果Schema、来源覆盖和有限显示语义验收；不执行生产投影。"""
import argparse,copy,importlib.util,json
from pathlib import Path
from importlib.metadata import version
from jsonschema import Draft202012Validator,FormatChecker
from referencing import Registry,Resource
ROOT=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('result_build',ROOT/'build.py');B=importlib.util.module_from_spec(spec);spec.loader.exec_module(B)
from fixtures import examples,D

def semantic_error(view,v):
 if view in ['ClockView','ClockAssessmentView'] and v['status']=='conditional':
  lo=int(v['reference_utc']['lower_ns']);hi=int(v['reference_utc']['upper_ns']);mid=int(v['estimated_utc_ns']);radius=int(v['error_radius_ns'])
  if not lo<=mid<=hi or radius<max(mid-lo,hi-mid):return 'clock_interval'
 if view=='CommandView':
  if (v['phase']=='finished')==(v['outcome']=='pending'):return 'phase'
  if v['outcome'] in ['unknown','blocked','expired'] and v['automation_continuation']!='paused_latched':return 'continuation'
  if v['outcome']=='unknown' and (v['effect_status']=='not_sent' or (v['resource_status']=='clear' and v['resolution_summary'] is None)):return 'unknown'
 if view=='PreflightView' and v['passed'] and any(c['status']!='passed' for c in v['checks']):return 'preflight'
 if view=='RecoveryOperationView':
  if int(v['committed_run_revision'])<=int(v['previous_run_revision']):return 'revision'
  if v['new_execution_id'] is None and (v['visible_new_command_ids'] or v['has_hidden_commands']):return 'execution'
 return None

def run():
 outputs=B.build();checks=[]
 def check(name,value=True):B.need(value,name);checks.append(dict(name=name,passed=True))
 for n,v in outputs.items():check('生成一致:'+n,(ROOT/n).read_bytes()==B.encoded(v))
 schema=outputs['result.schema.json'];bindings=outputs['bindings.json'];models=B.load(B.SDK/'contracts/event-integration/preview/models.schema.json');fixtures=examples()
 Draft202012Validator.check_schema(schema);registry=Registry().with_resources([(models['$id'],Resource.from_contents(models)),(B.SID,Resource.from_contents(schema))])
 def validator(s):return Draft202012Validator(s,registry=registry,format_checker=FormatChecker())
 def valid(name,v):return validator({'$ref':B.SID+'#/$defs/'+name}).is_valid(v) and semantic_error(name,v) is None
 check('23变体完整样例',set(fixtures)==set(bindings['plans']) and len(fixtures)==23)
 check('21视图35方法',len(bindings['views'])==21 and len(bindings['methods'])==35)
 check('181顶层字段',bindings['output_field_count']==sum(len(p['fields']) for p in bindings['plans'].values())==181)
 for name,p in bindings['plans'].items():
  v=fixtures[name];errors=list(validator({'$ref':B.SID+'#/$defs/'+name}).iter_errors(v))
  check('结果正例:'+name,not errors and semantic_error(name,v) is None)
  check('完整字段归属:'+name,set(p['fields'])==set(schema['$defs'][name]['properties']))
  for key,recipe in p['fields'].items():
   for path in ([recipe['path']] if recipe['kind']=='source' else recipe['paths']):B.path_shape(p['source_model'],path,models['$defs'])
   check('字段来源:'+name+':'+key)
   bad=copy.deepcopy(v);del bad[key];check('缺字段拒绝:'+name+':'+key,not valid(name,bad))
  for key in ['actor','request_identity','permit','raw_response','credentials','source_ref']:
   bad=copy.deepcopy(v);bad[key]={};check('拒绝额外原件:'+name+':'+key,not valid(name,bad))
 for m,b in bindings['methods'].items():
  check('方法结果联合:'+m,validator(schema).is_valid(dict(method=m,value=fixtures[b['variant']])))
  check('不得安装或透传:'+m,b['ready_for_installation'] is False and b['raw_response_allowed'] is False)
 def rejected(name,view,mutate):
  value=copy.deepcopy(fixtures[view]);mutate(value);check('拒绝:'+name,not valid(view,value))
 rejected('时钟浮点纳秒','ClockView',lambda v:v.update(estimated_utc_ns=1e18))
 rejected('条件时间冒充执行资格','ClockView',lambda v:v.update(grants_execution=True))
 rejected('旧同步状态','ClockView',lambda v:v.update(status='synchronized'))
 rejected('区间倒置','ClockView',lambda v:v['reference_utc'].update(lower_ns='1000000000000000021'))
 rejected('半径不足','ClockView',lambda v:v.update(error_radius_ns='1'))
 rejected('不可用保留有效区间','ClockView',lambda v:v.update(status='unavailable',reasons=['expired']))
 rejected('草稿伪装发布','DraftDefinitionView',lambda v:v.update(kind='published'))
 rejected('发布缺制品引用','PublishedDefinitionView',lambda v:v.pop('artifact_ref'))
 rejected('旧语义版本运行','RunView',lambda v:v.update(definition_version='1.0.0'))
 rejected('预检unknown伪通过','PreflightView',lambda v:v['checks'][0].update(status='unknown'))
 rejected('恢复修订倒退','RecoveryOperationView',lambda v:v.update(committed_run_revision=v['previous_run_revision']))
 rejected('无执行却有新命令','RecoveryOperationView',lambda v:v['visible_new_command_ids'].append('invented'))
 rejected('旧恢复世代','RecoveryOperationView',lambda v:v.update(recovery_generation='1'))
 rejected('旧UTC期限','TransferView',lambda v:v.update(expires_at='2026-10-28T00:00:00Z'))
 rejected('未知结果解锁继续','CommandView',lambda v:v.update(automation_continuation='eligible'))
 rejected('未知已清资源无处置','CommandView',lambda v:v.update(resource_status='clear'))
 rejected('错误生命周期用途','LifecycleMutationView',lambda v:v.update(kind='resume'))
 unavailable=dict(fixtures['ClockView'],status='unavailable',reference_utc=None,estimated_utc_ns=None,error_radius_ns=None,reasons=['expired'])
 check('不可用时间明确null',valid('ClockView',unavailable))
 check('空目标预检不自动失败',valid('PreflightView',dict(fixtures['PreflightView'],checks=[])))
 check('无执行运行明确null',valid('RunView',dict(fixtures['RunView'],active_execution_id=None,execution_summary=None)))
 check('过期剩余时间为零',valid('TransferView',dict(fixtures['TransferView'],remaining_ms=0)))
 check('不可信时基剩余时间未知',valid('TransferView',dict(fixtures['TransferView'],remaining_ms=None)))
 # 本例可过格式且同样通过本地语义；实际提供者必须拒绝不相关原件，不能据此授予许可。
 forged=copy.deepcopy(fixtures['CommandView']);forged['state_ref']['id']='unrelated'
 check('格式不证明来源',valid('CommandView',forged))
 check('两代授权ID分别显示',valid('RunView',fixtures['RunView']) and fixtures['RunView']['grant_summaries']['items'][0]['baseline_grant_id']!=fixtures['RunView']['grant_summaries']['items'][0]['target_grant_id'])
 rejected('授权不得透传原Ref','RunView',lambda v:v['grant_summaries']['items'][0].update(target_grant_ref={}))
 rejected('恢复不能丢参数摘要槽','RecoveryPlanView',lambda v:v['items'][0].pop('parameters_summary'))
 rejected('恢复不能透传证据Ref','RecoveryPlanView',lambda v:v['items'][0].update(evidence_refs=[]))
 summary=copy.deepcopy(fixtures['RecoveryPlanView']);q=dict(schema_ref=dict(schema_id='synthetic.recovery',definition='summary',schema_digest='1'*64),value={'label':'fixture'})
 summary['items'][0].update(evidence_summaries=[q],parameters_summary=q)
 check('恢复摘要封装格式',valid('RecoveryPlanView',summary))
 summary['items'][0]['parameters_summary']['value']={'unapproved_field':'fixture'}
 check('静态格式不证明动态字段批准',valid('RecoveryPlanView',summary))
 big=copy.deepcopy(fixtures['RecoveryPlanView']);big['items']=[dict(step_id='step.'+str(i),disposition='execute_new',previous_command_id=None,has_hidden_previous=False,evidence_summaries=[],parameters_summary=None) for i in range(4096)]
 check('完整4096步计划',valid('RecoveryPlanView',big));big['items'].append(big['items'][0]);check('4097步不能截断',not valid('RecoveryPlanView',big))
 paths=[p for p in ROOT.rglob('*') if p.is_file() and p.name!='report.json' and '__pycache__' not in p.parts]
 inputs={p.relative_to(B.SDK).as_posix():B.sha(p.read_bytes()) for p in sorted(paths)};inputs.update(B.load(ROOT/'sources.json')['inputs'])
 return dict(format='panel-result-report/1',approved=False,runtime_ready=False,all_passed=True,cases_passed=len(checks),checks=checks,
  views=21,variants=23,methods=35,top_level_field_bindings=181,providers=len(bindings['providers']),coverage_unit=bindings['coverage_unit'],
  runtime_projection_tests_executed=0,authority_provider_tests_executed=0,database_tests_executed=0,browser_tests_executed=0,network_tests_executed=0,device_tests_executed=0,
  tools={n:version(n) for n in ['jsonschema','referencing']},inputs=inputs)

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--report',action='store_true');args=parser.parse_args();r=run()
 if args.report:(ROOT/'report.json').write_bytes(B.encoded(r))
 print(json.dumps({k:v for k,v in r.items() if k not in ['checks','inputs']},ensure_ascii=False))
