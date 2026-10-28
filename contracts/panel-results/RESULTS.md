# 面板结果来源与释放契约

## 事实与候选范围

已知事实：固定 events2 图中已有当前命令、控制、生命周期与时间领域模型，同时保留旧面板结果定义。当前时间是 `reference-bound/1` 的纳秒区间；发布版本与草稿使用不同模型；运行拥有独立的活动槽、执行和布防代次；恢复操作可尚未产生 execution。原件路径、提交与字节摘要见 [sources.json](sources.json)，模型见[固定领域图](../event-integration/preview/models.schema.json)。

基于这些事实，本稿提出与当前面板输入相配的结果候选。21 个 View 名称保留，DefinitionView 拆为草稿及发布两个变体，MutationView 拆为授权撤销及生命周期两个变体，共 23 变体。35 方法逐一登记在 [bindings.json](bindings.json)。181 项仅计顶层输出字段；直接字段绑定当前模型路径，派生字段绑定具名提供者与转换规则。Schema 不承担认证、原件真实性、动态字段权限或完整状态机验证。

`result.schema.json` 的 `{method,value}` 只是验收分派根。采用时必须与新输入、Registry、Bundle、BoundIntent、面板结果/句柄存储和完整传输选择一起版本化；不能向旧激活或旧 SchemaRef 输出新字段。source_selection 标识格式来源，并不表示新结果已经被该选择安装。生成器使用原协议版本常量是当前来源约束，未来完整归并必须同步重新绑定，不能沿用旧摘要。

## 方法结果与原件取得

结果先由实际 authority 的领域服务读取原件，再执行投影。禁止面板指定网络地址、查询处理器、数据库位置、Schema 下载地址或可信快照。输入期望值不能充当事实；同名 ID、合法 Ref 或摘要相同也不能替代完整 scope、类型、修订及父子关系校验。

| 结果族 | 原件与关键关联 |
| --- | --- |
| Meta / Capacity | 同一服务、安装与会话；功能取批准交集，用量只显示当前会话 |
| Clock / ClockAssessment | 公开时间快照；不读取内部时间身份或 source_label |
| DevicePage / Capability / Observation / SceneCatalog | 同目录、设备、绑定及来源修订；动态字段另经批准 Schema 与可见性校验 |
| Command / Cancel / EvidencePage | accepted 回执的精确 command_ref、取消 initial_operation_ref、证据 state_ref 和 snapshot_ref；rejected 不生成 CommandView |
| ControlOperation / Control / Transfer | 原请求 result_kind 与 initial_result_ref 精确匹配；当前控制原件与目标版本、holder 和 gate 同快照核验 |
| GrantMutation | revokeRunGrant 的原 MutationReceipt；不能混入生命周期状态族 |
| LifecycleMutation | arm/pause 的原 LifecycleOperation；kind 必须对应原方法，完整目标状态不二值化 |
| DraftDefinition | create/update 原事务返回的 DraftRecord 修订；不能偷换成最新草稿 |
| PublishedDefinition | 固定 PublishedVersion 与 artifact/program/bindings 链，另读固定发布内容和 metadata |
| Run | 同 run 的完整状态、活动槽和执行；grant 目标固定当前操作与代次 |
| Preflight / RecoveryPlan | 原评估/预览及 run/slot 基线、同域期限、会话句柄；只显示，不签发执行资格 |
| RecoveryOperation | 原 kind=resume 操作、基线和完整新执行命令登记；execution 可 null |
| Independence | 原 definition/version/proof 登记及精确 revision、program/bindings/graph 摘要 |

submitCommand、cancelCommand 及控制写操作不能直接把 HTTP 受理回执当最终结果。精确 Ref 的目标暂时不可读取时，结果为当前通道的不可用状态，原受理事实仍存在；不得重新发起命令。写请求重查先定位原持久请求，再按当前读权展示其记录。get 方法按其原查询语义读取，不把历史受理记录冒充当前 ready 状态。

## 输出变化

| View | 本候选的明确行为 |
| --- | --- |
| ClockView / ClockAssessmentView | 保留 `conditional/unavailable`、有符号纳秒字符串、区间与误差半径；`grants_execution=false`；unavailable 时数值槽为 null 并带原因 |
| CommandView | 增完整 `state_ref`，供当前 cancel 输入作为期望；unknown、blocked、expired 保持 paused_latched；取消状态从原取消记录取得 |
| TransferView | `remaining_ms` 替代旧 UTC expires_at；0 表示到期，null 表示同域时基不可用；不推算绝对 UTC |
| DefinitionView | `kind=draft/published`；草稿保留 revision/content_digest/selection_digest/metadata_revision，发布保留 definition_version/source_draft_revision/artifact_ref/program_digest/bindings_digest |
| RunView | 版本用十进制 Revision；business_state 为 state_id/revision；增 artifact_ref 与独立 slot_revision；无执行时 execution_summary 可 null |
| RunView.grant_summaries | 目标保留 service_alias/state，baseline_grant_id 和 target_grant_id 分别来自两代 GrantRef.object_id，空 Ref 才为 null；两代不得合并 |
| PreflightView | run_revision/slot_revision 来自同一 baseline；checks 保留 passed/failed/unknown；零目标的合法预检不自动判失败 |
| RecoveryPlanView | 增 prior_execution_id，完整 plan 最多 4096 步；保留 disposition、previous_command_id 与隐藏标志、证据和参数的受控摘要 |
| RecoveryOperationView | 保留 reconciling 与可空 new_execution_id；使用 target_arm_generation；新命令从完整执行登记取得，不由 unresolved 子集推导 |
| MutationView | grant_revocation 与 arm/pause 分开；reserved/preparing/reconciling 不映射为 applied，locally_closed 不代表 protection_complete |

当前 grant 目标状态为 pending/applied/closing/closed/unknown；它表示准备/保护目标的状态，不是单独 GrantRecord 的最终状态。显示两代 ID 只供后续按 authority 和 run 关联选择对象，撤销仍须当前权限及原件核验。若某个目标的必要 ID 无权读取，应隐藏整个目标并置 has_hidden，不能用 null 假装该 Ref 不存在。service_alias 不能作为网络地址或授权来源。

Run 的 slot_revision 必须取相同定义版本的当前 ActivationSlot。同槽已指向另一 run 时仍显示真实槽修订，原 run 不自动获得布防资格。execution_summary 优先 active，其次明确 last，两者都不存在才 null；所读执行必须属于该 run。投影必须核 active_execution_id、摘要 execution_id 及当前/历史角色一致，静态 Schema 不执行该联接。

## 具名提供者合同

所有提供者从可信宿主调用，接受同一只读请求上下文：目标 authority/database、完整选择、认证主体与会话、panel_session/document_generation/activation/delegation、方法、原意图身份、目标及来源修订。输出必须带宿主可核验的来源绑定、读取版本和有效期，不能接受面板自报的通过标志。跨服务来源不因同一个 snapshot_id 就具备原子性；无法证明当前关联时整个结果不可用。以下是实现责任，当前包没有实例化这些提供者。

| 提供者 | 额外输入与输出职责 |
| --- | --- |
| session | 当前安装批准、功能和容量原件；给方法交集、有限预算和当前会话用量 |
| page | 固定 cursor、目录/状态/证据快照、过滤条件与 limit；保存绑定的 next_page_handle，不向面板暴露 cursor |
| dynamic | 可信注册的精确 SchemaRef、字段权限和预算；逐字段白名单重建并校验 QualifiedValue、参数、内容和布局 |
| visibility | 完整对象集合及当前读权；输出可见对象与 has_hidden，不能泄漏隐藏数量或通过删项消除风险 |
| identity | 完整 issuer/epoch/principal 与当前主体关系；输出 self/other/none 及受限标签，不能按裸 principal_id 比较 |
| control | 当前控制、原操作目标、gate 与未决记录；核有效版本和 ready，历史 effective 不延续当前资格 |
| command | 精确状态、取消、资源处置及证据原件；生成受控摘要，unknown 清资源仍锁存 |
| definition | 原草稿或固定发布制品与发布元数据、编译证明；给完整可编辑内容或整体不可用 |
| execution | run、slot、完整执行命令登记及恢复计划；给同父对象摘要，不把未决子集当完整命令集 |
| targets | 当前代次全部准备/保护目标及 GrantRef 原件；保留状态、两代授权标识和隐藏标志 |
| handle | 原预检/恢复记录与当前会话；给固定不透明句柄，绑定不能换代或续期 |
| deadline | 原 Lifetime 或 clock/issued/expires 与同域可信 now；给向下取整的剩余毫秒、0 或 null |
| vocabulary | 固定原因/标签表；内部未知文本映射通道允许的 unavailable 类状态，不泄漏 details |
| proof | definition/version/proof 登记及原证明；精确 ID/revision 和 verdict，不采信面板自报证明 |

主提供者名称是责任归属，不免除其他提供者复核。直接字段也必须经过对象授权、完整原件读取和释放复核，不能因为路径标为 source 就自动可信。动态槽的 SchemaRef 必须来自安装批准登记，value 的嵌套字段必须完整校验；本包的 `QualifiedValue.value={}` 刻意不冒充这一运行期校验。静态检查保留未批准动态字段也能通过格式的反例。

截止计算仅限完全相同的时钟域和 epoch；先以整数比较到期，未到期取 `(expires-now)//1000000`，不转浮点。域错配、读取失败或结果超过安全整数返回 null，并禁止以显示值决定执行。实际资格仍按原服务当前时钟和原截止复核；显示刷新不得延长期限。

## 定义和恢复内容完整性

草稿 content 与 metadata 是完整编辑原件。任何必需字段无读权、动态 Schema 未批准或容量超限都使编辑投影整体不可用，不能裁剪后允许保存。proof_summaries 只收录与该内容绑定的权威证明；来源确实没有证明才为空，读取失败不能伪装空集。布局和名称只作受限显示数据，不执行脚本或 HTML。

PublishedVersion 本身没有固定 metadata 引用，也没有完整 DraftContent。未来 definition 提供者及持久模型必须保存“definition/version/artifact → 固定源内容、发布时 metadata”的原子不可变关联，并核 artifact/program/bindings 与源草稿修订。现有字段不能单独证明此关联，缺少持久原件时返回整体不可用，禁止取最新草稿或当前可变 metadata。本稿规定所需关联，但没有交付该存储布局。

恢复每步的 evidence_summaries 与 parameters_summary 均是批准 Schema 下的 QualifiedValue。每个 evidence_ref 先精确读取、关联 step/previous command/prior execution，再按当前字段权限生成一个有界摘要；原列表空才返回空列表，非空不能删到空。parameters_ref 为 null 才返回 null，否则须读对应固定解析参数并生成完整确认所需摘要。摘要应表达动作、目标、关键参数及已取得的完成证据，不能用“通过”标签替代材料。具体动态摘要 Schema 的注册和实现仍待后续提供者交付，静态封装不是内容验收。

previous_command 无权读时可用 has_hidden_previous 表示，但可信确认所需的证据、目标或参数隐藏时整份恢复确认预览不可用。任一步骤缺失或不可证明关联也必须整体失败。计划最多 4096 步；嵌套证据最多 4096 项仍受全局字节、深度和工作量预算限制。其他有限数组同样不得因超过 maxItems 截断后冒充完整集合；分页仅适用于明确支持分页的 View。

## 生成、复核与释放顺序

1. 核固定方法 Schema、原意图身份与当前[外层授权及领域守卫](../authorization/AUTHORIZATION.md)，读取原件并核上述完整关联；按[输入契约](../panel-methods/METHODS.md)取得句柄，不重新发起写操作。
2. 在受控读取快照中形成完整候选，逐字段白名单重建。固定身份、状态与 Ref 不从显示字符串反推。动态内容另按安装批准的 Schema 与当前字段权限校验。
3. 检查结果结构、预算、同对象/同修订关联及有限显示不变量。结构正确但来源错配仍拒绝；摘要正确但未批准仍拒绝。任何必要提供者缺失均不可用。
4. 释放前重新核当前主体、授权、激活、scope、来源有效性和字段读权。资格变化立即丢弃候选，不把旧对象排队后无条件发送。页和评估句柄的保存不能延长原快照期限；无法完成原子保存时不能返回可用句柄。
5. 采用实际选定通道的有限错误词表及 Schema。内部异常、原报文、权限原件和凭据不得进入结果或错误。已提交领域操作不因投影失败撤销；响应丢失只能按原请求查原，不能重试写入。

本包不改变已有输出门的约束：实际已进入传输层的字节不可撤回；此处的复核要求尚未接到真实面板出口。主提供者声明、结构校验和有限 Python 显示检查都不能证明最终释放原子性。

正常轨迹：getRun 读取同 run/slot 与两代目标 → 返回当前修订及可见授权 ID → preflightRun 固定这些期望 → 保存评估句柄并显示原检查结果 → armRun 经可信确认与领域复核受理 → LifecycleMutationView 保留 preparing 或 reconciling，直到真实保护原件证明完成。

故障轨迹：发布已提交但固定发布 metadata 缺失 → 投影不可用，发布原件不回滚 → 后续查原仍按该版本读取，不用最新草稿补齐。另一轨迹：恢复预览在确认前出现隐藏证据或 slot 换代 → 拒绝旧预览，不能删步骤、改期望值或自动恢复。

本轮完成当前结果结构和顶层来源的显式登记。真实提供者、嵌套动态摘要批准、投影执行、新完整选择、生产存储与事务、浏览器和设备验收仍未完成；本稿不关闭 C09 或全系统设计阶段。
