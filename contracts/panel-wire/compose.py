"""生成修正worker模型URI的完整panel4候选，不改写panel3制品。"""
import importlib.util
from pathlib import Path
import argparse
import json

ROOT = Path(__file__).resolve().parent
SDK = ROOT.parents[1]
spec = importlib.util.spec_from_file_location('panel_composition', ROOT.parent / 'panel-integration/build.py')
B = importlib.util.module_from_spec(spec)
spec.loader.exec_module(B)
B.BASE = 'https://leafseamer.invalid/sdk/panel-wire/0.1/'
B.SID = B.BASE + 'models.schema.json'
B.CID = 'leafseamer.api.v1.panel4'
B.REF = B.REF | {'schema_ref'}


def build():
    outputs = B.build()
    outputs['manifest.json']['artifacts']['PROTOCOL.md'] = B.sha((ROOT / 'PROTOCOL.md').read_bytes())
    outputs['selection.json']['contract_digest'] = 'sha256:' + B.digest(outputs['manifest.json'])
    return outputs


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    args.output.mkdir(exist_ok=False)
    outputs = build()
    for name, value in outputs.items():
        (args.output / name).write_bytes(B.encoded(value))
    print(json.dumps(dict(files=len(outputs), selection=outputs['selection.json'])))
