"""原始字节、预算、条件Schema及Python/V8数字差分验收。"""
import argparse
from concurrent.futures import ThreadPoolExecutor
from dataclasses import replace
import hashlib
import importlib.metadata
import json
from pathlib import Path
import random
import struct
import subprocess
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
import wire as W

ROOT=Path(__file__).resolve().parent;SDK=ROOT.parents[1]
def sha(raw):return hashlib.sha256(raw).hexdigest()
def load(p):return json.loads(p.read_bytes())
def inputs():
    files=[p for p in ROOT.rglob('*') if p.is_file() and p.name!='report.json' and '__pycache__' not in p.parts]
    files += [SDK/p for p in load(ROOT/'sources.json')['inputs']]
    return {p.relative_to(SDK).as_posix():sha(p.read_bytes()) for p in sorted(set(files))}
def thaw(v):
    if isinstance(v,dict) or hasattr(v,'items'):return {k:thaw(x) for k,x in v.items()}
    if isinstance(v,tuple):return [thaw(x) for x in v]
    return v


def run():
    checks=[]
    def check(name,actual,expected=True):
        assert actual==expected,(name,actual,expected);checks.append(dict(name=name,passed=True))
    def reject(name,fn,reason=None):
        try:fn()
        except W.WireError as e:
            check(name,e.reason,reason) if reason else check(name,True)
            check(name+'错误不回显原文',set(e.public())<= {'stage','reason_code','byte_offset'})
            return e
        raise AssertionError(name+':未拒绝')
    source=load(ROOT/'sources.json')
    for path,digest in source['inputs'].items():check('输入字节:'+path,sha((SDK/path).read_bytes()),digest)
    for local,item in source['upstream']['files'].items():check('固定候选:'+local,sha((ROOT/local).read_bytes()),item['sha256'])
    fixtures=load(ROOT/'source/decoder-design-cases.json')
    profile=fixtures['base']['profiles'][0]
    check('Profile对应固定候选',{k:getattr(W.Profile(),k) for k in vars(W.Profile())},
          {k:v for k,v in profile.items() if k in vars(W.Profile())})
    broad=W.Schema(True);normal=W.Profile();slow=replace(normal,parse_deadline_ms=5000)
    for case in fixtures['raw_cases_planned']:
        raw=bytes.fromhex(case['raw_hex']) if 'raw_hex' in case else case['raw'].encode('utf8')
        schema=case.get('test_schema',{'type':'array','items':{'type':'integer'}} if case['root']=='integer_array' else {'type':case['root']})
        compiled=W.Schema(schema)
        if case['accept']:
            W.decode(raw,compiled);check(case['id'],True)
        else:reject(case['id'],lambda:W.decode(raw,compiled),case['reason'])
        if 'instance_pointer' in case:
            check(case['id']+'私有token定位',W.decode(raw,broad).numbers[0].pointer,case['instance_pointer'])
    for raw in (b'',b' ',b'[',b'{',b'[1,]',b'{"a" 1}',b'{"a":}',b'[01]',b'1.',b'1e',b'+1',b'.1',b'--1',b'truefalse',b'nullx',b'/*x*/1',b'"x\n"',b'"\\x12"',b'"\\u12g4"'):
        reject('语法拒绝'+raw.hex(),lambda:W.decode(raw,broad))
    for raw in (b'"\\udc00"',b'"\\ud800x"',b'"\\ufdd0"',b'"\\ufffe"',b'"\\uffff"',b'"\\ud83f\\udffe"'):
        reject('非法scalar'+raw.hex(),lambda:W.decode(raw,broad))
    for raw in (b'"\xed\xa0\x80"',b'"\xf4\x90\x80\x80"',b'"\x80"',b'"\xe2\x82"'):
        reject('UTF8拒绝'+raw.hex(),lambda:W.decode(raw,broad),'utf8')
    reject('可变缓冲拒绝',lambda:W.decode(bytearray(b'1'),broad),'immutable_bytes_required')
    reject('内存视图拒绝',lambda:W.decode(memoryview(b'1'),broad),'immutable_bytes_required')
    for field in vars(normal):
        reject(field+'零预算',lambda f=field:replace(normal,**{f:0}),'profile_bounds')
        reject(field+'布尔预算',lambda f=field:replace(normal,**{f:True}),'profile_bounds')
    budgets=[
        ('message',replace(normal,max_message_bytes=8,max_key_utf8_bytes=1,max_string_utf8_bytes=1),b'0       ',b'0        ','message_budget'),
        ('depth',replace(normal,max_depth=2),b'[[]]',b'[[[]]]','depth_budget'),
        ('nodes',replace(normal,max_value_nodes=3),b'[1,2]',b'[1,2,3]','node_budget'),
        ('members',replace(normal,max_object_members=1),b'{"x":1}',b'{"x":1,"y":2}','member_budget'),
        ('key',replace(normal,max_key_utf8_bytes=2),' {"é":1}'.encode(),'{"中":1}'.encode(),'key_budget'),
        ('string',replace(normal,max_key_utf8_bytes=1,max_string_utf8_bytes=4),'"😀"'.encode(),'"😀x"'.encode(),'string_budget'),
        ('number',replace(normal,max_number_chars=3),b'123',b'1234','number_budget'),
        ('exponent',replace(normal,max_exponent_abs=3),b'1e3',b'1e4','number_budget')]
    for name,p,good,bad,reason in budgets:
        W.decode(good,broad,p);check(name+'等号接受',True);reject(name+'超一拒绝',lambda:W.decode(bad,broad,p),reason)
    for raw in (b'"\\u0061"',b'"a"'):W.decode(raw,broad,replace(normal,max_key_utf8_bytes=1,max_string_utf8_bytes=1))
    check('转义后长度一致',True)
    reject('取消拒绝',lambda:W.decode(b'1',broad,cancelled=lambda:True),'cancelled')
    ticks=iter([0,100000000]);reject('deadline等号拒绝',lambda:W.decode(b'1',broad,clock=lambda:next(ticks)),'deadline')
    ticks=iter([2,1]);reject('时钟倒退',lambda:W.decode(b'1',broad,clock=lambda:next(ticks)),'clock_invalid')
    reject('时钟类型',lambda:W.decode(b'1',broad,clock=lambda:'0'),'clock_invalid')
    count=[0]
    def cancelling():count[0]+=1;return count[0]>3
    reject('扫描中取消',lambda:W.decode(b'"'+b'a'*100+b'"',broad,replace(normal,slice_units=8),cancelled=cancelling),'cancelled')
    eof=reject('EOF字节偏移',lambda:W.decode('{"é":'.encode(),broad),'json_grammar')
    check('EOF指向完整字节长度',eof.offset,len('{"é":'.encode()))
    # 相同数学值但不同数字词法必须按所处Schema分支判定。
    schemas=[
        ({'type':['integer','null']},False),({'type':['integer','number']},True),
        ({'oneOf':[{'type':'integer'},{'type':'number'}]},True),
        ({'allOf':[{'type':'number'},{'type':'integer'}]},False),
        ({'not':{'type':'integer'}},True),
        ({'if':{'type':'integer'},'then':False,'else':True},True),
        ({'$schema':W.PUBLIC,'$defs':{'I':{'$schema':W.PUBLIC,'type':'integer'}},'$ref':'#/$defs/I'},False)]
    for i,(schema,accepted) in enumerate(schemas):
        compiled=W.Schema(schema)
        if accepted:W.decode(b'1.0000000000000001',compiled);check('分支'+str(i),True)
        else:reject('分支'+str(i),lambda:W.decode(b'1.0000000000000001',compiled),'raw_integer')
    nullable=W.Schema({'type':['integer','null']});check('nullable不误拦',W.decode(b'null',nullable).value,None)
    reject('oneOf保留两个成功分支',lambda:W.decode(b'1.0',W.Schema({'oneOf':[{'type':'integer'},{'type':'number'}]})),'schema_rejected')
    exact=W.Schema({'type':'integer','minimum':1,'maximum':2})
    reject('范围下界',lambda:W.decode(b'0',exact),'schema_rejected')
    reject('范围上界',lambda:W.decode(b'3',exact),'schema_rejected')
    # 派生只改Schema位置；业务数据中的$schema与type保持。
    literal={'type':'object','properties':{'type':{'const':'integer'}},'examples':[{'$schema':'private','type':'integer'}]}
    compiled=W.Schema(literal);check('不改原Schema',compiled.source,literal);check('不误改数据',compiled.derived['examples'],literal['examples'])
    check('属性type的Schema照常进入',W.Schema({'properties':{'type':{'type':'integer'}}}).integer_paths,('/properties/type/type',))
    check('常量中的integer不是类型节点',W.Schema({'const':{'type':'integer'}}).integer_paths,())
    reject('外部引用禁止网络',lambda:W.Schema({'$ref':'https://leafseamer.invalid/private'}),'external_reference')
    reject('未知引用封闭失败',lambda:W.decode(b'1',W.Schema({'$ref':'#/$defs/missing'})),'unresolved_reference')
    reject('无进展引用递归封闭失败',lambda:W.decode(b'1',W.Schema({'$ref':'#'})),'schema_budget')
    secret=b'{"do-not-expose-secret":1.0000000000000001}'
    error=reject('错误不含动态键',lambda:W.decode(secret,W.Schema({'type':'object','additionalProperties':{'type':'integer'}})),'raw_integer')
    check('无秘密反射','do-not-expose' not in json.dumps(error.public()))
    raw='{"é":2,"a/b":{"~x":1.0000000000000001}}'.encode()
    result=W.decode(raw,broad)
    for token in result.numbers:check('字节半开区间'+token.pointer,raw[token.start:token.end].decode(),token.text)
    check('多字节前缀偏移',result.numbers[1].start,raw.index(b'1.000'))
    check('Pointer保留空键',W.decode(b'{"":1}',broad).numbers[0].pointer,'/')
    frozen=W.decode(b'{"__proto__":{"polluted":true},"x":[1]}',broad).value
    try:frozen['new']=1
    except TypeError:check('DTO只读',True)
    else:raise AssertionError('DTO可改')
    try:frozen['__proto__']['polluted']=False
    except TypeError:check('嵌套DTO只读',True)
    else:raise AssertionError('嵌套DTO可改')
    check('数组只读',type(frozen['x']) is tuple)
    # 独立JS oracle的精确整数判定与V8 binary64位模式。
    texts=['0','-0','1','1.0','1e0','1.0000000000000001','9007199254740991','9007199254740992','9007199254740993',
        '-9007199254740991','1e20','1e-400','0e-400','1e309','5e-324','2.2250738585072014e-308','1.7976931348623157e308',
        '123000e-3','10e-1','1001e-3','0.'+'0'*100+'1','1e4096']
    node=subprocess.run(['node',str(ROOT/'number-oracle.mjs')],input=json.dumps(texts),capture_output=True,text=True,check=True)
    oracle=json.loads(node.stdout)
    for item in oracle['results']:
        text=item['text']
        if not item['finite']:reject('V8非有限:'+text,lambda:W.decode(text.encode(),broad),'nonfinite');continue
        if item['underflow']:reject('V8下溢:'+text,lambda:W.decode(text.encode(),broad),'number_underflow');continue
        decoded=W.decode(text.encode(),broad);token=decoded.numbers[0]
        check('BigInt数学整数:'+text,token.integer,item['integer']);check('BigInt安全范围:'+text,token.safe,item['safe'])
        check('V8位模式:'+text,struct.pack('>d',decoded.value).hex(),item['bits'])
    # 固定种子的语法/值差分不包含故意改变的重复键、非字符和下溢。
    rng=random.Random(20261027)
    def random_value(depth=0):
        leaves=[None,True,False,rng.randint(-10000,10000),rng.random(),'', 'é/😀~', '__proto__']
        if depth>=3:return rng.choice(leaves)
        kind=rng.randrange(3)
        if kind==0:return [random_value(depth+1) for _ in range(rng.randrange(5))]
        if kind==1:return {str(i)+'é':random_value(depth+1) for i in range(rng.randrange(5))}
        return rng.choice(leaves)
    for i in range(200):
        raw=json.dumps(random_value(),ensure_ascii=bool(i%2),separators=(',',':')).encode()
        check('标准解析差分'+str(i),thaw(W.decode(raw,broad,slow).value),json.loads(raw))
    shared=W.Schema({'type':'array','items':{'type':'integer'}})
    def parallel(i):
        raw=b'[1.0]' if i%2 else b'[1.0000000000000001]'
        try:W.decode(raw,shared,slow);return bool(i%2)
        except W.WireError as e:return not i%2 and e.reason=='raw_integer' and e.offset==1
    with ThreadPoolExecutor(max_workers=4) as pool:check('64并发上下文隔离',all(pool.map(parallel,range(64))))
    # 新完整图在真实根上消费同一严格integer类型检查，不手写替代产品模型。
    graph=load(SDK/'contracts/event-integration/preview/models.schema.json')
    definitions=graph['$defs'];integer_names=[name for name,node in definitions.items() if node.get('type')=='integer']
    check('完整图有具名整数',bool(integer_names))
    compiled=W.Schema({'$schema':W.PUBLIC,'$defs':definitions,'$ref':'#/$defs/'+integer_names[0]})
    reject('完整图整数拒舍入',lambda:W.decode(b'1.0000000000000001',compiled,slow),'raw_integer')
    reject('完整图整数拒越界',lambda:W.decode(b'9007199254740993',compiled,slow),'integer_range')
    check('完整图原件未改',graph,load(SDK/'contracts/event-integration/preview/models.schema.json'))
    # 映射每一条公开integer类型节点，不以数量相等代替路径对应。
    for pointer in compiled.integer_paths:
        value={'$defs':definitions}
        for part in pointer.split('/')[1:]:value=value[int(part)] if isinstance(value,list) else value[part.replace('~1','/').replace('~0','~')]
        check('整数节点映射:'+pointer,value=='integer' or isinstance(value,list) and 'integer' in value)
    return dict(format='wire-json-check/1',all_passed=True,approved=False,runtime_ready=False,cases_passed=len(checks),checks=checks,
        planned_raw_cases_executed=30,differential_json_cases=200,parallel_decodes=64,node=oracle['node'],
        numeric_cross_language_cases=len(texts),full_graph_integer_nodes=compiled.integer_nodes,
        python=sys.version.split()[0],jsonschema=importlib.metadata.version('jsonschema'),
        product_runtime_tests_executed=0,browser_tests_executed=0,network_tests_executed=0,device_tests_executed=0,
        limitations=['同步参考不提供worker池或让出执行','V8只验证数字算术与位模式，不是完整JS扫描器','业务关联与动态Schema批准仍由可信上层提供'],inputs=inputs())


if __name__=='__main__':
    p=argparse.ArgumentParser();g=p.add_mutually_exclusive_group();g.add_argument('--report',action='store_true');g.add_argument('--check-report',action='store_true');a=p.parse_args()
    if a.check_report:
        r=load(ROOT/'report.json');assert r['all_passed'] and r['inputs']==inputs();print(json.dumps(dict(all_passed=True,bindings=len(r['inputs']))))
    else:
        r=run()
        if a.report:(ROOT/'report.json').write_bytes((json.dumps(r,ensure_ascii=False,indent=2)+'\n').encode('utf8'))
        print(json.dumps({k:v for k,v in r.items() if k not in ('checks','inputs')},ensure_ascii=False))
