"""独占owner与持久拒绝库存检查，含自建合成子进程强制退出。"""
import argparse
import copy
from dataclasses import replace
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys
import time
import uuid
sys.path.insert(0,str(Path(__file__).resolve().parent))
import owner as O
import fixtures as F

AUTHORITY=dict(authority_service_id='controller',database_instance_id='database',authority_role='controller')


def inputs():
    files=[p for p in O.ROOT.iterdir() if p.is_file() and p.name!='report.json']
    files += [O.G.SDK/p for p in O.S.G.load(O.ROOT/'sources.json')['inputs']]
    return {p.relative_to(O.G.SDK).as_posix():O.G.checksum(p.read_bytes()) for p in sorted(set(files))}


def snapshot(db):
    return {t:[tuple(r) for r in db.execute('SELECT * FROM '+t+' ORDER BY 1')] for t in O.S.TABLES+O.TABLES}


def setup(path,locks):
    f=F.fixture();db=O.S.connect(path,journal='WAL',authority=AUTHORITY);store=O.S.Store(db,AUTHORITY)
    try:
        store.install('profile',f['profile'],O.R.reference(f['profile']))
        for i,s in enumerate(f['selectors']):store.install('selector_'+str(i),s,O.R.reference(s))
        O.initialize_layout(db,locks)
    finally:db.close()
    return f


def binding(owner,transport='transport'):
    return dict(owner_epoch=owner.epoch,subscription_id='subscription',connection_generation='1',transport_id=transport,credential_binding='credential')


def open_channel(owner,f,transport='transport'):
    ctx=dict(f['ctx'],content_authorized=True,transport_credential_binding='credential')
    return owner.open(f['scope'],f['purpose'],f['grant'],ctx,binding(owner,transport))


def command(database,locks,epoch,mode,ready=None):
    args=[sys.executable,'-I','-B',str(O.ROOT/'worker.py'),'--database',str(database),'--locks',str(locks),'--epoch',epoch,'--mode',mode]
    if ready is not None:args += ['--ready',str(ready)]
    return args


def run(work):
    work.mkdir(parents=True,exist_ok=False);checks=[]
    def check(name,value,expected=True):
        assert value==expected,(name,value,expected);checks.append(dict(name=name,passed=True))
    def denied(name,fn,reason):
        try:fn()
        except ValueError as error:check(name,str(error),reason)
        else:raise AssertionError(name+':应拒绝')
    dbpath=work/'base.sqlite';locks=work/'locks';f=setup(dbpath,locks)
    owner=O.Owner(dbpath,locks,AUTHORITY,'first',lambda:0)
    try:
        handle=open_channel(owner,f);check('正常启动可取得新句柄',owner.gate.state(handle)['closed'],None)
        check('锁句柄不继承',os.get_inheritable(owner.lock.file.fileno()),False)
        denied('同进程同authority竞争',lambda:O.Owner(dbpath,locks,AUTHORITY,'competing',lambda:0),'owner_busy')
        result=subprocess.run(command(dbpath,locks,'other_process','probe'),check=True,capture_output=True,text=True,encoding='utf8',timeout=10)
        check('实际第二进程拒绝',json.loads(result.stdout),dict(status='rejected',reason='owner_busy'))
        denied('更换锁根不能逃避已绑定配置',lambda:O.Owner(dbpath,work/'wrong_locks',AUTHORITY,'wrong_root',lambda:0),'lock_configuration')
    finally:owner.close()
    owner=O.Owner(dbpath,locks,AUTHORITY,'clean_restart',lambda:0)
    try:
        check('正常停止不触发全量恢复',owner.recovered_owners,[])
        check('正常停止后旧注册仍可重新授权',owner.gate.state(open_channel(owner,f))['closed'],None)
    finally:owner.close()
    denied('owner epoch不复用',lambda:O.Owner(dbpath,locks,AUTHORITY,'first',lambda:0),'owner_epoch_reused')
    long_root=work/('long_'+120*'x');long_db=work/'long.sqlite';long_fixture=setup(long_db,long_root)
    owner=O.Owner(long_db,long_root,AUTHORITY,'long_owner',lambda:0)
    try:
        check('长锁路径覆盖260字符边界',len(str(long_root.resolve()/(O.R.digest(AUTHORITY)+'.lock')))>260)
        check('长路径正常开门',owner.gate.state(open_channel(owner,long_fixture))['closed'],None)
        denied('长路径锁仍拒绝第二owner',lambda:O.Owner(long_db,long_root,AUTHORITY,'long_competing',lambda:0),'owner_busy')
    finally:owner.close()
    owner=O.Owner(dbpath,locks,AUTHORITY,'intent_owner',lambda:0);ref=O.R.reference(f['profile'])
    try:
        handle=open_channel(owner,f);owner.gate.enqueue(handle,b'pending')
        try:owner.revoke('persisted_intent',ref,fail_after=1)
        except O.S.InjectedFailure:check('原注册写集故障实际发生',True)
        else:raise AssertionError('expected storage failure')
        check('意图已提交但原撤销未提交',owner.store.object(ref)['revoked'],False)
        check('持久意图存在',owner.db.execute("SELECT count(*) FROM rg_deny WHERE kind='revoke'").fetchone()[0],1)
        check('写集失败本机旧队列清空',owner.gate.state(handle)['queued'],0)
    finally:owner.close()
    owner=O.Owner(dbpath,locks,AUTHORITY,'intent_restart',lambda:0)
    try:
        check('持久意图允许正常停机记录',owner.recovered_owners,[])
        denied('重启后原Ref仍被拒绝',lambda:open_channel(owner,f),'reference_blocked')
        receipts=owner.reconcile();check('按原操作补交撤销',receipts[0]['operation_id'],'persisted_intent')
        before=snapshot(owner.db);check('再次查原返回同回执',owner.reconcile(),receipts)
        check('查原不增写集',snapshot(owner.db),before)
        check('补交后原撤销已持久',owner.store.object(ref)['revoked'],True)
        before=snapshot(owner.db)
        check('原撤销重投返回原回执',owner.revoke('persisted_intent',ref)['storage_receipt'],receipts[0])
        check('原撤销重投不增加账本',snapshot(owner.db),before)
    finally:owner.close()
    # 同操作ID不能改指另一对象；冲突不能覆盖原持久拒绝记录。
    owner=O.Owner(dbpath,locks,AUTHORITY,'conflicting_owner',lambda:0)
    try:
        before=snapshot(owner.db)
        denied('持久操作身份冲突拒绝',lambda:owner.revoke('persisted_intent',O.R.reference(f['selectors'][0])),'denial_conflict')
        check('冲突保留原库',snapshot(owner.db),before)
        check('冲突停止当前owner',owner.gate._stopped,True)
    finally:owner.close()
    # 意图回滚和提交观察丢失均不能写正常停止记录；下次启动覆盖全部旧注册。
    for mode in ('fail_before_intent','lose_intent_observation'):
        path=work/(mode+'.sqlite');folder=work/(mode+'_locks');fixture=setup(path,folder)
        prior=O.Owner(path,folder,AUTHORITY,'clean_history',lambda:0);prior.close()
        owner=O.Owner(path,folder,AUTHORITY,'uncertain_owner',lambda:0)
        try:
            handle=open_channel(owner,fixture)
            try:owner.revoke('uncertain_revoke',O.R.reference(fixture['profile']),**{mode:True})
            except (RuntimeError,O.IntentObservationLost):check(mode+'实际异常',True)
            else:raise AssertionError(mode)
            check(mode+'owner整体关闭',owner.gate.state(handle)['owner_stopped'],True)
        finally:owner.close()
        db=O.S.connect(path,journal='WAL',initialize=False)
        try:before=snapshot(db)
        finally:db.close()
        denied(mode+'漏恢复对象不能启动',lambda:O.Owner(path,folder,AUTHORITY,'incomplete_recovery',lambda:0,skip_recovery_item=True),'recovery_denial_missing')
        db=O.S.connect(path,journal='WAL',initialize=False)
        try:check(mode+'漏写启动全库回滚',snapshot(db),before)
        finally:db.close()
        owner=O.Owner(path,folder,AUTHORITY,'recovered',lambda:0)
        try:
            check(mode+'识别未正常关闭owner',owner.recovered_owners,['uncertain_owner'])
            check(mode+'全旧对象持久阻断',owner.db.execute("SELECT count(*) FROM rg_deny WHERE kind='recovery'").fetchone()[0],3)
            denied(mode+'不复活原scope',lambda:open_channel(owner,fixture),'reference_blocked')
            check(mode+'原注册仍保留历史',owner.store.object(O.R.reference(fixture['profile']))['revoked'],False)
            for table in O.TABLES:
                check(mode+table+'有被测行',owner.db.execute('SELECT count(*) FROM '+table).fetchone()[0]>0)
                field=owner.db.execute('PRAGMA table_info('+table+')').fetchone()['name']
                for action,sql in [('update','UPDATE '+table+' SET '+field+'='+field),('delete','DELETE FROM '+table),('replace','INSERT OR REPLACE INTO '+table+' SELECT * FROM '+table)]:
                    old=snapshot(owner.db)
                    try:owner.db.execute(sql)
                    except sqlite3.IntegrityError:check(mode+table+action+'拒绝',True)
                    else:raise AssertionError(table+action)
                    check(mode+table+action+'保持全库',snapshot(owner.db),old)
        finally:owner.close()
    # 两个自建合成进程：分别在活跃owner与意图已提交/原撤销未提交点强制结束。
    for mode in ('idle','pending'):
        path=work/(mode+'.sqlite');folder=work/(mode+'_locks');fixture=setup(path,folder);ready=work/(mode+'.ready')
        p=subprocess.Popen(command(path,folder,'killed_'+mode,mode,ready),stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
        try:
            deadline=time.monotonic()+10
            while not ready.exists() and p.poll() is None and time.monotonic()<deadline:time.sleep(0.02)
            assert ready.exists() and p.poll() is None,(mode,'child not ready',p.poll())
            check(mode+'确认真实活进程',p.poll(),None)
            result=subprocess.run(command(path,folder,'probe_live','probe'),check=True,capture_output=True,text=True,encoding='utf8',timeout=10)
            check(mode+'强杀前不能接替',json.loads(result.stdout)['reason'],'owner_busy')
            p.kill();p.wait(timeout=10);check(mode+'强杀已终结',p.returncode is not None)
            owner=O.Owner(path,folder,AUTHORITY,'after_kill',lambda:0)
            try:
                check(mode+'锁释放且恢复旧owner',owner.recovered_owners,['killed_'+mode])
                denied(mode+'旧scope不自动复活',lambda:open_channel(owner,fixture),'reference_blocked')
                check(mode+'原撤销尚未提交',owner.store.object(O.R.reference(fixture['profile']))['revoked'],False)
                if mode=='pending':
                    check('强杀后查原保持原操作身份',owner.reconcile()[0]['operation_id'],'child_pending_revoke')
                    check('强杀后补交原撤销',owner.store.object(O.R.reference(fixture['profile']))['revoked'],True)
                else:
                    fresh=copy.deepcopy(fixture);fresh['profile']['revision']='2';profile_ref=O.R.reference(fresh['profile'])
                    owner.store.install('fresh_profile',fresh['profile'],profile_ref)
                    for i,selector in enumerate(fresh['selectors']):
                        selector['revision']='2';selector['profile_ref']=profile_ref
                        owner.store.install('fresh_selector_'+str(i),selector,O.R.reference(selector))
                    fresh['scope']['projection_profile_ref']=profile_ref
                    for collection,selector in zip(fresh['scope']['collections'],fresh['selectors']):collection['selector_ref']=O.R.reference(selector)
                    fresh['grant']=replace(fresh['grant'],profile_ref=profile_ref,selector_refs=tuple(O.R.reference(s) for s in fresh['selectors']))
                    check('独立新批准身份可建立新连接',owner.gate.state(open_channel(owner,fresh,'fresh_transport'))['closed'],None)
                check(mode+'恢复库外键完整',owner.db.execute('PRAGMA foreign_key_check').fetchall(),[])
            finally:owner.close()
        finally:
            if p.poll() is None:p.kill();p.wait(timeout=10)
            for stream in (p.stdin,p.stdout,p.stderr):stream.close()
    return dict(format='scope-recovery-check/1',all_passed=True,approved=False,runtime_ready=False,cases_passed=len(checks),checks=checks,
        journal_tables=len(O.TABLES),sqlite_file_scenarios=6,subprocess_kill_scenarios=2,exclusive_owner_platform=os.name,
        product_runtime_tests_executed=0,authentication_tests_executed=0,http_ws_tls_tests_executed=0,browser_tests_executed=0,
        device_tests_executed=0,power_loss_tests_executed=0,linux_tests_executed=int(os.name!='nt'),
        scope='单机固定锁根下的合成owner/SQLite/子进程强杀；不是跨机器唯一出口、产品传输或断电验收',inputs=inputs())


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);g=p.add_mutually_exclusive_group();g.add_argument('--report',action='store_true');g.add_argument('--check-report',action='store_true');p.add_argument('--work',type=Path)
    a=p.parse_args()
    if a.check_report:
        if a.work:p.error('--check-report不创建测试目录')
        r=O.S.G.load(O.ROOT/'report.json');assert r['all_passed'] and r['inputs']==inputs();print(json.dumps(dict(all_passed=True,bindings=len(r['inputs']))))
    else:
        r=run(a.work or O.G.SDK/'logs/scope-recovery-tests'/uuid.uuid4().hex)
        if a.report:(O.ROOT/'report.json').write_bytes(O.S.G.C.encode(r))
        print(json.dumps({k:v for k,v in r.items() if k not in ('checks','inputs')},ensure_ascii=False))
