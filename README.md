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

当前包采用 `leafseamer.api.v1.product9`，完整承接 [sdk-inputs.json](sdk-inputs.json) 固定的201项旧操作，增加Controller当前会话注销、五项Seamer绑定批准、双方各两项事件时间原件读取及双方快照上下文查询，共213项；209项普通HTTP操作有类型入口，4个WS入口不经fetch发送。产品构建按 [sdk-contract.json](sdk-contract.json) 归并具名根、类型、静态校验器、完整SchemaRef／RegistryRef和新选择；详见 [产品契约](CONTRACT.md)。旧panel4字节与候选批准标志保持不变，不接受旧选择混投。完整主体视图、服务身份、配对、权限及其他DF01差集仍按首期范围实施；本开发选择不是最终发行接受集，声明操作不等于服务已经实现。

事件时间入口为 `@leafseamer/sdk/event-time`。`validateEventTimeModel` 核验Origin、SourceBinding、SourceTimeEvidence及AgeEvidence的结构与本地关联，`digestEventTimeModel`使用固定JCS投影，`verifyEventOrigin`核对完整来源与时间原件并返回深冻结的`origin`和`source_time_evidence`副本。异步核验固定调用时输入，调用方应消费返回副本；摘要一致不授信任、发布或执行权限。实际引用解析、年龄包络计算、撤销、连续性及持久摄取仍由服务实现，不能从Schema通过或空时间引用推断事件新鲜。

`npm test` 验证真实本机 HTTP、路径及 authority 绑定、重定向拒绝、发送后断线、响应大小、超时和取消。它不证明浏览器权限流程、生产认证、产品服务、数据库、部署或设备已验收。构建产物在 `dist/`，带字节清单和第三方许可；仅这些运行文件进入 npm 包，本地日志和治理资料不打包。

服务端从 `@leafseamer/sdk/http` 导入 `createHttpAdapter`，将原始方法、目标和逐项原始头传给 `prepareRequest`，再用 `decodeRequest` 校验有界正文；发送前用 `prepareResponse` 和 `decodeResponse` 校验完整响应。解码结果含 `value` 与数值词法信息，业务层须按操作收窄未知类型。句柄绑定创建它的适配器实例，不能跨实例或手工伪造；敏感头不进入参数投影。此出口使用同一份锁定校验器，不复制协议规则，也不提供认证、Origin信任、Cookie管理或网络接收预算。检查覆盖客户端／服务端同选择往返、跨实例句柄、重复敏感头、错选择、未知字段和重复JSON键。

## 人员会话客户端

从根入口导入 `createBrowserSessionClient`，传入与页面同源的 HTTPS 根 `baseUrl`，然后依次调用 `login({login, password})`、`issueToken({audience, requested_scopes})`、`current()`。`refresh(clientInstanceId)` 轮换Cookie凭据并清本地旧token；需要继续读取时重新签发token。当前会话Cookie路径为 `/auth`，此客户端拒绝 `/services/<service_id>` 前缀，避免Cookie发送范围不匹配；通用fetch传输的前缀能力不变。

Cookie由浏览器管理，CSRF及token只存在客户端闭包内存，不写本地持久存储；CSRF只从通过选择、Schema和规范编码校验的响应采用。所有会话操作拒绝并发进入，不自动重试或自动刷新。`clearLocalState()` 清内存并使在途响应失效，迟到响应不能重新安装内存凭据；它不能删除HttpOnly Cookie或撤销服务端会话。`logout()` 调用签发Controller的当前会话注销，无body目标选择；202表示本地已撤销，远端传播仍按receipts判断。注销成功或失败均清SDK内存，不自动重试；401或清Cookie不代表传播applied。完整主体管理及服务身份接受集仍须生成。

`createRequestContext({audience, operations, ttl_ms, max_unique_requests})` 使用内存中的定向token，自动填入当前契约选择并发送同源Origin。token须包含request.create及全部目标操作权限；服务可缩短期限和新请求容量，以返回的上下文为准。Controller当前将上下文绑定实际凭据链并持久保留，重启和撤销会关闭旧资格；命令受理与去重消费尚未接入。上下文不代替设备控制权，也不改变无自动重试策略。

人员会话客户端还提供 `lookupCommandAdmission(identity)`、`rejectCommandAdmission({rejection_operation_id, identity, content})` 和 `submitCommand(command)`，沿用同源Bearer／Origin及不自动重试策略。命令操作返回具名正文：200查原读取 `result.body.state`，裁决读取 `result.body.decision`，不使用身份接口的data信封。Controller当前已实现自身命名空间的持久拒收与查原；新动作仍返回503，只有已有裁决可由迟到submit取回。command.read／command.cancel须显式授予，拒收不是取消已受理动作，not_found也不证明未来副本已被永久拒收。

`listDevices(cursor?)` 和 `getControl(deviceId)` 使用当前Bearer分别读取本Controller设备目录及控制记录，要求device.read和control.read。目录从 `result.body.data` 读取；控制记录从 `result.body` 读取。目录游标失效返回409后重新列举，不能拼接跨修订页面；客户端不自动重试。当前新登记设备保持disconnected和protected，空能力不代表型号已支持，automatic/null也不代表自动化已布防。

19项SDK检查覆盖错误CSRF、错误选择、HTTPS／路径限制、凭据发送、完整操作保留、历史输入摘要及新选择的SchemaRef／RegistryRef／WS一致性。Controller另有实际文件库、原生采样与HTTPS往返验证，使用模拟Cookie容器和合成环境批准；不能当作真实浏览器或生产身份资格验收。`fetchImpl` 注入仅供可信宿主适配和测试，调用方不得记录密码、Cookie、CSRF或token。当前Controller的token `expires_in` 使用秒提示，客户端不据它放宽服务端截止。

## 设备模块只读接口

`@leafseamer/sdk/device-module` 导出 `DeviceModuleFactory`、`DeviceModuleFrame` 和 `validateDeviceModuleFrame`。扩展入口导出 `createDeviceModule(context)`，返回版本为 `leafseamer-device-module/2` 的实现，提供 `connectReadOnly`、`proposeCatalog`、`captureBaseline`、`stopReadOnly` 四个异步方法。宿主供应已绑定的配置、设备范围、取消信号和本域单调读数；模块须核设备与session并响应取消。清单须声明该API版本及 `device-module/3` IPC版本。

v3新增仅供固定宿主装配的`BIND_EXECUTION`／`EXECUTION_BOUND`，传递核心持久执行Binding及其精确引用。SDK核帧结构、引用和方向，固定宿主核当前运行及具体模块配置；该确认不授予设备写许可。旧模块IPC版本严格拒绝，模块实现API仍为`leafseamer-device-module/2`。

事件采集通过独立常量 `deviceModuleEventProtocol` 显式选择 `device-module/4`；v3保留原消息集合，不能携带事件操作。v4清单还须声明 `leafseamer-device-event-capture/1`，实现 `events.start/read/acknowledge/stop`。协议新增 `EVENT_START/STARTED`、`EVENT_READ/BATCH`、`EVENT_ACK/ACKED`、`EVENT_STOP/STOPPED` 四组请求／响应，同一通道从LOAD起固定版本，不在途中降级或升级。

采集描述符包含当前设备、会话、采集身份、事件类型、原单调起点及模块基线 `baseline`；事件包含 `event_id`、连续 `sequence`、`event_type`、模块正文 `payload` 和 `capture_interval`。基线和正文仍须由具体模块Schema裁决。SDK限制每批32条、每条1024字节、正文深度16，并检查顺序、区间、明确缺失和停止计数；接收端另核原描述符、JCS摘要、跨批次时钟及故障锁存。采样快照不能作为事件提交，读取请求时间不替换原采集区间。确认仅释放模块缓存，不构成规范事件持久摄取、RunGrant或运行恢复。

连接取得identity后，宿主在同一截止窗口内调用 `proposeCatalog`，把只含目录修订、状态Schema和动作／触发器ID集合的提议附于CONNECTED。提议不能自报批准；Controller须按当前安装批准与具体型号资格核验。v2不接受缺少目录的v1连接响应。

通道依次使用 LOAD／LOADED、CONNECT／CONNECTED、CAPTURE／CAPTURED、DISCONNECT／DISCONNECTED。帧携带运行引用、通道及member boot，序号和tick保留十进制字符串，每次请求窗口至多两秒；响应回绑原序号、请求ID、时间窗口及设备／session／capture身份。类型按消息判别，但采样value保持unknown，须按已批准设备能力另行验证。

本入口检查对象结构并深冻结，不验证原始JSON字节、真实对端或当前授权。Controller宿主负责规范JSON、大小／深度预算、实际进程绑定、原件持久化、当前运行资格及超时关闭。CAPTURED是候选读数；它不授予设备写入、目录批准、事件发布或年龄资格，也不能单凭模块自报identity证明物理设备身份。命令执行继续使用独立设备IPC。

## 独立bootstrap入口

`@leafseamer/sdk/bootstrap` 提供 `decodeBootstrap(bytes, expectedType)` 和 `decodeProtectedLaunchIntent(bytes)`，分别解析ASSIGNMENT／PROOF／ADMISSION／REJECT及core／time_provider空设备启动意图，导出具名类型。版本固定 `bootstrap/0.1.0-draft.1`，不修改HTTP产品选择、worker IPC或面板选择。解码在16KiB及深度／成员／节点预算内拒绝重复键、错误方向、未知字段和非规范Secret32；整数保持字符串，结果深冻结，运行时不动态编译。

本入口只做字节与结构检查，不生成秘密、计算挑战证明或授准入。可信管道来源、HMAC、域／意图摘要、截止、OS进程归属与单次消费由监督宿主及核心实施。完整来源闭包与摘要记录在 `contracts/bootstrap/source.json`，产物进入统一构建清单；runtime_approved保持false，worker启动与完整运行域验收不因类型存在而完成。

## 监督控制入口

`@leafseamer/sdk/supervisor-control` 提供 `decodeSupervisorControl(bytes, expectedType)`、SupervisorScope、LaunchKey、JournalView、FenceSnapshot及FenceResult类型，采用既定 `supervisor-control/0.1.0-draft.1` 的LAUNCH_QUERY／LAUNCH_RESULT／ERROR及FENCE_PUT／FENCE_RESULT接受集。方向、完整scope／信封、十进制序号和具名结果经静态校验，拒绝重复键和未知字段，查询与响应正文上限64KiB；完整FENCE_PUT上限256KiB、256项，解析预算1秒，查询解析预算100毫秒。控制入口与bootstrap和公开HTTP分别导出，HTTP产品选择选择及摘要保持不变。

此入口不证明对端身份、当前进程存活或准入有效性；序号连续性、reply_to对应关系和原件一致性由控制连接消费者逐帧核验。快照结构通过不证明完整覆盖、摘要正确或耐久提交，消费者与监督日志负责这些约束；当前没有将LAUNCH_REGISTER／CREATE或RETIRE写操作宣称为已实现，扩展worker必须采用包含完整object_scope及extension_binding的既定启动意图，不能沿用core空设备分支。

## Worker完整范围与来源通道

`@leafseamer/sdk/worker-runtime`导出独立选择`leafseamer.worker-runtime.3`，提供完整object_scope／extension_binding意图、监督控制0.4十三帧、SourceRuntimeBinding、来源采集八帧及C05设备／数据源判别身份。LAUNCH_MATERIALIZE与MATERIALIZATION_RESULT使监督器取得并保管物化证据；LAUNCH_LOAD与LOAD_RESULT按固定截止分片交接完整内容材料，CREATE必须引用同监督实例持有的load_id。核心以固定请求ID轮询，不延长原健康期限。verified物化回执绑定完整启动摘要、challenge、证据ID及监督器本地域最多五秒的寿命；加载ready只证明内容保护，不授予创建许可。0.2与0.3生成函数保留，新入口拒绝旧监督版本和旧顶层device_ids；旧监督查询入口保留其固定接受集。

详见[运行契约](contracts/worker-runtime/README.md)。八种来源消息具有独立字节预算、方向和具名类型，数据源只能由Seamer消费；类型与解码通过不替代真实批准、采集宿主或业务摄取。公开HTTP产品选择及其摘要不变，不能把独立来源身份直接混入旧HTTP接受集。

`@leafseamer/sdk/artifact-import`提供独立选择`leafseamer.artifact-import.1`，包含安装控制文档、库存及九种导入IPC帧的严格解码和具名类型。文档最多4MiB、IPC最多64KiB；拒绝重复键、畸形UTF8、额外字段及错误方向。库存另核严格file_id顺序、可移植ASCII路径、保留名、大小写／父目录碰撞及容量。详见[导入契约](contracts/artifact-import/README.md)。入口只证明结构与局部约束，不证明真实peer、发行信任、角色绑定、物化或运行准入；Suite负责实际ZIP及持久结果，原HTTP选择保持不变。

SDK 的首份独立契约资料位于 [contracts/draft4](contracts/draft4/README.md)：迁入公共 Schema、IPC、HTTP 骨架、路由投影及正反例，可离线重组六份历史产物。该目录冻结旧基线，后续修订须进入明确的新候选版本，不能覆盖旧版。该目录不是当前产品接受集；完整语义判定器及生产工具链仍待交付。

旧 NodeCG 实现及历史保留于 [leafseamer-legacy](https://github.com/ikenainanodesu/leafseamer-legacy)。本仓尚未导入旧业务源码；后续复用时逐项记录来源、历史映射和必要许可声明。

## 自动化程序模型入口

`@leafseamer/sdk/automation-program` 导出当前 product5 中继承的既有程序模型的 TypeScript 类型及 `validateAutomationModel(name, value)`。生成器从同一接受集提取模型并预编译校验器，运行期不生成代码，不改变HTTP选择。输入须为普通JSON值，拒绝访问器、循环、稀疏数组、非有限数和畸形Unicode，并限制深度48、节点1048576及实际JSON UTF8大小16MiB。该接口接受已解码的值，原始报文仍须经对应的严格字节入口处理。 `digestAutomationValue(value)` 对同一有界JSON检查通过后的值计算JCS规范SHA-256摘要，供固定发布产物、程序、绑定和证明原件比对；摘要一致不授予来源批准或运行资格。

模型合法不代表表达式语义、依赖图、绑定批准、发布或运行资格；这些由Seamer及相应权威实现。

同一入口以 `Lifecycle` 前缀导出既有草稿、元数据、修订记录和创建／更新请求模型及其引用闭包。内容与metadata分别修订，客户端提交绑定选择而不是自行批准的CompiledProgram；程序和草稿生成结果仍与继承的product4原模型逐项对账。

## 完整发行清单入口

`@leafseamer/sdk/release-manifest` 提供 `decodeReleaseManifest(bytes)`、`decodeReleaseRevocations(bytes)` 及具名类型，采用独立选择 `leafseamer.release-manifest.1`。新版 `native-release/0.2.0-draft.1` 表达五仓组件、运行入口、多通道、存储修订、独立连接策略、运行时和多镜像部署；旧发行格式及 HTTP产品选择 摘要不变。

输入上限4MiB，严格拒绝重复键、未知字段和畸形UTF8，核引用齐全、依赖无环、端点配对、ABI声明、可读写修订及部署依赖闭包。发行序号保持十进制字符串，完整原字节摘要用于发行身份；报告引用与镜像声明通过不代表内容或环境真实。`decodeReleaseExtensionBinding`及具名`ReleaseExtensionBinding`解析受签target的完整发行／扩展归档关联，区分完整manifest原字节摘要与扩展清单JCS摘要。详见[发行清单契约](contracts/release-manifest/README.md)。Suite 已将这些入口接入下载原件、当前撤销、发行序号和新导入受理；SDK解码本身不核签名或安装资格。

## 静态设备能力模板入口

`@leafseamer/sdk/capability-template`提供`decodeCapabilityTemplate(bytes)`与具名`CapabilityTemplate`类型，采用独立选择`leafseamer.capability-template.1`。从产品动作、触发器与Schema模型派生，静态动作去除运行footprint；原始JSON严格解析并校验有序唯一集合，最多1MiB。此新入口使用普通点分版本号，不改变旧HTTP接受集。Schema文档摘要与动态编译由宿主另行核验；模板声明不证明设备支持或运行批准。详见[静态模板契约](contracts/capability-template/README.md)。

本仓主许可为 [Apache-2.0](LICENSE)。

`createBrowserSessionClient` 可通过 `createDraftClient({baseUrl, audience})` 建立固定Seamer草稿入口。地址与audience必须来自可信站点配置；先完成Controller登录，再显式调用草稿客户端的 `issueToken(scopes)`。签发仍只访问Controller并使用同源Cookie与内存CSRF，草稿五操作仅向固定Seamer发送其独立的内存Bearer，传输固定 `credentials: 'omit'`，不转发Controller的Cookie或CSRF，也不自动重试／刷新／重新签发。context请求的audience与SDK选择由客户端固定；写入仍要求调用者提供原context、幂等键和相应CAS修订。

父会话清理、退出、成功刷新或认证响应失败会清除相应内存凭据；清理前发起的迟到签发不能恢复token。不同Seamer客户端不共享token，签发响应audience必须与请求精确一致。Seamer需要显式允许Controller页面origin，并在CORS响应中公开两个契约选择头。该接口延用Fetch传输预算：默认响应64KiB，可在父会话配置中显式提高至8MiB；超限响应拒收不表示写入未提交。客户端可用不表示GUI编辑器、真实浏览器、首次配对引导或发布／运行功能已验收。

product5的人员introspection响应必须携带同一会话修订的近期认证原区间；服务与inactive结果为null。请求必填目标端本地配对选择器，水位采用签发方整体授权修订；接收方从发起原挑战的本地单调时刻计算新鲜期限。此协议不授予目标服务对象权限，近期认证过期也不能用令牌TTL替代。

`prepareDraftChange` 为创建、内容更新、元数据更新和固定修订发布生成已校验请求、原请求摘要与 `lookupAutomationRequest` 的非秘密查询身份；摘要与Seamer采用同一具名语义版本，排除顶层context但保留嵌套同名内容。准备工具不发送请求或授予权限。草稿客户端提供 `lookupAutomationRequest`：重新登录／重新签发后可在当前request.read与对象读取权下查询原结果；必须核对返回操作、摘要和目标范围，不把原结果当最新草稿。产品HTTP选择已显式升级为product6。

浏览器会话客户端提供 `getCapabilities(deviceId)`，承接既有GET能力契约、内存定向Bearer及严格响应校验。调用前须显式签发目标Controller的device.read令牌；不自动重试、刷新或把Schema内容当作设备写入／发布批准。

草稿客户端新增 `publishDefinition(definitionId, body)`、`getPublishedArtifact(definitionId, version)`、`getCompiledProgram(definitionId, version)` 和 `getIndependenceProof(definitionId, proofId, revision)`。发布须先显式取得包含 publishDefinition 的 Seamer context；SDK 只从完整校验成功的该 context 响应采用独立 X-CSRF-Token，最多保留256项内存映射，仅向对应Seamer的对应context发送。重新签发、客户端清理或父会话刷新／清理会丢弃这些凭据；不转发Controller CSRF，不自动补context或重试发布。静态自动化模型出口新增 LifecyclePublish／LifecyclePublishedVersion，定义仍来自同一product5选择。完整权威发布来源和浏览器发布界面仍待集成验收。


浏览器草稿客户端新增五项本地绑定批准方法，沿用定向内存令牌及完整选择校验。批准／撤销先显式创建包含对应操作的Seamer请求上下文，SDK使用该上下文响应的独立CSRF；没有自动重试。候选、批准与查原均不授予发布或运行资格，具体保证及摘要投影见CONTRACT.md。

`decodeWorkerControl(bytes, type, {yieldNow})` 允许可信调用方显式指定解析分片的调度函数。默认仍让出事件循环；已绑定的本地监督通道可使用微任务调度，先完成完整回复校验再处理业务回调。调度函数不改变结构校验、方向、容量或原1秒解析预算，也不延长监督确认期限。
