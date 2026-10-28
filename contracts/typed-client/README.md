# TypeScript 客户端候选

本目录把两端完整 OpenAPI 候选转成可编译声明，并提供复用 [HTTP 信封入口](../http-envelope/README.md) 的单次传输客户端。`approved=false`、`runtime_ready=false`；这是阶段 0 的隔离参考成果，尚未替代生产 SDK。

两端分别保留全部 1,351 个 Schema 和 102/99 个操作声明。普通 HTTP 客户端覆盖 197 个操作，按操作和响应状态关联正文类型；另外四个 WebSocket 操作保留完整 OpenAPI 类型和绑定元数据，必须经专门的升级传输实现，普通 `call` 不接受它们。总计 2,148 个响应绑定均保留在生成清单中。

## 使用与边界

```ts
import {createClient} from './client.mjs';
// selection 必须来自可信安装配置；transport 由应用提供。
const client=createClient('controller',selection,transport);
const result=await client.call('getCommandRevision',{
  path:{command_id:'command',revision:'9007199254740993'}
});
```

`client.d.mts` 公开强类型接口；`preview/controller.d.ts`、`preview/seamer.d.ts` 公开完整模型和操作，`preview/operations.d.ts` 关联调用入参与状态结果。类型不能表达字符串格式、数值范围及所有 JSON Schema 条件；每次发送和接收仍经过固定契约摘要对应的运行校验。递归 JSON 联合使用等价命名别名，避免 TypeScript 接口索引自引用错误，未扩大为 `any`。

调用者只传声明的 path/query/headers/body。客户端自动填入契约选择、JSON 媒体类型和正文长度，拒绝覆盖自动头、未知参数和非 JSON 值；路径与查询参数编码一次，十进制计数器保持字符串。数据在第一次异步让出前复制，JSON 响应深冻结。输入必须是普通数据对象，客户端不是执行不可信 JavaScript 或 Proxy 的隔离容器。

传输签名为 `Transport(request) -> RawResponse | PromiseLike<RawResponse>`。它绑定可信 authority 的固定端点，负责实际认证、TLS、HTTP 分帧和原始响应头行；不得自动重试或重定向。客户端每次 `call` 仅调用传输一次，不能约束自定义传输内部额外发送。凭据由传输处理，不进入业务 DTO。未提供默认 Fetch 适配器，因为已合并的响应头不能证明原始重复字段合法。

`ClientError.state` 表示：

| 状态 | 可据此判断的事实 |
| --- | --- |
| `not_sent` | 本客户端尚未调用传输，输入校验或发送前取消失败 |
| `outcome_unknown` | 已调用传输后发生失败或取消，不能推断服务端是否执行 |
| `response_rejected` | 传输返回的响应未通过校验，不能推断服务端是否执行 |

声明内的 HTTP 错误响应按状态正常返回；调用者必须检查 `status`，不能把 Promise 成功等同业务成功。所有结果的 `authorization_granted` 均为 `false`，契约匹配不授予权限。传输异常文本不进入公共错误，避免传播凭据或原始响应。可传 `AbortSignal`；没有信号或信号未取消时，挂起传输仍可持续等待，应用应设置自己的调用期限。

正文使用现有解码器默认预算：64 KiB、深度 32、16,384 个值节点及 100 ms 解析期限。更大的已协商配置、生产鉴权、WebSocket 生命周期和业务调用策略尚待后续接入，不能将此候选视为全系统已交付。

## 可复验成果

固定 Node 24.22.0、npm 11.19.1、TypeScript 5.9.3、openapi-typescript 7.13.0；33 个包的归档完整性、SHA-256、许可证、生命周期脚本声明和 2,009 个安装文件摘要记录在 [dependencies.json](dependencies.json)。安装时禁用脚本，锁文件与 [固定来源](sources.json) 均参与检查。类型生成使用官方 [Node API](https://openapi-ts.dev/node)，以本地 JSON 输入、仅本地引用生成，运行客户端不加载生成工具链。

在本目录安装依赖，然后从 SDK 根目录执行：

```text
npm ci --ignore-scripts --engine-strict --no-audit --no-fund
node contracts/typed-client/check.mjs --http --write-report
```

[验证报告](report.json) 记录两次生成一致性、全部模型和操作覆盖、不开启 `skipLibCheck` 的严格编译、20 条逐行负例诊断、862 项禁止动态代码生成的运行断言，以及两次真实回环 HTTP 收发。运行断言覆盖 201 个入口；其中有正文操作的全量入口检查证明缺失正文不发送，真实有效写正文另以 `createRequestContext` 样本验证，不宣称已对每种业务正文进行完整端到端调用。浏览器、生产认证和设备验证均未运行。
