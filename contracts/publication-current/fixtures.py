"""纯合成原件；不提供编译可信性、当前读权或设备资格。"""
import copy
from store import digest,freeze,SELECTION

def example():
    scope=dict(authority_service_id='seamer.synthetic',database_instance_id='database.synthetic')
    h='sha256:'+'a'*64
    policy=dict(kind='policy',scope=scope,object_id='policy',revision='1',digest=h)
    content=dict(program=dict(kind='rule',trigger_binding_id='event',condition=dict(kind='literal',value=True),groups=[dict(mode='sequence',steps=[
        dict(kind='delay',step_id='delay',depends_on=[],required=True,failure_policy='stop',delay_ms=0,max_lateness_ms=1000)])]),
        selections=[dict(binding_id='event',kind='input',content_ref=dict(id='selected',revision='1',digest=h))],policy_ref=policy)
    draft=dict(scope=copy.deepcopy(scope),definition_id='definition',revision='7',content=content,content_digest=digest(content),selection_digest=digest(content['selections']),
        metadata_revision='11',metadata=dict(name='发布时名称',description='合成内容',layout={'position':{'x':1,'y':2}}))
    published=dict(scope=copy.deepcopy(scope),definition_id='definition',definition_version='3',source_draft_revision='7',
        artifact_ref=dict(kind='artifact',scope=copy.deepcopy(scope),object_id='artifact',revision='1',digest=h),program_digest=h,bindings_digest=h,published_by='publisher.synthetic')
    return freeze(published,draft,SELECTION)
