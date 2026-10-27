# 完整事件契约候选

本包将完整 HTTP、双向订阅、快照投影、范围注册和 worker 模型组合为独立的 `leafseamer.api.v1.events2` 选择。包含 1351 个模型、201 项 API 操作和 52 类 worker 消息。旧 `integration1` 原件及选择摘要保持不变。

[协议与边界](PROTOCOL.md)规定精确选择、人员和服务 WS 入口、替换范围以及发布条件；[政策](policy.json)默认关闭批准、运行与广告资格。[来源](sources.json)固定父提交和输入字节摘要。

## 产物

- [统一模型](preview/models.schema.json)、[Controller API](preview/controller.openapi.json)、[Seamer API](preview/seamer.openapi.json)和[双向帧根](preview/frames.schema.json)。
- [worker 图](preview/worker-ipc.schema.json)和[消息表](preview/worker-messages.json)保持原消息语义与方向。
- [路由表](preview/routing.json)记录两服务各四项明确替换；[模型映射](preview/model-map.json)记录公共原件、增加和改绑；[注册映射](preview/registry-map.json)保留已验证等价的视图闭包。
- [制品清单](preview/manifest.json)绑定生成字节；[选择](preview/selection.json)绑定清单的 JCS SHA-256。二者不递归计入制品摘要。

## 复现与验证

在 SDK 根目录、已安装 `rfc8785`、`jsonschema`、`referencing` 和 `openapi-spec-validator` 的 Python 环境执行：

```text
python -I -B contracts/event-integration/build.py --output <新的输出目录>
python -I -B contracts/event-integration/check.py
python -I -B contracts/event-integration/check.py --check-report
```

生成器拒绝来源漂移、同名不同模型、未经裁决的路由覆盖、缺失旧入口和视图闭包改变。检查覆盖两份完整 OpenAPI、未替换操作的认证和正文等价、精确选择与旧选择拒绝、双向帧和 52 类 worker 样例；结果见 [报告](report.json)。`--check-report` 只检查报告输入绑定，不能代替实际执行。

当前仅提供阶段 0 的可复现契约与参考检查。生产认证、真实传输、浏览器、设备、规范摄取与执行事务尚未验收；`projection_applied` 不能替代 `durable_ingest`。生成成功或局部检查通过均不授予部署和广告资格。
