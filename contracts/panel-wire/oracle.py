"""独立遍历两份OpenAPI并以Python原始字节验证器计算接受集。"""
import importlib.util
import json
from pathlib import Path
import sys
root=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('wire_reference',root.parent/'wire-json/wire.py')
wire=importlib.util.module_from_spec(spec);sys.modules[spec.name]=wire;spec.loader.exec_module(wire)
inv=json.loads((root/'preview/inventory.json').read_text(encoding='utf8'))
graph=json.loads((root.parent/'panel-wire/contract/models.schema.json').read_text(encoding='utf8'))
def rel(value):
    if isinstance(value,bool):return value
    out={}
    for key,node in value.items():
        if key=='$ref':
            assert node.startswith('#/components/schemas/')
            name=node.removeprefix('#/components/schemas/');assert name in graph['$defs']
            out[key]='#/$defs/'+name
        elif key in ('$defs','definitions','properties','patternProperties','dependentSchemas'):
            out[key]={name:rel(child) for name,child in node.items()}
        elif key in ('allOf','anyOf','oneOf','prefixItems'):out[key]=[rel(child) for child in node]
        elif key in ('items','contains','additionalProperties','unevaluatedProperties','unevaluatedItems','propertyNames','not','if','then','else','contentSchema','additionalItems'):out[key]=rel(node)
        else:out[key]=node
    return out
actual={(o['authority'],o['method'].lower(),o['path']):o for o in inv['operations']}
expected=set();binding_checks=0
def body(record,binding):
    global binding_checks
    schema=record.get('content',{}).get('application/json',{}).get('schema')
    assert (schema is None)==(binding is None)
    if schema is not None:assert inv['schemas'][binding]==rel(schema)
    binding_checks+=1
for authority in ('controller','seamer'):
    api=json.loads((root.parent/'panel-wire/contract'/(authority+'.openapi.json')).read_text(encoding='utf8'))
    for route,item in api['paths'].items():
        for method,op in item.items():
            key=(authority,method,route);expected.add(key);record=actual[key]
            assert record['operation_id']==op['operationId']
            assert record['source']=='contracts/panel-wire/contract/'+authority+'.openapi.json'
            assert record['pointer']=='/paths/'+route.replace('~','~0').replace('/','~1')+'/'+method
            body(op.get('requestBody',{}),record['request'])
            assert set(record['responses'])==set(op['responses'])
            for status,response in op['responses'].items():body(response,record['responses'][status])
            wanted={direction:op[k] for direction,k in [('client','x-client-frame-schema'),('server','x-server-frame-schema'),('first_server','x-first-server-frame-schema')] if k in op}
            assert set(wanted)==set(record['ws'])
            for direction,ref in wanted.items():
                assert inv['schemas'][record['ws'][direction]]==rel({'$ref':ref});binding_checks+=1
assert set(actual)==expected and len(actual)==len(inv['operations'])
workers=json.loads((root.parent/'panel-wire/contract/worker-messages.json').read_text(encoding='utf8'))
assert len(workers['messages'])==len(inv['messages'])
for original,record in zip(workers['messages'],inv['messages']):
    assert {k:v for k,v in record.items() if k!='root'}==original
    assert inv['schemas'][record['root']]=={'$ref':original['schema_ref'].replace(graph['$id'],'')}
    binding_checks+=1
panel={}
for group,model in [('window','WindowFrame'),('panel','PanelFrame'),('host','HostFrame')]:
    for branch in graph['$defs']['panel__Channel_'+model]['oneOf']:
        definition=branch['$ref'].removeprefix('#/$defs/')
        schema=graph['$defs'][definition];visited=set()
        while set(schema)=={'$ref'}:
            assert schema['$ref'].startswith('#/$defs/') and schema['$ref'] not in visited
            visited.add(schema['$ref']);schema=graph['$defs'][schema['$ref'].split('/')[-1]]
        kind=schema['properties']['type']['const']
        assert kind not in panel
        panel[kind]=dict(group=group,definition=definition)
assert len(panel)==len(inv['panel'])==19
for record in inv['panel']:
    assert panel[record['type']]=={k:record[k] for k in ['group','definition']}
    assert inv['schemas'][record['root']]=={'$ref':'#/$defs/'+record['definition']}
    panel[record['type']]['root']=record['root'];binding_checks+=1
corpus=['null','{}','[]','0','1.0000000000000001','9007199254740993','"text"','true','{"code":"authentication_required","request_id":"request","retry_action":"do_not_retry"}']
results={}
# 一次编译整个图；每次只携带一个具名属性，原始数字词法仍由参考扫描器处理。
selected=wire.Schema({'$schema':graph['$schema'],'$defs':graph['$defs'],'type':'object','properties':inv['schemas'],'additionalProperties':False})
for name,schema in inv['schemas'].items():
    answers=[]
    for raw in corpus:
        try:
            wire.decode(('{'+json.dumps(name)+':'+raw+'}').encode('utf8'),selected,wire.Profile(parse_deadline_ms=5000))
            answers.append(True)
        except wire.WireError:
            answers.append(False)
    results[name]=answers
spec=importlib.util.spec_from_file_location('panel_wire_cases',root/'cases.py')
cases=importlib.util.module_from_spec(spec);spec.loader.exec_module(cases);samples=cases.build()
for case in samples['panel_cases']:
    record=panel[case['type']];case.update(group=record['group'])
    try:
        wire.decode(('{'+json.dumps(record['root'])+':'+case['raw']+'}').encode('utf8'),selected,wire.Profile(parse_deadline_ms=5000))
        accepted=True
    except wire.WireError:accepted=False
    assert accepted==case['accepted'],case['label']
out=dict(format='panel-wire-oracle/1',binding_checks=binding_checks,operations=len(expected),corpus=corpus,results=results,**samples)
sys.stdout.buffer.write((json.dumps(out,ensure_ascii=False,indent=2)+'\n').encode('utf8'))
