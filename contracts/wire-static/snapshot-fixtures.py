"""从固定快照检查器生成合成整包，不运行数据库或网络。"""
import importlib.util
import json
from pathlib import Path
import sys
root=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('snapshot_reference_cases',root.parent/'snapshot-consumer/check.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
result={name:m.packet(kinds,empty) for name,kinds,empty in [('controller',m.CONTROLLER,False),('seamer',m.SEAMER,False),('empty',m.CONTROLLER,True)]}
sys.stdout.buffer.write((json.dumps(result,ensure_ascii=False,indent=2)+'\n').encode('utf8'))
