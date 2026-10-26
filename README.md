# LeafSeamer SDK

> **施工中 / Work in progress。** 当前交付契约资料及离线生成验证，尚无生产可用 SDK 或服务实现。不要用于实际直播控制。

公共 API 契约、客户端、设备模块和界面扩展开发接口。优先规范 Seamer 的 Trigger / Action 能力模型；SDK 是库与协议，不是中心服务。

总体设计、已确认决策、待落实事项和路线图统一维护于 [LeafSeamer Suite](https://github.com/LeafSeamer/leafseamer-suite)。当前维护分支为 `main`；设计确认不等于业务实现已获启动批准。

SDK 的首份独立契约资料位于 [contracts/draft4](contracts/draft4/README.md)：迁入公共 Schema、IPC、HTTP 骨架、路由投影及正反例，可离线重组六份历史产物。该目录冻结旧基线，后续修订须进入明确的新候选版本，不能覆盖旧版。类型客户端、语义判定器及生产工具链仍待交付。

旧 NodeCG 实现及历史保留于 [leafseamer-legacy](https://github.com/ikenainanodesu/leafseamer-legacy)。本仓尚未导入旧业务源码；后续复用时逐项记录来源、历史映射和必要许可声明。

本仓主许可为 [Apache-2.0](LICENSE)。
