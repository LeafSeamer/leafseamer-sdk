"""在独立进程使用固定旧存储实现，验证仍存活的旧连接边界。"""
import copy
import json
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'publication-source'))
import store as S
from fixtures import example

db=S.connect(sys.argv[1]);db.execute('PRAGMA journal_mode='+sys.argv[2])
record=example();db.execute('BEGIN IMMEDIATE');S.append(db,record);db.execute('COMMIT')
print(json.dumps(dict(ready=True,record=record)),flush=True)
try:
    for line in sys.stdin:
        request=json.loads(line);action=request['action']
        try:
            if action=='quit':break
            if action=='begin_write':db.execute('BEGIN IMMEDIATE');value=True
            elif action=='begin_read':db.execute('BEGIN');value=db.execute('SELECT count(*) FROM publication_source').fetchone()[0]
            elif action=='rollback':db.execute('ROLLBACK');value=True
            elif action=='commit':db.execute('COMMIT');value=True
            elif action=='read':value=S.read(db,request.get('expected',record['published']))
            elif action=='append':
                published=copy.deepcopy(record['published']);published['definition_version']='9';published['artifact_ref']['object_id']='legacy.late'
                item=S.freeze(published,record['source']);owned=not db.in_transaction
                try:
                    if owned:db.execute('BEGIN IMMEDIATE')
                    value=S.append(db,item)
                    if owned:db.execute('COMMIT')
                except Exception:
                    if owned and db.in_transaction:db.execute('ROLLBACK')
                    raise
            else:raise ValueError('unknown_probe_action')
            print(json.dumps(dict(ok=True,value=value)),flush=True)
        except Exception as error:
            print(json.dumps(dict(ok=False,error=type(error).__name__,code=getattr(error,'sqlite_errorname',None))),flush=True)
finally:db.close()
