# 当前领域接口的面板输入与代理约束

已知事实：当前事件选择的面板 Intent 仍绑定旧 35 方法输入；同一选择中的命令、控制与自动化领域接口已经具有新的状态引用、主体、上下文和修订字段。取消请求现用 `expected_state_ref`，转交目标是完整 issuer/epoch/principal，生命周期使用 `context` 及独立 run/slot 修订。上述字段直接取自固定 SDK 原件，完整字节和提交见 [sources.json](sources.json)，旧输入归属见[来源副本](source/legacy-bindings.json)。

基于这些事实，本稿提出 `panel-methods/0.3.0-draft.1`。它为全部 35 方法登记当前输入、HTTP 字段归属和 28 类领域约束，保留 19 个 Controller、16 个 Seamer 方法及原八个可信确认方法。`approved=false`、`runtime_ready=false`、`installed=false`。这是可审阅的新版本候选，不能把新参数塞进旧 SchemaRef，也不能宣称当前 events2 已支持新面板。

## 版本及目标身份

[input.schema.json](input.schema.json) 的 `{method,arguments}` 是候选验证根，不新增线上消息外壳。未来采用时，完整 Registry、Bundle、BoundIntent、响应 View、订阅、HTTP 选择和存储绑定必须一起形成新的完整选择；旧激活不能原地换方法 Schema 或摘要。当前只读取 events2 作为领域格式来源，其 HTTP 头用于合成格式比较，不构成新面板的协商或部署许可。

每个方法必须在实际会话的单一 authority 上解析；Controller 方法不能经 Seamer 会话转发。目标句柄来自该会话当前批准范围，不接受调用方提供服务地址、数据库路径、处理器名或 HTTP 路径。`target_kind` 表示领域对象类别，由服务器读原件关联，不能仅按字段名、字符串相等或 Schema 合法判定。

服务级方法仍绑定当前服务及安装 scope；创建定义或运行先校验父命名空间。设备操作核 device；命令对象需从当前命令原件取得 device；控制/恢复 operation 从原操作记录取得父对象；acceptTransfer 还核 device/transfer，proof 查询核 definition/proof/revision。目标 ID 和完整 Ref 均只是期望，摘要不授予对象归属或当前读取权。

## 当前字段归属

全部映射见 [bindings.json](bindings.json) 的 `source_fields`。每个 HTTP path、query、header 和 body 顶层字段均有归属，未映射字段不能从面板透传。

| 归属 | 提供方式及必要关联 |
| --- | --- |
| panel_expected | 从当前输入读取；服务核验原件与权限，不以“最新值”覆盖 expected 字段来使旧请求成功 |
| request_identity | 从完整 PanelRequestIdentity 的持久绑定取得 context/idempotency；同请求重查复用，不能重签新身份重发 |
| host_selection | 从目标服务与会话的固定完整选择取得；面板 arguments 不接受协商头 |
| host_correlation | 宿主为原请求固定非秘密关联，不接受面板指定或每次重试重新生成 |
| fixed_manual / fixed_null / forbidden | submitCommand 的 origin 固定 manual，automation_binding 显式 null，run_binding 不得存在 |
| page_handle | 宿主以当前会话绑定的页句柄解析实际 cursor；不向面板输出或接收原 cursor |
| member_handle | 受限成员目录句柄解析完整 issuer_id/issuer_epoch/principal_id，不能将裸成员名扩成组织目录查询 |
| assessment_handle | 从原预检记录取得 preflight_id/digest，连同 run/slot 修订与批准链核验，不采用面板自报通过 |
| recovery_handle | 从原恢复预览取得 preview_id/digest，固定原失败、未知/在途集合、策略及期限，不能以查询刷新有效期 |

四种句柄均为不透明关联 ID，不是 bearer 权限。服务读取的记录至少绑定目标 authority/database、当前认证主体与 auth_session、panel_session、document_generation、activation、delegation、method、目标及输入摘要、来源修订、选择和最早期限。成员、评估、恢复记录还绑定各自用途；页记录另绑定过滤条件、limit、目录/状态/证据修订及原 cursor。未提供 page_handle 表示第一页；提供句柄时其他条件必须与原页记录相同。scope/激活/授权下降即失效，不延长旧句柄。

输入变化逐方法记录在 `changes`。其中保留字段的 Schema 引用变化只表示格式源发生变化，不声称其接受集必然不同。主要行为变更如下：

| 方法 | 新输入约束 |
| --- | --- |
| cancelCommand | 完整 expected_state_ref，不能仅用旧 expected_revision 补查出另一个状态 |
| offerTransfer | member_handle 替换裸 target_principal_id；可信确认展示解析后的明确目标，不能在确认后换人 |
| getCommandEvidence | 显式 state_revision、可选 limit 与 page_handle；固定版本分页，不拼接当前与历史证据 |
| createDefinition / updateDraft | 使用当前 content/program/selections/policy；新增 metadata 或 expected_draft_revision，不将旧 definition 对象自动转换 |
| publishDefinition | 同时固定草稿修订、内容摘要和选择摘要；确认的内容与实际发布必须一致 |
| createRun | 保留定义版本并增加完整 expected_artifact_ref；原件关系通过后只创建未布防运行 |
| preflightRun / previewRecovery | 固定 expected_run_revision 与 expected_slot_revision，宿主另提供持久 context |
| armRun / resumeRun | 固定 run/slot 修订和对应句柄；不接收原预检、恢复或批准 ID 来绕过宿主 |
| pauseRun | 当前 expected_run_revision 和有限 reason_code，不把任意文本当作受控原因 |
| getIndependenceProof | 明确 revision；证明属于该 definition 及指定版本，不能默认取最新原件 |

## 处理顺序与原子边界

1. 严格原始字节入口完成预算、重复键、数值词法与固定方法 Schema 校验。这里的 Schema 检查本身不承担原始解码，动态 parameters/content/layout 还需各自批准 Schema、深度/字节预算和字段权限。
2. 按[外层授权契约](../authorization/AUTHORIZATION.md)核当前宿主会话、激活、委托及方法 capability 交集，再解析目标与句柄；固定 `human_branch` 的权限和全部领域守卫仍须执行。外层 invoke 通过不能代替被代理操作授权。
3. 生成规范意图。保留面板提供的 expected 值和原始字段存在性；acquireControl 的缺省 force 仅在此固定为 false，并将规范值纳入预览和内容摘要。之后不能自动升级为 true。
4. 同一 PanelRequestIdentity 的内容不同即冲突；已存在时只在当前读权下返回原记录，不再解析新句柄或生成新领域操作。查原不能宣称当前仍可执行。
5. panel_read 只读领域内容或保存预检/恢复评估记录，不创建执行许可。panel_write 的领域受理、面板记录、审计与 outbox 同一目标事务提交。不得用“调用外部 HTTP 成功后再记录面板请求”模拟该原子关系。
6. host_confirm 先持久 pending/offered，只有可信宿主完成确认才能消费。确认原件、固定意图、句柄来源、当前授权、expected 修订及期限全部复核后，确认消费、面板 accepted 与领域受理在同一事务提交。重复提交查原，不能再次消费；取消已消费预览不回滚领域事实。
7. 生成白名单投影，释放前复核当前身份、scope、激活和字段读权。响应丢失使客户端结果未知，后续只能查询原记录；不自动重发或把已受理动作改写成未发生。

这些阶段要求可信服务实现；本包没有把 JSON 字典中的通过标志视作事实。合成测试使用的宿主字段只用于证明当前字段映射可满足完整 HTTP 格式。

## 结果及失败边界

`result_view` 保留原 21 个 View 名称作为待衔接对象，不证明旧结果 Schema 可以完整表示当前领域结果。尤其完整 DSL 定义、当前 artifact/run/slot 与恢复关系须继续做逐字段投影审阅；不能把新 content 填进旧 definition 或直接透传完整 HTTP 响应。投影或必要字段不可证明时返回现有通道声明的 unavailable 类失败，不能返回裁剪后看似完整且可保存的定义。

未知方法、错 authority、旧 SchemaRef、失效句柄、错父子对象、错误 expected 修订及未确认写入均拒绝。没有当前权威来源时返回不可用而非猜测许可。错误必须沿实际选定通道的有限词表与 Schema 编码，不暴露内部异常或对象存在性；已提交后的投影失败保留原领域记录，查原仍核当前权限。

正常轨迹：面板观察 run/slot 修订 → 只读预检 → 宿主保存绑定的 assessment_handle → 固定布防意图并确认 → 同事务复核与受理 → 当前权限下释放投影。若确认期间 slot 被另一运行占用，复核拒绝旧意图，不替换成新 slot 修订，也不重新确认或自动布防。

恢复轨迹：固定原失败集合和资源条件 → 生成有限预览 → 宿主确认 → 提交前发现授权或资源来源已失效 → 停止受理并保留可查原结果；不得通过扩大失败继续集合或隐藏未知项使恢复通过。

本轮关闭当前 35 方法输入字段未跟随领域接口的设计登记缺口。真实句柄存储、身份与动态字段提供者、完整结果投影、新完整选择、生产事务/浏览器及设备验收仍未完成，不关闭 C09 或阶段 0。
