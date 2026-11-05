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

当前包采用 `leafseamer.api.v1.product1`，完整承接 [sdk-inputs.json](sdk-inputs.json) 固定的201项旧操作，增加Controller当前会话注销，共202项；198项普通HTTP操作有类型入口，4个WS入口不经fetch发送。产品构建按 [sdk-contract.json](sdk-contract.json) 归并具名根、类型、静态校验器、完整SchemaRef／RegistryRef和新选择；详见 [产品契约](CONTRACT.md)。旧panel4字节与候选批准标志保持不变，不接受旧选择混投。完整主体视图、服务身份、配对、权限及其他DF01差集仍按首期范围实施；本开发选择不是最终发行接受集，声明操作不等于服务已经实现。

`npm test` 验证真实本机 HTTP、路径及 authority 绑定、重定向拒绝、发送后断线、响应大小、超时和取消。它不证明浏览器权限流程、生产认证、产品服务、数据库、部署或设备已验收。构建产物在 `dist/`，带字节清单和第三方许可；仅这些运行文件进入 npm 包，本地日志和治理资料不打包。

服务端从 `@leafseamer/sdk/http` 导入 `createHttpAdapter`，将原始方法、目标和逐项原始头传给 `prepareRequest`，再用 `decodeRequest` 校验有界正文；发送前用 `prepareResponse` 和 `decodeResponse` 校验完整响应。解码结果含 `value` 与数值词法信息，业务层须按操作收窄未知类型。句柄绑定创建它的适配器实例，不能跨实例或手工伪造；敏感头不进入参数投影。此出口使用同一份锁定校验器，不复制协议规则，也不提供认证、Origin信任、Cookie管理或网络接收预算。检查覆盖客户端／服务端同选择往返、跨实例句柄、重复敏感头、错选择、未知字段和重复JSON键。

## 人员会话客户端

从根入口导入 `createBrowserSessionClient`，传入与页面同源的 HTTPS 根 `baseUrl`，然后依次调用 `login({login, password})`、`issueToken({audience, requested_scopes})`、`current()`。`refresh(clientInstanceId)` 轮换Cookie凭据并清本地旧token；需要继续读取时重新签发token。当前会话Cookie路径为 `/auth`，此客户端拒绝 `/services/<service_id>` 前缀，避免Cookie发送范围不匹配；通用fetch传输的前缀能力不变。

Cookie由浏览器管理，CSRF及token只存在客户端闭包内存，不写本地持久存储；CSRF只从通过选择、Schema和规范编码校验的响应采用。所有会话操作拒绝并发进入，不自动重试或自动刷新。`clearLocalState()` 清内存并使在途响应失效，迟到响应不能重新安装内存凭据；它不能删除HttpOnly Cookie或撤销服务端会话。`logout()` 调用签发Controller的当前会话注销，无body目标选择；202表示本地已撤销，远端传播仍按receipts判断。注销成功或失败均清SDK内存，不自动重试；401或清Cookie不代表传播applied。完整主体管理及服务身份接受集仍须生成。

`createRequestContext({audience, operations, ttl_ms, max_unique_requests})` 使用内存中的定向token，自动填入当前契约选择并发送同源Origin。token须包含request.create及全部目标操作权限；服务可缩短期限和新请求容量，以返回的上下文为准。Controller当前将上下文绑定实际凭据链并持久保留，重启和撤销会关闭旧资格；命令受理与去重消费尚未接入。上下文不代替设备控制权，也不改变无自动重试策略。

人员会话客户端还提供 `lookupCommandAdmission(identity)`、`rejectCommandAdmission({rejection_operation_id, identity, content})` 和 `submitCommand(command)`，沿用同源Bearer／Origin及不自动重试策略。命令操作返回具名正文：200查原读取 `result.body.state`，裁决读取 `result.body.decision`，不使用身份接口的data信封。Controller当前已实现自身命名空间的持久拒收与查原；新动作仍返回503，只有已有裁决可由迟到submit取回。command.read／command.cancel须显式授予，拒收不是取消已受理动作，not_found也不证明未来副本已被永久拒收。

`listDevices(cursor?)` 和 `getControl(deviceId)` 使用当前Bearer分别读取本Controller设备目录及控制记录，要求device.read和control.read。目录从 `result.body.data` 读取；控制记录从 `result.body` 读取。目录游标失效返回409后重新列举，不能拼接跨修订页面；客户端不自动重试。当前新登记设备保持disconnected和protected，空能力不代表型号已支持，automatic/null也不代表自动化已布防。

19项SDK检查覆盖错误CSRF、错误选择、HTTPS／路径限制、凭据发送、完整操作保留、历史输入摘要及新选择的SchemaRef／RegistryRef／WS一致性。Controller另有实际文件库、原生采样与HTTPS往返验证，使用模拟Cookie容器和合成环境批准；不能当作真实浏览器或生产身份资格验收。`fetchImpl` 注入仅供可信宿主适配和测试，调用方不得记录密码、Cookie、CSRF或token。当前Controller的token `expires_in` 使用秒提示，客户端不据它放宽服务端截止。

## 独立bootstrap入口

`@leafseamer/sdk/bootstrap` 提供 `decodeBootstrap(bytes, expectedType)` 和 `decodeProtectedLaunchIntent(bytes)`，分别解析ASSIGNMENT／PROOF／ADMISSION／REJECT及core／time_provider空设备启动意图，导出具名类型。版本固定 `bootstrap/0.1.0-draft.1`，不修改HTTP product1、worker IPC或面板选择。解码在16KiB及深度／成员／节点预算内拒绝重复键、错误方向、未知字段和非规范Secret32；整数保持字符串，结果深冻结，运行时不动态编译。

本入口只做字节与结构检查，不生成秘密、计算挑战证明或授准入。可信管道来源、HMAC、域／意图摘要、截止、OS进程归属与单次消费由监督宿主及核心实施。完整来源闭包与摘要记录在 `contracts/bootstrap/source.json`，产物进入统一构建清单；runtime_approved保持false，worker启动与完整运行域验收不因类型存在而完成。

## 监督控制入口

`@leafseamer/sdk/supervisor-control` 提供 `decodeSupervisorControl(bytes, expectedType)`、SupervisorScope、LaunchKey、JournalView、FenceSnapshot及FenceResult类型，采用既定 `supervisor-control/0.1.0-draft.1` 的LAUNCH_QUERY／LAUNCH_RESULT／ERROR及FENCE_PUT／FENCE_RESULT接受集。方向、完整scope／信封、十进制序号和具名结果经静态校验，拒绝重复键和未知字段，查询与响应正文上限64KiB；完整FENCE_PUT上限256KiB、256项，解析预算1秒，查询解析预算100毫秒。控制入口与bootstrap和公开HTTP分别导出，HTTP product1选择及摘要保持不变。

此入口不证明对端身份、当前进程存活或准入有效性；序号连续性、reply_to对应关系和原件一致性由控制连接消费者逐帧核验。快照结构通过不证明完整覆盖、摘要正确或耐久提交，消费者与监督日志负责这些约束；当前没有将LAUNCH_REGISTER／CREATE或RETIRE写操作宣称为已实现，扩展worker必须采用包含完整object_scope及extension_binding的既定启动意图，不能沿用core空设备分支。

## Worker完整范围与来源通道

`@leafseamer/sdk/worker-runtime`导出独立选择`leafseamer.worker-runtime.3`，提供完整object_scope／extension_binding意图、监督控制0.4十三帧、SourceRuntimeBinding、来源采集八帧及C05设备／数据源判别身份。LAUNCH_MATERIALIZE与MATERIALIZATION_RESULT使监督器取得并保管物化证据；LAUNCH_LOAD与LOAD_RESULT按固定截止分片交接完整内容材料，CREATE必须引用同监督实例持有的load_id。核心以固定请求ID轮询，不延长原健康期限。verified物化回执绑定完整启动摘要、challenge、证据ID及监督器本地域最多五秒的寿命；加载ready只证明内容保护，不授予创建许可。0.2与0.3生成函数保留，新入口拒绝旧监督版本和旧顶层device_ids；旧监督查询入口保留其固定接受集。

详见[运行契约](contracts/worker-runtime/README.md)。八种来源消息具有独立字节预算、方向和具名类型，数据源只能由Seamer消费；类型与解码通过不替代真实批准、采集宿主或业务摄取。公开HTTP product1及其摘要不变，不能把独立来源身份直接混入旧HTTP接受集。

`@leafseamer/sdk/artifact-import`提供独立选择`leafseamer.artifact-import.1`，包含安装控制文档、库存及九种导入IPC帧的严格解码和具名类型。文档最多4MiB、IPC最多64KiB；拒绝重复键、畸形UTF8、额外字段及错误方向。库存另核严格file_id顺序、可移植ASCII路径、保留名、大小写／父目录碰撞及容量。详见[导入契约](contracts/artifact-import/README.md)。入口只证明结构与局部约束，不证明真实peer、发行信任、角色绑定、物化或运行准入；Suite负责实际ZIP及持久结果，原HTTP选择保持不变。

SDK 的首份独立契约资料位于 [contracts/draft4](contracts/draft4/README.md)：迁入公共 Schema、IPC、HTTP 骨架、路由投影及正反例，可离线重组六份历史产物。该目录冻结旧基线，后续修订须进入明确的新候选版本，不能覆盖旧版。该目录不是当前产品接受集；完整语义判定器及生产工具链仍待交付。

旧 NodeCG 实现及历史保留于 [leafseamer-legacy](https://github.com/ikenainanodesu/leafseamer-legacy)。本仓尚未导入旧业务源码；后续复用时逐项记录来源、历史映射和必要许可声明。

## 完整发行清单入口

`@leafseamer/sdk/release-manifest` 提供 `decodeReleaseManifest(bytes)`、`decodeReleaseRevocations(bytes)` 及具名类型，采用独立选择 `leafseamer.release-manifest.1`。新版 `native-release/0.2.0-draft.1` 表达五仓组件、运行入口、多通道、存储修订、独立连接策略、运行时和多镜像部署；旧发行格式及 HTTP product1 摘要不变。

输入上限4MiB，严格拒绝重复键、未知字段和畸形UTF8，核引用齐全、依赖无环、端点配对、ABI声明、可读写修订及部署依赖闭包。发行序号保持十进制字符串，完整原字节摘要用于发行身份；报告引用与镜像声明通过不代表内容或环境真实。`decodeReleaseExtensionBinding`及具名`ReleaseExtensionBinding`解析受签target的完整发行／扩展归档关联，区分完整manifest原字节摘要与扩展清单JCS摘要。详见[发行清单契约](contracts/release-manifest/README.md)。Suite 已将这些入口接入下载原件、当前撤销、发行序号和新导入受理；SDK解码本身不核签名或安装资格。

## 静态设备能力模板入口

`@leafseamer/sdk/capability-template`提供`decodeCapabilityTemplate(bytes)`与具名`CapabilityTemplate`类型，采用独立选择`leafseamer.capability-template.1`。从产品动作、触发器与Schema模型派生，静态动作去除运行footprint；原始JSON严格解析并校验有序唯一集合，最多1MiB。此新入口使用普通点分版本号，不改变旧HTTP接受集。Schema文档摘要与动态编译由宿主另行核验；模板声明不证明设备支持或运行批准。详见[静态模板契约](contracts/capability-template/README.md)。

本仓主许可为 [Apache-2.0](LICENSE)。
