# 契约选择、上下文及 WebSocket 绑定候选

状态：设计候选，未批准、未部署。对应 Suite C01／DF01 的协商归并任务；不更改已批准 draft.4，也不关闭跨域模型、身份提供者、订阅投影或持久化门槛。当前候选 ID 为 `leafseamer.api.v1.integration1`。这个 ID 有意独立于 SDK 包版本和 worker 的 IPC 0.14；不得当成正式 v1 兼容承诺。

## 事实与设计推荐

固定 SDK 输入 `9eb9cf5` 包含两服务 177 项操作、1263 个模型和 52 类 worker 帧。原 RequestContext、WsTicketBinding 未携完整契约选择，来源接口的版本头也不一致。现有 WS 两个入口通过子协议带单次票据，浏览器 WebSocket 构造器只提供 URL 和 protocols 参数。（来源：[SDK原件](../integration/README.md)、[WHATWG WebSockets 接口](https://websockets.spec.whatwg.org/#the-websocket-interface)。）

以下是本包提出并以离线模型验证的完整传输选择方案，不宣称线上已执行。控制权、授权、时间、额度及每次设备发送许可继续独立校验。

## 1. 身份、摘要与兼容

`Selection={contract_id, contract_digest}`。本候选 ID 为固定常量；摘要为 `sha256:` 加64位小写十六进制。Schema只能证明格式，运行选择必须与服务加载的可信 manifest 精确匹配。

manifest 的 `artifacts` 固定统一模型图、两份 OpenAPI、worker入口、方向表、路由表、policy 和本文的精确 UTF-8 字节摘要。`contract_digest=sha256(JCS(manifest))`；manifest 不包含自身摘要，selection 不加入 manifest，Schema也不嵌入本次具体摘要，因此没有自指循环。文件字节摘要与 manifest 的 JCS 摘要不能混用。JCS提供确定性属性排序及JSON规范表示，本包使用既定 rfc8785 0.1.4 校验依赖。（规范来源：[RFC8785](https://www.rfc-editor.org/rfc/rfc8785)。）

同一 contract_id 的资料不可静默替换。任何已对外广告的资料字节或协议语义变化须使用新 ID，并重新核兼容组合；格式看似相同也不回退猜测。新服务继续支持旧客户端时，须明确保留旧契约、旧解析／响应投影和已验证的处理适配器；只广告真正就绪的组合。预发布不按“同major”自动放行。本轮只交付一个候选组合，合成双版本测试不证明第二个生产组合可用。候选尚未发布前的修订不构成线上替换。达到8个保留组合上限而旧依赖未清理时，阻止引入第9个组合，不能自动挤掉仍承载查原、取消或恢复的旧版本。

请求幂等身份不增加 contract_digest 这一分区：原 context_id 固定选择，不允许换头或换Context来自动重新执行未知结果的写请求。历史查原、取消和恢复所依赖的旧处理组合须在保留期内可用；移除前先处理这些依赖，不能靠直接删除旧广告绕过直播在途风险。升级不得在已打开的连接中热换协议或自动重放操作。

## 2. 发现及普通 HTTP

每个宿主新增 `GET /.well-known/leafseamer-contracts`，不要求事先选择契约，以解决登录／首次初始化的启动环。它只返回 `negotiation_protocol=contract-selection/1`、authority_role 和至多8个支持的精确 Selection；不返回凭据、稳定服务身份、内部拓扑或运行状态，不授予权限，`Cache-Control: no-store`。同一ID不同摘要、重复ID、空列表均不构成有效广告。限流429，无可用组合503。只允许受信部署入口；客户端不能因广告而自动下载或执行未知Schema／代码。

其余175项普通HTTP均要求两个头：

- `X-LeafSeamer-Contract: leafseamer.api.v1.integration1`
- `X-LeafSeamer-Contract-Digest: sha256:<64位小写十六进制>`

字段名按HTTP大小写不敏感，值精确匹配。每个选择字段必须恰好出现一次；重复、逗号拼接、换行和非法值拒绝，不取首个或末个。框架／nginx必须保留或明确拒绝重复性，不能先静默去重。与版本无关的HTTP安全限制、解压和原始消息预算先执行；随后选择可信解析器，再执行原认证、领域校验和当前授权。不能为探测版本先尝试多个领域解码器。

原每操作版本头在新预览中由统一选择替代；原值保留在 `x-source-contract-parameters` 作为溯源，不作为可接受回退。38类旧基线响应和Meta（共39个定义）的 protocol_version 同步改成新ID，并携 selection。其他命名域的binding_version、protocol_version和revision是领域Schema版本，保留原义，不能全文替换。

选择成功后的响应（包括领域错误）回显这两个头，客户端验证其与发送选择一致后才能解码；不能仅因HTTP 2xx信任结果。选择前的400／409使用固定 `SelectionError`，无须假造已接受的选择头。结构为 negotiation_protocol、code、request_id、domain_evaluated=false、retry_advice=do_not_retry；不包含秘密或原请求受理结果。

| 失败 | 结果 |
| --- | --- |
| 选择头缺失、重复、格式非法 | 400 CONTRACT_SELECTION_INVALID |
| 无已广告的精确ID／摘要组合 | 409 CONTRACT_NOT_SUPPORTED |
| Context、票据或响应与选择不一致 | 409 CONTRACT_BINDING_MISMATCH；客户端响应校验失败则拒绝解释 |
| 选择正确但认证／权限不足 | 保留原401／403等领域规则 |

这些错误只证明本次尝试未进入领域解析，不永久裁决先前可能已受理的同一业务请求；不能据此创建新幂等身份重发。网络丢响应仍按原查原规则处理。一个契约可以包含内部操作，发现或正确选择不让浏览器取得内部调用权。

## 3. RequestContext 与票据

createRequestContext 的请求和服务端持久记录均增加必填 selection，值必须等于已核选择。后续所有使用 context_id 的操作从权威存储读取Context并比对选择、主体／凭据链、服务audience、issuer_epoch、期限及操作交集；不能只核客户端回传的Context。协议检查不替代这些现有权威条件。

WsTicketRequest 与 WsTicketBinding 增加必填 selection，Binding还增加 service_boot_id。票据继承Context选择，绑定现有 session、issuer_epoch、origin、client_instance_id、scope_digest、audience和期限。首个201仅返回一次秘密票据；重复200仍只返回非秘密绑定，不重新发票据。失败后也不能使用新契约重新发出旧秘密。人员WS票据不扩展成service会话；服务订阅与第三方面板通道保留各自设计边界。

权威签发事务必须将选择和绑定一起写入原票据记录；升级时，原认证及有效性重读、选择匹配、单次消费与连接绑定在同一串行化边界裁决。竞争中只能一个消费成功。票据消费提交后101或首帧丢失，票据仍已消费，不能回滚消费或重放；新连接要经新授权票据，原业务请求不随之重放。本包的串行关系模型只验证此不可逆规则，不证明真实数据库并发和认证原子性；物理迁移、现有writer与双连接验收列入实施交接。

## 4. WebSocket 握手和首帧

两个WS入口不要求浏览器设置上述自定义选择头。客户端提供且只提供：

1. `leafseamer.contract.<contract_id>.<64位摘要十六进制>`。
2. `leafseamer.ticket.<base64url秘密票据>`。

服务器只能回显第一个完整契约token，绝不能回显票据token；缺失、重复、未知token、旧 `leafseamer.v1`、多份候选或选择与票据不符均拒绝升级。两个token顺序无关。Origin继续精确检查，不因有票据而忽略。所用字符符合WebSocket子协议token要求，服务端选中的协议必须来自客户端提供集合。（依据：[RFC6455 §4.1、§4.2.2](https://www.rfc-editor.org/rfc/rfc6455)。）

101之后首个应用帧必须为 `WsReady={type:contract.ready,selection,binding_id,service_id,service_boot_id}`。客户端核对已签发绑定和部署身份后，连接从 `await_ready` 转为 `ready`。前置事件、重复Ready、错摘要、错boot／binding、连接中途换选择均使连接关闭；后续只按固定 WsData 解码。首帧超时使用连接建立时的单调期限，不能据NTP回拨延长；具体额度继承部署连接预算，不新增无限等待。

首帧仅证明当前传输组合绑定，不证明收到状态快照、订阅已live、设备可发命令或worker已Ready。既有游标、重同步、订阅授权和待归并的C05投影／客户端ACK规则独立成立。本轮保持原事件payload图，不把它包装成已完成当前命令／控制权投影。

## 5. 交付与限制

离线候选提供Schema/OpenAPI、逐操作路由裁决、精确清单、纯函数关联模型及正反例。新HTTP/WS资料为179项操作（原177＋两服务发现各1）；worker仍52种、IPC wire未改，不能因此宣称worker已经协商完整bundle。JSON未知写字段和数字接受集仍由选定版本及DF01约束。

后续须将选择字段和票据消费接入实际可信身份与存储writer，补nginx重复头、浏览器子协议、并发消费／提交后断开、兼容适配器和完整C05投影验收。跨域Ref、权限矩阵、摘要／DDL等原冻结事项继续有效。上述运行证据可在实施阶段执行，但契约和失败行为不得留给运行时猜测。本文未授权业务实现、部署、发布或真实设备操作。
