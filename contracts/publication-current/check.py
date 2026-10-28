"""关联语义、SQLite原子性和不可变性检查；不实施真实发布服务。"""
import argparse
import copy
import json
import sqlite3
import subprocess
import sys
import uuid
from importlib.metadata import version
from pathlib import Path
from jsonschema import Draft202012Validator
from jsonschema.exceptions import ValidationError
import build as B
import store as S
from fixtures import example
from migration_checks import run as migration

def read(db,expected):return S.read_current(db,expected,S.SELECTION)

def run():
    checks=[];connections=[]
    def check(name,value):B.require(value,name);checks.append(dict(name=name,passed=True))
    def denied(name,fn):
        try:fn()
        except (ValueError,ValidationError,sqlite3.DatabaseError):check(name,True)
        else:raise AssertionError(name+':未拒绝')
    def connect(path=':memory:'):
        db=S.connect(path);connections.append(db);return db
    def count(db):return db.execute('SELECT count(*) FROM publication_source').fetchone()[0]
    schema=B.build();check('生成字节一致',(B.ROOT/'record.schema.json').read_bytes()==B.encode(schema));Draft202012Validator.check_schema(schema)
    source=B.load(B.ROOT/'sources.json')
    for p,h in source['inputs'].items():
        raw=subprocess.check_output(['git','show',source['source_commit']+':'+p],cwd=B.SDK)
        check('固定SDK原件:'+p,B.sha(raw)==h and raw==(B.SDK/p).read_bytes())
    for p,item in source['copied_sources'].items():
        check('固定来源副本:'+p,B.sha((B.SDK/p).read_bytes())==item['sha256'])
    check('29模型闭包',len(schema['$defs'])==29)
    def refs(v):
        if isinstance(v,list):
            for x in v:yield from refs(x)
        elif isinstance(v,dict):
            for k,x in v.items():
                if k=='$ref':yield x
                elif k not in ['const','enum','default','examples']:yield from refs(x)
    check('无外部Schema获取',all(r.startswith('#/$defs/') and r[8:] in schema['$defs'] for r in refs(schema)))
    v=example();check('完整关联正例',S.validate(v)==v)
    for field in v:
        x=copy.deepcopy(v);x.pop(field);denied('缺少根字段:'+field,lambda x=x:S.validate(x))
    mutations=[
        ('跨authority',lambda x:x['source']['scope'].update(authority_service_id='other')),
        ('跨database',lambda x:x['source']['scope'].update(database_instance_id='other')),
        ('制品跨scope',lambda x:x['published']['artifact_ref']['scope'].update(database_instance_id='other')),
        ('定义错配',lambda x:x['source'].update(definition_id='other')),
        ('草稿修订错配',lambda x:x['source'].update(revision='8')),
        ('内容未重算',lambda x:x['source']['content']['program']['condition'].update(value=False)),
        ('选择摘要伪造',lambda x:x['source'].update(selection_digest='sha256:'+'0'*64)),
        ('metadata未重算',lambda x:x['source']['metadata'].update(name='changed')),
        ('非法选择',lambda x:x['selection'].update(contract_id='other')),
        ('注入批准',lambda x:x.update(approved=True)),
        ('当前草稿代填',lambda x:x['source'].update(revision='99',metadata_revision='99'))]
    for label,mutate in mutations:
        x=copy.deepcopy(v);mutate(x);x['record_digest']=S.digest({k:y for k,y in x.items() if k!='record_digest'})
        denied('即使重算封装仍拒绝:'+label,lambda x=x:S.validate(x))
    x=copy.deepcopy(v);x['record_digest']='sha256:'+'0'*64;denied('封装摘要',lambda:S.validate(x))
    nested={};cursor=nested
    for _ in range(S.MAX_DEPTH+1):cursor['a']={};cursor=cursor['a']
    denied('深度预算',lambda:S.bounded(nested));denied('字符预算',lambda:S.bounded('x'*(S.MAX_BYTES+1)))
    denied('节点预算',lambda:S.bounded([None]*S.MAX_NODES));denied('NaN不可规范化',lambda:S.bounded(float('nan')))
    try:
        db=connect();denied('必须由writer拥有事务',lambda:S.append(db,v));check('未开启事务零写入',count(db)==0)
        db.execute('BEGIN IMMEDIATE');check('首次写入',S.append(db,v)=='inserted');check('同事务完整查原',read(db,v['published'])==v)
        db.execute('ROLLBACK');check('故障回滚没有半份原件',count(db)==0)
        db.execute('BEGIN IMMEDIATE');S.append(db,v);db.execute('COMMIT')
        db.execute('BEGIN IMMEDIATE');check('原件精确重试',S.append(db,v)=='existing');db.execute('COMMIT')
        check('重试无重复版本',count(db)==1)
        for label,mutate in [('metadata修订',lambda x:x['source'].update(metadata_revision='12')),
                             ('名称内容',lambda x:x['source']['metadata'].update(name='替换名称')),
                             ('发布主体',lambda x:x['published'].update(published_by='other')),
                             ('制品摘要',lambda x:x['published']['artifact_ref'].update(digest='sha256:'+'b'*64))]:
            x=copy.deepcopy(v);mutate(x);x=S.freeze(x['published'],x['source'],S.SELECTION);db.execute('BEGIN IMMEDIATE')
            denied('同版本不可替换:'+label,lambda x=x:S.append(db,x));db.execute('ROLLBACK')
        for label,sql,args in [('UPDATE','UPDATE publication_source SET record_digest=?',('sha256:'+'0'*64,)),
                               ('DELETE','DELETE FROM publication_source',()),
                               ('REPLACE','INSERT OR REPLACE INTO publication_source VALUES(?,?,?,?,?,?,?,?,?)',S.columns(v))]:
            denied('直接SQL不可变:'+label,lambda sql=sql,args=args:db.execute(sql,args))
        db.execute('PRAGMA recursive_triggers=OFF')
        denied('关闭递归仍拒绝REPLACE',lambda:db.execute('INSERT OR REPLACE INTO publication_source VALUES(?,?,?,?,?,?,?,?,?)',S.columns(v)))
        check('原件保持',read(db,v['published'])==v)
        for field in ['program_digest','bindings_digest','published_by','source_draft_revision']:
            p=copy.deepcopy(v['published']);p[field]='sha256:'+'0'*64 if field.endswith('digest') else ('9' if field.endswith('revision') else 'other')
            denied('查原核完整发布对象:'+field,lambda p=p:read(db,p))
        p=copy.deepcopy(v['published']);p['definition_version']='4';denied('缺失版本不能回退最新',lambda:read(db,p))
        got=read(db,v['published']);got['source']['metadata']['name']='外部修改';check('返回副本不改原件',read(db,v['published'])==v)
        for i in range(9):
            fresh=connect();row=list(S.columns(v));row[i]=b'{}' if i==8 else str(row[i])+'x'
            denied('SQL列与封装联核:'+str(i),lambda fresh=fresh,row=row:fresh.execute('INSERT INTO publication_source VALUES(?,?,?,?,?,?,?,?,?)',row))
            check('错配没有存入:'+str(i),count(fresh)==0)
        fresh=connect();row=list(S.columns(v));row[-1]=b' '+row[-1]
        denied('非规范JSON字节拒绝',lambda:fresh.execute('INSERT INTO publication_source VALUES(?,?,?,?,?,?,?,?,?)',row))
        row=list(S.columns(v));row[-1]=b'{"format":"bad",'+row[-1][1:]
        denied('重复JSON键拒绝',lambda:fresh.execute('INSERT INTO publication_source VALUES(?,?,?,?,?,?,?,?,?)',row))
        root=B.SDK/'logs/publication-current'/('sqlite-'+uuid.uuid4().hex);root.mkdir(parents=True)
        for mode in ['DELETE','WAL']:
            a=connect(str(root/(mode+'.sqlite')));a.execute('PRAGMA journal_mode='+mode);b=connect(str(root/(mode+'.sqlite')))
            a.execute('BEGIN IMMEDIATE');S.append(a,v)
            check(mode+':第二连接看不到未提交记录',count(b)==0)
            denied(mode+':第二writer不能插入竞争版本',lambda:b.execute('BEGIN IMMEDIATE'))
            a.execute('COMMIT');check(mode+':提交后完整原件可见',read(b,v['published'])==v)
            b.execute('BEGIN IMMEDIATE');check(mode+':丢失响应后只查原',S.append(b,v)=='existing');b.execute('COMMIT')
            a.close();b.close();reopened=connect(str(root/(mode+'.sqlite')));check(mode+':关闭重开保留原件',read(reopened,v['published'])==v)
        # 有效的来源封装仍不是编译、字段授权或最终发送证明。
        check('局部校验不伪称编译证明',S.validate(v)['published']['program_digest']=='sha256:'+'a'*64)
    finally:
        for db in connections:db.close()
    upgraded=migration();check('完整新旧库迁移检查',upgraded['all_passed'] and upgraded['cases_passed']==len(upgraded['checks']))
    paths=[p for p in B.ROOT.rglob('*') if p.is_file() and p.name!='report.json' and '__pycache__' not in p.parts]
    inputs={p.relative_to(B.SDK).as_posix():B.sha(p.read_bytes()) for p in sorted(paths)};inputs.update(source['inputs'])
    return dict(format='publication-current-report/1',approved=False,runtime_ready=False,installed=False,all_passed=True,cases_passed=len(checks),checks=checks,
        models=29,sqlite_tables=1,sqlite_file_modes_tested=['DELETE','WAL'],sqlite_two_connection_scenarios=2,migration=upgraded,
        production_publication_tests_executed=0,compiler_tests_executed=0,dynamic_schema_authorization_tests_executed=0,
        browser_tests_executed=0,network_tests_executed=0,device_tests_executed=0,power_loss_tests_executed=0,
        sqlite_version=sqlite3.sqlite_version,python_version=sys.version.split()[0],python_executable_sha256=B.sha(Path(sys.executable).read_bytes()),tools={n:version(n) for n in ['jsonschema','rfc8785']},inputs=inputs)
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--report',action='store_true');args=parser.parse_args();r=run()
    if args.report:(B.ROOT/'report.json').write_bytes(B.encode(r))
    print(json.dumps({k:v for k,v in r.items() if k not in ['checks','inputs','migration']}|{'migration_checks':r['migration']['cases_passed']},ensure_ascii=False))
