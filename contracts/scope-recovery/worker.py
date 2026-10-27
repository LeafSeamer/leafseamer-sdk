"""仅供合成子进程验收：持有owner、报告就绪并等待检查器终止。"""
import argparse
import json
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
import owner as O

AUTHORITY=dict(authority_service_id='controller',database_instance_id='database',authority_role='controller')


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--database',type=Path,required=True)
    p.add_argument('--locks',type=Path,required=True);p.add_argument('--epoch',required=True)
    p.add_argument('--mode',choices=['probe','idle','pending'],required=True);p.add_argument('--ready',type=Path)
    a=p.parse_args()
    try:owner=O.Owner(a.database,a.locks,AUTHORITY,a.epoch,lambda:0)
    except ValueError as error:
        if a.mode!='probe':raise
        print(json.dumps(dict(status='rejected',reason=str(error))));return
    try:
        if a.mode=='probe':print(json.dumps(dict(status='acquired')));return
        def wait():
            a.ready.write_text('ready',encoding='utf8')
            sys.stdin.readline()
        if a.mode=='idle':wait()
        else:
            ref=O.S.decode(owner.db.execute("SELECT ref_body FROM sr_object WHERE kind='projection_profile' ORDER BY object_key LIMIT 1").fetchone()[0])
            owner.revoke('child_pending_revoke',ref,after_intent=wait)
    finally:owner.close()


if __name__=='__main__':main()
