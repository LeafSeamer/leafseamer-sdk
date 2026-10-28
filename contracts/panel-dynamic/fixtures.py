"""合成可信宿主配置；不代表真实安装审批或字段权威。"""
import copy
import provider as P

FORM='urn:leafseamer:panel-schema:form'
TYPES='urn:leafseamer:panel-schema:types'
def obj(**properties):return dict(type='object',properties=properties,required=list(properties),additionalProperties=False)
def document(shape):return {'$schema':P.B.DIALECT,'$id':FORM,'$defs':{'Value':shape}}
def fixture(value=None,documents=None,profile=None):
    if value is None:value={'device':{'level':3,'labels':['ok']}}
    if documents is None:
        documents={FORM:document(obj(device=obj(level={'$ref':TYPES+'#Level'},labels=dict(type='array',items={'type':'string'},maxItems=3)))),
                   TYPES:{'$schema':P.B.DIALECT,'$id':TYPES,'$defs':{'Level':{'$anchor':'Level','type':'integer','minimum':0,'maximum':10}}}}
    p=profile or P.profile();reference=dict(schema_id=FORM,definition='Value',schema_digest=P.digest(documents[FORM]))
    resources=[]
    for sid,doc in sorted(documents.items()):
        raw=P.canonical(doc);chunks=[raw[n:n+16384] for n in range(0,len(raw),16384)]
        resources.append(dict(schema_id=sid,document_digest=P.digest(doc),canonical_bytes=len(raw),chunks=[dict(index=i,byte_count=len(b),digest=P.B.sha(b)) for i,b in enumerate(chunks)]))
    m=dict(format_version='panel-schema-bundle/0.1.0-draft.1',bundle_id='synthetic.bundle',bundle_revision='1',registry_ref=copy.deepcopy(P.REGISTRY['registry_ref']),scope_revision='2',
        profile_ref=P.profile_ref(p),dialect=P.B.DIALECT,resources=resources,exports=[dict(binding_key='device.state',purpose='state',schema_ref=reference)])
    m['manifest_digest']=P.digest(m)
    def ref(kind):return dict(authority_service_id='controller.synthetic',database_instance_id='database.synthetic',entity_kind=kind,entity_id=kind,entity_epoch='epoch.1',revision='1',content_digest='1'*64)
    c=dict(selection=copy.deepcopy(P.SELECTION),public_binding=dict(panel_session_id='session',panel_instance_id='panel',document_generation='1',channel_id='channel',protocol_version='panel-channel/0.3.0-draft.1'),
        activation_ref=dict(activation_id='activation',registry_ref=copy.deepcopy(P.REGISTRY['registry_ref']),scope_revision='2',bundle_ref=dict(bundle_id=m['bundle_id'],manifest_digest=m['manifest_digest'])),
        installation_ref=ref('installation'),approval_ref=ref('approval'),authorization_ref=ref('authorization'),source_ref=ref('observation'),
        input_digest=P.digest({'device_id':'device.synthetic'}),method='controller.getDeviceState',slot='/values',binding_key='device.state',purpose='state',access='read')
    return dict(context=c,manifest=m,documents=documents,profile=p,paths=sorted(P.nodes(value,p)),qualified=dict(schema_ref=reference,value=value))
def authority(f):return P.Authority(f['context'],f['manifest'],f['documents'],f['profile'],f['paths'])
