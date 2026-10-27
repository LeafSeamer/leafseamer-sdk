"""真实SQLite写集、漏写回滚、查原和双连接顺序验收；不操作真实服务。"""
import argparse
import copy
import json
from pathlib import Path
import platform
import sqlite3
import sys
import uuid
sys.path.insert(0, str(Path(__file__).resolve().parent))
import storage as S
import fixtures as F

AUTHORITY = dict(authority_service_id='controller',database_instance_id='database',authority_role='controller')


def snapshot(db):
    return {table:[tuple(row) for row in db.execute('SELECT * FROM '+table+' ORDER BY 1')] for table in S.TABLES}


def populate(store, fixture, selectors=True):
    store.install('install_profile',fixture['profile'],S.R.reference(fixture['profile']))
    if selectors:
        for i,body in enumerate(fixture['selectors']):store.install('install_selector_'+str(i),body,S.R.reference(body))


def inputs():
    files=[p for p in S.ROOT.iterdir() if p.is_file() and p.name!='report.json']
    files += [S.SDK/p for p in S.G.load(S.ROOT/'sources.json')['inputs']]
    return {p.relative_to(S.SDK).as_posix():S.G.C.sha(p.read_bytes()) for p in sorted(set(files))}


def run(work):
    checks=[];errors=[];file_scenarios=0
    def check(name,actual,expected=True):
        assert actual==expected,(name,actual,expected);checks.append(dict(name=name,passed=True))
    def denied(name,fn,kind=ValueError,reason=None,sqlite_name=None):
        try:fn()
        except kind as error:
            if reason is not None:assert str(error)==reason,(name,str(error),reason)
            if sqlite_name is not None:assert error.sqlite_errorname==sqlite_name,(name,error.sqlite_errorname)
            if isinstance(error,sqlite3.Error):errors.append(dict(case=name,sqlite_errorname=error.sqlite_errorname))
            check(name,True)
        else:raise AssertionError(name+':应拒绝')
    work.mkdir(parents=True,exist_ok=False)
    f=F.fixture();p=f['profile'];pr=S.R.reference(p)
    def memory():
        db=S.connect(authority=AUTHORITY);return db,S.Store(db,AUTHORITY)
    db,store=memory()
    try:
        receipt=store.install('install_profile',p,pr)
        check('实际七表',set(r[0] for r in db.execute("SELECT name FROM sqlite_schema WHERE type='table'")),set(S.TABLES))
        check('安装五步',store.last_steps,['sr_object','sr_operation','sr_audit','sr_outbox','sr_seal'])
        before=snapshot(db);check('同操作查原',store.install('install_profile',p,pr),receipt)
        check('查原不增加任何行',snapshot(db),before)
        altered=copy.deepcopy(p);altered['maximum_records']+=1
        denied('同操作不同正文',lambda:store.install('install_profile',altered,S.R.reference(altered)),reason='operation_conflict')
        denied('新操作不覆盖同身份',lambda:store.install('new_install',p,pr),reason='identity_exists')
        denied('错误本地批准Ref',lambda:store.install('wrong_ref',altered,pr),reason='unapproved_body')
        check('拒绝后原件保持',snapshot(db),before)
        for i,body in enumerate(f['selectors']):store.install('install_selector_'+str(i),body,S.R.reference(body))
        _,plan=store.authorize_at_writer(f['scope'],f['purpose'],f['grant'],f['ctx'])
        check('持久原件接入实际订阅授权',plan,f['store'].resolve(f['scope'],f['purpose'],f['grant']))
        rev=store.revoke('revoke_profile',pr);check('撤销五步',store.last_steps,['sr_revocation','sr_operation','sr_audit','sr_outbox','sr_seal'])
        before=snapshot(db);check('同撤销操作幂等',store.revoke('revoke_profile',pr),rev)
        check('撤销查原不增行',snapshot(db),before)
        denied('新操作不能再次覆盖撤销',lambda:store.revoke('other_revoke',pr),reason='already_revoked')
        check('旧安装回执仍可查',store.install('install_profile',p,pr),receipt)
        check('旧回执不复活对象',store.object(pr)['revoked'],True)
        check('历史正文保留',store.object(pr)['body'],p)
        denied('撤profile拒当前授权',lambda:store.authorize_at_writer(f['scope'],f['purpose'],f['grant'],f['ctx'],plan),reason='profile_revoked')
        selector=copy.deepcopy(f['selectors'][0]);selector['entity_id']='new_selector'
        denied('撤profile后不能安装子项',lambda:store.install('late_selector',selector,S.R.reference(selector)),reason='profile_revoked')
        for table in S.TABLES:
            column=db.execute('PRAGMA table_info('+table+')').fetchone()['name']
            for action,sql in [('更新','UPDATE '+table+' SET '+column+'='+column),('删除','DELETE FROM '+table)]:
                before=snapshot(db)
                denied(table+action+'拒绝',lambda sql=sql:db.execute(sql),sqlite3.IntegrityError)
                check(table+action+'保持全库',snapshot(db),before)
            before=snapshot(db)
            denied(table+'替换拒绝',lambda table=table:db.execute('INSERT OR REPLACE INTO '+table+' SELECT * FROM '+table),sqlite3.IntegrityError)
            check(table+'替换保持全库',snapshot(db),before)
        check('全部外键闭合',db.execute('PRAGMA foreign_key_check').fetchall(),[])
        broken=dict(db.execute("SELECT * FROM sr_object WHERE kind='selector' LIMIT 1").fetchone())
        broken.update(object_key='null_parent_kind',install_operation='null_parent_operation',profile_kind=None)
        before=snapshot(db)
        denied('selector父类型不能以NULL绕过',lambda:db.execute('INSERT INTO sr_object('+','.join(broken)+') VALUES('+','.join('?' for _ in broken)+')',tuple(broken.values())),
               sqlite3.IntegrityError,sqlite_name='SQLITE_CONSTRAINT_CHECK')
        check('NULL父类型拒绝保持全库',snapshot(db),before)
        db.execute('PRAGMA recursive_triggers=OFF')
        denied('关闭递归触发器的连接拒绝',lambda:S.Store(db,AUTHORITY),reason='connection_not_ready')
    finally:db.close()
    # 每类写集独立故障，实际COMMIT拒绝遗漏，不调用foreign_key_check替代提交。
    for operation in ('profile','selector','revoke_profile','revoke_selector'):
        for fault in ('fail_after','skip_step'):
            for step in range(1,6):
                db,store=memory()
                try:
                    if operation!='profile':populate(store,f,selectors=operation=='revoke_selector')
                    if operation=='profile':call=lambda **kw:store.install('fault_profile',p,pr,**kw)
                    elif operation=='selector':call=lambda **kw:store.install('fault_selector',f['selectors'][0],S.R.reference(f['selectors'][0]),**kw)
                    else:
                        target=pr if operation=='revoke_profile' else S.R.reference(f['selectors'][0])
                        call=lambda **kw:store.revoke('fault_revoke',target,**kw)
                    before=snapshot(db);label=operation+'/'+fault+'/'+str(step)
                    denied(label,lambda:call(**{fault:step}),S.InjectedFailure if fault=='fail_after' else sqlite3.IntegrityError,
                           sqlite_name='SQLITE_CONSTRAINT_FOREIGNKEY' if fault=='skip_step' else None)
                    check(label+'全库回滚',snapshot(db),before);check(label+'事务退出',db.in_transaction,False)
                finally:db.close()
    db,store=memory()
    try:
        populate(store,f)
        sr=S.R.reference(f['selectors'][0]);store.revoke('revoke_selector',sr)
        denied('撤单selector拒当前授权',lambda:store.authorize_at_writer(f['scope'],f['purpose'],f['grant'],f['ctx']),reason='selector_revoked')
        check('撤selector不改profile',store.object(pr)['revoked'],False)
        wrong=dict(AUTHORITY,database_instance_id='foreign_database')
        denied('错误启动库身份',lambda:S.Store(db,wrong),reason='database_authority')
        foreign=copy.deepcopy(p);foreign['authority_service_id']='other'
        denied('外来权威注册',lambda:store.install('foreign_install',foreign,S.R.reference(foreign)),reason='object_authority')
        denied('外来权威读取',lambda:store.object(S.R.reference(foreign)),reason='object_authority')
        role=copy.deepcopy(p);role['authority_role']='seamer';role['entity_id']='wrong_role'
        denied('库角色不可替换',lambda:store.install('wrong_role',role,S.R.reference(role)),reason='profile_role')
        denied('重复键存储正文',lambda:S.decode('{"x":1,"x":2}'))
        denied('非规范存储正文',lambda:S.decode('{"x": 1}'),reason='noncanonical_storage')
        db.execute('BEGIN')
        denied('不沿用调用方事务',lambda:store.revoke('nested',pr),reason='nested_transaction')
        check('拒嵌套不结束调用方事务',db.in_transaction,True);db.rollback()
    finally:db.close()
    # 两种真实磁盘日志模式：响应观察丢失、关闭重开、双连接锁与不可见提交。
    for mode in ('DELETE','WAL'):
        file_scenarios+=1;path=work/(mode.lower()+'.sqlite')
        db=S.connect(path,journal=mode,authority=AUTHORITY);store=S.Store(db,AUTHORITY)
        peer_db=S.connect(path,journal=mode,initialize=False);peer=S.Store(peer_db,AUTHORITY)
        try:
            denied(mode+'安装提交后观察丢失',lambda:store.install('lost_install',p,pr,lose_observation=True),S.CommitObservationLost)
            check(mode+'观察丢失不是回滚',peer.lookup('lost_install')['status'],'committed')
            before=snapshot(peer_db);store.install('lost_install',p,pr)
            check(mode+'原操作查原不重写',snapshot(peer_db),before)
            # 在第一连接真实持写锁期间，以第二连接尝试写与查原。
            observed=[]
            def concurrent(index):
                if index!=5:return
                observed.append(peer.lookup('pending_selector'))
                denied(mode+'第二writer被锁',lambda:peer.install('contending',f['selectors'][0],S.R.reference(f['selectors'][0])),
                       sqlite3.OperationalError,sqlite_name='SQLITE_BUSY')
            store.install('pending_selector',f['selectors'][0],S.R.reference(f['selectors'][0]),after_step=concurrent)
            check(mode+'提交前查无不能判回滚',observed,[None])
            check(mode+'提交后查原出现',peer.lookup('pending_selector')['status'],'committed')
            denied(mode+'并发后不同操作不重复安装',lambda:peer.install('contending',f['selectors'][0],S.R.reference(f['selectors'][0])),reason='identity_exists')
            store.install('source_selector',f['selectors'][1],S.R.reference(f['selectors'][1]))
            _,plan=store.authorize_at_writer(f['scope'],f['purpose'],f['grant'],f['ctx'])
            denied(mode+'撤销提交后观察丢失',lambda:peer.revoke('lost_revoke',pr,lose_observation=True),S.CommitObservationLost)
            check(mode+'已提交撤销可查',store.lookup('lost_revoke')['status'],'committed')
            denied(mode+'新writer重读拒旧plan',lambda:store.authorize_at_writer(f['scope'],f['purpose'],f['grant'],f['ctx'],plan),reason='profile_revoked')
            check(mode+'两连接外键一致',peer_db.execute('PRAGMA foreign_key_check').fetchall(),[])
        finally:peer_db.close();db.close()
        reopened=S.connect(path,journal=mode,initialize=False)
        try:
            recovered=S.Store(reopened,AUTHORITY)
            check(mode+'关闭重开保留撤销',recovered.object(pr)['revoked'],True)
            check(mode+'重开保留原回执',recovered.lookup('lost_install')['status'],'committed')
            denied(mode+'重开不复活选择器',lambda:recovered.authorize_at_writer(f['scope'],f['purpose'],f['grant'],f['ctx']),reason='profile_revoked')
        finally:reopened.close()
    # WAL旧读快照仍可见旧注册：实际反例用于约束最终释放，不能把读取点当持续资格。
    path=work/'stale.sqlite';db=S.connect(path,journal='WAL',authority=AUTHORITY);store=S.Store(db,AUTHORITY)
    peer_db=S.connect(path,journal='WAL',initialize=False);peer=S.Store(peer_db,AUTHORITY)
    try:
        populate(store,f);db.execute('BEGIN')
        old=store.current_registry(f['scope']).resolve(f['scope'],f['purpose'],f['grant'])
        peer.revoke('concurrent_revocation',pr)
        check('WAL旧读仍见旧资格的反例',store.current_registry(f['scope']).resolve(f['scope'],f['purpose'],f['grant']),old)
        denied('公共writer不继承旧read',lambda:store.authorize_at_writer(f['scope'],f['purpose'],f['grant'],f['ctx'],old),reason='nested_transaction')
        denied('旧read升级writer拒绝',lambda:db.execute('INSERT INTO sr_seal VALUES(?,?)',('stale_write','0'*64)),
               sqlite3.OperationalError,sqlite_name='SQLITE_BUSY_SNAPSHOT')
        db.rollback()
        denied('退出旧read后新writer拒撤销',lambda:store.authorize_at_writer(f['scope'],f['purpose'],f['grant'],f['ctx'],old),reason='profile_revoked')
    finally:peer_db.close();db.close()
    return dict(format='scope-storage-check/1',all_passed=True,approved=False,runtime_ready=False,
        cases_passed=len(checks),checks=checks,tables=len(S.TABLES),sqlite_version=sqlite3.sqlite_version,python_version=platform.python_version(),
        sqlite_file_scenarios=file_scenarios+1,sqlite_errors=errors,per_write_failure_paths=40,
        runtime_tests_executed=0,authentication_tests_executed=0,browser_tests_executed=0,device_tests_executed=0,
        process_crash_tests_executed=0,power_loss_tests_executed=0,final_release_gate_implemented=False,
        scope='内存与临时磁盘SQLite及双连接顺序；不是完整生产库、身份来源或网络释放验收',inputs=inputs())


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--work',type=Path)
    group=parser.add_mutually_exclusive_group();group.add_argument('--report',action='store_true');group.add_argument('--check-report',action='store_true')
    args=parser.parse_args()
    if args.check_report:
        if args.work:parser.error('--check-report不创建数据库')
        r=S.G.load(S.ROOT/'report.json');assert r['all_passed'] and r['inputs']==inputs()
        print(json.dumps(dict(all_passed=True,bindings=len(r['inputs']))))
    else:
        work=args.work or S.SDK/'logs'/'scope-storage-tests'/uuid.uuid4().hex
        r=run(work.resolve())
        if args.report:(S.ROOT/'report.json').write_bytes(S.G.C.encode(r))
        print(json.dumps({k:v for k,v in r.items() if k not in ('checks','inputs','sqlite_errors')},ensure_ascii=False))
