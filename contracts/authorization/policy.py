"""逐操作设计分支；未知来源或操作不推导默认授权。"""
from copy import deepcopy


ADDITIONAL_GUARDS={
 'ticket_issue':'当前human向已存在且归属相同会话/client/选择的subscription签发有限一次性票据；Origin与scope取当前交集，不沿用旧无subscription绑定入口',
 'command_namespace':'请求键所属主体、凭据链、Context和目标authority精确匹配；查询原受理结果仍检查当前读取权',
 'seamer_command_owner':'配对Seamer仅访问其权威组织run的automation命令；尚未受理的查原或永久拒收按原请求命名空间和origin归属核验，不要求命令记录预先存在',
 'transfer_cancel':'当前邀请发起者或明确目标管理权；取消不撤回已生效转交、不释放其他持有人',
 'extension_scope':'目标authority中的slot、installation与operation按固定引用关联；创建对象前校验父命名空间和当前管理范围',
 'extension_consent':'审批、权限审阅及角色解析绑定当前产物摘要、修订、人员和批准范围；管理权限不自动生成同意记录',
 'panel_host':'受信宿主调用，当前human与host session、窗口、实例及安装激活世代相同；面板不能直接持有宿主凭据',
 'panel_operation':'session、request、preview及host operation按实际操作的固定引用关联；新建对象校验所属安装和宿主命名空间',
 'panel_method':'invoke及确认提交按固定方法目录检查capability、实体范围、安装批准与当前human权限交集；确认不能替代被代理操作的授权',
 'panel_subscription':'订阅、投影及ACK归属于同一host session与激活/委托代次；可见性下降立即停止旧投影释放',
 'service_subscription':'真实mTLS、当前配对、consumer槽及purpose所有权，scope/profile/selector来自当前注册；每次释放重核集合权限',
 'human_subscription':'当前human会话、client、subscription/snapshot/page/connection属于同一owner与选择；新建时绑定当前owner，后续不扩scope',
 'collection_scope':'按当前注册scope、selector和profile校验集合权限及完整性；逐对象过滤不得伪装完整快照',
 'definition_scope':'精确definition、draft/version、artifact/program/proof与当前可见范围关联；所有读取都检查当前权限',
 'run_retire':'当前human明确退休目标run，目标修订与保护关闭条件成立；退休不删除尚待核销的在途事实',
 'automation_namespace':'RequestKey、Context及原操作归属当前主体/凭据链和authority；查原结果仍需当前对象可见性',
 'origin_peer':'mTLS实际对端为原对象登记的origin服务，当前配对、组织授权及用途成立，不能采用body自报origin',
 'controller_peer':'mTLS实际对端为对象登记的Controller且当前配对用途有效，receipt/withdrawal属于同一准备与延续引用',
 'continuation_scope':'continuation、preparation、grant、run与保护代次按原权威引用关联；查原或保护不得扩大原动作范围',
 'ingress_scope':'provider事件或内部commit属于已登记来源/boot/stream和当前请求身份；查原不接受调用方自报durable'
}

GROUPS={
 'command':{
   'getCommand':'command_scope','getCommandCancellation':'command_scope','getCommandEvidence':'command_scope',
   'getCommandEvidenceRevision':'command_scope','getCommandRevision':'command_scope',
   'submitCommand':None,'lookupCommandAdmission':'command_namespace','rejectCommandAdmission':'command_namespace',
   'cancelCommand':'cancel_target','lookupCommandCancellation':'command_scope'},
 'control':{
   'getControlOperation':'control_scope','getControl':'control_scope','getTransfer':'control_scope',
   'lookupControlRequest':'control_scope','acquireControl':'acquire_target','releaseControl':'release_target',
   'offerTransfer':'offer_target','acceptTransfer':'accept_target','cancelTransfer':'transfer_cancel'},
 'installation':{
   'getExtensionOperation':'extension_scope','getExtensionSlot':'extension_scope','getExtensionInstallation':'extension_scope',
   'lookupExtensionRequest':'extension_scope','createExtensionSlot':'extension_scope','activateExtension':'extension_scope',
   'disableExtension':'extension_scope','enableExtension':'extension_scope','planExtensionChange':'extension_scope',
   'uninstallExtension':'extension_scope','upgradeExtension':'extension_scope','stageExtension':'extension_scope',
   'approveExtension':'extension_consent','resolveExtensionRoles':'extension_consent','reviewExtensionPermissions':'extension_consent'},
 'panel':{
   'getPanelConfirmation':'panel_operation','getPanelSessionOperation':'panel_operation','getPanelSession':'panel_operation',
   'getPanelRequest':'panel_operation','cancelPanelConfirmation':'panel_operation','commitPanelConfirmation':'panel_method',
   'createPanelSession':'panel_operation','activatePanelSession':'panel_operation','closePanelSession':'panel_operation',
   'offerPanelConfirmation':'panel_method','beginPanelHandshake':'panel_operation','preparePanelActivation':'panel_operation',
   'renewPanelSession':'panel_operation','invokePanelMethod':'panel_method'},
 'subscription':{n:'panel_subscription' for n in ['getPanelSubscription','getPanelProjectionFrames','createPanelSubscription','acknowledgePanelProjection','closePanelSubscription']},
 'lifecycle':{
   'getActivationSlot':'run_read','getDraft':'definition_scope','updateDraft':'definition_edit',
   'getIndependenceProof':'proof_visibility','getDefinitionVersion':'definition_scope','getPublishedArtifact':'definition_scope',
   'getCompiledProgram':'definition_scope','getRecoveryOperation':'recovery_visibility','getRunOperation':'run_read',
   'getRun':'run_read','getTriggerDecision':'run_read','getExecution':'run_read','lookupAutomationRequest':'automation_namespace',
   'createDefinition':'definition_edit','publishDefinition':'definition_publish','createRun':'run_create_unarmed',
   'armRun':'arm_approval','disarmRun':'pause_target','pauseRun':'pause_target','preflightRun':'preflight_readonly',
   'previewRecovery':'recovery_readonly','resumeRun':'recovery_confirm','retireRun':'run_retire','updateDefinitionMetadata':'definition_edit'},
 'time_public':{n:'public_projection' for n in ['getClock','getClockAssessment']},
 'time_internal':{n:'internal_object' for n in ['getReferenceTimeAnchor','getReferenceTimeAssessment','getReferenceTimeBundle','getReferenceTimeProfile']},
 'preparation':{n:'continuation_scope' for n in ['prepareAutomation','closePreparation','lookupPreparation']},
 'protection':{n:'continuation_scope' for n in ['protectRunGeneration','lookupRunProtection']},
 'continuation_controller':{n:'continuation_scope' for n in ['issueContinuation','lookupControllerContinuation']},
 'continuation_seamer':{n:'continuation_scope' for n in ['registerContinuation','adoptContinuation','finishContinuation','lookupSeamerContinuation','observeContinuationReceipt','observeContinuationWithdrawal']},
 'ingress':{'readIngressCommit':'ingress_scope','submitProviderEvent':'provider_event','lookupProviderEvent':'ingress_scope'}
}
EVENTS={n:'human_subscription' for n in ['openEvents','getSnapshot','createSubscription','issueWsTicket','getSubscription','closeSubscription','getSubscriptionConnection','getSnapshotPage']}
EVENTS.update({n:'service_subscription' for n in ['internalCreateSubscription','internalGetSubscription','internalCloseSubscription','internalGetSubscriptionConnection','internalGetSnapshot','internalGetSnapshotPage','internalOpenEvents']})
BASELINE={
 'baseline_controller':{'getRevocation','getCapacity','listDevices','getCapabilities','getSceneCatalog','getDeviceState','getMeta','getSession','getSubject','getClockDomainDescriptor','revokeAuthorization','createRequestContext','revokeRunGrant','bootstrap','issueToken','login','refreshSession','introspect','setCapacity','updateRunGrant'},
 'baseline_seamer':{'getRevocation','getCapacity','getMeta','getSession','getSubject','getClockDomainDescriptor','revokeAuthorization','createRequestContext','setCapacity','updateCatalog'}
}


def branches(op,legacy):
    e=op['extensions'];source=e.get('x-composition-source',{}).get('document');name=op['operation_id']
    def branch(profile,guards,origin=None):return dict(profile=profile,origin=origin,guards=guards)
    if source in BASELINE:
        if name not in BASELINE[source]:raise ValueError('未知基线操作')
        return deepcopy(legacy['operations'][op['authority']+':'+name]['branches'])
    if source is None:
        if name=='discoverContracts':return [branch('discovery',[])]
        guard=EVENTS[name]
        profile='internal' if guard=='service_subscription' else 'ticket' if name=='openEvents' else 'human'
        guards=[guard,'collection_scope']
        if name=='openEvents':guards.append('ticket_binding')
        if name=='issueWsTicket':guards.append('ticket_issue')
        return [branch(profile,guards)]
    guard=GROUPS[source][name]
    if source=='command':
        if name=='submitCommand':return [branch('human',['manual_holder'],'manual'),branch('seamer',['automation_grant'],'automation')]
        return [branch('human',[guard]),branch('seamer',[guard,'seamer_command_owner'])]
    if source in ['control','time_public']:return [branch('human',[guard])]
    if source=='installation':return [branch('human',list(dict.fromkeys(['extension_scope',guard])))]
    if source in ['panel','subscription']:return [branch('human',list(dict.fromkeys(['panel_host','panel_operation',guard])))]
    if source=='lifecycle':return [branch(p,[guard]) for p in e['x-subject-kinds']]
    if source=='time_internal':return [branch('internal',[guard])]
    if source=='ingress':return [branch('internal' if name=='readIngressCommit' else 'provider',[guard])]
    if source in ['preparation','protection','continuation_controller','continuation_seamer']:
        peer='controller_peer' if e.get('x-required-peer-role')=='controller' else 'origin_peer'
        return [branch('internal',[peer,guard])]
    raise ValueError('未显式登记的来源')
