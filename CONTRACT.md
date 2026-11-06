# 产品开发契约

当前选择为 `leafseamer.api.v1.product4`。它包含完整的202项HTTP／WS操作声明：承接panel4的201项并新增签发Controller的 `DELETE /auth/sessions/current`。四个WS入口使用专用升级通道，其余198项有普通HTTP类型入口。声明存在不表示产品已实现该操作；服务仅开放已有处理器，其它能力不得宣称可用。

生成入口为 `scripts/build.mjs`；`sdk-inputs.json` 固定历史消费者与静态运行依赖，`sdk-contract.json` 固定完整契约基线清单。构建先核原件字节，再归并产品模型、路由、选择及类型；SchemaRef采用完整input／result文档的JCS摘要，RegistryRef采用已重绑Registry的JCS摘要，完整selection采用制品清单的JCS摘要。制品字节另以SHA-256核验，不混用三种摘要。

所有原有HTTP、WS、worker及面板根继续纳入生成和严格解码；worker IPC显式升级为 `ipc/0.16.0-reference-optional-draft.1`，面板通道仍为0.3，订阅仍为0.2。新旧选择与IPC版本不能混用，不静默回退；旧panel4文件保持原字节。构建期使用锁定的Schema和类型生成依赖，运行包不包含动态编译或外部npm依赖。

执行IPC按 `execution-capabilities.json` 协商。HELLO只宣告当前装配已实现的能力，HELLO_ACK选择两端交集及完整依赖，至少具备监督运行域、双向日志和终端关闭三项。两端对每条业务帧在严格解码之后、领域副作用之前调用 `assertDeviceExecutionFeatures`；未知、重复、缺依赖的能力或未协商路径均拒绝并关闭会话。握手成功仍为closed，不授予设备写权，不降低Guard、持久日志、授权、Ownership、许可单次消费或证据要求。

普通手动即时路径要求完整manual能力组；面板、自动化、取消、参考时间、协议重传与保护执行分别增加对应要求，业务正文中的来源、时间和屏障集合同样受检查。未选择相应能力时，OPEN中的运行／取消快照只能为空，参考时间快照默认仍须满足完整Schema；明确选择reference_time_absent且未选择任何reference能力时，OPEN必须保留字段并可置为null，ACK对应Ref也为null。该分支没有参考时间资格，TIME消息、需要UTC的Guard与定时请求仍在领域副作用前拒绝；不得伪造provider、State或时间代次。已选择reference能力时禁止null，后续启用必须换会话重新准入。`protection_execution` 是新版本的明确能力；ordinary开闸不隐含支持保护发送。能力交集固定于会话；变化必须结束原会话并以新的受监督运行重新准入。静态消息目录和能力清单不代表当前Controller或Worker已经实现这些能力，装配层不得直接宣告全部清单。

`initial_control_fence` 单独允许首个关闭屏障：FENCE及确认必须是零签发、空普通／传输／取消账本、gate revision 1、首次尝试且无前驱。确认还须无丢弃、在途和未决命令。它不包含OPEN、非空屏障、后继尝试或设备写权限；这些路径继续要求完整manual及对应能力。控制权、当前连接、原始账本和持久消息来源仍由装配层验证，能力标志不能代替来源证据。

增量闭环是首期实现的中间里程碑；面板、自动化、取消、参考时间及其他既定功能和最终验收范围保持不变。

product4将命令记录及其快照、面板投影的 `accepted_at` 显式扩为参考时间戳或null。无参考时间的即时命令保存null；Controller必须另行持久保存实际受理单调域、tick和原截止，查询不使用当前系统时间补填。完整记录中null只允许immediate排期，定时命令仍须可信参考时间。已有参考时间戳的格式保持不变，字段不得省略。历史product3选择不能混投；此变更不把认证时钟升级为参考时钟，也不改变最终参考时间功能范围。

注销使用当前Cookie、CSRF和精确Origin，无目标body，不要求auth.manage或近期认证。202的 `operation_ref` 绑定服务、数据库、操作身份和修订；`propagation` 保留RevocationRecord字段，固定目标上限4096，与会话账本一致。Controller将持久session撤销floor投影为该session操作的issuer_commit_revision，将同一不可变事务身份投影为audit_id。未取得目标receipt时只能返回accepted与空receipts，不构造applied或假receipt；查询／远端消费和完整审计API仍须实施。

SDK的 `logout()` 无自动重试，完成或失败后清除内存认证材料。202只证明本地受理，401或本地清理都不证明传播完成。Controller发送202前再次核对已提交注销事实与认证时钟；结果未知保持错误，不补造成功或替用户重发。

当前仍保持 `approved=false`、`runtime_ready=false`、`advertisable=false`。完整主体视图、服务身份、配对、权限收紧及其他DF01差集仍须按既定首期范围生成并实现；本开发选择不代表最终发行接受集、生产认证资格、浏览器或设备验收。
