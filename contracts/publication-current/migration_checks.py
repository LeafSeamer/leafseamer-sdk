"""两种磁盘日志模式下保留旧原件并阻断旧writer，全部使用隔离测试库。"""
import copy
import importlib.util
import json
from pathlib import Path
import sqlite3
import subprocess
import sys
import uuid
from jsonschema.exceptions import ValidationError
import build as B
import store as S

def run():
    checks=[]
    def check(name,value):B.require(value,name);checks.append(dict(name=name,passed=True))
    def denied(name,fn):
        try:fn()
        except (ValueError,ValidationError,sqlite3.DatabaseError):check(name,True)
        else:raise AssertionError(name+':未拒绝')
    check('领域29定义保留',S.SCHEMA['$defs']==S.LEGACY_SCHEMA['$defs'])
    check('新旧完整选择不同',S.SELECTION!=S.LEGACY_SELECTION and S.SELECTION['contract_id']=='leafseamer.api.v1.panel4')
    original=sys.modules.get('build')
    try:
        sys.modules['build']=object()
        spec=importlib.util.spec_from_file_location('isolated_current_store',B.ROOT/'store.py');isolated=importlib.util.module_from_spec(spec);spec.loader.exec_module(isolated)
        check('宿主同名模块不污染绑定',isolated.SELECTION==S.SELECTION and isolated.ROOT==B.ROOT)
    finally:
        if original is None:sys.modules.pop('build',None)
        else:sys.modules['build']=original
    directory=B.SDK/'logs/publication-current'/('upgrade-'+uuid.uuid4().hex);directory.mkdir(parents=True)
    for mode in ['DELETE','WAL']:
        path=directory/(mode+'.sqlite');proc=subprocess.Popen([sys.executable,'-I','-B',str(B.ROOT/'legacy_probe.py'),str(path),mode],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,encoding='utf8')
        db=None;observer=sqlite3.connect(path,isolation_level=None,timeout=0)
        def request(action,**kwargs):
            proc.stdin.write(json.dumps(dict(action=action,**kwargs))+'\n');proc.stdin.flush()
            line=proc.stdout.readline();B.require(bool(line),'legacy_probe_exited');return json.loads(line)
        try:
            ready=json.loads(proc.stdout.readline());check(mode+':旧进程就绪',ready['ready']);old=ready['record']
            before=observer.execute('SELECT body FROM publication_source').fetchone()[0];layout=S._layout(observer)
            denied(mode+':未显式批准升级不得接管',lambda:S.connect(path))
            check(mode+':默认拒绝不改布局',S._layout(observer)==layout)
            check(mode+':旧writer持锁',request('begin_write')['ok'])
            denied(mode+':writer未退出升级失败',lambda:S.connect(path,upgrade=True))
            check(mode+':锁冲突无半迁移',S._layout(observer)==layout)
            check(mode+':旧writer释放',request('rollback')['ok'])
            check(mode+':旧reader固定快照',request('begin_read')['value']==1)
            if mode=='DELETE':
                denied(mode+':旧reader阻止DDL提交',lambda:S.connect(path,upgrade=True))
                check(mode+':DDL提交失败原布局保持',S._layout(observer)==layout)
                check(mode+':旧reader释放',request('rollback')['ok'])
            db=S.connect(path,upgrade=True)
            check(mode+':升级不重写BLOB',observer.execute('SELECT body FROM publication_source').fetchone()[0]==before)
            check(mode+':新门控唯一追加',len(S._layout(db))==len(layout)+1)
            if mode=='WAL':
                result=request('append');check(mode+':旧读快照不得升级写',not result['ok'] and result['code']=='SQLITE_BUSY_SNAPSHOT')
                check(mode+':旧读快照释放',request('rollback')['ok'])
            result=request('append');check(mode+':存活旧writer缺当前门控拒绝',not result['ok'] and result['error']=='OperationalError')
            check(mode+':旧连接仍可读原件',request('read')['value']==old)
            check(mode+':显式历史读取保持原选择',S.read_history(db,old['published'],S.LEGACY_SELECTION)==old)
            denied(mode+':旧记录不能从当前入口读取',lambda:S.read_current(db,old['published'],S.SELECTION))
            denied(mode+':历史入口拒当前选择',lambda:S.read_history(db,old['published'],S.SELECTION))
            denied(mode+':当前入口拒混合选择',lambda:S.read_current(db,old['published'],{**S.SELECTION,'contract_digest':S.LEGACY_SELECTION['contract_digest']}))
            denied(mode+':freeze不接受旧选择',lambda:S.freeze(old['published'],old['source'],S.LEGACY_SELECTION))
            db.execute('BEGIN IMMEDIATE')
            denied(mode+':当前API拒追加旧封装',lambda:S.append(db,old))
            converted=S.freeze(old['published'],old['source'],S.SELECTION)
            denied(mode+':重标重摘要不能覆盖同发布版本',lambda:S.append(db,converted))
            late=copy.deepcopy(old);late['published']['definition_version']='8';late['published']['artifact_ref']['object_id']='old.direct'
            late['record_digest']=S.digest({k:v for k,v in late.items() if k!='record_digest'})
            denied(mode+':直接SQL旧新版本也拒绝',lambda:db.execute('INSERT INTO publication_source VALUES(?,?,?,?,?,?,?,?,?)',S.columns(late)))
            db.execute('ROLLBACK')
            published=copy.deepcopy(old['published']);published['definition_version']='4';published['artifact_ref']['object_id']='current.artifact'
            source=copy.deepcopy(old['source']);source['metadata_revision']='12';source['metadata']['name']='当前发布的元数据'
            current=S.freeze(published,source,S.SELECTION)
            db.execute('BEGIN IMMEDIATE');S.append(db,current);db.execute('ROLLBACK')
            denied(mode+':回滚当前记录不可读',lambda:S.read_current(db,published,S.SELECTION))
            db.execute('BEGIN IMMEDIATE');S.append(db,current);db.execute('COMMIT')
            check(mode+':新旧同库两条记录',db.execute('SELECT count(*) FROM publication_source').fetchone()[0]==2)
            check(mode+':当前精确读取',S.read_current(db,published,S.SELECTION)==current)
            check(mode+':当前写后历史字节不变',db.execute('SELECT body FROM publication_source WHERE version=?',('3',)).fetchone()[0]==before)
            denied(mode+':当前记录不能由历史入口读取',lambda:S.read_history(db,published,S.LEGACY_SELECTION))
            result=request('read',expected=published);check(mode+':旧reader拒当前记录',not result['ok'] and result['error']=='ValidationError')
            check(mode+':旧reader仍读旧记录',request('read')['value']==old)
            check(mode+':混合历史完整性检查',db.execute('PRAGMA integrity_check').fetchall()==[('ok',)])
            db.close();db=S.connect(path)
            check(mode+':重开无需重复升级',S.read_history(db,old['published'],S.LEGACY_SELECTION)==old and S.read_current(db,published,S.SELECTION)==current)
            snapshot=S._layout(db);db.close();db=S.connect(path,upgrade=True);check(mode+':重复升级无DDL漂移',S._layout(db)==snapshot)
            db.execute('DROP TRIGGER publication_source_no_delete');damaged=S._layout(db);db.close();db=None
            denied(mode+':损坏布局不可自动修复',lambda:S.connect(path,upgrade=True))
            check(mode+':失败不补写损坏布局',S._layout(observer)==damaged)
        finally:
            if db is not None:db.close()
            observer.close()
            if proc.poll() is None:
                proc.stdin.write('{"action":"quit"}\n');proc.stdin.flush()
                try:proc.wait(timeout=10)
                except subprocess.TimeoutExpired:proc.kill();proc.wait()
            check(mode+':旧进程正常关闭',proc.returncode==0)
            proc.stdin.close();proc.stdout.close();proc.stderr.close()
    return dict(all_passed=True,cases_passed=len(checks),checks=checks,sqlite_file_modes_tested=['DELETE','WAL'],live_legacy_processes=2,
                historical_blob_rewritten=False,production_database_migrated=False,production_authorization_executed=False)
