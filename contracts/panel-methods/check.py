"""检查输入候选和合成HTTP映射，不执行身份、句柄或领域提供者。"""
import argparse,copy,importlib.util,json
from importlib.metadata import version
from pathlib import Path
from jsonschema import Draft202012Validator,FormatChecker
from referencing import Registry,Resource
ROOT=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('panel_build',ROOT/'build.py');B=importlib.util.module_from_spec(spec);spec.loader.exec_module(B)
from fixtures import examples,D

def run():
 outputs=B.build();checks=[]
 def check(name,value=True):B.need(value,name);checks.append(dict(name=name,passed=True))
 for n,v in outputs.items():check('生成字节一致:'+n,(ROOT/n).read_bytes()==B.encoded(v))
 schema=outputs['input.schema.json'];bindings=outputs['bindings.json'];rows=bindings['methods'];models=B.load(B.SDK/'contracts/event-integration/preview/models.schema.json')
 registry=Registry().with_resources([(models['$id'],Resource.from_contents(models)),(B.SID,Resource.from_contents(schema))])
 Draft202012Validator.check_schema(schema)
 def validator(s):return Draft202012Validator(s,registry=registry,format_checker=FormatChecker())
 def valid(method,args):return validator({'$ref':B.SID+'#/$defs/'+rows[method]['input_definition']}).is_valid(args)
 fixtures=examples();check('手写全部方法样例',set(fixtures)==set(rows) and len(rows)==35)
 check('固定双权威方法数',sum(m.startswith('controller.') for m in rows)==19 and sum(m.startswith('seamer.') for m in rows)==16)
 check('固定八项确认',{m for m,r in rows.items() if r['mode']=='host_confirm'}==B.CONFIRM)
 apis={a:B.load(B.SDK/f'contracts/event-integration/preview/{a}.openapi.json') for a in ['controller','seamer']}
 # 仅为格式相容实验：这些字典不是可信句柄，不能作为实际提供者或许可。
 host=dict(context_id='context.fixture',idempotency_key='key.fixture',context=dict(context_id='context.fixture',idempotency_key='key.fixture'),
   correlation_id='correlation.fixture',target_principal=dict(issuer_id='issuer.fixture',issuer_epoch='epoch.fixture',principal_id='principal.fixture'),
   preflight_id='preflight.fixture',preflight_digest=D,preview_id='preview.fixture',preview_digest=D)
 mapped={}
 for m,args in fixtures.items():
  row=rows[m];definition=schema['$defs'][row['input_definition']]
  errors=list(validator({'$ref':B.SID+'#/$defs/'+row['input_definition']}).iter_errors(args));check('输入正例:'+m,not errors)
  for key in ['context','context_id','idempotency_key','origin','run_binding','automation_binding','correlation_id','authorization','delegation_ref']:
   bad=copy.deepcopy(args);bad[key]='caller';check('拒绝宿主字段:'+m+':'+key,not valid(m,bad))
  for key in definition['required']:
   bad=copy.deepcopy(args);del bad[key];check('拒绝缺少参数:'+m+':'+key,not valid(m,bad))
  http={'path':{},'query':{},'body':{},'header':{}}
  for field,entry in row['source_fields'].items():
   loc,n=field.split('.',1);owner=entry['owner'];arg=entry.get('argument')
   if owner=='forbidden':continue
   if owner=='panel_expected':
    if arg not in args:continue
    value=args[arg]
   elif owner=='page_handle':
    if arg not in args:continue
    value='Y3Vyc29yX2ZpeHR1cmU'
   elif owner=='host_selection':value=bindings['source_selection']['contract_id' if n.lower().endswith('contract') else 'contract_digest']
   elif owner=='fixed_manual':value='manual'
   elif owner=='fixed_null':value=None
   else:
    if arg:check('句柄先由面板选择:'+m+':'+n,arg in args)
    value=host[n]
   http[loc][n]=copy.deepcopy(value)
  if m=='controller.acquireControl':http['body'].setdefault('force',False)
  op=apis[row['authority']]['paths'][row['path']][row['http_method']]
  for param in op.get('parameters',[]):
   present=param['name'] in http[param['in']]
   check('完整参数映射:'+m+':'+param['name'],present or not param.get('required',False))
   if present:check('参数格式:'+m+':'+param['name'],validator(B.rewrite(param['schema'],models['$id'])).is_valid(http[param['in']][param['name']]))
  if row['http_body_schema']:check('合成完整HTTP正文:'+m,validator(row['http_body_schema']).is_valid(http['body']))
  else:check('无正文不注入字段:'+m,not http['body'])
  mapped[m]=http
  check('候选未安装未授权:'+m,row['installed'] is False and row['authorization_granted'] is False and row['raw_response_allowed'] is False)
  check('语义所有者具名:'+m,row['semantic_rule'] in bindings['semantic_rules'])
 # 独立预期检测旧版/当前接口不能静默混用。
 expected={
 'controller.cancelCommand':({'expected_state_ref'},{'expected_revision'}),
 'controller.offerTransfer':({'member_handle'},{'target_principal_id','target_principal'}),
 'controller.getCommandEvidence':({'state_revision','limit','page_handle'},{'cursor'}),
 'seamer.createDefinition':({'content','metadata'},{'definition'}),
 'seamer.updateDraft':({'expected_draft_revision','content'},{'definition','expected_revision'}),
 'seamer.publishDefinition':({'expected_draft_revision','expected_content_digest','expected_selection_digest'},{'expected_revision'}),
 'seamer.createRun':({'expected_artifact_ref'},set()),
 'seamer.armRun':({'expected_run_revision','expected_slot_revision','assessment_handle'},{'approval_id','preflight_id','preflight_digest','expected_revision'}),
 'seamer.resumeRun':({'expected_run_revision','expected_slot_revision','recovery_handle'},{'preview_id','preview_digest','expected_revision'}),
 'seamer.getIndependenceProof':({'revision'},set())}
 for m,(added,forbidden) in expected.items():
  props=set(schema['$defs'][rows[m]['input_definition']]['properties']);check('独立当前字段:'+m,added<=props and not forbidden&props)
  for key in sorted(forbidden):
   bad=copy.deepcopy(fixtures[m]);bad[key]='old';check('拒绝旧版字段:'+m+':'+key,not valid(m,bad))
 check('手动命令不带运行绑定',mapped['controller.submitCommand']['body']['automation_binding'] is None and mapped['controller.submitCommand']['body']['origin']=='manual' and 'run_binding' not in mapped['controller.submitCommand']['body'])
 check('强制默认值规范化',mapped['controller.acquireControl']['body']['force'] is False)
 for m in ['controller.submitCommand','controller.acquireControl']:
  bad=copy.deepcopy(fixtures[m]);bad['expected_control']['version']=2;check('拒绝数字代替修订:'+m,not valid(m,bad))
 bad=copy.deepcopy(fixtures['controller.submitCommand']);bad.update(action_id='obs.program_scene.set',parameters={},required_completion='sent')
 check('保留OBS条件限制',not valid('controller.submitCommand',bad))
 bad=copy.deepcopy(mapped['controller.submitCommand']['body']);bad['automation_binding']={}
 check('完整HTTP再验宿主字段',not validator(rows['controller.submitCommand']['http_body_schema']).is_valid(bad))
 # 合成引用可通过格式但不证明同源；这项反例不能被算作实际授权通过。
 bad=copy.deepcopy(fixtures['controller.cancelCommand']);bad['expected_state_ref']['id']='unrelated.fixture'
 check('格式不能证明原件归属',valid('controller.cancelCommand',bad))
 check('旧选择未改写',bindings['source_selection']==B.load(B.SDK/'contracts/event-integration/preview/selection.json') and bindings['requires_new_complete_selection'] and not bindings['installed'])
 paths=[p for p in ROOT.rglob('*') if p.is_file() and p.name!='report.json' and '__pycache__' not in p.parts]
 inputs={p.relative_to(B.SDK).as_posix():B.sha(p.read_bytes()) for p in sorted(paths)};inputs.update(B.load(ROOT/'sources.json')['inputs'])
 return dict(format='panel-method-report/1',approved=False,runtime_ready=False,all_passed=True,methods=len(rows),semantic_rules=len(bindings['semantic_rules']),
  cases_passed=len(checks),checks=checks,synthetic_http_mappings=len(mapped),real_handle_tests_executed=0,authorization_tests_executed=0,
  result_projection_tests_executed=0,browser_tests_executed=0,network_tests_executed=0,device_tests_executed=0,
  tools={n:version(n) for n in ['jsonschema','referencing']},inputs=inputs)

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--report',action='store_true');args=parser.parse_args();r=run()
 if args.report:(ROOT/'report.json').write_bytes(B.encoded(r))
 print(json.dumps({k:v for k,v in r.items() if k not in ['checks','inputs']},ensure_ascii=False))
