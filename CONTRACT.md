# 产品开发契约

当前选择为 `leafseamer.api.v1.product1`。它包含完整的202项HTTP／WS操作声明：承接panel4的201项并新增签发Controller的 `DELETE /auth/sessions/current`。四个WS入口使用专用升级通道，其余198项有普通HTTP类型入口。声明存在不表示产品已实现该操作；服务仅开放已有处理器，其它能力不得宣称可用。

生成入口为 `scripts/build.mjs`；`sdk-inputs.json` 固定历史消费者与静态运行依赖，`sdk-contract.json` 固定完整契约基线清单。构建先核原件字节，再归并产品模型、路由、选择及类型；SchemaRef采用完整input／result文档的JCS摘要，RegistryRef采用已重绑Registry的JCS摘要，完整selection采用制品清单的JCS摘要。制品字节另以SHA-256核验，不混用三种摘要。

所有原有HTTP、WS、worker及面板根继续纳入生成和严格解码；worker IPC仍为0.14，面板通道仍为0.3，订阅仍为0.2。独立通道版本不因HTTP选择更新而自动升级。新旧HTTP选择不能混用，不静默回退；旧panel4文件保持原字节。构建期使用锁定的Schema和类型生成依赖，运行包不包含动态编译或外部npm依赖。

注销使用当前Cookie、CSRF和精确Origin，无目标body，不要求auth.manage或近期认证。202的 `operation_ref` 绑定服务、数据库、操作身份和修订；`propagation` 保留RevocationRecord字段，固定目标上限4096，与会话账本一致。Controller将持久session撤销floor投影为该session操作的issuer_commit_revision，将同一不可变事务身份投影为audit_id。未取得目标receipt时只能返回accepted与空receipts，不构造applied或假receipt；查询／远端消费和完整审计API仍须实施。

SDK的 `logout()` 无自动重试，完成或失败后清除内存认证材料。202只证明本地受理，401或本地清理都不证明传播完成。Controller发送202前再次核对已提交注销事实与认证时钟；结果未知保持错误，不补造成功或替用户重发。

当前仍保持 `approved=false`、`runtime_ready=false`、`advertisable=false`。完整主体视图、服务身份、配对、权限收紧及其他DF01差集仍须按既定首期范围生成并实现；本开发选择不代表最终发行接受集、生产认证资格、浏览器或设备验收。
