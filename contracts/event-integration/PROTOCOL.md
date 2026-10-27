# 完整事件组合的选择与边界

`leafseamer.api.v1.events2` 是新候选完整选择，与 `leafseamer.api.v1.integration1` 分离。旧选择的原件、摘要与处理语义不变。部署只有在全部对应处理器就绪并完成批准后才能广告该组合；当前 `approved=false`、`runtime_ready=false`、`advertisable=false`。

HTTP 使用精确 `X-LeafSeamer-Contract` 与 `X-LeafSeamer-Contract-Digest`，响应在选择完成后回带同一组合。人员 WS 提供契约 token 和单次秘密票据 token，服务 WS 只提供契约 token 并使用 mTLS。服务器仅回显契约 token，不能回显秘密。首帧是带完整 ChannelBinding 的 `contract.ready`，之后按 `channel__ClientFrame`／`channel__ServerFrame` 处理；不能继续使用旧无双向确认的数据根。

Context、票据、订阅和注册 Profile 的 selection 绑定同一新 ID 与精确 manifest 摘要。Schema 固定 ID 和摘要格式；实际摘要相等、主体与范围、当前期限、单次消费及关闭次序由处理器核验。匹配契约不是授权，不能据此打开设备出口或自动恢复运行。

清单的 `artifacts` 绑定固定资料字节；selection 摘要为整个 manifest 的 JCS SHA-256，并带 `sha256:` 前缀。清单和 selection 不递归计入 artifacts，避免自指。Profile 的 `graph_digest`／view SchemaRef 继续引用经逐定义等价证明的固定事件子图，不替换成 manifest 摘要，也不混淆裸 hex 与带前缀摘要。

人员四个旧入口在两服务各替换一次：创建订阅、读取快照、WS 升级、签发票据。新增查询、关闭、连接查原、分页及服务订阅入口。面板订阅路径和事件摄取 POST 保持原职责，不因路径含 events 或 subscriptions 就替换。其余路由只升级完整选择身份及相应响应身份；原认证方案、请求和领域响应模型保持。

新注册、快照、消费与发送参考包可核验结构和局部状态链，但尚未实现生产认证、WS/TLS 缓冲关闭、GUI 展示、规范 inbox／固定触发决定及相关执行额度事务。`projection_applied` 不得替代 `durable_ingest`。worker 的52种消息和完整命令模型保持原 wire 接受集，仅重绑图 URI；该组合不声称 worker 已协商整个 HTTP/事件 bundle。

任何不同 ID／不同摘要、旧 Context／票据、旧连接代次或未知广告都不得隐式降级。重选契约不能自动重投原写命令，应查询原操作或重新执行明确的资格建立。阶段 0 全系统门槛仍未关闭，本候选生成成功不构成发布或业务实现放行。
