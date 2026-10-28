# 完整HTTP调用主体、可信上下文与复核契约

已知事实：固定事件选择已有201个操作，旧逐操作主体候选覆盖71个旧入口；后续命令、生命周期、时间、安装、面板及事件接口增加了独立认证和对象约束。当前HTTP信封只校验结构与选择，类型客户端也不授予权限。本稿将当前完整API的认证分支、权限和对象守卫汇入[绑定清单](bindings.json)，来源字节及提交见[sources.json](sources.json)。

基于这些事实，本稿提供新的设计候选 `authorization-bindings/1`。它不是令牌服务、权限实现或公共协议修订；`approved=false`、`runtime_ready=false`、每操作`authorization_granted=false`。既有OpenAPI及选择摘要不变，未把旧候选或新增取舍登记为用户批准。62个守卫的职责和12个提供者的输入、输出与失败行为均列入清单，实际提供者尚未接入。

## 完整键、认证与用途

操作键固定为 `authority:operation_id`，再精确绑定method、path、transport与选择。authority来自受信服务挂载，不从Host之外的任意转发头、请求body、对象名或URL文本推断；同名操作在Controller与Seamer仍为不同权限空间。新增操作、认证方案、来源模块或守卫未登记时生成失败，没有默认human或默认service。

`security`完整保留原OpenAPI的OR分支；每个分支内部的全部凭据为AND。分支的`security_alternatives`只能指向能够证明该profile的原认证分支。Cookie与CSRF、humanBearer与CSRF不可拆成任选。身份提供者还核对精确Origin、当前会话/CSRF及源中具名守卫；非浏览器Origin不代替凭据，反向代理身份头不代替实际mTLS对端。

| profile | 必须由可信提供者取得的身份事实 |
| --- | --- |
| human | 当前human本地主体、非空当前会话、目标audience与凭据链；不接受body自报human |
| service | 当前组织服务身份，session为空，范围来自当前组织批准，不继承批准人员的会话 |
| seamer | service条件，加双方当前配对与权威登记Seamer角色；只进入显式允许的自动化分支 |
| provider | service条件，加实际来源注册、provider/boot/stream/用途；与普通服务身份不互换 |
| internal | 实际mTLS对端、当前配对和指定用途；不自动取得public bearer分支资格 |
| cookie | 当前人员会话Cookie、会话绑定CSRF与精确Origin同时成立 |
| ticket | 当前人员会话与一次性票据的audience/Origin/client/scope/选择绑定；101不授永久资格 |
| bootstrap / login | 有限部署能力或登录证明及有界预算；源security为空不等于匿名管理，auth.*为登录前用途标记 |
| discovery | 只能释放静态公开契约广告及有限错误；不装载新代码、不泄漏主体/设备/安装状态 |

`named_permission`需当前命名权限及对象范围；`bound_object_and_method`用于面板等由宿主会话和固定方法定义授权的入口，并非省略权限。invoke和确认提交须再按方法目录及被代理的领域操作核对权限。`pre_identity_purpose`不能要求先拥有登录后的RBAC，也不能跳过登录/部署能力证明。额外凭据不能使请求从已失败分支降级到另一个较宽分支。

## 可信调用快照与提供者

提供者只由服务组合根按清单中固定ID安装，不能从请求选择模块或函数。调用形式为 `resolve(invocation_handle, checkpoint, previous_handle?) -> fact_handle | denied | unavailable | fault`。两个handle均是服务实例内的不可伪造句柄，不接受反序列化JSON作为可信事实；单个guard通过只表示本次评估结论，不是发送许可。

调用句柄至少绑定以下字段，完整记录由目标服务保存，不加入当前公共请求body：

| 字段 | 类型与约束 |
| --- | --- |
| authority、service_id、database_instance_id、service_boot_id | 安装配置及本次运行实例的不可复用身份，必须与实际提供者一致 |
| operation_id、method、path_template、selection | 固定清单项及精确契约ID/摘要；实例路径参数另存已校验值 |
| request_identity、request_digest | 已校验输入和实际凭据链绑定；digest只证明字节身份，不证明权限；无RequestKey的读取使用本次不可复用调用ID |
| issuer_id、issuer_epoch、subject_id、principal_kind、principal_id | 当前身份映射；本地subject不能用裸外部principal代替 |
| credential_id、credential_revision、session_id | 原始入口实际认证结果；service的session为空，human当前会话非空 |
| audience、authorization_revision、scope_ref、delegation_ref | 目标服务的当前权限交集；没有委托也须显式记录空值，不能剥掉原委托域 |
| snapshot_id、clock_domain_ref、sampled_tick、expires_tick | 同一次可复核快照与可信单调时钟域；tick为规范十进制字符串，换域或到期不复用 |
| target_refs | 根据固定操作解析的规范对象引用列表，含owner/原authority/修订；创建前先绑定父命名空间，不能要求尚未创建的对象已存在 |

每个fact_handle额外绑定provider_id、该提供者的当前状态代次、checkpoint、调用身份、全部依赖引用及最早截止。截止为凭据、会话、组织批准、grant、委托、对象快照及策略期限中最早可证明者；任何必需期限不可证明即unavailable，不设置无限TTL。引用可解析、哈希相同或客户端声称fresh/durable均不能创建fact_handle。

清单内提供者表逐项指定权威所有者和必要输入/输出；identity核认证与配对，permission核当前范围交集，object解析目标归属，其余分别由控制、Context、会话、订阅、扩展、自动化、来源、延续及容量所有者负责。提供者只能读取或准备决策；初始化、刷新、票据消费和业务状态写入由其所属事务在提交点执行，不能因评估函数被调用两次而重复消费。

## 阶段、失效与释放

固定顺序为：原始预算/信封 → 完整认证分支 → 当前身份、audience及撤销下界 → 命名权限或宿主方法权限 → 规范目标及owner → 全部用途守卫 → Context/幂等/修订和领域专属门控。原始输入或结构错误可提前拒绝，但不能因此释放对象内容。守卫清单是AND，不允许“已满足其中一个”即放行。

| checkpoint | 责任与禁止行为 |
| --- | --- |
| admission | 为本次输入建立同快照的当前身份、范围与对象关联；返回的早期结论不能冻结后续权限 |
| before_authoritative_commit | 操作有权威写入时，在领域事务的提交边界按当前代次/修订重核；纯读取没有写事务时明确不适用，不伪造已提交结果 |
| before_response_release | 在响应字节交给传输前，重核当前对象可见性、身份截止与撤销；历史成功或幂等命中不授予当前读取权 |
| before_frame_release | 四个WS入口的每次数据帧释放重核owner、scope/profile/selector、订阅和当前授权代次；ACK持久采用另走权威提交检查 |
| public_metadata_release | 发现入口只检查静态广告资格及预算，不加载动态身份对象 |

跨提供者快照不能仅靠相同snapshot_id拼接。组合根须取得各权威的版本/截止证明；最终相关事务或释放门在同一个串行点核对代次仍有效。若需要跨服务事实，必须采用该服务已有的有界授权快照/撤销协议，不能把顺序HTTP查询伪称原子快照。缺失当前证明时停止本次受理/写入/释放，返回不可用；不延长旧缓存、不隐式重试或发送取证命令。

委托、会话、来源、配对、scope或安装激活代次下降均使相关旧句柄失效；数据库/服务启动身份改变后也不复用。响应已经交给传输的字节不可撤回，取消或校验失败不能推断远端未执行。HTTP策略不是设备最终出口：真正派发仍由Controller/worker既有控制、准备、时间、资源和唯一出口门重新核对，不能把admission或response_release当设备发送许可。

## 失败与正常轨迹

| 结果 | HTTP边界与状态处理 |
| --- | --- |
| 凭据、票据或会话无效 | 使用该操作已声明401响应，按绑定Schema生成脱敏正文，不泄漏账户或目标存在性 |
| 主体、权限、owner、用途或范围不允许 | 使用该操作403；不换主体、不洗掉delegation、不取历史较宽权限 |
| 可信上下文缺失/过期、权威不可用或评估故障 | 使用该操作503；不把无法验证改成业务失败或已执行，不自动重试写操作 |
| WS尚未升级 / 已经升级 | 未升级沿已声明HTTP拒绝；升级后沿现有通道终止/失步协议关闭释放，不能再写HTTP状态或伪造普通业务帧 |
| 已提交后响应无法释放 | 保留领域操作和幂等原记录；客户端结果未知，后续查原仍须当前查询权；不可回滚历史成功或重发原动作 |

正常轨迹：当前human请求命令证据 → 完整bearer分支 → 当前command.evidence.read与设备范围 → 从权威命令记录解析owner/证据修订 → 生成有界投影 → 释放门重核仍有效 → 交付。查询者是原发起者也不省略当前读权。

关键故障轨迹：配对Seamer查原已受理命令 → 自有automation及当前scope通过 → 在响应准备期间组织授权撤销 → before_response_release发现修订变化 → 不释放原内容，按既有错误Schema拒绝/不可用 → 已受理记录保留，既不取消他人控制也不自动重发。另一个Seamer即使猜中ID仍不能进入自有命令分支。

面板轨迹：受信宿主创建session时先核installation/slot父范围 → 当前窗口/实例/激活及委托绑定 → invoke解析固定方法 → 当前human权限∩安装批准∩方法capability∩实体范围 → 被代理领域操作重核。旧preview或同名窗口不继承新激活资格；确认不跳过被代理操作。

## 迁移与验收范围

`legacy_changes`逐项列出旧71入口与当前201入口的新增、替换及显式分支变化。当前命令服务分支采用已声明的配对Seamer自有automation；公共时间查询采用当前humanBearer，不因旧推荐曾允许service而扩宽当前API。旧候选保留为固定来源，不能直接拼接旧分支或按operationId猜同权威。

本轮检查证明固定来源、201操作无遗漏、认证OR/AND、profile匹配、权限/守卫/提供者闭包及阶段计划一致；不执行真实认证、授权竞争、事务或网络。完整跨域Ref、语义原子规则、面板35方法的领域语义以及生产DDL仍按所属契约完成；本稿关闭的是完整HTTP外层调用策略的登记缺口，不宣称C01/C07、阶段0或全部系统已关闭。实质权限取舍仍保持待审阅。
