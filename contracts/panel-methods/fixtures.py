"""独立合成格式样例，不是授权事实、来源证明或生产输入。"""
from copy import deepcopy
D='sha256:'+'1'*64
CONTROL=dict(epoch='epoch.fixture',version='2')
SCOPE=dict(authority_service_id='seamer.fixture',database_instance_id='db.fixture')
CONTENT=dict(program=dict(kind='rule',trigger_binding_id='trigger.fixture',condition=dict(kind='literal',value=True),
 groups=[dict(mode='sequence',steps=[dict(step_id='delay.fixture',depends_on=[],required=True,failure_policy='stop',kind='delay',delay_ms=1,max_lateness_ms=100)])]),
 selections=[],policy_ref=dict(kind='policy',scope=SCOPE,object_id='policy.fixture',revision='1',digest=D))
CONTROL_ARGS=dict(device_id='device.fixture',expected_control=CONTROL,reason='operator_request')
RUN=dict(run_id='run.fixture',expected_run_revision='2',expected_slot_revision='3')
def examples():
 return deepcopy({
 'controller.getMeta':{},'controller.getClock':{},'controller.listDevices':{'page_handle':'page.fixture'},
 'controller.getCapabilities':{'device_id':'device.fixture'},'controller.getDeviceState':{'device_id':'device.fixture'},
 'controller.submitCommand':dict(device_id='device.fixture',action_id='fixture.action',capability_version='1.0.0',parameters={},
   expected_control=CONTROL,required_completion='effect_verified',preconditions=[],dispatch=dict(mode='immediate',max_queue_ms=100),evidence_timeout_ms=100),
 'controller.getCommand':{'command_id':'command.fixture'},
 'controller.cancelCommand':dict(command_id='command.fixture',expected_state_ref=dict(id='state.fixture',revision='2',digest=D),reason='operator_request'),
 'controller.getControlOperation':{'operation_id':'operation.fixture'},'controller.getControl':{'device_id':'device.fixture'},
 'controller.acquireControl':CONTROL_ARGS,'controller.releaseControl':CONTROL_ARGS,
 'controller.offerTransfer':dict(CONTROL_ARGS,member_handle='member.fixture',offer_ttl_ms=1000),
 'controller.acceptTransfer':dict(CONTROL_ARGS,transfer_id='transfer.fixture'),
 'controller.revokeRunGrant':dict(grant_id='grant.fixture',expected_revision='2',reason='operator_request'),
 'controller.getClockAssessment':{},'controller.getCapacity':{},'controller.getSceneCatalog':{'device_id':'device.fixture'},
 'controller.getCommandEvidence':dict(command_id='command.fixture',state_revision='2',page_handle='page.fixture',limit=10),
 'seamer.getMeta':{},'seamer.getClock':{},
 'seamer.createDefinition':dict(content=CONTENT,metadata=dict(name='fixture',description='',layout={})),
 'seamer.updateDraft':dict(definition_id='definition.fixture',expected_draft_revision='2',content=CONTENT),
 'seamer.publishDefinition':dict(definition_id='definition.fixture',expected_draft_revision='2',expected_content_digest=D,expected_selection_digest=D),
 'seamer.createRun':dict(definition_id='definition.fixture',definition_version='2',expected_artifact_ref=dict(kind='artifact',scope=SCOPE,object_id='artifact.fixture',revision='2',digest=D)),
 'seamer.getRun':{'run_id':'run.fixture'},'seamer.preflightRun':RUN,'seamer.armRun':dict(RUN,assessment_handle='assessment.fixture'),
 'seamer.pauseRun':dict(run_id='run.fixture',expected_run_revision='2',reason_code='operator_request'),
 'seamer.previewRecovery':RUN,'seamer.resumeRun':dict(RUN,recovery_handle='recovery.fixture'),
 'seamer.getClockAssessment':{},'seamer.getCapacity':{},'seamer.getRecoveryOperation':{'operation_id':'recovery.fixture'},
 'seamer.getIndependenceProof':dict(definition_id='definition.fixture',proof_id='proof.fixture',revision='2')})
