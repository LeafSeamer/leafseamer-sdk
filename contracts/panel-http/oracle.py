"""独立遍历OpenAPI参数与响应，不调用JavaScript生成器或运行时。"""
import argparse
import copy
import json
from pathlib import Path
import re
from urllib.parse import quote
from jsonschema import Draft202012Validator, FormatChecker

ROOT=Path(__file__).resolve().parent;SDK=ROOT.parents[1]
def read(p):return json.loads((SDK/p).read_bytes())
def encode(v):return (json.dumps(v,ensure_ascii=False,indent=2)+'\n').encode('utf8')
def schema(s,defs):
    while '$ref' in s:s=defs[s['$ref'].split('/')[-1]]
    return s
def accepts(s,raw):
    # 当前环境未安装jsonschema的可选URI插件；有限语料的URI预期独立列明，不能静默跳过format。
    if s.get('format')=='uri' and raw not in {'a:b','https://ui.invalid','https://ui.invalid/a?b=c','sha256:'+'0'*64}:return False
    value=raw
    if s.get('type')=='integer':
        if not re.fullmatch(r'0|[1-9][0-9]*',raw):return False
        value=int(raw)
        if value>9007199254740991:return False
    return Draft202012Validator(s,format_checker=FormatChecker()).is_valid(value)
def sample(s):
    for v in [s.get('const'),'1','a','a'*16,'https://ui.invalid','sha256:'+'0'*64,'']:
        if isinstance(v,str) and accepts(s,v):return v
    raise AssertionError(s)
def main():
    inv=read('contracts/panel-http/preview/inventory.json');selection=read('contracts/panel-wire/contract/selection.json')
    token='leafseamer.contract.'+selection['contract_id']+'.'+selection['contract_digest'][7:]
    operations=[];variants=[];seen=set();binding_checks=0
    corpus=['','0','1','01','-0','-1','+1','1.0','1e0','8','9','64','65','127','128','9007199254740992','18446744073709551615','a','a:b','a/b','a%2Fb','a\n','a\r','a\t','.','..','https://ui.invalid','noturi','https://ui.invalid/a?b=c','sha256:'+'0'*64,'a'*16,'a'*129,'中','😀']
    for authority in ['controller','seamer']:
        doc=read('contracts/panel-wire/contract/'+authority+'.openapi.json');defs=doc['components']['schemas']
        for path,item in doc['paths'].items():
            for method,op in item.items():
                actual=next(x for x in inv['operations'] if (x['authority'],x['operation_id'])==(authority,op['operationId']))
                assert (actual['method'],actual['path'],actual['security'])==(method.upper(),path,op['security'])
                assert actual['extensions']=={k:v for k,v in op.items() if k.startswith('x-')}
                assert actual['security_schemes']=={n:doc['components']['securitySchemes'][n] for group in op['security'] for n in group}
                assert len(actual['parameters'])==len(op.get('parameters',[]));binding_checks+=1
                parameters=op.get('parameters',[]);values=[]
                for p,a in zip(parameters,actual['parameters']):
                    s=schema(p['schema'],defs);assert inv['schemas'][a['validator']]==s and a['source_schema']==p['schema']
                    assert (a['location'],a['name'],a['required'],a['numeric'])==(p['in'],p['name'].lower() if p['in']=='header' else p['name'],p.get('required',False),s.get('type')=='integer');binding_checks+=1
                    v=sample(s)
                    if p['name']=='X-LeafSeamer-Contract-Digest':v=selection['contract_digest']
                    values.append(v)
                def request(items):
                    target=path;query=[];headers=[]
                    for p,v in zip(parameters,items):
                        if p['in']=='path':target=target.replace('{'+p['name']+'}',quote(v,safe=''))
                        elif p['in']=='query':query.append(quote(p['name'],safe='')+'='+quote(v,safe=''))
                        else:headers.append([p['name'],v])
                    if query:target+='?'+'&'.join(query)
                    if op.get('requestBody'):headers.append(['Content-Type','application/json; charset="UTF-8"'])
                    if actual['transport']=='websocket-subprotocol':headers.append(['Sec-WebSocket-Protocol',token+(', leafseamer.ticket.'+'a'*16 if op['x-secret-ticket-required'] else '')])
                    return dict(authority=authority,operation_id=op['operationId'],method=method.upper(),target=target,headers=headers)
                base=request(values);responses=[]
                assert set(actual['responses'])==set(op['responses'])
                for status,response in op['responses'].items():
                    a=actual['responses'][status];assert a['body']==('json' if response.get('content') else 'none')
                    assert len(a['headers'])==len(response.get('headers',{}));headers=[]
                    for (name,h),generated in zip(response.get('headers',{}).items(),a['headers']):
                        s=schema(h['schema'],defs)
                        assert generated['name']==name.lower() and generated['source_schema']==h['schema'] and inv['schemas'][generated['validator']]==s
                        assert generated['required']==h.get('required',False) and generated['after_selection']==h.get('x-required-after-selection',False);binding_checks+=1
                        v=sample(s) if name!='Sec-WebSocket-Protocol' else token
                        if name=='X-LeafSeamer-Contract-Digest':v=selection['contract_digest']
                        headers.append([name,v])
                    if a['body']=='json':headers.append(['Content-Type','Application/JSON; charset=utf-8'])
                    responses.append(dict(status=status,headers=headers,body=a['body']));binding_checks+=1
                operations.append(dict(request=base,responses=responses,body=actual['body']))
                for index,p in enumerate(parameters):
                    identity=json.dumps(p,sort_keys=True)
                    if identity in seen:continue
                    seen.add(identity);s=schema(p['schema'],defs)
                    for v in corpus+[sample(s),values[index],'a'*4096,'a'*4097]:
                        normal=v.strip(' \t') if p['in']=='header' else v
                        expected=accepts(s,normal) and not re.search(r'[\x00-\x08\x0a-\x1f\x7f]' if p['in']=='header' else r'[\x00-\x1f\x7f]',v)
                        if p['in']=='path':expected=expected and v not in ('','.','..') and not re.search(r'[\\/%]',v)
                        if p['in']=='header':expected=expected and all(ord(c)<=255 for c in v)
                        if p['name']=='X-LeafSeamer-Contract':expected=expected and normal==selection['contract_id']
                        if p['name']=='X-LeafSeamer-Contract-Digest':expected=expected and normal==selection['contract_digest']
                        changed=values.copy();changed[index]=v
                        variants.append(dict(name=p['in']+':'+p['name']+':'+str(len(variants)),request=request(changed),expected=bool(expected)))
    return dict(format='panel-http-oracle/1',binding_checks=binding_checks,operations=operations,parameter_variants=variants,distinct_parameters=len(seen))
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path);args=parser.parse_args();v=main()
    if args.output:args.output.write_bytes(encode(v))
    print(json.dumps(dict(all_passed=True,binding_checks=v['binding_checks'],operations=len(v['operations']),responses=sum(len(o['responses']) for o in v['operations']),parameter_variants=len(v['parameter_variants']),distinct_parameters=v['distinct_parameters'])))
