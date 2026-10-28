"""逐视图来源与转换计划；不实例化权威提供者。"""
PROVIDERS={
'session': '当前宿主会话、激活与安装批准；固定方法功能交集及仅本会话容量',
'page': '当前会话/方法/输入/过滤条件/对象修订/选择绑定的页句柄存储；不能透传cursor',
'dynamic': '当前批准Schema、完整字段权限及预算；动态数据通过完整校验后才生成QualifiedValue，完整编辑数据不得裁剪',
'visibility': '当前对象读权与范围；逐项白名单重建，隐藏对象保留风险布尔标志，不返回未授权数量',
'identity': '当前本地主体与原主体完整issuer/epoch/principal关系，输出self/other/none和受限显示标签',
'control': '同快照当前控制原件及当前闸；比较operation目标和完整控制版本，不能仅从effective推断ready',
'command': '同命令State、取消、资源处置及证据原件，精确Ref联接；unknown清资源后仍保持锁存',
'definition': '固定draft或published artifact的完整content/metadata与编译证明，禁止用当前草稿替代已发布原件',
'execution': '同run/operation的完整执行与命令登记，包括已终结及未决；不由unresolved子集推导全部新命令',
'targets': '完整目标准备/保护原件及当前可见性，保留pending/applied/closing/closed/unknown，不把受理当全体完成',
'handle': '原评估/恢复记录及当前会话的固定不透明句柄；到期或换代不续用，显示值不能作为执行凭据',
'deadline': '来源Lifetime或clock加issued/expires及同域当前tick；向下取整剩余毫秒，未知返回null，不把tick伪装UTC',
'vocabulary': '固定受控原因和标签词表；未知内部错误映射有限unavailable，不暴露自由文本或内部details',
'proof': '原definition/version/proof登记与精确revision，program/bindings/graph摘要关系，verdict直接取原证明'
}

def plan(model,direct,derived,relation):
 return dict(model=model,direct={x.split('=')[0]:x.split('=')[-1] for x in direct.split()},derived=derived,relation=relation)
def field(provider,paths,rule):return dict(provider=provider,paths=paths.split() if paths else [],rule=rule)

PLANS={
'MetaView':plan('baseline__Meta','component_version protocol_version',{
 'panel_features':field('session','features','当前Registry已批准方法与原features取交集'),
 'limits_profile_ref':field('session','limits_profile','仅显示当前会话适用预算profile，不能返回后台全部配置')},'同一服务及完整选择'),
'ClockView':plan('time_public__S12__PublicClock','model_id model_revision status reference_utc estimated_utc_ns error_radius_ns reasons grants_execution',{},'当前时间服务公开快照；无source_label或内部运行身份'),
'ClockAssessmentView':plan('time_public__S12__PublicClock','model_id model_revision status reference_utc estimated_utc_ns error_radius_ns reasons grants_execution',{},'仅显示reference-bound区间，conditional不是绝对执行资格'),
'DevicePageView':plan('baseline__DevicePage','catalog_revision',{
 'items':field('visibility','items','逐项只保留device_id/device_kind/display_name/connection_state；先对象授权，不回总数'),
 'next_page_handle':field('page','next_cursor catalog_revision','有后页时登记固定页句柄，否则null；目录或scope变化拒绝旧页')},'固定目录修订与页条件'),
'CapabilityView':plan('baseline__CapabilityCatalog','catalog_revision',{
 'device_id':field('visibility','devices','按方法目标选唯一已授权device'),
 'actions':field('dynamic','devices','对选中device.actions逐字段按ActionSummary白名单重建并绑定批准参数/结果Schema'),
 'triggers':field('dynamic','devices','对选中device.triggers按TriggerSummary白名单重建并绑定批准payloadSchema'),
 'state_schema_ref':field('dynamic','devices','仅固定选中device.state_schema的批准投影，不传原完整目录')},'目标device在当前目录且其安装/能力版本有效'),
'ObservationView':plan('baseline__Observation','device_id observation_id state_revision observed_at freshness_ms integrity',{
 'projection_status':field('visibility','values','字段裁剪状态独立于来源integrity'),
 'values':field('dynamic','values','按当前字段读权构造QualifiedValue并核Schema；不透原Payload')},'设备、来源修订与采样同一原件'),
'CommandView':plan('command__V__S0_CommandRecord','command_id revision state_ref target origin accepted_at phase=state.phase outcome=state.outcome effect_status=state.effect_status resource_status=state.resource_status required_completion=completion.required achieved_completion=completion.achieved automation_continuation=state.automation_continuation',{
 'cancellation_state':field('command','cancellation','null表示none；非空取同命令取消视图状态，不能据Receipt宣布confirmed'),
 'reason_code':field('vocabulary','state.reason_code','仅映射具名原因；失败/未知/阻断等不能丢失原因'),
 'resolution_summary':field('command','state.resolution_ref state.resource_evidence_refs','从精确处置原件生成摘要；unknown+clear仍保持paused_latched')},'submit先按accepted command_ref读取精确原件；rejected不得生成CommandView，当前get核当前修订'),
'CancelView':plan('command__V__S0_CancelOperation','operation_id=cancellation_id command_id revision state future_writes',{
 'reason_code':field('vocabulary','reason_code','按固定原因词表显示，不暴露内部错误')},'Receipt.initial_operation_ref联接同命令取消原件；取消revision不同于命令state revision'),
'ControlOperationView':plan('control__ControlOperation','operation_id device_id state',{
 'target':field('identity','target','target.mode/version保留，holder按完整主体关系投影'),
 'failure_code':field('vocabulary','failure_code','有限原因码或null'),
 'effective_version':field('control','effective_control_ref target state','仅effective且原control引用匹配时取实际生效版本，其他状态null'),
 'ready':field('control','effective_control_ref target state','与当前epoch/version/holder/mode/gate及未决集合联核；历史effective不能保留ready')},'RequestReceipt精确initial_result_ref与result_kind=control_operation，当前GET按原operation读取'),
'ControlView':plan('control__ControlRecord','device_id revision control_epoch effective_version mode gate_state',{
 'holder':field('identity','holder','完整主体关联投影，不用裸principal_id匹配'),
 'pending_change':field('control','pending_change','按PendingChange白名单重建；目标主体单独投影，不返回内部原件'),
 'in_flight':field('visibility','in_flight_command_ids','CommandSet逐项过滤可见ID，隐藏项仅保留has_hidden'),
 'unresolved':field('visibility','unresolved_command_ids','隐藏风险仍使ready为false，不将未知删去')},'当前ControlRecord及相同释放快照'),
'TransferView':plan('control__TransferOffer','transfer_id device_id expected_control state accept_operation_id=accepted_operation_id',{
 'from_holder':field('identity','from_principal','按当前查看者关系生成holder'),
 'target_holder':field('identity','target_principal','固定原邀请目标，过期也不替换'),
 'remaining_ms':field('deadline','lifetime','同域当前tick计算；过期为0，时基不可用为null，非UTC expires_at')},'RequestReceipt.result_kind=transfer_offer且精确initial_result_ref'),
'GrantMutationView':plan('baseline__MutationReceipt','operation_id state entity_id revision',{
 'kind':field('targets','','固定grant_revocation'),
 'visible_targets':field('targets','targets','按原目标逐项状态和当前别名权限投影；applied须完整集合证明'),
 'has_hidden_targets':field('visibility','targets','隐藏目标仍计入完成判断，不能伪装全体完成')},'仅controller.revokeRunGrant及其原请求回执'),
'LifecycleMutationView':plan('lifecycle__LifecycleOperation','operation_id run_id kind state committed_run_revision committed_slot_revision target_arm_generation locally_closed protection_complete',{
 'target_status_summary':field('targets','targets','保留全部目标状态；隐藏项用has_hidden，不改变protection_complete')},'仅arm/pause原操作；reserved和preparing不映射为applied'),
'CapacityView':plan('baseline__CapacityStatus','pressure',{
 'reason_codes':field('vocabulary','reasons','有限原因码，不暴露其他主体情况'),
 'panel_budget':field('session','profile_id profile_revision','只取当前PanelSession适用维度预算'),
 'current_panel_usage':field('session','usage','只取当前会话用量，预算下降不把已用值清零')},'同一会话容量快照而非全服务usage透传'),
'SceneCatalogView':plan('baseline__CatalogBinding','device_id collection_ref collection_generation catalog_revision binding_revision status',{
 'entries':field('visibility','entries','只返回scene_id/display_name等View白名单，按当前场景可见性；不暴露OBS内部UUID')},'目标设备当前catalog binding'),
'EvidencePageView':plan('command__V__S0_EvidencePage','command_id',{
 'items':field('command','items state_ref snapshot_ref','仅同命令证据，按EvidenceSummary白名单重建；不输出原details/attempt/报文'),
 'resource_release_summary':field('command','state_ref','从精确状态与处置原件读取resource_status；单条sent/ack不能表示已清资源'),
 'next_page_handle':field('page','next_cursor snapshot_ref state_ref','绑定完整证据快照/状态修订和页条件，隐藏计数不泄漏total')},'已固定state_revision与snapshot，当前读权另验'),
'DraftDefinitionView':plan('lifecycle__DraftRecord','definition_id revision content_digest selection_digest metadata_revision',{
 'kind':field('definition','','固定draft'),
 'content':field('dynamic','content','必须完整可读/可编辑并符合当前DraftContent及全部动态字段Schema；不能裁剪后回写'),
 'metadata':field('dynamic','metadata','只读固定metadata；layout按批准有界Schema，名称当纯文本'),
 'proof_summaries':field('definition','definition_id revision content_digest','只收录同草稿内容的权威编译证明；不存在时空集而非伪造通过')},'create/update返回其原事务草稿修订，不偷换为当前草稿'),
'PublishedDefinitionView':plan('lifecycle__PublishedVersion','definition_id definition_version source_draft_revision artifact_ref program_digest bindings_digest',{
 'kind':field('definition','','固定published'),
 'content':field('definition','artifact_ref program_digest bindings_digest','从固定发布制品重建完整源内容并核映射；不能取最新草稿，无法证明完整则整个投影不可用'),
 'metadata':field('definition','definition_id definition_version artifact_ref','固定发布时metadata原件；不混当前可变metadata'),
 'proof_summaries':field('definition','artifact_ref program_digest bindings_digest','原制品的全部可见证明摘要，不执行面板自报证明')},'固定发布与artifact、program、bindings全链；源草稿修订独立于definition_version'),
'RunView':plan('lifecycle__RunRecord','run_id definition_id definition_version artifact_ref revision business_state lifecycle arm_generation active_execution_id',{
 'slot_revision':field('execution','definition_id definition_version','从同快照ActivationSlot取当前修订，不能用run.revision代替；slot不再指该run时仍展示真实修订并阻止旧预检'),
 'transition_summary':field('execution','active_execution_id last_execution_id business_state','由同run固定执行/状态提交记录生成，只读显示不驱动业务'),
 'execution_summary':field('execution','active_execution_id last_execution_id','优先当前active，其次显式last；都不存在时null，不伪造pending'),
 'grant_summaries':field('targets','active_operation_id arm_generation','读取当前run代次完整准备目标，分别保留baseline_grant_ref和target_grant_ref对应的可见grant_id；不得合并两代ID或用旧applied延续资格')},'完整run及同版本关联执行和活动槽快照'),
'PreflightView':plan('lifecycle__Preflight','run_id run_revision=baseline.run_revision slot_revision=baseline.slot_revision passed',{
 'checks':field('targets','checks','保留passed/failed/unknown，隐藏目标使确认所需完整预览不可用，不能将unknown改为false后丢语义'),
 'remaining_ms':field('deadline','clock issued_tick_ns expires_tick_ns','同域剩余期限仅展示，不能签发UTC时间或授权'),
 'assessment_handle':field('handle','preflight_id preflight_digest baseline','固定原预检+run/slot+会话/激活，不重复刷新期限')},'passed不是布防授权；目标零个的有效预检按领域规则，不能强行要求非空'),
'RecoveryPlanView':plan('lifecycle__RecoveryPreview','run_id prior_execution_id run_revision=baseline.run_revision slot_revision=baseline.slot_revision',{
 'recovery_handle':field('handle','preview_id preview_digest baseline','固定原预览、失败集合与当前会话，不给面板原凭据'),
 'remaining_ms':field('deadline','clock issued_tick_ns expires_tick_ns','同域截止，不把不透明tick转UTC'),
 'items':field('execution','plan','完整保留step_id/disposition，previous command按可见性给ID或隐藏标记；每个evidence_ref和非空parameters_ref由精确原件构造批准Schema的QualifiedValue摘要，dynamic逐字段核权限；必要摘要隐藏则整份不可用，不删步骤或用空集替代读取失败'),
 'unresolved':field('visibility','unresolved_command_refs','可见ID与has_hidden；有隐藏必要决策内容时整份确认预览不可用')},'固定preview的完整计划，最多4096项，超预算整体不可用不截断'),
'RecoveryOperationView':plan('lifecycle__LifecycleOperation','operation_id run_id previous_run_revision=baseline.run_revision committed_run_revision committed_slot_revision target_arm_generation state new_execution_id=execution_id',{
 'visible_new_command_ids':field('execution','operation_id execution_id','查询完整该操作执行的命令登记，不能只用未决子集'),
 'has_hidden_commands':field('visibility','operation_id execution_id','完整命令集合过滤后的隐藏标志；execution为空不造命令'),
 'target_status_summary':field('targets','targets','保持closing/closed/unknown和完整目标集，不能把本地完成当远端完成')},'kind必须resume；execution可null且state保留reconciling，target_arm_generation不是旧recovery_generation'),
'IndependenceView':plan('lifecycle__Program_IndependenceProof','failed_step_id successor_step_ids verdict',{
 'proof_id':field('proof','program_digest bindings_digest graph_digest','从原proof登记取精确ID'),
 'proof_revision':field('proof','program_digest bindings_digest graph_digest','严格匹配请求revision'),
 'definition_id':field('proof','program_digest bindings_digest','从原definition/version映射取得'),
 'definition_version':field('proof','program_digest bindings_digest','固定发布版本，不默认latest'),
 'reason_codes':field('vocabulary','verdict','仅受控证明说明；unknown不改independent')},'请求父子引用、版本和完整证明原件关联')
}
