"""生成固定发布原件关联的独立候选；不改已存在的完整选择。"""
import copy
import hashlib
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parent
SDK=ROOT.parents[1]
SID='https://leafseamer.invalid/sdk/publication-source/0.1/record.schema.json'
def sha(raw):return hashlib.sha256(raw).hexdigest()
def encode(value):return (json.dumps(value,ensure_ascii=False,indent=2)+'\n').encode('utf8')
def load(path):return json.loads(path.read_bytes())
def require(ok,reason):
    if not ok:raise ValueError(reason)
def build():
    sources=load(ROOT/'sources.json')
    for path,digest in sources['inputs'].items():require(sha((SDK/path).read_bytes())==digest,'source_drift:'+path)
    source=load(SDK/'contracts/panel-integration/preview/models.schema.json')
    definitions={}
    def include(name):
        if name in definitions:return
        value=copy.deepcopy(source['$defs'][name]);definitions[name]=value
        def visit(v):
            if isinstance(v,list):
                for item in v:visit(item)
            elif isinstance(v,dict):
                for k,item in v.items():
                    if k=='$ref':
                        require(item.startswith('#/$defs/'),'external_ref');include(item[8:])
                    elif k not in ['const','enum','default','examples']:visit(item)
        visit(value)
    for name in ['lifecycle__DraftRecord','lifecycle__PublishedVersion']:include(name)
    props=dict(format={'const':'publication-source/0.1.0-draft.1'},selection={'const':load(SDK/'contracts/panel-integration/preview/selection.json')},
        published={'$ref':'#/$defs/lifecycle__PublishedVersion'},source={'$ref':'#/$defs/lifecycle__DraftRecord'},
        metadata_digest={'$ref':'#/$defs/lifecycle__Digest'},record_digest={'$ref':'#/$defs/lifecycle__Digest'})
    return {'$schema':'https://json-schema.org/draft/2020-12/schema','$id':SID,'type':'object','properties':props,
            'required':list(props),'additionalProperties':False,'$defs':definitions}
if __name__=='__main__':
    schema=build();(ROOT/'record.schema.json').write_bytes(encode(schema));print(json.dumps(dict(models=len(schema['$defs']))))
