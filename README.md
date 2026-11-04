# LeafSeamer SDK

> **施工中 / Work in progress。** 已提供可构建、可本地安装的 SDK 开发包；首期完整契约归并、身份服务及各产品仍在实施，不是生产发行或设备支持声明。

公共 API 契约、客户端、设备模块和界面扩展开发接口。优先规范 Seamer 的 Trigger / Action 能力模型；SDK 是库与协议，不是中心服务。

总体设计、已确认决策、待落实事项和路线图统一维护于 [LeafSeamer Suite](https://github.com/LeafSeamer/leafseamer-suite)。当前维护分支为 `main`。按已确认顺序推进既定 SDK、服务和 GUI 实现，型号绑定仍为首期必须完成的任务；未完成型号不宣称支持。

## 使用开发包

使用 Node 24.22.0 和 npm 11.19.1。运行时无外部 npm 依赖，构建核验固定契约及消费者字节；不在线下载 Schema，也不在运行时生成校验函数。

```sh
npm ci --ignore-scripts
npm test
npm pack
```

将生成的 `leafseamer-sdk-0.1.0-dev.1.tgz` 安装到服务或 GUI 项目，然后从包入口导入。包包含两项 authority 的类型客户端、静态校验器、固定选择和 HTTP 传输，支持独立服务 origin 及套件 `/services/<service_id>` 前缀。

```typescript
import {createClient, createFetchTransport, contractSelection} from '@leafseamer/sdk';

const transport = createFetchTransport({
  authority: 'controller',
  baseUrl: 'https://control.example.invalid/services/controller-one',
  timeoutMs: 10000,
  maxResponseBytes: 65536,
});
const controller = createClient('controller', contractSelection, transport);
const result = await controller.call('discoverContracts');
```

必须将目标 authority、端点及选择绑定到实际服务身份；例中的地址只用于说明。凭据由调用方的会话管理器提供，默认 fetch credentials 为 same-origin，不把 Schema 校验视为鉴权。仅本机 HTTP 开发可显式开启 `allowInsecureLoopback`，普通远端仍须 HTTPS。GUI 同源静态入口与跨域凭据策略分别配置，不通过更改 authority 字符串转发请求。

传输不自动重试、不跟随重定向，累计正文和整次请求均有预算。取消或超时发生在发送后时保留 `outcome_unknown`，不能据此重新提交动作。错误不暴露原始凭据或响应。浏览器 fetch 只能提供浏览器公开的头字段，不能证明拿到了原始重复头；服务端仍须在原始 HTTP 边界执行完整信封检查。现有字节校验的协作式预算也不等于硬内存隔离。

当前包固定 `leafseamer.api.v1.panel4`，复用 [sdk-inputs.json](sdk-inputs.json) 所列完整输入；197 项普通 HTTP 操作有类型入口，4 个 WS 入口不经 fetch 发送。现有类型不表达全部 Schema 条件，运行校验仍必需。DF01 第15—16节要求的身份接口、主体权限及其它同版迁移尚待生成新接受集；本包不会改写旧 panel4，也不会将候选 `approved=false` 或 `runtime_ready=false` 改为批准。服务与 GUI 应固定包版本和选择，正式首期发布前必须完成该归并。

`npm test` 验证真实本机 HTTP、路径及 authority 绑定、重定向拒绝、发送后断线、响应大小、超时和取消。它不证明浏览器权限流程、生产认证、产品服务、数据库、部署或设备已验收。构建产物在 `dist/`，带字节清单和第三方许可；仅这些运行文件进入 npm 包，本地日志和治理资料不打包。

SDK 的首份独立契约资料位于 [contracts/draft4](contracts/draft4/README.md)：迁入公共 Schema、IPC、HTTP 骨架、路由投影及正反例，可离线重组六份历史产物。该目录冻结旧基线，后续修订须进入明确的新候选版本，不能覆盖旧版。类型客户端、语义判定器及生产工具链仍待交付。

旧 NodeCG 实现及历史保留于 [leafseamer-legacy](https://github.com/ikenainanodesu/leafseamer-legacy)。本仓尚未导入旧业务源码；后续复用时逐项记录来源、历史映射和必要许可声明。

本仓主许可为 [Apache-2.0](LICENSE)。
