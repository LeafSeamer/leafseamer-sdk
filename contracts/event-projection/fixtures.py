"""手工定义的合成命令；不含运行凭据或真实设备数据。"""
import copy
import model as M

D='sha256:'+'a'*64
S=dict(authority_service_id='controller',database_instance_id='database')
def ref(name): return dict(id=name,revision='1',digest=D)


def seal(record):
    record['state_ref']=dict(id=record['command_id'],revision=record['state']['revision'],digest=M.digest(record['state']))
    record['evidence_index']['state_ref']=copy.deepcopy(record['state_ref'])
    record['record_digest']=M.digest({k:v for k,v in record.items() if k!='record_digest'})
    return record


def base():
    state=dict(command_id='command',scope=copy.deepcopy(S),revision='1',phase='queued',outcome='pending',
        effect_status='not_sent',resource_status='clear',automation_continuation='eligible',reason_code=None,
        terminal_revision=None,resolution_ref=None,completion_evidence_refs=[],resource_evidence_refs=[],attempt_ids=[])
    policy=dict(command_id='command',scope=copy.deepcopy(S),device_id='device',admission_ref=ref('admission'),
        required_completion='effect_verified',completion_policy_ref=ref('completion-policy'),release_policy_ref=ref('release-policy'),
        retry_policy_ref=None,max_attempts=1,original_deadline_ref=ref('deadline'),conflict_scope='whole_device')
    key=dict(target_scope=copy.deepcopy(S),issuer_id='issuer',issuer_epoch='issuer-epoch',principal_id='operator',
             request_epoch='request-epoch',operation_id='createCommand',idempotency_key='request-key')
    r=dict(command_id='command',scope=copy.deepcopy(S),revision='1',
        initial_command_ref=dict(kind='command',scope=copy.deepcopy(S),object_id='command',revision='1',digest=D),
        request_identity=dict(key=key,request_digest=D),target=dict(device_id='device',action_id='obs.program_scene.set',capability_version='1.0.0'),
        actor=dict(principal_id='operator',session_id='session',authorization_revision='1',issuer_id='issuer',issuer_epoch='issuer-epoch',local_subject_id='local'),
        origin='manual',run_binding=None,automation_binding=None,accepted_at='2026-10-27T00:00:00.000Z',
        dispatch=dict(mode='immediate',max_queue_ms=1000),control_binding=dict(epoch='control',version='1'),
        policy=policy,state_ref=ref('command'),state=state,
        completion=dict(required='effect_verified',achieved=None,policy_ref=ref('completion-policy'),evidence_refs=[]),
        attempts=[],cancellation=None,evidence_index=dict(snapshot_ref=ref('evidence-snapshot'),state_ref=ref('command'),total='0'),record_digest='')
    return seal(r)


def context(record):
    return M.TrustedRead(M.source_ref(record),'device','command-epoch','human',frozenset({'command.read'}),True,True,True,False,False)


def unknown(clear=False):
    r=base();r['revision']='9007199254740993'
    r['state'].update(revision=r['revision'],phase='finished',outcome='unknown',effect_status='possible',
        resource_status='clear' if clear else 'unresolved',automation_continuation='paused_latched',
        reason_code='effect_unproven',terminal_revision='9007199254740992',
        resolution_ref=ref('resolution') if clear else None,resource_evidence_refs=[ref('resource-proof')] if clear else [])
    r['cancellation']=dict(operation_ref=ref('cancellation'),state='indeterminate',future_writes='indeterminate',reason_code='closure_unproven')
    return seal(r)


def automation():
    r=base();r['origin']='automation'
    origin=dict(authority_service_id='seamer',database_instance_id='seamer-db')
    r['run_binding']=dict(run_id='run',definition_version='1',grant_id='grant',grant_revision='1',
        arm_generation='1',step_id='step',logical_action_id='action')
    r['automation_binding']=dict(origin_scope=origin,run_id='run',definition_version='1',arm_generation='1',
        execution_id='execution',execution_binding_ref=dict(kind='execution_binding',scope=origin,object_id='binding',revision='1',digest=D),
        step_id='step',logical_action_id='action',binding_version='continuation-execution/0.1.0-draft.1',
        authorization_mode='preparation',continuation=None)
    return seal(r)
