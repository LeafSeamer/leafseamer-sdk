"""隔离SQLite关联参考；调用方拥有事务，可信发布、权限和编译由宿主提供。"""
import copy
import importlib.util
import json
from pathlib import Path
import sqlite3
import rfc8785
from jsonschema import Draft202012Validator
_spec=importlib.util.spec_from_file_location('publication_current_build',Path(__file__).with_name('build.py'))
_build=importlib.util.module_from_spec(_spec);_spec.loader.exec_module(_build)
ROOT=_build.ROOT;load=_build.load;require=_build.require;sha=_build.sha

MAX_BYTES=8*1024*1024
MAX_NODES=200000
MAX_DEPTH=64
SCHEMA=load(ROOT/'record.schema.json')
VALIDATOR=Draft202012Validator(SCHEMA)
SELECTION=copy.deepcopy(SCHEMA['properties']['selection']['const'])
LEGACY_SCHEMA=load(ROOT.parent/'publication-source/record.schema.json')
LEGACY_SELECTION=copy.deepcopy(LEGACY_SCHEMA['properties']['selection']['const'])
LEGACY_VALIDATOR=Draft202012Validator(LEGACY_SCHEMA)
def digest(value):return 'sha256:'+sha(rfc8785.dumps(value))
def bounded(value):
    todo=[(value,0)];count=0;characters=0
    while todo:
        node,depth=todo.pop();count+=1
        require(depth<=MAX_DEPTH and count<=MAX_NODES,'value_budget')
        if isinstance(node,dict):
            require(all(type(k) is str for k in node),'object_key');characters+=sum(map(len,node));todo.extend((v,depth+1) for v in node.values())
        elif isinstance(node,list):todo.extend((v,depth+1) for v in node)
        else:
            require(node is None or type(node) in [str,bool,int,float],'json_value')
            if isinstance(node,str):characters+=len(node)
        require(characters<=MAX_BYTES,'character_budget')
    raw=rfc8785.dumps(value);require(len(raw)<=MAX_BYTES,'byte_budget');return raw
def _validate(value,validator):
    bounded(value);validator.validate(value)
    p=value['published'];s=value['source']
    require(p['scope']==s['scope']==p['artifact_ref']['scope'],'scope')
    require(p['definition_id']==s['definition_id'] and p['source_draft_revision']==s['revision'],'source_revision')
    require(s['content_digest']==digest(s['content']),'content_digest')
    require(s['selection_digest']==digest(s['content']['selections']),'selection_digest')
    require(value['metadata_digest']==digest(s['metadata']),'metadata_digest')
    require(value['record_digest']==digest({k:v for k,v in value.items() if k!='record_digest'}),'record_digest')
    return value
def validate(value):return _validate(value,VALIDATOR)
def freeze(published,source,selection):
    """仅冻结关联，不产生发布资格；两份原件必须来自同一权威发布事务。"""
    require(selection==SELECTION,'selection');bounded(published);bounded(source)
    value=dict(format=SCHEMA['properties']['format']['const'],selection=copy.deepcopy(SCHEMA['properties']['selection']['const']),
        published=copy.deepcopy(published),source=copy.deepcopy(source),metadata_digest=digest(source['metadata']))
    value['record_digest']=digest(value);return validate(value)
def key(published):
    s=published['scope'];return (s['authority_service_id'],s['database_instance_id'],published['definition_id'],published['definition_version'])
def columns(value):
    p=value['published'];a=p['artifact_ref']
    return (*key(p),a['object_id'],a['revision'],a['digest'],value['record_digest'],bounded(value))
def _valid_row(*row):
    try:
        raw=row[-1]
        if type(raw) is not bytes or len(raw)>MAX_BYTES:return 0
        # 只接受由本候选规范化的字节；重复键、空白及其他数字写法均不能旁路。
        value=json.loads(raw)
        if value.get('selection')==SELECTION:validate(value)
        elif value.get('selection')==LEGACY_SELECTION:_validate(value,LEGACY_VALIDATOR)
        else:return 0
        return int(tuple(row)==columns(value))
    except Exception:
        # SQLite回调不将内部异常文本泄漏给调用者；不吞掉进程终止类异常。
        return 0
def _layout(db):
    return db.execute("SELECT type,name,tbl_name,sql FROM sqlite_schema WHERE tbl_name='publication_source' ORDER BY type,name").fetchall()
def _current_body(raw):
    try:
        require(type(raw) is bytes and len(raw)<=MAX_BYTES,'current_body');validate(json.loads(raw));return 1
    except Exception:return 0
def connect(path=':memory:',*,upgrade=False):
    db=sqlite3.connect(path,isolation_level=None,timeout=0)
    try:
        db.execute('PRAGMA foreign_keys=ON');db.execute('PRAGMA recursive_triggers=ON')
        db.create_function('publication_source_valid',9,_valid_row,deterministic=True)
        db.create_function('publication_current_body',1,_current_body,deterministic=True)
        sql=(ROOT/'layout.sql').read_text(encoding='utf8')
        admission=(ROOT/'admission.sql').read_text(encoding='utf8')
        template=sqlite3.connect(':memory:')
        try:
            template.create_function('publication_source_valid',9,lambda *args:1)
            template.executescript(sql);legacy=_layout(template)
            template.executescript(admission);expected=_layout(template)
        finally:template.close()
        actual=_layout(db)
        if actual==legacy:
            require(upgrade is True,'publication_upgrade_required')
            # 只接受精确旧布局；在writer锁内追加门控，不重写任何历史BLOB。
            db.execute('BEGIN IMMEDIATE')
            require(_layout(db)==legacy,'publication_layout')
            db.execute(admission)
            require(_layout(db)==expected,'publication_layout');db.commit()
        elif actual:
            require(actual==expected,'publication_layout')
        else:
            names=[row[1] for row in expected]
            require(not db.execute('SELECT name FROM sqlite_schema WHERE name IN ('+','.join('?' for _ in names)+')',names).fetchall(),'publication_layout')
            db.executescript('BEGIN IMMEDIATE;\n'+sql+'\n'+admission+'\nCOMMIT;')
            require(_layout(db)==expected,'publication_layout')
        return db
    except Exception:
        if db.in_transaction:db.rollback()
        db.close();raise
def append(db,value):
    require(db.in_transaction,'writer_transaction_required');validate(value);row=columns(value)
    old=db.execute('SELECT body FROM publication_source WHERE authority=? AND database_id=? AND definition_id=? AND version=?',row[:4]).fetchone()
    if old is not None:
        require(old[0]==row[-1],'immutable_publication_conflict');return 'existing'
    db.execute('INSERT INTO publication_source VALUES(?,?,?,?,?,?,?,?,?)',row);return 'inserted'
def _read(db,expected,validator):
    """expected为权威查得的完整PublishedVersion；不从当前草稿或显示标签补齐。"""
    bounded(expected);validator.evolve(schema={'$ref':'#/$defs/lifecycle__PublishedVersion','$defs':validator.schema['$defs']}).validate(expected)
    row=db.execute('SELECT body FROM publication_source WHERE authority=? AND database_id=? AND definition_id=? AND version=?',key(expected)).fetchone()
    require(row is not None,'source_unavailable');value=_validate(json.loads(row[0]),validator)
    require(row[0]==bounded(value),'stored_bytes')
    require(value['published']==expected,'published_binding');return copy.deepcopy(value)
def read_current(db,expected,selection):
    require(selection==SELECTION,'selection');return _read(db,expected,VALIDATOR)
def read_history(db,expected,selection):
    require(selection==LEGACY_SELECTION,'historical_selection');return _read(db,expected,LEGACY_VALIDATOR)
