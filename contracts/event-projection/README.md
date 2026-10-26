# 当前命令到快照／事件的具名投影候选

本轮是 C01／C05 归并的一步，状态为 `approved=false`、`runtime_ready=false`。它把固定 SDK 命令模型接到 C05 十二类快照图，明确当前命令的字段来源、读取权限和摘要边界；不修改既有 HTTP、WS、IPC、已广告的选择 ID 或业务代码。本目录的版本 `snapshot-projection/0.2.0-draft.1` 尚不能在原 `integration1` 通道发送。

已知事实：C05 原 CommandSnapshotView 的 cancellation_state 只支持 none／requested／confirmed／unsupported／failed，RequestLink 仍包含旧 context_id；当前 SDK CancellationView 已含 indeterminate／too_late／future_writes，RequestIdentity 使用 RequestKey／request_epoch。旧快照也没有 automation_continuation 和 terminal_revision，不能完整表达 unknown 已清资源但仍锁存暂停的状态。（来源：[固定 SDK 命令模型](https://github.com/LeafSeamer/leafseamer-sdk/blob/c37256500c43092b145feebd026e273c5a2667f4/contracts/negotiation/preview/models.schema.json)、[固定 C05 原件](https://github.com/LeafSeamer/leafseamer-suite/blob/21dd0175abaf503f2ff8c348e3c7a5d0c40722c7/docs/contracts/c05-snapshot/snapshot.schema.json)。）

设计裁决：不能把新状态降级成 failed／none，也不能用当前控制持有人重写原命令归属。本轮替换命令具名投影，其他十一类保留原接受集及各自待审阅项。公开 ControlRecord 的 gate_state 枚举与旧快照一致；内部限定闸资格不能通过扩大公开枚举自动暴露，需后续对账。保留其他模型不等于证明其与最新领域语义完全一致。

## 字段与权限

| 目标字段 | 唯一来源与约束 |
| --- | --- |
| source_record_ref | 从完整 CommandRecord 的 scope／command_id／revision／record_digest 构造；kind=command；它是完整原件引用，不是本投影的摘要 |
| initial_command_ref、request_identity | 原样复用当前 SDK 定义和字段；前者仍固定初始修订 1，后者不编造旧 context_id |
| target、origin、accepted_at、control_binding | 原始命令受理字段；不替换成当前持有人、当前期限或快照生成时间 |
| state_ref | 完整原 State 的 id／revision／JCS 摘要；不能对裁剪后的状态重新计算后冒充原件摘要 |
| state | 复用当前 State 的身份、修订、phase／outcome、effect／resource、automation_continuation、reason、terminal_revision 和 resolution_ref |
| state 的三个 count | 完整 State 的完成证据、资源证据及尝试数组长度；不是“已验证”布尔值，不证明设备效果 |
| completion | 固定 required／achieved／policy_ref，加原完成证据数量；与 State 和原政策一致 |
| cancellation | 原 CancellationView 或 null；保留六状态和 future_writes，不能用 null 代替 indeterminate |
| 外层 entity_id／revision／epoch | id 和 revision 必须与同一 CommandRecord／State 相等；epoch 来自可信投影登记，不从 control_epoch 或进程 boot 猜测 |

`status.read` 不能单独打开 commands 集合。构建及每次释放均需当前 command.read、目标设备范围、订阅 owner／scope／generation 和来源可发布性；human 使用当前允许的设备范围，service 另须真实配对及自身 automation 来源。模型中的 TrustedRead 是人工提供者上下文，不是可接受的请求 JSON，不实现认证或证明这些条件真实成立。授权收窄、换代或来源不可发布必须使旧页／帧停止释放；已经交给传输层的字节仍不可收回。

命令投影不发布 actor 会话信息、dispatch、完整 policy、attempts、run／automation 绑定、evidence_index 或证据正文。只返回具名政策／核对引用和数量；引用不是访问凭据，按固定 revision 读取原件仍核当前权限，证据明细还需 command.evidence.read。不能用另查“最新”原件补全旧快照。source_record_ref 和 state_ref 的摘要只能由完整来源验证，客户端不得声称从公开裁剪字段已复算完整原件。

## 生成及故障边界

[build.py](build.py) 从固定 SDK 的现有定义选取字段，生成封闭白名单及其本地引用闭包；所有引入的 command 定义与来源逐节点相等，不按同名推断等价。State 的 unknown-clear 条件把私有证据数组约束显式转成 resource_evidence_count≥1；其他来源条件保留。新增 State 字段、旧条件变化或输入摘要漂移会拒绝生成，避免悄悄丢掉未来字段。其他未公开字段的清单见 [projection-map](preview/projection-map.json)。

[model.py](model.py) 在合成可信来源下先验证完整 CommandRecord Schema、原件摘要及关联，再生成具名 Record；释放时重新按当前上下文与完整原件比较。完整 provider 状态验证、真实 SQL 一致点、权限服务和来源证据仍由后续实现承担；这里的字段检查不替代完整命令状态机。

故障时序：

1. 生成页后撤销 command.read／更换 connection_generation：释放复核拒绝旧 Record，不先发数据再补失步通知。
2. 取消结果 indeterminate 或 too_late：查询与事件保留相同状态，不将“不再发送”解释为设备已停止。
3. unknown 后人工核对清资源：outcome 仍为 unknown，automation_continuation 仍 paused_latched，保留 resolution_ref；页面变绿不触发 resume。
4. 重连重新包裹 DeliveryBinding：entry 原件及其 JCS 摘要不变；新 generation 的资格独立核验，摘要相同不续授权限。
5. 攻击者篡改外层身份、state、来源引用后重算公开摘要：与可信原件比对失败。结构通过不是来源可信。

本包 [snapshot 入口](preview/snapshot.schema.json) 将 Manifest／PageResponse／Data 绑定到同一 [86 模型闭包](preview/models.schema.json)。PageContent、Manifest、Data 的格式版本同时升级；旧格式不可混用。entry 仍按完整 `{entry_kind,payload}` 求 JCS＋SHA-256；没有改动原分页／manifest 算法。未重新执行旧 bundle、分页或动态Schema语义模型，不能把原十一类结构回归当作整个 C05 通过。

摘要文本沿各自具名来源：快照 scope／entry 摘要为 64 位小写裸 hex；命令 record／state／Ref 摘要带 `sha256:` 前缀。生成器和实例不做全局字符串替换，两个表示交叉提交均拒绝。统一摘要注册仍待后续逐类型裁决，不能凭算法相同忽略文本接受集差异。

## 验证与剩余交付

依赖沿用 [既有验证依赖](../negotiation/requirements-validation.txt)，不是产品依赖锁。

```text
python -I -B contracts/event-projection/build.py --output <不存在的目录>
python -I -B contracts/event-projection/check.py --examples
python -I -B contracts/event-projection/check.py --report
python -I -B contracts/event-projection/check.py --check-report
```

[用例](fixtures.py)是手工合成输入；[检查器](check.py)覆盖新旧取消接受集、unknown 清理后的锁存、大整数、来源错配、撤权／换代、服务越权和拒绝透传，结果见[报告](report.json)。Schema检查不执行原始wire严格解码；序列化数值和跨语言验收沿 DF01。真实认证、数据库、网络和设备运行次数分别为零。

下一步仍需：其他十一类当前领域映射、完整人员／服务 owner 和 selector 权限矩阵、服务订阅 HTTP／双向帧、当前快照根与全部 API 同版绑定，以及 projection_profile／摘要注册／DDL。必须完成后生成新的完整选择组合，不能直接修改原 integration1 的同 ID 产物。阶段 0 未关闭；全系统设计完成后才开始业务实现。

本轮为新周期第 1/3 轮，仅在 SDK main 本地提交；第三轮统一交接并推送。固定来源和原始字节摘要见 [sources.json](sources.json)，只保留规范、合成用例及交付成果。
