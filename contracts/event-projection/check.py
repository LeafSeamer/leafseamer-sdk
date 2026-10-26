"""固定输入、字段接受集、可信前提下的投影与撤权反例；不运行产品服务。"""
import argparse
import copy
from dataclasses import replace
import json
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
import build as B
import model as M
import fixtures as F
from jsonschema import Draft202012Validator, FormatChecker, ValidationError
from referencing import Registry, Resource


def inputs():
    paths=[p for p in B.ROOT.rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.name!='report.json']
    paths += [B.SDK/n for n in B.load(B.ROOT/'sources.json')['inputs']]
    return {p.relative_to(B.SDK).as_posix():B.C.sha(p.read_bytes()) for p in sorted(paths)}


def run():
    results=[]
    def check(name,actual,expected=True):
        assert actual==expected,(name,actual,expected)
        results.append(dict(name=name,passed=True))
    def denied(name,action):
        try:action()
        except (ValueError,ValidationError):check(name,True)
        else:raise AssertionError(name+':应拒绝')
    outputs=B.build();graph=outputs['models.schema.json'];defs=graph['$defs']
    for name,value in outputs.items():check('生成字节:'+name,(B.ROOT/'preview'/name).read_bytes()==B.C.encode(value))
    Draft202012Validator.check_schema(graph)
    registry=Registry().with_resource(graph['$id'],Resource.from_contents(graph))
    wrapper=Draft202012Validator(outputs['snapshot.schema.json'],registry=registry,format_checker=FormatChecker())
    canonical=B.load(B.ROOT.parent/'negotiation/preview/models.schema.json')['$defs']
    for n,v in defs.items():
        if n.startswith('command__'):check('完整复用:'+n,v==canonical[n])
    def valid(name,value):return Draft202012Validator({'$ref':B.P+name,'$defs':defs},format_checker=FormatChecker()).is_valid(value)
    old=B.load(B.ROOT/'source/snapshot.schema.json')
    records=B.load(B.ROOT/'source/snapshot-cases.json')['records']
    for kind,record in records.items():
        check('旧投影边界:'+kind,valid('snapshot__Record',record),kind!='commands')
    # 来源条件不能只复制成功状态：unknown清理资源后仍必须保留暂停锁存与核对引用。
    cases={'queued':F.base(),'unknown':F.unknown(),'unknown_clear':F.unknown(True),'automation':F.automation()}
    c=F.context(cases['automation']);c=replace(c,subject_kind='service',paired=True,origin_owned=True)
    for label,r in cases.items():
        context=c if label=='automation' else F.context(r)
        out=M.project(r,context)
        check('当前投影:'+label,valid('snapshot__Record',out))
        check('释放来源:'+label,M.check_binding(out,context,r))
        check('原件不就地改写:'+label,r['record_digest']==M.digest({k:v for k,v in r.items() if k!='record_digest'}))
    new=M.project(cases['unknown_clear'],F.context(cases['unknown_clear']))
    check('超过JS安全整数保留',new['entity_revision'],'9007199254740993')
    check('unknown仍unknown',new['view']['state']['outcome'],'unknown')
    check('清理资源仍暂停',new['view']['state']['automation_continuation'],'paused_latched')
    for state in ('requested','confirmed','unsupported','failed','indeterminate','too_late'):
        r=F.unknown();r['cancellation']['state']=state;F.seal(r)
        out=M.project(r,F.context(r));check('取消状态:'+state,out['view']['cancellation']['state'],state)
        legacy=copy.deepcopy(records['commands']);legacy['view']['cancellation_state']=state
        check('旧格式接受集:'+state,Draft202012Validator({'$ref':'#/$defs/Record','$defs':old['$defs']}).is_valid(legacy),state not in ('indeterminate','too_late'))
    r=F.base();ctx=F.context(r);out=M.project(r,ctx)
    for key,value in [('current_authorization',False),('current_generation',False),('source_publishable',False),
                      ('device_id','other'),('permissions',frozenset({'status.read'})),('subject_kind','extension')]:
        denied('释放前失效:'+key,lambda key=key,value=value:M.check_binding(out,replace(ctx,**{key:value}),r))
    for key,value in [('paired',False),('origin_owned',False)]:
        denied('服务不得越权:'+key,lambda key=key,value=value:M.project(cases['automation'],replace(c,**{key:value})))
    denied('服务不得读外来手动',lambda:M.project(r,replace(ctx,subject_kind='service',paired=True,origin_owned=True)))
    # 手工明确的错配，不从投影实现自动生成期望值。
    mutations=[('state.command_id','other'),('state.revision','2'),('request_identity.key.target_scope.database_instance_id','other'),
        ('initial_command_ref.object_id','other'),('initial_command_ref.revision','2'),
        ('completion.required','sent'),('completion.evidence_refs',[F.ref('extra')]),
        ('state.attempt_ids',['missing-attempt']),('state.outcome','succeeded')]
    for path,value in mutations:
        bad=copy.deepcopy(r);target=bad;parts=path.split('.')
        for part in parts[:-1]:target=target[part]
        target[parts[-1]]=value;F.seal(bad)
        denied('重算摘要仍拒绝:'+path,lambda bad=bad:M.project(bad,F.context(bad)))
    bad=F.unknown(True);bad['state']['resource_evidence_refs']=[];F.seal(bad)
    denied('unknown-clear缺资源证据',lambda:M.project(bad,F.context(bad)))
    bad=F.unknown();bad['state']['automation_continuation']='eligible';F.seal(bad)
    denied('unknown不能解锁自动化',lambda:M.project(bad,F.context(bad)))
    bad=F.unknown();bad['state']['terminal_revision']='9007199254740994';F.seal(bad)
    denied('终态修订越界',lambda:M.project(bad,F.context(bad)))
    for key in ('actor','dispatch','attempts','run_binding','automation_binding','policy','evidence_index','record_digest'):
        check('未公开完整字段:'+key,key not in out['view'])
        bad=copy.deepcopy(out);bad['view'][key]=copy.deepcopy(r[key])
        check('拒绝透传字段:'+key,valid('snapshot__Record',bad),False)
    for path,value in [('entity_id','other'),('entity_epoch','other'),('entity_revision','2'),
                       ('view.source_record_ref.digest',F.D),('view.state.phase','finished')]:
        bad=copy.deepcopy(out);target=bad;parts=path.split('.')
        for part in parts[:-1]:target=target[part]
        target[parts[-1]]=value
        denied('错投影拒绝:'+path,lambda bad=bad:M.check_binding(bad,ctx,r))
    data=dict(format_version=B.VERSION,type='server.data',binding=dict(subscription_id='subscription',publisher_service_id='controller',
        publisher_database_instance_id='database',stream_id='stream',stream_epoch='stream-epoch',scope_digest='a'*64,
        authorization_revision='1',connection_generation='1'),cursor='2',previous_cursor='1',delivery_mode='reconcile',
        entry=dict(entry_kind='entity.upsert',payload=out),payload_digest='')
    data['payload_digest']=M.digest(data['entry']).removeprefix('sha256:');check('新data入口',wrapper.is_valid(data))
    olddata=copy.deepcopy(data);olddata['format_version']='snapshot-projection/0.1.0-draft.1'
    check('旧版本不能混用',wrapper.is_valid(olddata),False)
    wrong=copy.deepcopy(data);wrong['payload_digest']='sha256:'+wrong['payload_digest']
    check('快照摘要拒绝命令前缀',wrapper.is_valid(wrong),False)
    wrong=copy.deepcopy(out);wrong['view']['source_record_ref']['digest']=wrong['view']['source_record_ref']['digest'].removeprefix('sha256:')
    check('命令引用拒绝裸hex',valid('snapshot__Record',wrong),False)
    rebound=copy.deepcopy(data);rebound['binding']['connection_generation']='2'
    check('重包裹不改entry摘要',M.digest(rebound['entry']).removeprefix('sha256:')==data['payload_digest'])
    check('正例固定字节',(B.ROOT/'examples.json').read_bytes()==B.C.encode(dict(records={k:M.project(v,c if k=='automation' else F.context(v)) for k,v in cases.items()},data=data)))
    return dict(format='command-snapshot-check/1',all_passed=True,approved=False,runtime_ready=False,
        cases_passed=len(results),checks=results,models=len(defs),runtime_tests_executed=0,device_tests_executed=0,
        authentication_tests_executed=0,database_tests_executed=0,inputs=inputs())


def examples():
    cases={'queued':F.base(),'unknown':F.unknown(),'unknown_clear':F.unknown(True),'automation':F.automation()}
    records={k:M.project(v,replace(F.context(v),subject_kind='service',paired=True,origin_owned=True) if k=='automation' else F.context(v)) for k,v in cases.items()}
    data=dict(format_version=B.VERSION,type='server.data',binding=dict(subscription_id='subscription',publisher_service_id='controller',
        publisher_database_instance_id='database',stream_id='stream',stream_epoch='stream-epoch',scope_digest='a'*64,
        authorization_revision='1',connection_generation='1'),cursor='2',previous_cursor='1',delivery_mode='reconcile',
        entry=dict(entry_kind='entity.upsert',payload=records['queued']),payload_digest='')
    data['payload_digest']=M.digest(data['entry']).removeprefix('sha256:')
    return dict(records=records,data=data)


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);g=p.add_mutually_exclusive_group()
    g.add_argument('--examples',action='store_true');g.add_argument('--report',action='store_true');g.add_argument('--check-report',action='store_true');a=p.parse_args()
    if a.examples:(B.ROOT/'examples.json').write_bytes(B.C.encode(examples()))
    elif a.check_report:
        r=B.load(B.ROOT/'report.json');assert r['all_passed'] and r['inputs']==inputs();print(json.dumps(dict(all_passed=True,bindings=len(r['inputs']))))
    else:
        r=run()
        if a.report:(B.ROOT/'report.json').write_bytes(B.C.encode(r))
        print(json.dumps({k:v for k,v in r.items() if k not in ('checks','inputs')},ensure_ascii=False))
