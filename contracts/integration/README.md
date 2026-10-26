# HTTP 与 worker IPC 共源候选

本包属于设计阶段，`approved=false`、`runtime_ready=false`。它在冻结的 [composition](../composition/README.md) 预览上引入完整命令模型；不修改业务代码，不授予实际设备发送权限。`sdk-integration/0.1.0-draft.1` 是资料包版本，不是新增 wire 版本。

## 已完成的结构归并

固定来源为 [Suite 提交 77433a0](https://github.com/LeafSeamer/leafseamer-suite/tree/77433a07e99e310efd0fdf55f2cf28e4e28df3d2) 和 SDK 提交 `027f1fc75d9113da9dd5dae93e075ca3082e5e4e`。路径、原件摘要和基础输入见 [sources.json](sources.json)，保留 Apache-2.0 许可及原声明，参见 [LICENSE](../../LICENSE)。

| 交付物 | 边界 |
| --- | --- |
| [统一模型图](preview/models.schema.json) | 1263 个定义：927 个旧公共模型中 command 的 128 个定义逐项证明相等后，扩展为完整 464 个命令定义 |
| [模型身份](preview/model-identities.json) | 命令定义同时可回溯 HTTP 来源与 canonical 来源；其他命名空间不自动合并 |
| [Controller OpenAPI](preview/controller.preview.openapi.json)／[Seamer OpenAPI](preview/seamer.preview.openapi.json) | 90／87 项操作及认证、安全方案、正文和版本头保持；components 是统一图的可移植投影 |
| [worker IPC Schema](preview/worker-ipc.schema.json) | 52 个入口直接引用统一图；保持 `ipc/0.14.0-continuation-draft.1` |
| [方向与回复表](preview/worker-messages.json) | 从精确入口定义提取，不按消息名称猜方向；不存在的目标及同方向回复拒绝 |
| [验收报告](report.json) | 结构、共源等价、方向和握手关系测试，以及本包和固定来源的摘要绑定 |

生成器先验证原 composition 的全部来源往返和路由裁决，再验证 command 公共闭包的等价性。命令模型不一致、缺引用、外部未知引用、重复入口、版本漂移均拒绝。历史包保留为冻结输入，不允许同时手工维护两份命令正文；新候选生成只消费完整 canonical 正文，旧公共副本仅用作等价证明。下一次修改源模型必须有显式版本及兼容裁决，不能通过更新摘要掩盖不等价变化。

## 握手关系与信任边界

已知事实：当前 HELLO 的结构要求 23 项能力，HELLO_ACK 要求 30 项。[原件 Schema](source/command-contract.schema.json)允许某些 HELLO 单体通过，但这不足以证明能接受 ACK。原 [合成帧](source/frames.json) 是独立结构样例，其中 HELLO_ACK 的 `reply_to` 并未关联 HELLO；验收首先确认该组合被拒绝，然后仅修正关联 ID 构造关系正例。不得把这 52 帧称为可重放的完整会话或已重算所有业务摘要的时序。

候选关系检查见 [handshake.py](handshake.py)，本包的设计推荐如下：

1. 通道提供者独立给出 `ipc_session_id`、两端 boot ID、`clock_domain_id`、`descriptor_digest`；待检查消息不能自行声明可信身份。
2. HELLO 为 w2c，ACK 为 c2w，回复类型及 `reply_to` 对应，消息 ID 不复用。双方序号分方向管理，ACK 序号不要求大于 HELLO。
3. 内外运行域字段一致；两端完整描述符都须等于监督器先行核验的描述符原件。该函数不重做描述符摘要验证，不证明平台 profile 已获批准，不证明消息来自已认证操作系统进程。
4. `selected_ipc_version` 属于提供集合，`selected_features` 是提供能力的子集，且保留 ACK Schema 强制的全部 30 项。不能为取得交集删掉强制能力；双方共同声明的额外能力可保留，但不自动授予功能权限。
5. 成功只返回 `wire_compatible_closed`，并明确 `gate_state=closed`、`send_authorized=false`、`full_bundle_negotiated=false`。后续 OPEN_GATE、授权、准备、Guard 和每次传输许可仍各自成立。

`frame` 只检查单帧结构、方向及通道投影；`reply` 只检查回复信封；`negotiate` 只检查上述握手关系。共享日志、去重、方向序号连续性、会话持久化、恢复、租约、完整消息摘要和业务守卫仍由原协议约束，本包未实现运行服务。`journal_mode` 保留各原件接受集，不将紧急关闭强制改成普通 durable 消息。

## 验证与复现

生成器仅使用 Python 标准库。验收沿用 [离线验证依赖](../composition/requirements-validation.txt)，不作为生产工具链锁。

```text
python -I -B contracts/integration/build.py
python -I -B contracts/integration/build.py --output <尚不存在的目录>
python -I -B contracts/integration/check.py
python -I -B contracts/integration/check.py --suite <Suite仓库> --report
python -I -B contracts/integration/check.py --check-report
```

默认检查无需 Suite、无需网络；Schema 引用使用显式本地 registry。带 `--suite` 额外核对固定 Git blob，仍不执行旧业务服务。`--check-report` 只核报告输入，不重新执行行为用例。

样例由固定 Suite 的 `check_continuation_binding.upgraded(check_ipc_journal.fixtures()[0])` 提取，未改写原独立结构样例。采集时已核对所加载的项目 Python 模块和继承输入均等于固定 Git 原件，246 项见 [样例来源](source/frames-provenance.json)。这些摘要证明来源，不代替行为验收；实际执行范围以本报告为准。验收含全部 52 类型结构、反方向、旧版、非法序号、回复表、boot/session/运行域错配、双方伪造同一描述符、缺强制能力、选择未提供能力和生成拒绝用例。

## 剩余冻结事项

本轮完成统一模型图与当前 worker IPC 的机械归并。HTTP／WS 仍保留各来源版本，完整 bundle 接受集互认尚未成立；RequestContext、WS 票据和服务身份如何绑定 bundle 还需一起冻结。跨域 Ref 与数字接受集、权限与面板操作矩阵、快照投影、具名摘要及 DDL 映射、其他独立 IPC 通道、候选批准与阶段 0 交接继续按 Suite 原编号推进。

本轮为新提交周期第 1/3 轮，只提交 SDK；第 3 轮归并 Suite 权威状态后再按依赖顺序推送。此状态不表示完成系统设计，也不解除“全部系统方案设计完成后再业务实现”的阶段边界。
