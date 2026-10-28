"""真实子进程动态值校验与合成权威状态检查，不替代生产宿主验收。"""
import argparse
import copy
import json
import subprocess
import threading
from importlib.metadata import version
import provider as P
from fixtures import FORM,TYPES,fixture,authority,document,obj

def run():
    checks=[];worker_calls=0
    def check(name,value=True):P.need(value,name);checks.append(dict(name=name,passed=True))
    def denied(name,fn,reason=None):
        try:fn()
        except (P.Unavailable,ValueError) as e:
            check(name,reason is None or str(e)==reason)
        else:raise AssertionError(name+':未拒绝')
    original=P.instance
    def counted(*args):
        nonlocal worker_calls
        worker_calls+=1;return original(*args)
    P.instance=counted
    try:
        source=json.loads((P.ROOT/'sources.json').read_bytes())
        for path,digest in source['inputs'].items():
            raw=subprocess.check_output(['git','show',source['source_commit']+':'+path],cwd=P.SDK)
            check('固定SDK原件:'+path,P.B.sha(raw)==digest and raw==(P.SDK/path).read_bytes())
        for path,item in source['copied_sources'].items():check('固定副本:'+path,P.B.sha((P.SDK/path).read_bytes())==item['sha256'])
        f=fixture();a=authority(f);q=copy.deepcopy(f['qualified']);token=a.prepare(f['context'],q)
        q['value']['device']['level']=999
        check('嵌套验证并冻结副本',a.consume(f['context'],token)==f['qualified']);denied('候选不可重复消费',lambda:a.consume(f['context'],token))
        denied('自报候选JSON拒绝',lambda:a.consume(f['context'],{'valid':True}))
        denied('伪造对象无登记',lambda:a.consume(f['context'],P.Candidate()))
        other=authority(f);token=a.prepare(f['context'],f['qualified']);denied('候选不能跨权威',lambda:other.consume(f['context'],token))
        for label,modify in [
            ('selection',lambda c:c['selection'].update(contract_digest='sha256:'+'0'*64)),
            ('document_generation',lambda c:c['public_binding'].update(document_generation='2')),
            ('channel',lambda c:c['public_binding'].update(channel_id='other')),
            ('panel_session',lambda c:c['public_binding'].update(panel_session_id='other')),
            ('scope_revision',lambda c:c['activation_ref'].update(scope_revision='3')),
            ('activation',lambda c:c['activation_ref'].update(activation_id='other')),
            ('installation',lambda c:c['installation_ref'].update(revision='2')),
            ('approval',lambda c:c['approval_ref'].update(content_digest='2'*64)),
            ('authorization',lambda c:c['authorization_ref'].update(revision='2')),
            ('input_digest',lambda c:c.update(input_digest='3'*64)),
            ('purpose',lambda c:c.update(purpose='parameters')),
            ('access',lambda c:c.update(access='write')),
            ('source_revision',lambda c:c['source_ref'].update(revision='2')),
            ('source_database',lambda c:c['source_ref'].update(database_instance_id='other')),
            ('method',lambda c:c.update(method='controller.getCapabilities')),
            ('slot',lambda c:c.update(slot='/other')),
            ('binding',lambda c:c.update(binding_key='other'))]:
            c=copy.deepcopy(f['context']);modify(c)
            denied('准备不能跨绑定:'+label,lambda c=c:a.prepare(c,f['qualified']),'authority_stale')
            denied('消费必须复核:'+label,lambda c=c:a.consume(c,token),'authority_stale')
        check('错上下文未消费正确候选',a.consume(f['context'],token)==f['qualified'])
        check('能力仅导出精确SchemaRef',a.consume(f['context'],a.prepare_reference(f['context']))==f['qualified']['schema_ref'])
        z=authority(f);tokens=[z.prepare_reference(f['context']) for _ in range(64)]
        denied('候选容量拒绝不挤掉旧值',lambda:z.prepare_reference(f['context']),'pending_budget')
        check('消费后释放一个容量槽',z.consume(f['context'],tokens[0])==f['qualified']['schema_ref'])
        z.prepare_reference(f['context']);check('容量保持64',len(z._pending)==64);z.revoke();check('撤权清空待消费记录',not z._pending)
        for label,modify in [('doc_digest',lambda q:q['schema_ref'].update(schema_digest='0'*64)),('definition',lambda q:q['schema_ref'].update(definition='Other')),
                             ('schema_id',lambda q:q['schema_ref'].update(schema_id=TYPES)),('extra',lambda q:q.update(approved=True))]:
            q=copy.deepcopy(f['qualified']);modify(q);denied('精确导出:'+label,lambda q=q:a.prepare(f['context'],q))
        for label,value in [('嵌套范围',{'device':{'level':11,'labels':['ok']}}),('禁止数值强转',{'device':{'level':'3','labels':['ok']}}),
                            ('数组元素类型',{'device':{'level':3,'labels':[3]}}),('不能缺必需字段',{'device':{'labels':['ok']}})]:
            q=copy.deepcopy(f['qualified']);q['value']=value;denied(label,lambda q=q:a.prepare(f['context'],q),'instance_invalid')
        q=copy.deepcopy(f['qualified']);q['value']['device']['secret']='synthetic'
        denied('未批准嵌套字段拒绝',lambda:a.prepare(f['context'],q),'field_denied')
        for path in ['', '/device','/device/labels','/device/labels/0','/device/level']:
            g=copy.deepcopy(f);g['paths'].remove(path);z=authority(g)
            denied('每个容器与叶节点均需读权:'+path,lambda z=z:z.prepare(g['context'],g['qualified']),'field_denied')
        for paths in [['/bad~2'],['/a','/a'],['/z','/a'],['relative']]:denied('非法字段策略:'+str(paths),lambda paths=paths:P.check_paths(paths))
        for change in [lambda g:g['documents'][FORM]['$defs']['Value']['properties']['device']['properties']['level'].update(maximum=100),
                       lambda g:g['manifest']['profile_ref'].update(digest='0'*64),
                       lambda g:g['manifest']['registry_ref'].update(digest='0'*64),
                       lambda g:g['profile'].update(engine_version='other'),lambda g:g['profile'].update(python_version='other'),
                       lambda g:g['profile'].update(format_implementations={'uuid':'other'})]:
            g=copy.deepcopy(f);change(g);denied('改内容或引擎不继承批准:'+str(len(checks)),lambda g=g:authority(g))
        for label,shape in [('外部HTTP引用',{'$ref':'https://example.invalid/schema'}),('缺本地引用',{'$ref':'#/$defs/Missing'}),
                            ('同实例环',{'$ref':'#/$defs/Value'}),('未知关键字',{'x-execute':'bad'}),
                            ('未批准模式',{'type':'string','pattern':'x'}),('未批准format',{'type':'string','format':'uuid'}),
                            ('不能注入默认值',{'type':'object','default':{}})]:
            g=fixture(value='x',documents={FORM:document(shape)});denied(label,lambda g=g:authority(g),'bundle_invalid')
        # JSON Schema属性名中的$ref是普通数据字段；锚点跨文档已由基础正例验证。
        data={'$ref':'literal','a/b':{'~name':[]}}
        shape=obj(**{'$ref':{'const':'literal'},'a/b':obj(**{'~name':{'type':'array','maxItems':0}})})
        g=fixture(value=data,documents={FORM:document(shape)});z=authority(g)
        check('转义字段及空容器不被删掉',z.consume(g['context'],z.prepare(g['context'],g['qualified']))==g['qualified'])
        docs={FORM:document({'anyOf':[{'type':'null'},obj(value={'type':'integer'},child={'$ref':'#/$defs/Value'})]})}
        g=fixture(value={'value':1,'child':{'value':2,'child':None}},documents=docs);z=authority(g)
        check('下降子实例递归可验证',z.consume(g['context'],z.prepare(g['context'],g['qualified']))==g['qualified'])
        shape=dict(type='array',prefixItems=[{'type':'string'},{'type':'integer'}],items=False,minItems=2)
        g=fixture(value=['a',2],documents={FORM:document(shape)});z=authority(g)
        check('完整tuple应用器',z.consume(g['context'],z.prepare(g['context'],g['qualified']))==g['qualified'])
        shape=dict(type='object',patternProperties={'^x$':{'type':'integer'}},additionalProperties=False)
        g=fixture(value={'x':1},documents={FORM:document(shape)},profile=P.profile(patterns=['^x$']));z=authority(g)
        check('批准pattern实际验证',z.consume(g['context'],z.prepare(g['context'],g['qualified']))==g['qualified'])
        q=copy.deepcopy(g['qualified']);q['value']['x']='bad';denied('pattern字段类型仍拒绝',lambda:z.prepare(g['context'],q),'instance_invalid')
        g=fixture(value='12345678-1234-5678-1234-567812345678',documents={FORM:document({'type':'string','format':'uuid'})},profile=P.profile(formats=['uuid']));z=authority(g)
        check('批准format实际验证',z.consume(g['context'],z.prepare(g['context'],g['qualified']))==g['qualified'])
        q=copy.deepcopy(g['qualified']);q['value']='not-uuid';denied('format不是仅注解',lambda:z.prepare(g['context'],q),'instance_invalid')
        for value in [float('nan'),9007199254740992,'x'*262145,[None]*32768]:denied('值预算或数值拒绝:'+str(len(checks)),lambda value=value:P.nodes(value,P.profile()))
        value={};cursor=value
        for _ in range(49):cursor['next']={};cursor=cursor['next']
        denied('实例深度拒绝',lambda:P.nodes(value,P.profile()))
        z=authority(f);token=z.prepare(f['context'],f['qualified']);z.revoke()
        denied('准备后撤权拒绝消费',lambda:z.consume(f['context'],token),'authority_stale')
        denied('撤权不能新准备',lambda:z.prepare(f['context'],f['qualified']),'authority_stale')
        z=authority(f);started=threading.Event();resume=threading.Event();out=[]
        def delayed(*args):
            started.set();P.need(resume.wait(5),'test_wait');return counted(*args)
        P.instance=delayed
        def pending():
            try:z.prepare(f['context'],f['qualified']);out.append('unexpected_success')
            except P.Unavailable as e:out.append(str(e))
        thread=threading.Thread(target=pending);thread.start()
        try:
            P.need(started.wait(5),'thread_start')
            denied('同权威只允许一个在途验证',lambda:z.prepare(f['context'],f['qualified']),'validator_busy');z.revoke()
        finally:resume.set();thread.join(10);P.instance=counted
        check('验证中撤权不能生成候选',not thread.is_alive() and out==['authority_stale'])
        # 批准名单不保证正则耗时；真实子进程超过墙钟期限必须终止并拒绝。
        slow='(a+)+$';g=fixture(value='a'*5000+'!',documents={FORM:document({'type':'string','pattern':slow})},profile=P.profile(patterns=[slow],timeout_ms=300));z=authority(g)
        denied('子进程截止拒绝',lambda:z.prepare(g['context'],g['qualified']),'validator_timeout')
        check('截止后没有可消费候选',not z._pending)
        # 后续正常子进程必须能成功，超时不能污染全局验证状态。
        z=authority(f);check('超时后正常值仍通过',z.consume(f['context'],z.prepare(f['context'],f['qualified']))==f['qualified'])
    finally:P.instance=original
    import publication_checks
    publication=publication_checks.run()
    paths=[p for p in P.ROOT.rglob('*') if p.is_file() and p.name!='report.json' and '__pycache__' not in p.parts]
    inputs={p.relative_to(P.SDK).as_posix():P.B.sha(p.read_bytes()) for p in sorted(paths)};inputs.update(source['inputs'])
    return dict(format='panel-current-report/1',approved=False,runtime_ready=False,installed=False,all_passed=True,cases_passed=len(checks),checks=checks,
        validator_subprocess_calls=worker_calls+publication['validator_subprocess_calls']+publication['legacy_validator_subprocess_calls'],publication_source=publication,revocation_thread_scenarios=1,validator_timeout_scenarios=1,
        production_authority_tests_executed=0,production_projection_tests_executed=0,worker_memory_limit_tests_executed=0,
        browser_tests_executed=0,network_tests_executed=0,database_tests_executed=publication['sqlite_disk_scenarios'],device_tests_executed=0,
        tools={n:version(n) for n in ['jsonschema','referencing','rfc8785']},inputs=inputs)
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--report',action='store_true');args=parser.parse_args();r=run()
    if args.report:(P.ROOT/'report.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
    print(json.dumps({k:v for k,v in r.items() if k not in ['checks','inputs']},ensure_ascii=False))
