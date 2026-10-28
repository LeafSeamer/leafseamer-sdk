"""隔离SQLite关联参考；调用方拥有事务，可信发布、权限和编译由宿主提供。"""
import copy
import json
import sqlite3
import rfc8785
from jsonschema import Draft202012Validator
from build import ROOT,load,require,sha

MAX_BYTES=8*1024*1024
MAX_NODES=200000
MAX_DEPTH=64
SCHEMA=load(ROOT/'record.schema.json')
VALIDATOR=Draft202012Validator(SCHEMA)
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
def validate(value):
    bounded(value);VALIDATOR.validate(value)
    p=value['published'];s=value['source']
    require(p['scope']==s['scope']==p['artifact_ref']['scope'],'scope')
    require(p['definition_id']==s['definition_id'] and p['source_draft_revision']==s['revision'],'source_revision')
    require(s['content_digest']==digest(s['content']),'content_digest')
    require(s['selection_digest']==digest(s['content']['selections']),'selection_digest')
    require(value['metadata_digest']==digest(s['metadata']),'metadata_digest')
    require(value['record_digest']==digest({k:v for k,v in value.items() if k!='record_digest'}),'record_digest')
    return value
def freeze(published,source):
    """仅冻结关联，不产生发布资格；两份原件必须来自同一权威发布事务。"""
    bounded(published);bounded(source)
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
        value=json.loads(raw);validate(value)
        return int(tuple(row)==columns(value))
    except Exception:
        # SQLite回调不将内部异常文本泄漏给调用者；不吞掉进程终止类异常。
        return 0
def connect(path=':memory:'):
    db=sqlite3.connect(path,isolation_level=None,timeout=0)
    db.execute('PRAGMA foreign_keys=ON');db.execute('PRAGMA recursive_triggers=ON')
    db.create_function('publication_source_valid',9,_valid_row,deterministic=True)
    db.executescript((ROOT/'layout.sql').read_text(encoding='utf8'));return db
def append(db,value):
    require(db.in_transaction,'writer_transaction_required');validate(value);row=columns(value)
    old=db.execute('SELECT body FROM publication_source WHERE authority=? AND database_id=? AND definition_id=? AND version=?',row[:4]).fetchone()
    if old is not None:
        require(old[0]==row[-1],'immutable_publication_conflict');return 'existing'
    db.execute('INSERT INTO publication_source VALUES(?,?,?,?,?,?,?,?,?)',row);return 'inserted'
def read(db,expected):
    """expected为权威查得的完整PublishedVersion；不从当前草稿或显示标签补齐。"""
    bounded(expected);VALIDATOR.evolve(schema={'$ref':'#/$defs/lifecycle__PublishedVersion','$defs':SCHEMA['$defs']}).validate(expected)
    row=db.execute('SELECT body FROM publication_source WHERE authority=? AND database_id=? AND definition_id=? AND version=?',key(expected)).fetchone()
    require(row is not None,'source_unavailable');value=validate(json.loads(row[0]))
    require(value['published']==expected,'published_binding');return copy.deepcopy(value)
