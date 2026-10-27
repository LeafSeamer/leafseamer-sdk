# 投影 profile 与具名选择器注册候选

本包补齐 C05 SP01 中 `projection_profile_ref` 和 `selector_ref` 的正文及解析规则，并将结果接入[既有订阅模型](../event-channel/README.md)。状态为 `approved=false`、`runtime_ready=false`；这是可执行的离线设计参考，不是身份服务、持久注册库或产品 SDK。

已知事实：上一轮 ScopeSpec 已包含这两个引用，但批准范围仍由人工 `allowed_scope_digests` 和 `canonical_scope_complete` 输入表示；十二类视图引用也没有具名注册正文。（来源：[固定 SDK 通道](https://github.com/LeafSeamer/leafseamer-sdk/blob/fc714097df98be3d7ffe2be714b96222d75a511b/contracts/event-channel/model.py)、[Suite SP01／SP02](https://github.com/LeafSeamer/leafseamer-suite/blob/29103575f789e6b987a0c0fd9cc5e8df4303efec/docs/rebirth-c05-event-sync-design.md)。）本轮将这些方案具体化为同源 Schema、不可变引用及逐集合判定，不改变既有通道的接受集或 advertised selection。

## 注册正文与固定身份

| 对象 | 固定内容 | 约束 |
| --- | --- | --- |
| Profile | 发布服务／库、role、对象身份／epoch／revision、完整契约 selection、允许的 owner／purpose、模型图字节摘要、集合规则及容量 | 每类视图固定 schema_id、definition、schema_digest；从本地已安装图读取，禁止下载任意 URL 或仅按同名认可模型 |
| CollectionRule | 集合、具名视图、权限、允许的关系与历史政策 | 权限必须与固定通道 policy 相等；Controller／Seamer 分开；commands、executions、occurrences 不得采用遗漏未决对象的 current 政策 |
| Selector | 相同发布服务／库、不可变身份、精确 Profile Ref、目标集合、有限谓词及参数、关系政策、历史窗口 | 只支持 entity_set 与 all_authorized；拒绝 SQL、脚本、表达式及事件类型过滤；entity_set 不能静默缩为当前有权子集 |
| ObjectRef | 服务／库、kind、身份／epoch／revision、content_digest | content_digest 是完整正文 JCS 的裸 SHA-256；不包含引用本身，Profile 不引用未来 Selector，避免循环依赖 |

模型图的 `schema_digest` 是完整固定图的原始字节 SHA-256；Profile／Selector 的 `content_digest` 是完整具名正文的 JCS SHA-256；ScopeSpec 的摘要继续覆盖原完整 ScopeSpec。三个投影不能互换。初始 revision 可以为 `0`，沿原 Counter 接受集；不由本包改写既有版本或数字格式。

[注册参考模型](registry.py)的 `install(body, trusted_ref)` 从本地批准记录取得 expected Ref，再核正文、安装图与关系；不能将客户端正文现算出的 Ref 当成批准。相同身份、相同字节语义重复登记幂等；相同身份换正文，即使重算摘要也拒绝。撤销是不可逆身份墓碑且可重复执行；重新批准必须使用新的身份或修订。撤 Profile 会使所有指向它的 Selector 在下次解析时失效，历史正文不能继续释放数据。

## 当前授权、窗口与释放

`Grant` 是可信提供者的本地输出，不属于请求 Schema。它绑定 owner、发布服务／库／role、selection、authorization_revision、权限、获准的 Profile／Selector 精确 Ref、逐集合实体全集及规范来源全集。摘要证明绑定，不证明批准来源真实；认证服务与批准存储仍须实现。

- entity_set 的全部成员必须有权，否则整体拒绝。all_authorized 的集合来自 Grant 固定实体集合；不接收远端自报的授权列表。
- 创建／附着前，`authorize` 核注册原件、当前 Grant 与实际认证上下文，再派生两个旧批准字段，调用原通道 `authorize`。传入的同名布尔或 scope 摘要不会绕过注册核验。
- 每次释放必须携带先前保存的 plan，重新调用 `authorize(..., previous_plan=...)`；授权修订、成员集合、Profile／Selector 或 owner／selection 变化均拒绝旧 plan。不得缓存第一次输出的 ctx 后永久复用。提供者仍负责把真实授权变化推进到新修订，最终释放门仍须与撤权排序。
- bounded_history_and_unresolved 使用固定闭区间 journal cursor，按精确整数及实体身份排序；窗口外仍保留当前对象及全部未决对象。`current` 是领域提供者依据固定规则判定的“当前集合成员”，不是“任意历史对象的最新 revision”；`unresolved` 也不得由终态显示颜色猜测。真实领域读取映射仍须提供。
- 超容量整体拒绝，不取前 N 个后宣称完整。集合未选择与已选择但空集不同，plan 保留每个已选集合及具名 view_schema_ref。此包不构造分页或验证 required_in_scope 引用闭包，后续快照消费者须继续执行对应规则。
- canonical_trigger 必须为已认证 Seamer 服务，sources 集合精确覆盖 Grant 的全部规范来源，且不能为它附加历史窗口；快照选择后再核 sources 全集，缺失或重复来源均拒绝。此检查不验证来源连续性、gap、epoch 或 durable_ingest，不能代替原 canonical_source 规则。

参考模型接入原 `Subscription` 构造与 `check` 已有直接验收，但生产释放接口尚未接线。完整性还要求同一数据库一致点、状态与 journal 同事务、来源原件及实际权限提供者；候选数组和 Grant 在测试中均为明确合成来源。

## 验证与阶段边界

[生成器](generate.py)保留原通道全部 122 个定义，新增 4 个注册定义；[映射](preview/mapping.json)覆盖 12 类具名视图。它们中的 11 类仍是旧投影定义，注册可解析不等于已与最新领域字段归并。旧 179 操作、新订阅 15 操作和本包没有被拼成可广告的运行组合；本包不新增公共管理 API。

```text
python -I -B contracts/scope-registry/generate.py --output <不存在的目录>
python -I -B contracts/scope-registry/check.py --examples
python -I -B contracts/scope-registry/check.py --report
python -I -B contracts/scope-registry/check.py --check-report
```

依赖沿用[既有离线验证依赖](../negotiation/requirements-validation.txt)。[报告](report.json)区分原定义等价、合成结构／关系判定与实际运行数量；真实数据库、认证、浏览器和设备验收均为零。固定来源及字节摘要见 [sources.json](sources.json)，样例由[手工夹具](fixtures.py)独立描述。

后续仍须：其余十一类最新领域投影；注册／撤销的精确 DDL 与原子写集；真实授权和领域成员读取；完整页面／帧消费者、跨引用及来源连续性；新完整双 authority API／选择组合。阶段 0 未关闭。本轮为新周期第 1/3 轮，只在 SDK main 本地提交，第三轮后统一审查推送。
