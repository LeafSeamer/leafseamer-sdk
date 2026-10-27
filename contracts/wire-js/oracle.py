"""固定Python参考的跨进程对照桥；输入仅为验收夹具。"""
from dataclasses import asdict
import json
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'wire-json'))
import wire as W

def plain(v):
    if hasattr(v,'items'):return {k:plain(x) for k,x in v.items()}
    if isinstance(v,tuple):return [plain(x) for x in v]
    return v

results=[]
for case in json.load(sys.stdin):
    try:
        result=W.decode(bytes.fromhex(case['hex']),W.Schema(case['schema']),W.Profile(**case.get('profile',{})))
        results.append(dict(accepted=True,value=plain(result.value),numbers=[asdict(n) for n in result.numbers]))
    except W.WireError as error:results.append(dict(accepted=False,error=error.public()))
print(json.dumps(dict(python=sys.version.split()[0],results=results),ensure_ascii=True,allow_nan=False))
