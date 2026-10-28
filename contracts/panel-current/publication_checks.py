"""当前读权下读取已提交的当前及历史原件；批准配置全部为合成输入。"""
import copy
import json
import sqlite3
import subprocess
import sys
import uuid
from pathlib import Path
from jsonschema.exceptions import ValidationError
import provider as P
import fixtures as F

S=P.PUBLICATION

def fixture(record,component,shape=None):
    value=record['source'][component]
    # 测试宿主明确批准此完整值；实际Bundle由安装审批提供，不能据数据自动批准。
    f=F.fixture(value=value,documents={F.FORM:F.document(shape or {'const':copy.deepcopy(value)})})
    m=f['manifest'];c=f['context'];binding='published.'+component
    m['exports'][0].update(binding_key=binding,purpose='definition')
    m.pop('manifest_digest');m['manifest_digest']=P.digest(m)
    c['activation_ref']['bundle_ref']['manifest_digest']=m['manifest_digest']
    c.update(method='seamer.publishDefinition',slot='/'+component,binding_key=binding,purpose='definition',access='read')
    p=record['published'];c['source_ref'].update(**p['scope'],entity_kind='publication_source',entity_id=p['definition_id'],revision=p['definition_version'],content_digest=record['record_digest'][7:])
    return f

def authority(f,record,selection,component):
    return P.PublicationAuthority(f['context'],f['manifest'],f['documents'],f['profile'],f['paths'],record['published'],selection,component)

def run():
    checks=[];calls=0
    def check(name,ok=True):P.need(ok,name);checks.append(dict(name=name,passed=True))
    def denied(name,fn,reason=None):
        try:fn()
        except (ValueError,ValidationError,sqlite3.DatabaseError) as e:check(name,reason is None or str(e)==reason)
        else:raise AssertionError(name+':未拒绝')
    original=P.instance
    def counted(*args):
        nonlocal calls
        calls+=1;return original(*args)
    P.instance=counted
    try:
        base=F.fixture()
        for name,selection in [('panel3',S.LEGACY_SELECTION),('混合摘要',{**P.SELECTION,'contract_digest':S.LEGACY_SELECTION['contract_digest']})]:
            f=copy.deepcopy(base);f['context']['selection']=copy.deepcopy(selection)
            denied('当前提供者拒绝'+name,lambda f=f:F.authority(f),'selection')
        old_registry=json.loads((P.SDK/'contracts/panel-integration/preview/method-registry.json').read_bytes())['registry_ref']
        f=copy.deepcopy(base);f['manifest']['registry_ref']=old_registry;f['context']['activation_ref']['registry_ref']=old_registry
        denied('不能仅更新选择而沿用旧Registry',lambda:F.authority(f),'context_shape')
        # 固定旧消费者在独立进程验证，避免两个provider/fixtures模块互相覆盖。
        program="""import json,sys
sys.path.insert(0,sys.argv[1])
import provider as P
from fixtures import fixture,authority
f=fixture();a=authority(f);assert a.consume(f['context'],a.prepare(f['context'],f['qualified']))==f['qualified']
f['context']['selection']=json.loads(sys.argv[2])
try:authority(f)
except P.Unavailable as e:assert str(e)=='selection'
else:raise AssertionError('old_accepts_current')
print('ok')
"""
        result=subprocess.run([sys.executable,'-I','-B','-c',program,str(P.SDK/'contracts/panel-dynamic'),json.dumps(P.SELECTION)],capture_output=True,text=True,timeout=20)
        check('旧提供者实际运行仍接受原选择并拒当前选择',result.returncode==0 and result.stdout.strip()=='ok')
        directory=P.SDK/'logs/panel-current'/('publication-'+uuid.uuid4().hex)
        directory.mkdir(parents=True)
        path=directory/'publication.sqlite'
        # 使用真实旧实现产生记录，再由当前实现显式升级。
        result=subprocess.run([sys.executable,'-I','-B',str(P.SDK/'contracts/publication-current/legacy_probe.py'),str(path),'WAL'],input='{"action":"quit"}\n',capture_output=True,text=True,encoding='utf8',timeout=20)
        check('旧存储进程正常关闭',result.returncode==0)
        old=json.loads(result.stdout)['record'];db=S.connect(path,upgrade=True)
        try:
            p=copy.deepcopy(old['published']);p['definition_version']='4';p['artifact_ref']['object_id']='artifact.current'
            source=copy.deepcopy(old['source']);source['metadata']['name']='当前原件名称'
            current=S.freeze(p,source,S.SELECTION);db.execute('BEGIN IMMEDIATE');S.append(db,current);db.commit()
            before=db.execute('SELECT body FROM publication_source ORDER BY version').fetchall()
            for label,record,selection in [('当前',current,S.SELECTION),('历史',old,S.LEGACY_SELECTION)]:
                for component in ['content','metadata']:
                    prefix=label+':'+component+':'
                    f=fixture(record,component);a=authority(f,record,selection,component)
                    token=a.prepare(db,f['context'])
                    check(prefix+'完整原件值实际校验并交付',a.consume(f['context'],token)==f['qualified'])
                    denied(prefix+'候选单次消费',lambda:a.consume(f['context'],token),'candidate_binding')
                    other=authority(f,record,selection,component);token=a.prepare(db,f['context'])
                    denied(prefix+'候选不能跨权威',lambda:other.consume(f['context'],token),'candidate_binding')
                    a.revoke();denied(prefix+'准备后撤权拒消费',lambda:a.consume(f['context'],token),'authority_stale')
                    denied(prefix+'撤权不能再准备',lambda:a.prepare(db,f['context']),'authority_stale')
                    inverse=S.LEGACY_SELECTION if selection==S.SELECTION else S.SELECTION
                    wrong=authority(f,record,inverse,component)
                    denied(prefix+'当前历史入口不可互换',lambda:wrong.prepare(db,f['context']))
                    for field in ['',f['paths'][-1]]:
                        g=copy.deepcopy(f);g['paths'].remove(field);z=authority(g,record,selection,component)
                        denied(prefix+'缺字段权利整值拒绝:'+field,lambda:z.prepare(db,g['context']),'field_denied')
            f=fixture(current,'metadata')
            for key,value in [('authority_service_id','other'),('database_instance_id','other'),('entity_kind','observation'),('entity_id','other'),('revision','9')]:
                g=copy.deepcopy(f);g['context']['source_ref'][key]=value
                denied('来源身份不匹配:'+key,lambda g=g:authority(g,current,S.SELECTION,'metadata'),'publication_source_identity')
            for key,value in [('method','controller.getDeviceState'),('access','write'),('purpose','state'),('slot','/content')]:
                g=copy.deepcopy(f);g['context'][key]=value
                denied('发布用途边界:'+key,lambda g=g:authority(g,current,S.SELECTION,'metadata'),'publication_usage')
            g=copy.deepcopy(f);g['context']['source_ref']['content_digest']='0'*64;z=authority(g,current,S.SELECTION,'metadata')
            denied('摘要绑定实际存储整份原件',lambda:z.prepare(db,g['context']),'publication_source_digest')
            changed=copy.deepcopy(current);changed['published']['published_by']='other'
            z=authority(f,changed,S.SELECTION,'metadata')
            denied('完整PublishedVersion不匹配',lambda:z.prepare(db,f['context']),'published_binding')
            missing=copy.deepcopy(current);missing['published']['definition_version']='99';g=fixture(missing,'metadata');z=authority(g,missing,S.SELECTION,'metadata')
            denied('缺版本不回退最新',lambda:z.prepare(db,g['context']),'source_unavailable')
            g=fixture(current,'metadata',{'type':'string'});z=authority(g,current,S.SELECTION,'metadata')
            denied('存储值仍须通过当前批准Schema',lambda:z.prepare(db,g['context']),'instance_invalid')
            g=copy.deepcopy(f);g['paths'].remove('/layout/position/x');z=authority(g,current,S.SELECTION,'metadata')
            denied('隐藏布局叶节点不能裁剪绕过',lambda:z.prepare(db,g['context']),'field_denied')
            g=copy.deepcopy(f);snapshot=copy.deepcopy(g['context']);r=copy.deepcopy(current);sel=copy.deepcopy(S.SELECTION);z=authority(g,r,sel,'metadata')
            g['qualified']['value']['name']='宿主后改值';g['documents'].clear();r['published']['published_by']='other';sel.clear()
            check('宿主后改输入不替换存储原件或批准配置',z.consume(snapshot,z.prepare(db,snapshot))==f['qualified'])
            changed_context=copy.deepcopy(snapshot);changed_context['source_ref']['entity_epoch']='epoch.2'
            denied('消费前来源生命周期变化拒绝',lambda:z.consume(changed_context,z.prepare(db,snapshot)),'authority_stale')
            p=copy.deepcopy(current['published']);p['definition_version']='5';p['artifact_ref']['object_id']='artifact.rollback'
            pending=S.freeze(p,current['source'],S.SELECTION);g=fixture(pending,'metadata');z=authority(g,pending,S.SELECTION,'metadata')
            db.execute('BEGIN IMMEDIATE');S.append(db,pending)
            denied('同连接未提交原件不能生成候选',lambda:z.prepare(db,g['context']),'publication_transaction')
            check('拒绝不提交调用方事务',db.in_transaction);db.rollback()
            denied('回滚后原件缺失不能回退',lambda:z.prepare(db,g['context']),'source_unavailable')
            # 在实际worker返回前撤权，模拟来源读取之后发生的批准失效。
            z=authority(f,current,S.SELECTION,'metadata')
            def revoke_after_validation(*args):counted(*args);z.revoke()
            P.instance=revoke_after_validation
            try:denied('原件校验完成后撤权不能生成候选',lambda:z.prepare(db,f['context']),'authority_stale')
            finally:P.instance=counted
            check('全部读取与拒绝保持当前历史BLOB字节',db.execute('SELECT body FROM publication_source ORDER BY version').fetchall()==before)
            check('混合记录数据库完整性',db.execute('PRAGMA integrity_check').fetchone()[0]=='ok')
        finally:db.close()
    finally:P.instance=original
    return dict(all_passed=True,cases_passed=len(checks),checks=checks,validator_subprocess_calls=calls,legacy_validator_subprocess_calls=1,
                sqlite_disk_scenarios=1,journal_mode='WAL',legacy_store_processes=1,revocation_after_source_read_scenarios=1,
                production_authority_tests_executed=0,production_database_migrated=False)
