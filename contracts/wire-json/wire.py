"""阶段0受限JSON入口参考；不提供认证、传输重组或设备执行。"""
from dataclasses import dataclass
import copy
import json
import math
import re
import time
from types import MappingProxyType
from jsonschema import Draft202012Validator, FormatChecker, validators
from referencing import Registry, Resource
from referencing.exceptions import NoSuchResource, Unresolvable

PUBLIC = 'https://json-schema.org/draft/2020-12/schema'
PRIVATE = 'urn:leafseamer:reference:raw-integer:1'
NUMBER = re.compile(r'-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?')
MAX_SAFE = '9007199254740991'


class WireError(ValueError):
    def __init__(self, stage, reason, offset=None):
        self.stage, self.reason, self.offset = stage, reason, offset
        super().__init__(reason)

    def public(self):
        return dict(stage=self.stage, reason_code=self.reason,
                    **({} if self.offset is None else {'byte_offset': self.offset}))


@dataclass(frozen=True)
class Profile:
    max_message_bytes: int = 65536
    max_depth: int = 32
    max_value_nodes: int = 16384
    max_object_members: int = 4096
    max_key_utf8_bytes: int = 1024
    max_string_utf8_bytes: int = 32768
    max_number_chars: int = 128
    max_exponent_abs: int = 4096
    slice_units: int = 4096
    parse_deadline_ms: int = 100

    def __post_init__(self):
        ceilings = (8388608,64,1048576,65536,4096,8388608,128,4096,4096,5000)
        if any(type(v) is not int or not 1 <= v <= cap for v,cap in zip(vars(self).values(),ceilings)):
            raise WireError('profile','profile_bounds')
        if not self.max_key_utf8_bytes <= self.max_string_utf8_bytes <= self.max_message_bytes:
            raise WireError('profile','profile_order')


@dataclass(frozen=True)
class Token:
    pointer: str
    start: int
    end: int
    text: str
    negative: bool
    coefficient: str
    exponent: int
    integer: bool
    safe: bool


def numeric(text, pointer, start, end, profile):
    if len(text) > profile.max_number_chars:
        raise WireError('scan','number_budget',start)
    parts = re.split('[eE]',text.lstrip('-'))
    exponent = int(parts[1]) if len(parts)==2 else 0
    if abs(exponent) > profile.max_exponent_abs:
        raise WireError('scan','number_budget',start)
    whole, _, fraction = parts[0].partition('.')
    digits = (whole+fraction).lstrip('0')
    exponent -= len(fraction)
    if digits:
        trailing = len(digits)-len(digits.rstrip('0'))
        digits = digits.rstrip('0'); exponent += trailing
    else:
        digits, exponent = '0', 0
    integer = digits=='0' or exponent>=0
    size = len(digits)+exponent
    safe = integer and (size<len(MAX_SAFE) or (size==len(MAX_SAFE) and digits+'0'*exponent<=MAX_SAFE))
    value = float(text)
    if not math.isfinite(value):raise WireError('scan','nonfinite',start)
    if value==0 and digits!='0':raise WireError('scan','number_underflow',start)
    return Token(pointer,start,end,text,text.startswith('-'),digits,exponent,integer,safe)


class RawNumber(float):
    def __new__(cls, token):
        value = super().__new__(cls,token.text)
        value.token = token
        return value


def integer_type(checker, value):
    if isinstance(value,RawNumber):return value.token.integer and value.token.safe
    return type(value) is int and abs(value)<=int(MAX_SAFE)


RawValidator = validators.extend(Draft202012Validator,
    type_checker=Draft202012Validator.TYPE_CHECKER.redefine('integer',integer_type))
RawValidator.META_SCHEMA = copy.deepcopy(Draft202012Validator.META_SCHEMA)
RawValidator.META_SCHEMA['$id'] = PRIVATE
validators.validates(PRIVATE)(RawValidator)


class Schema:
    """仅由可信路由安装；不从请求中选择Schema或放宽Profile。"""
    def __init__(self, source):
        Draft202012Validator.check_schema(source)
        self.source = copy.deepcopy(source)
        self.derived = copy.deepcopy(source)
        # 仅遍历Schema位置，const/default/examples等业务数据不参与转换。
        maps = ('$defs','properties','patternProperties','dependentSchemas')
        lists = ('allOf','anyOf','oneOf','prefixItems')
        singles = ('items','contains','additionalProperties','unevaluatedProperties',
                   'unevaluatedItems','propertyNames','not','if','then','else','contentSchema')
        stack=[(self.derived,'')]; count=0; integer_paths=[]
        while stack:
            node,path=stack.pop(); count+=1
            if count>262144:raise WireError('schema','schema_budget')
            if isinstance(node,bool):continue
            if '$schema' in node:
                if node['$schema'] not in (PUBLIC,PUBLIC+'#'):raise WireError('schema','dialect')
                node['$schema']=PRIVATE
            for key in ('$ref','$dynamicRef'):
                if key in node and not node[key].startswith('#'):
                    raise WireError('schema','external_reference')
            typ=node.get('type',[])
            if typ=='integer' or isinstance(typ,list) and 'integer' in typ:integer_paths.append(path+'/type')
            for key in maps:
                stack.extend((v,path+'/'+key+'/'+k.replace('~','~0').replace('/','~1')) for k,v in node.get(key,{}).items())
            for key in lists:stack.extend((v,path+'/'+key+'/'+str(i)) for i,v in enumerate(node.get(key,[])))
            for key in singles:
                if key in node:stack.append((node[key],path+'/'+key))
        self.integer_paths=tuple(sorted(integer_paths)); self.integer_nodes=len(integer_paths)
        def unavailable(uri):raise NoSuchResource(ref=uri)
        self.validator=RawValidator(self.derived,registry=Registry(retrieve=unavailable),format_checker=FormatChecker())

    def validate(self, value):
        try:error=next(self.validator.iter_errors(value),None)
        except Unresolvable:raise WireError('schema','unresolved_reference') from None
        except RecursionError:raise WireError('schema','schema_budget') from None
        if error is None:return
        # 不将动态键、值、Schema正文或库异常消息暴露给调用方。
        pending=[error]
        while pending:
            item=pending.pop();pending.extend(item.context)
            if item.validator=='type' and isinstance(item.instance,RawNumber):
                typ=item.validator_value
                if typ=='integer' or isinstance(typ,list) and 'integer' in typ:
                    t=item.instance.token
                    if not t.integer:raise WireError('schema','raw_integer',t.start)
                    if not t.safe:raise WireError('schema','integer_range',t.start)
        raise WireError('schema','schema_rejected')


@dataclass(frozen=True)
class Decoded:
    value: object
    # 内部审计材料，不得作为公共错误、日志或事件直接输出。
    numbers: tuple


def decode(raw, schema, profile=Profile(), *, clock=time.monotonic_ns, cancelled=lambda:False):
    if type(raw) is not bytes:raise WireError('input','immutable_bytes_required')
    if not isinstance(schema,Schema) or type(profile) is not Profile:raise WireError('input','trusted_configuration')
    if not 0<len(raw)<=profile.max_message_bytes:raise WireError('scan','message_budget')
    started=clock(); previous=started
    if type(started) is not int:raise WireError('scan','clock_invalid')
    def checkpoint():
        nonlocal previous
        now=clock()
        if type(now) is not int or now<previous:raise WireError('scan','clock_invalid')
        previous=now
        if cancelled():raise WireError('scan','cancelled')
        if now-started>=profile.parse_deadline_ms*1000000:raise WireError('scan','deadline')
    checkpoint()
    if raw.startswith(b'\xef\xbb\xbf'):raise WireError('scan','bom',0)
    try:text=raw.decode('utf8',errors='strict')
    except UnicodeDecodeError as error:raise WireError('scan','utf8',error.start) from None
    offsets=[0]; units=0
    for char in text:
        offsets.append(offsets[-1]+len(char.encode('utf8')));units+=1
        if units%profile.slice_units==0:checkpoint()
    n=len(text);i=0;nodes=0;tokens=[];stack=[];root=False;steps=0
    def fail(reason,pos=None):raise WireError('scan',reason,offsets[i if pos is None else pos])
    def string(key=False):
        nonlocal i,steps
        start=i;i+=1
        while i<n:
            c=text[i];i+=1;steps+=1
            if steps%profile.slice_units==0:checkpoint()
            if c=='"':break
            if c=='\\':
                if i>=n:fail('json_grammar')
                escape=text[i];i+=1
                if escape=='u':
                    if i+4>n or not re.fullmatch('[0-9a-fA-F]{4}',text[i:i+4]):fail('json_grammar')
                    i+=4
                elif escape not in '"\\/bfnrt':fail('json_grammar')
            elif ord(c)<32:fail('json_grammar',i-1)
        else:fail('json_grammar')
        value=json.loads(text[start:i])
        for char in value:
            cp=ord(char)
            if 0xd800<=cp<=0xdfff:fail('unicode_scalar',start)
            if 0xfdd0<=cp<=0xfdef or cp&0xffff in (0xfffe,0xffff):fail('unicode_noncharacter',start)
        limit=profile.max_key_utf8_bytes if key else profile.max_string_utf8_bytes
        if len(value.encode('utf8'))>limit:fail('key_budget' if key else 'string_budget',start)
        return value
    while True:
        steps+=1
        if steps%profile.slice_units==0:checkpoint()
        while i<n and text[i] in ' \t\r\n':
            i+=1;steps+=1
            if steps%profile.slice_units==0:checkpoint()
        if not stack and root:
            if i!=n:fail('trailing_data')
            break
        pointer=''
        if stack:
            f=stack[-1];kind,state=f['kind'],f['state']
            if state=='comma':
                if i<n and text[i]==('}' if kind=='object' else ']'):i+=1;stack.pop();continue
                if i>=n or text[i]!=',':fail('json_grammar')
                i+=1;f['state']='key_required' if kind=='object' else 'value_required';continue
            if kind=='object' and state in ('first','key_required'):
                if state=='first' and i<n and text[i]=='}':i+=1;stack.pop();continue
                if i>=n or text[i]!='"':fail('json_grammar')
                key_start=i;key=string(True)
                if key in f['keys']:fail('duplicate_key',key_start)
                f['keys'].add(key)
                if len(f['keys'])>profile.max_object_members:fail('member_budget',key_start)
                f['key']=key;f['state']='colon';continue
            if state=='colon':
                if i>=n or text[i]!=':':fail('json_grammar')
                i+=1;f['state']='value_required';continue
            if kind=='array' and state=='first' and i<n and text[i]==']':i+=1;stack.pop();continue
            suffix=f['key'].replace('~','~0').replace('/','~1') if kind=='object' else str(f['index'])
            pointer=f['pointer']+'/'+suffix;f['state']='comma'
            if kind=='array':f['index']+=1
        else:root=True
        nodes+=1
        if nodes>profile.max_value_nodes:fail('node_budget')
        if i>=n:fail('json_grammar')
        c=text[i]
        if c in '{[':
            if len(stack)+1>profile.max_depth:fail('depth_budget')
            stack.append(dict(kind='object' if c=='{' else 'array',state='first',keys=set(),index=0,pointer=pointer));i+=1
        elif c=='"':string()
        elif c=='-' or c in '0123456789':
            match=NUMBER.match(text,i)
            if match is None:fail('json_grammar')
            end=match.end()
            if end<n and text[end] not in ' \t\r\n,]}':fail('json_grammar',end)
            tokens.append(numeric(match.group(),pointer,offsets[i],offsets[end],profile));i=end
        else:
            literal=next((v for v in ('true','false','null') if text.startswith(v,i)),None)
            if literal is None:fail('json_grammar')
            i+=len(literal)
    checkpoint()
    number_iter=iter(tokens)
    def number(token_text):
        token=next(number_iter)
        if token.text!=token_text:raise WireError('parse','token_mismatch')
        return RawNumber(token)
    try:value=json.loads(text,parse_int=number,parse_float=number)
    except (ValueError,StopIteration):raise WireError('parse','parser_disagreement') from None
    if next(number_iter,None) is not None:raise WireError('parse','token_mismatch')
    checkpoint();schema.validate(value);checkpoint()
    def freeze(v):
        if isinstance(v,dict):return MappingProxyType({k:freeze(x) for k,x in v.items()})
        if isinstance(v,list):return tuple(freeze(x) for x in v)
        if isinstance(v,RawNumber):return float(v)
        return v
    result=Decoded(freeze(value),tuple(tokens));checkpoint()
    return result
