# 面板输入、结果、通道与完整选择归并

已知事实：固定 events2 的服务 BoundIntent、RequestReceipt 和面板订阅仍引用旧 35 方法输入及旧结果文档摘要。新输入和结果已分别提供可复验候选，但尚未安装。来源及固定提交见 [sources.json](sources.json)，逐方法语义见[输入规范](../panel-methods/METHODS.md)与[结果规范](../panel-results/RESULTS.md)。

本稿基于这些事实构建独立选择 `leafseamer.api.v1.panel3`，保留 201 个操作及 52 类 worker 消息。面板使用 `panel-channel/0.3.0-draft.1`，面板订阅封装使用 `panel-subscriptions/0.2.0-draft.1`。新的完整图、两份 OpenAPI、双向事件帧、完整面板帧、固定输入结果文档和 Registry 一并绑定清单。批准、运行就绪和广告资格均为 false；生成完整资料不表示真实提供者、数据库或业务运行已经完成。

## 摘要与无循环生成

输入和结果各生成一个封闭 Schema 文档，仅包含其具名输出及真实引用所需的领域闭包，全部引用在本地解析，不下载 URI。`D__` 名称代表固定来源的领域定义。文档根禁止直接接受实例，必须选 Registry 中的具名定义。领域结构保留，新完整选择版本常量显式升级。面板表单动态 Bundle 与 SDK 固定输入/结果文档各有职责；不把整个内部领域图交给面板作为动态 exports。

SchemaRef.schema_digest 是完整输入或结果文档 JCS 的 SHA256，使用 64 位小写十六进制，不是子树摘要。Registry 含 35 个明确方法描述符，自己的 revision/digest 覆盖完整 Registry。Manifest 中每个文件用原始字节 SHA256；完整选择 digest 是 Manifest 的 JCS SHA256，带 `sha256:` 前缀。三个摘要层次不得互换。输入/结果文档不反向引用 Registry、完整图或 Manifest 的摘要，清单不包含自身及 selection 文件，避免自指。

生成后的 Registry、ActivationRef、PortOffer、PrepareActivation 及 Bundle Manifest/Ready 固定相同 registry_ref。输入和结果类型、方法用途及订阅模式逐方法约束；合法同形值带旧文档摘要也必须拒绝。显示 Registry 或面板自报 ready 不证明当前安装批准或权限。真实会话仍须重新检查批准、scope、激活、委托和字段权限。

## 调用、结果与订阅

19 类窗口/端口消息全部保留。调用 Request、Intent、服务 BoundIntent 使用当前输入；服务 RequestReceipt、host.result 以及 17 种投影订阅使用当前结果变体。Definition 的草稿/发布、Mutation 的授权撤销/生命周期按方法选择，不能借共同 View 名称接受错误变体。两个分页方法仅发送失效通知，预检/恢复预览和所有写方法不可订阅。

新的 host.result 增加 `projection_state`，受理状态与显示可用性分开：

| status | projection_state | result |
| --- | --- | --- |
| accepted | available | 对应方法的精确 SchemaRef 与当前结果 |
| accepted | unavailable | null，保留已受理事实及 reason_code=ok |
| pending_confirmation / rejected / cancelled / unavailable | not_applicable | null |

其中 unavailable 的 status 表示当前通道没有可用的受理结果，不能据此推定领域操作未发生；投影不可用不使用这一 status 覆盖已有 accepted。宿主从服务回执映射时保留原状态与 projection_state。响应丢失只能查原请求，不自动重发，不重新消费确认，不延长句柄期限。pending_confirmation 仅允许原八种可信确认方法。

面板订阅的 baseline/update 仍需真实完整投影提供者及每次释放授权；新 Registry 和正确 SchemaRef 不替代它们。旧订阅、旧激活、旧页/评估/恢复句柄不能通过改写摘要迁移到新选择。切换先停止旧端口及订阅的释放，重新创建会话、批准绑定与完整基线；历史写操作仍按原请求和原版本查原，不转成新请求重发。

## 完整协议边界

两份 OpenAPI 的请求/响应选择头及四个 WS 入口的子协议绑定新 ID；人员 WS 保留契约与票据两个 token，服务 WS 保留单个契约 token。选择摘要须与当前安装清单精确一致，不允许相同 ID 的不同摘要或静默降级。身份、CSRF、对象权限和全部领域守卫按原声明保留，发现入口仍不需要预先选定组合。

原事件十二类注册视图的闭包及其独立 SchemaRef 摘要不随全图 URI 自动改变；投影 ACK 不替代规范摄取。worker 命令模型和消息方向/回复关系保留，仅模型图 URI 移动；公共选择不表示 worker 已获得发送资格。既有解码器和类型客户端绑定 events2，不能直接用于 panel3，必须在采用新选择前重建并验证对应产物。

当前绑定完整结构仍不关闭所有设计问题：固定发布内容/metadata 的持久关联、动态摘要的批准 Schema、真实授权和投影提供者、面板事务及最终出口需要继续落实。已有运行、平台和设备证据只属于各自旧成果，不能继承到本候选。阶段 0 保持开放。
