# 人员／服务订阅的同源通道候选

本轮将 C05 的人员与服务 owner、HTTP、双向消息及上一轮当前命令快照接入同一模型图，交付 **15 项操作、122 个模型**的设计切片。状态 `approved=false`、`runtime_ready=false`、`x-advertisable=false`；没有改写原 integration1 选择，也没有开始业务实现。其余领域投影和完整版本组合仍待联合审阅。

已知事实：原服务候选有七类对象但没有 HTTP；人员旧订阅只有 scope／event_types 和裸 resume_cursor；人员 WS 票据没有具体 subscription_id。C05 SS02／SP03 已规定服务独立 mTLS、精确附着身份、固定页面地址和当前代际检查。（来源：[固定 C05 设计](https://github.com/LeafSeamer/leafseamer-suite/blob/21dd0175abaf503f2ff8c348e3c7a5d0c40722c7/docs/rebirth-c05-event-sync-design.md)、[旧服务 Schema](source/service-subscription.schema.json)、[当前命令投影](../event-projection/README.md)。）以下是这些设计的候选具体化，尚非已批准运行基线。

## 同源入口及替换范围

[生成器](build.py)消费固定 SDK 投影图和固定 Suite 服务模型；Id、Counter、Digest、DeliveryBinding 在两个来源逐节点等价后统一引用，86 个快照定义完全保持。新增 owner／scope／ticket／channel 类型及双方帧使用同一闭包，[OpenAPI](preview/subscriptions.openapi.json)只改本地引用表示，没有另一份手写类型源。

| 路由后缀 | 人员 `/api/v1` | 服务 `/internal` | 关键绑定 |
| --- | --- | --- | --- |
| POST `/subscriptions` | HumanCreate，200 查原／202 新建 | ServiceCreate，同响应 | owner 从可信认证映射构造；请求禁止 owner／active；原幂等身份不复活终态订阅 |
| GET `/subscriptions/{subscription_id}` | 当前人员 owner | 当前服务 owner | view 含完整 owner、scope、选择、流世代、generation、ACK 和 snapshot_ref |
| DELETE 同上 | bearer AND CSRF | mTLS | query expected_revision；只关闭订阅；重复关闭可使用原关闭前修订或关闭后修订 |
| GET `.../connections/{attempt_id}` | 同 owner | 同 owner | 返回原 attached 和 current；current=false 不是新 socket 的授权 |
| GET `.../snapshot` | 固定 manifest | 固定 manifest | 必填 expected_connection_generation；不缓存、不补当前数据 |
| GET `.../snapshots/{snapshot_id}/pages/{page_index}` | 固定页面 | 固定页面 | page_index 0—127；当前 owner／scope／domain／期限／generation 逐次复核 |
| GET `/events` | 单次人员票据升级 | 配对 mTLS 升级 | 只建立待附着通道；与已有 POST `/internal/events` 摄取职责分开 |
| POST `/ws-tickets` | 201 一次秘密／200 非秘密绑定 | 无此入口 | 精确 subscription_id、authorization_revision、scope_digest、owner、Origin、client、选择及运行身份 |

15 项操作在两种 publisher authority 均可用，联合归并时为 **30 个 authority 操作实例**；不表示已实现 30 项功能。公开 createSubscription/getSnapshot/openEvents/issueWsTicket 替换旧同路径同方法操作，其余新增；面板代理接口与内部 POST 摄取保持独立，不能按路径前缀误删。该切片不是完整 Controller／Seamer API，也不提前广告新组合。

普通 HTTP 使用精确契约 ID／摘要双头，按既有协商层拒绝缺失、重复或不支持选择；成功选择后回显。400／409 的 SelectionError 在领域解析前返回，domain_evaluated=false 不能裁决先前结果未知的命令。该层的重复头解析沿前轮候选，未在本轮重新实现。

## owner、scope 与读取授权

HumanOwner 固定 kind、issuer_id、issuer_epoch、principal_id、session_id、client_instance_id；ServiceOwner 固定 kind 加原七项 issuer／principal／consumer 服务、库、槽和 pairing 身份，不含人员 session。创建时由可信入口核实，client.attach 中的 owner 只作三方比对，不是身份凭据。服务创建按 `(publisher,owner,purpose,request_id)` 幂等，人员按 owner、context_id、idempotency_key 绑定；同身份异内容拒绝，同内容可查终态，但不会新建替代订阅。

ScopeSpec 固定 scope_id／revision、projection_profile_ref 及 collection 集合。每类绑定服务端已批准的 selector_ref；selector 的参数及历史窗口包含在其不可变引用内容中，不接受 SQL、脚本或任意过滤表达式。重复 collection、错误 authority、超范围请求整体拒绝，不能静默缩窄后声称“完整”。commands／executions／occurrences 必须包含未决对象；current 不能作为这些集合的历史策略。

本轮推荐的具体权限映射见 [policy](preview/policy.json)：Controller 的 devices／catalogs／observations 需 device.read，commands 需 command.read，controls 需 control.read；Seamer definitions 需 definition.read，runs／business_states／executions／排期投影需 run.read；sources 需 status.read 及明确 selector／来源授权。人员所有集合另需 status.read，服务另需 event.internal.subscribe。这些权限名只是一层门槛，不能替代逐资源范围、来源和字段投影批准。排期及 source 的最终权限映射仍须随其完整领域 API 联校。

canonical_trigger 仅为已批准 Seamer 服务、完整来源集合且含 sources；不允许类型过滤隐藏来源序列，确认必须 durable_ingest。状态投影仅 projection_applied，不因 service 身份自动获得执行权。service consumer 槽首期一个活跃订阅；终态可靠释放槽但保留幂等／attempt 墓碑。人员注销只命中同 issuer／epoch／session 的 human owner，不连带撤销组织服务订阅。

## 连接、快照和 ACK 时序

1. WS 先验证选定组合。人员提供契约 token＋票据 token，服务只提供契约 token 且验证实际 mTLS；服务器只回显契约 token。首帧 `contract.ready` 携带 ChannelBinding：binding_id、selection、publisher 服务／库／boot、owner、transport；人员固定 subscription_id，服务为 null，随后 attach 才选具体订阅。此新首帧与原 negotiation WsReady 不同，必须随新完整选择发布，不能在旧通道混用。
2. 客户端收到并核对 Ready 前不能发送 attach 或接受数据。第一条业务帧必须 client.attach；只有 attached 后才允许快照确认、ACK 或数据。服务端从真实 transport 保存 channel／凭据引用，不接收客户端构造 ChannelBinding。未附着失败只关闭连接，不编造带订阅身份的失步帧。
3. attach 以 expected_connection_generation CAS；同 attempt 只在原 socket 仍当前时重发原 attached，换 socket 复用拒绝。客户端对原 attached 的重复只作忽略，不能回退已推进的状态。旧 attempt 的查询结果不把旧连接恢复成当前。替换成功使旧 generation 的释放／ACK／页面确认失败；已经交 TLS 的字节不承诺收回。
4. 发布完整固定快照后，客户端按既有规则校验全部页面并原子应用，再确认 SnapshotRef。baseline ACK 摘要为 `SHA256(JCS({entry_kind:"snapshot.baseline",payload:SnapshotRef}))`，不能填 manifest_digest。普通用途确认承诺来自订阅，不增加 client_durable=true 自证字段。
5. 追赶只发 reconcile。sync.ready 的摘要为 `SHA256(JCS({entry_kind:"sync.ready",payload:{baseline_snapshot_id}}))`。客户端处理到检查点可显示交付已追赶；本轮明确服务器收到覆盖该检查点的连续 ACK 后，才将后续数据标 live。ACK 丢失重发不会撤销同一 live 连接资格，检查点本身不解除 run 暂停或 source 锁存。
6. 重连只使用服务器已确认的 cursor／digest 和仍保留的映射；客户端已落库但 ACK 丢失时不能自报更大水位。缺投影、缺映射、错确认点或未确认旧快照失效，锁存 resync_required 并重新订阅／完整快照，不跳当前尾部。正常重连也先 catching_up／reconcile，不补直播动作。

ACK 只能确认当前 generation 已提交发送的连续前缀，不能超 last_sent；重复较旧 ACK 须仍有匹配摘要映射。data 的摘要覆盖完整 entry，不含新连接 envelope；source origin 摘要、manifest 摘要和 checkpoint 摘要各自独立。快照和通道裸 hex 与命令原件的 sha256: 前缀沿上一轮具名接受集，不全局改字符串。

## 故障、持久写集及模型边界

| 故障或事务 | 必须保持的结果 |
| --- | --- |
| create 提交成功／响应丢失 | 保存请求摘要、owner／scope／选择、槽和 pin；同身份查原，不增加订阅 |
| 两个 attach 使用同旧 generation | 短事务只成功一个；attempt＋原 socket＋新 generation 及旧连接失效同提交；失败不能把旧连接冒充新连接 |
| attach 提交未知或进程崩溃 | 不发成功；按 attempt 查原。新进程不能继承旧 socket，重新附着；无法证明已发送映射则重同步 |
| snapshot.applied 响应丢失 | 已确认的同绑定重复返回原结果，不重做应用。已经完成的确认重发不靠下载 TTL 延寿，也不因 TTL 到期重置 live |
| 发送／ACK | 持久准备映射，最终释放前重核，传输提交点可证明后才接收 ACK；ACK 与可释放 pin 更新同事务，网络等待不持写锁 |
| 撤权、换域、boot 改变、证书轮换 | 旧释放资格失效；新证书不能绑定到旧 socket，必须新 attach。权限变化终结旧 scope；换进程不得继续下载旧未完成页 |
| generation／revision 耗尽 | 不回绕，停止释放；可靠状态无法递增时只报告保护未完成，不伪称终态已持久保存 |
| 交付映射预算耗尽 | 锁存 resync_required；不丢中间映射、不跳号继续 live；不删除命令或 inbox 证据 |

服务端快照 TTL 在同受监督时钟域按单调截止执行，到期等号拒绝；重新下载／attach 不延长原截止。公开 expires_at 不是唯一判据。ACK 不删除 inbox 去重、命令证据或来源 gap。

[model.py](model.py)是串行内存设计模型，ctx 中的认证、已批准 scope、selector 内容资格、完整快照提供者和容量布尔均为**人工可信前提**，不属于任何请求 Schema。其 atomic 包装仅模拟拒绝回滚，不证明真实 SQLite CAS、WAL、磁盘故障或发送点。模型的 256 条映射上限用于有界故障测试，不是批准的生产容量。真实状态机须在无来源证明时停止释放；代码中的模拟“已发送”不能用于证明网卡或设备已收到。

人员票据首次 201 秘密只返回一次，重复 200 只返回非秘密绑定；消费提交后 101／Ready 丢失也不恢复秘密。模型验证消费绑定及不复活，完整签发幂等库与真实认证仍待实施。凭据引用留在受信运行上下文，不放入公开 owner。

## 复现与未完成事项

```text
python -I -B contracts/event-channel/build.py --output <不存在的目录>
python -I -B contracts/event-channel/check.py --examples
python -I -B contracts/event-channel/check.py --report
python -I -B contracts/event-channel/check.py --check-report
```

沿用 [验证依赖](../negotiation/requirements-validation.txt)。[合成正例](examples.json)、[检查器](check.py)与[报告](report.json)分别交付，检查包含 OpenAPI、消息方向、来源定义等价、幂等／附着竞争、旧代际、ACK／resume、票据及权限边界。它不执行浏览器、真实服务、数据库并发或设备。

ClientOrder 另验证 Ready／attach／attached／基线声明的顺序、相同绑定及重复响应，错误后永久关闭；它只接受“绑定正确的帧”，不证明页面真正应用、data 摘要或 source 资格。完整帧消费者还须调用既有分页、payload／动态 Schema、来源完整性及授权规则。

下一轮交接此切片与命令投影。仍需完成其余十一类最新领域映射、selector／投影 profile 的机器注册、实际提供者及 DDL、真实接收驱动和完整双 authority OpenAPI／SDK 选择组合；此处类型及串行检查不等于上述实现或系统设计完成。已批准 draft.4 原件保持，阶段 0 未关闭。本轮为第 2/3 轮，仅本地 main 提交，第三轮审查后统一推送。
