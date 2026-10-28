"""一次性本地实例校验子进程；只输出布尔结果，不返回数据或验证错误详情。"""
import json
import sys
from jsonschema import Draft202012Validator,FormatChecker
from referencing import Registry,Resource
from referencing.jsonschema import DRAFT202012
from referencing.exceptions import NoSuchResource

def unavailable(uri):raise NoSuchResource(ref=uri)
def run():
    raw=sys.stdin.buffer.read(1572865)
    if len(raw)>1572864:return False
    v=json.loads(raw);documents=v['documents']
    registry=Registry(retrieve=unavailable).with_resources((sid,Resource.from_contents(doc,default_specification=DRAFT202012)) for sid,doc in documents.items())
    r=v['schema_ref'];schema={'$ref':r['schema_id']+'#/$defs/'+r['definition']}
    checker=FormatChecker(formats=v['formats'])
    return Draft202012Validator(schema,registry=registry,format_checker=checker).is_valid(v['value'])
if __name__=='__main__':
    try:valid=run()
    except Exception:valid=False
    sys.stdout.buffer.write(b'{"valid":true}' if valid else b'{"valid":false}')
