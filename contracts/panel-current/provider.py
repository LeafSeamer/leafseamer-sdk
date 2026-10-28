"""动态值提供者隔离参考；权威快照由可信宿主提供，不开放配置写入API。"""
import copy
import hashlib
import importlib.util
import json
import subprocess
import sys
import threading
from importlib.metadata import version,PackageNotFoundError
from pathlib import Path
import rfc8785
from jsonschema import Draft202012Validator,FormatChecker

ROOT=Path(__file__).resolve().parent;SDK=ROOT.parents[1]
spec=importlib.util.spec_from_file_location('fixed_bundle_profile',ROOT/'source/check_bundle.py')
B=importlib.util.module_from_spec(spec);spec.loader.exec_module(B)
MODELS=json.loads((SDK/'contracts/panel-wire/contract/models.schema.json').read_bytes())
SELECTION=json.loads((SDK/'contracts/panel-wire/contract/selection.json').read_bytes())
REGISTRY=json.loads((SDK/'contracts/panel-wire/contract/method-registry.json').read_bytes())
OLD=json.loads((ROOT/'source/bundle.schema.json').read_bytes())
METHODS={m['method'] for m in REGISTRY['registry']['methods']}
_source_spec=importlib.util.spec_from_file_location('current_publication_store',SDK/'contracts/publication-current/store.py')
PUBLICATION=importlib.util.module_from_spec(_source_spec);_source_spec.loader.exec_module(PUBLICATION)
CONTEXT_KEYS={'selection','public_binding','activation_ref','installation_ref','approval_ref','authorization_ref','source_ref','input_digest','method','slot','binding_key','purpose','access'}
class Unavailable(ValueError):pass
def need(ok,reason):
    if not ok:raise Unavailable(reason)
def canonical(v):return rfc8785.dumps(v)
def digest(v):return hashlib.sha256(canonical(v)).hexdigest()
def shape(name,value):
    need(Draft202012Validator({'$defs':MODELS['$defs'],'$ref':'#/$defs/'+name}).is_valid(value),'context_shape')
def profile(patterns=(),formats=(),timeout_ms=2000):
    implementations={}
    for name in formats:
        if name=='uuid':implementations[name]='python-stdlib/'+sys.version.split()[0]
        elif name=='date-time':
            try:implementations[name]='rfc3339-validator/'+version('rfc3339-validator')
            except PackageNotFoundError as e:raise Unavailable('format_implementation') from e
        else:raise Unavailable('format_implementation')
    return dict(profile_id='panel-form-jsonschema-1',revision='1',engine='python-jsonschema',
        engine_version=version('jsonschema'),referencing_version=version('referencing'),python_version=sys.version.split()[0],format_implementations=implementations,approved_patterns=sorted(set(patterns)),
        approved_formats=sorted(set(formats)),value_bytes=262144,value_nodes=32768,value_depth=48,timeout_ms=timeout_ms)
def profile_ref(p):return dict(profile_id=p['profile_id'],revision=p['revision'],digest=digest(p))
def validate_profile(p):
    need(set(p)==set(profile()),'profile_fields')
    need(p==profile(p['approved_patterns'],p['approved_formats'],p['timeout_ms']),'profile_engine_or_limits')
    need(type(p['timeout_ms']) is int and 100<=p['timeout_ms']<=5000,'profile_timeout')
    need(set(p['approved_formats'])<= {'date-time','uuid'} and set(p['approved_formats'])<=set(FormatChecker().checkers),'format_implementation')
    need(all(type(x) is str and len(x)<=1024 for x in p['approved_patterns']),'pattern_budget')
def context(value,manifest):
    need(set(value)==CONTEXT_KEYS,'context_fields');need(value['selection']==SELECTION,'selection')
    shape('panel__Channel_PublicBinding',value['public_binding']);shape('panel__Channel_ActivationRef',value['activation_ref'])
    for key in ['installation_ref','approval_ref','authorization_ref','source_ref']:shape('panel__Channel_ObjectRef',value[key])
    a=value['activation_ref']
    need(a['registry_ref']==manifest['registry_ref']==REGISTRY['registry_ref'] and a['scope_revision']==manifest['scope_revision'],'activation_registry_scope')
    need(a['bundle_ref']==dict(bundle_id=manifest['bundle_id'],manifest_digest=manifest['manifest_digest']),'activation_bundle')
    need(value['method'] in METHODS and type(value['slot']) is str and 0<len(value['slot'])<=256,'method_slot')
    need(any(e['binding_key']==value['binding_key'] and e['purpose']==value['purpose'] for e in manifest['exports']),'binding_key_or_purpose')
    need(value['access'] in ['read','write'] and type(value['input_digest']) is str and len(value['input_digest'])==64 and all(c in '0123456789abcdef' for c in value['input_digest']),'input_or_access')
def nodes(value,p):
    """返回严格JSON Pointer节点全集，容器本身也需要权限；不产生裁剪副本。"""
    todo=[('',value,0)];paths=set();chars=0
    while todo:
        path,v,depth=todo.pop();need(depth<=p['value_depth'] and len(paths)<p['value_nodes'],'value_budget');paths.add(path)
        if type(v) is dict:
            need(all(type(k) is str for k in v),'object_key');chars+=sum(map(len,v))
            todo.extend((path+'/'+k.replace('~','~0').replace('/','~1'),x,depth+1) for k,x in v.items())
        elif type(v) is list:todo.extend((path+'/'+str(i),x,depth+1) for i,x in enumerate(v))
        else:
            need(v is None or type(v) in [str,bool,int,float],'json_value')
            if type(v) is str:chars+=len(v)
        need(chars<=p['value_bytes'],'character_budget')
    try:raw=canonical(value)
    except (ValueError,TypeError,OverflowError) as e:raise Unavailable('json_number') from e
    need(len(raw)<=p['value_bytes'],'value_bytes');return paths
def check_paths(paths):
    need(type(paths) is list and len(paths)<=32768 and all(type(p) is str for p in paths),'field_policy')
    need(paths==sorted(set(paths)),'field_policy_order')
    for path in paths:
        need(path=='' or path.startswith('/'),'field_pointer')
        # 不允许非法转义或通配符；字面星号作为普通键仍可使用精确路径。
        for token in path.split('/')[1:]:
            i=0
            while i<len(token):
                if token[i]=='~':need(i+1<len(token) and token[i+1] in '01','field_pointer');i+=1
                i+=1
def instance(documents,reference,value,p):
    payload=dict(documents=documents,schema_ref=reference,value=value,formats=p['approved_formats'])
    try:
        result=subprocess.run([sys.executable,'-I','-B',str(ROOT/'worker.py')],input=canonical(payload),capture_output=True,timeout=p['timeout_ms']/1000)
    except subprocess.TimeoutExpired as e:raise Unavailable('validator_timeout') from e
    need(result.returncode==0 and result.stdout==b'{"valid":true}', 'instance_invalid')
class Candidate:
    """仅进程内对象，不可用面板自报JSON代替。"""
    __slots__=()
class Authority:
    def __init__(self,approved_context,manifest,documents,approved_profile,allowed_paths):
        # 此入口只能由可信安装/字段权威调用；这些参数不是用户提交证明。
        validate_profile(approved_profile);check_paths(allowed_paths)
        context(approved_context,manifest);shape('panel__Bundle_Manifest',manifest)
        need(manifest['profile_ref']==profile_ref(approved_profile),'profile_ref')
        c=dict(authorized=True,approval_active=True,**{k:manifest[k] for k in ['manifest_digest','registry_ref','scope_revision','profile_ref','exports']},
               approved_patterns=approved_profile['approved_patterns'],approved_formats=approved_profile['approved_formats'])
        raws={sid:canonical(doc) for sid,doc in documents.items()}
        need(not B.bundle_errors(manifest,raws,c,OLD),'bundle_invalid')
        self._context=copy.deepcopy(approved_context);self._documents=copy.deepcopy(documents);self._manifest=copy.deepcopy(manifest)
        self._profile=copy.deepcopy(approved_profile);self._paths=set(allowed_paths);self._lock=threading.Lock();self._generation=0;self._active=True;self._pending={};self._inflight=0
    def revoke(self):
        with self._lock:self._active=False;self._generation+=1;self._pending.clear()
    def prepare(self,current_context,qualified):
        with self._lock:
            need(self._active and current_context==self._context,'authority_stale');generation=self._generation
            need(len(self._pending)<64,'pending_budget')
            need(self._inflight==0,'validator_busy');self._inflight=1
        try:
            need(type(qualified) is dict and set(qualified)=={'schema_ref','value'},'qualified_shape')
            export=next(e for e in self._manifest['exports'] if e['binding_key']==self._context['binding_key'])
            need(qualified['schema_ref']==export['schema_ref'],'export_binding')
            # 先复制以阻止调用者在异步验证期间改值；没有默认值、强转或删字段。
            nodes(qualified['value'],self._profile);value=copy.deepcopy(qualified)
            need(nodes(value['value'],self._profile)<=self._paths,'field_denied')
            instance(self._documents,export['schema_ref'],value['value'],self._profile)
            with self._lock:return self._offer(current_context,generation,value)
        finally:
            with self._lock:self._inflight=0
    def _offer(self,current_context,generation,value):
        need(self._active and generation==self._generation and current_context==self._context,'authority_stale')
        need(len(self._pending)<64,'pending_budget')
        candidate=Candidate();self._pending[candidate]=(generation,canonical(value));return candidate
    def prepare_reference(self,current_context):
        with self._lock:
            reference=next(e['schema_ref'] for e in self._manifest['exports'] if e['binding_key']==self._context['binding_key'])
            return self._offer(current_context,self._generation,reference)
    def consume(self,current_context,candidate):
        # 只在本参考内检查消费；生产必须在最终输出Gate内重核真实权威并交付。
        with self._lock:
            need(self._active and current_context==self._context,'authority_stale')
            need(type(candidate) is Candidate and candidate in self._pending,'candidate_binding')
            generation,raw=self._pending.pop(candidate);need(generation==self._generation,'candidate_binding');return json.loads(raw)

class PublicationAuthority:
    """发布内容只从固定原件提取；构造参数由可信当前读权宿主提供。"""
    def __init__(self,approved_context,manifest,documents,approved_profile,allowed_paths,published,source_selection,component):
        need(component in ['content','metadata'],'publication_component')
        need(approved_context.get('method')=='seamer.publishDefinition' and approved_context.get('access')=='read' and
             approved_context.get('purpose')=='definition' and approved_context.get('slot')=='/'+component,'publication_usage')
        need(source_selection in [PUBLICATION.SELECTION,PUBLICATION.LEGACY_SELECTION],'publication_selection')
        PUBLICATION.bounded(published)
        PUBLICATION.VALIDATOR.evolve(schema={'$ref':'#/$defs/lifecycle__PublishedVersion','$defs':PUBLICATION.SCHEMA['$defs']}).validate(published)
        self._authority=Authority(approved_context,manifest,documents,approved_profile,allowed_paths)
        self._context=copy.deepcopy(approved_context);self._published=copy.deepcopy(published)
        self._source_selection=copy.deepcopy(source_selection);self._component=component
        self._reference=copy.deepcopy(next(e['schema_ref'] for e in manifest['exports'] if e['binding_key']==approved_context['binding_key']))
        source=approved_context['source_ref'];scope=published['scope']
        need(source['authority_service_id']==scope['authority_service_id'] and source['database_instance_id']==scope['database_instance_id'] and
             source['entity_kind']=='publication_source' and source['entity_id']==published['definition_id'] and source['revision']==published['definition_version'],'publication_source_identity')
    def revoke(self):self._authority.revoke()
    def prepare(self,db,current_context):
        # 未提交记录即使同连接可见也不可成为面板候选；不替调用方结束事务。
        need(not db.in_transaction,'publication_transaction')
        need(current_context==self._context,'authority_stale')
        read=PUBLICATION.read_current if self._source_selection==PUBLICATION.SELECTION else PUBLICATION.read_history
        record=read(db,self._published,self._source_selection)
        need(record['record_digest']=='sha256:'+current_context['source_ref']['content_digest'],'publication_source_digest')
        value=record['source'][self._component]
        # 没有调用方自报value、替换草稿或裁剪接口；当前批准Schema仍独立验证历史值。
        return self._authority.prepare(current_context,dict(schema_ref=self._reference,value=value))
    def consume(self,current_context,candidate):return self._authority.consume(current_context,candidate)
