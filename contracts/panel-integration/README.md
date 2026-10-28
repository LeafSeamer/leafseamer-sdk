# 面板与完整协议选择候选

本包把当前 35 方法输入和 21 类结果接入完整 Registry、窗口/端口帧、服务调用回执、面板订阅及两份 OpenAPI，生成独立的 `leafseamer.api.v1.panel3`。保留 201 操作、19 类面板消息、17 个投影订阅方法和两个失效通知方法；预检、恢复预览及写方法不可订阅。来源和精确提交见 [sources.json](sources.json)。

`approved=false`、`runtime_ready=false`、`advertisable=false`。本包是可审阅的完整格式候选，没有安装到服务或 GUI，没有执行真实投影、权限、存储、网络、浏览器和设备验证。阶段 0 仍未完成。

- [PROTOCOL.md](PROTOCOL.md)：版本、摘要、受理/显示状态、迁移及剩余边界。
- [method-registry.json](preview/method-registry.json)：35 方法的固定输入/结果 SchemaRef 和订阅用途。
- [models.schema.json](preview/models.schema.json)：完整具名模型图；[两端 API](preview/controller.openapi.json)及[Seamer API](preview/seamer.openapi.json)从同图生成。
- [selection.json](preview/selection.json)及[manifest.json](preview/manifest.json)：完整选择与无自指制品清单。
- [binding-map.json](preview/binding-map.json)：方法映射和已有模型变化、新增模型集合。
- [report.json](report.json)：实际结构检查、来源与生成字节绑定及未运行项目。

从 SDK 根使用 Python 3.14 以及固定验证库 `jsonschema==4.25.1`、`referencing==0.36.2`、`rfc8785==0.1.4`、`openapi-spec-validator==0.7.2`：

```text
python -I -B contracts/panel-integration/build.py --output <不存在的输出目录>
python -I -B contracts/panel-integration/check.py --report
```

生成器只向新目录输出，来源字节漂移即失败。检查器实际校验两份完整 OpenAPI、逐方法调用/结果及订阅、其余领域保留和全部制品重建；只解析预注册的本地资源。固定原样例中的可信布尔没有作为本轮授权事实，也没有重跑其旧轨迹。

新输入/结果文档包含真实引用闭包，SchemaRef 摘要绑定完整规范化文档。它们是 SDK 随附静态文档，不受动态表单 Bundle 的资源导出许可自动覆盖。动态字段仍需真实批准、专用 Schema 和权限提供者；静态结构通过不能证明它们已具备。本包新增的 accepted/unavailable 结果状态仅保存“已受理但暂不可显示”的区别，不表示设备效果完成。

旧 events2、旧解码器与旧类型客户端均保留。后续采用本候选前须重建对应解码/类型产物并完成提供者、生产事务及设计批准，不可混用旧激活、旧句柄或旧订阅摘要。
