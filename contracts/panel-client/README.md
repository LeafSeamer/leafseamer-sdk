# 面板完整选择的类型客户端

本包为 `leafseamer.api.v1.panel4` 生成两个 authority 的1463个模型类型、201项操作元数据和2148个响应绑定。197项普通 HTTP 操作可调用，四个 WS 操作只提供类型元数据。完整选择见[选择文件](../panel-wire/contract/selection.json)，HTTP 信封由[当前适配器](../panel-http/README.md)验证。保留 `approved=false`、`runtime_ready=false`，尚未接入产品运行路径。

```typescript
import {createClient, type Transport} from './client.mjs';
const client = createClient('controller', installedSelection, transport);
const receipt = await client.call('invokePanelMethod', {
  path: {session_id: intent.identity.panel_session_id},
  headers: {Origin: 'https://panel.invalid'},
  body: {intent},
});
```

调用方提供已验证的安装选择与受控 `Transport`。客户端固定自动契约头，在第一次异步等待前复制纯数据；拒绝访问器、循环、非有限数字和非纯数据，不执行 `toJSON`。请求经过路径、参数及完整正文验证后最多调用传输一次。响应状态、头字段、正文和选择再次验证；结果中的 `authorization_granted` 始终为 `false`。传输必须自行提供真实认证、目标绑定、网络分帧和超时，且禁止自动重试与重定向。

失败状态区分发送前 `not_sent`、已进入传输后结果未知 `outcome_unknown`、收到不合格响应 `response_rejected`。收到响应后的取消仍不能推断服务端未执行。错误不回显原始请求、响应、凭据或传输异常文本。`accepted` 且投影 `unavailable` 仍保留受理事实，禁止因此推断操作失败后自动重试。

类型层提供操作名称、参数、只读结构和枚举检查，**当前生成器不表达 JSON Schema 的 `if/then` 条件关联，也不表达全部数字范围与字符串模式**。严格编译正例明确保留了 `available` 配合空投影等类型层盲区；完整运行校验拒绝它们。不能以 TypeScript 编译通过替代字节与 Schema 校验。

[固定输入](sources.json)的 `inputs` 来自所列父提交，`local_inputs` 绑定与本包同次交付的 HTTP 包，不能把它们误称为父提交中的文件。工具复用[原类型生成器的锁定依赖](../typed-client/dependencies.json)及其锁文件；构建逐文件校验依赖摘要，不安装或执行包脚本。

```powershell
node contracts/panel-client/build.mjs --output <新建目录>
node contracts/panel-client/check.mjs --http --write-report
```

[验证报告](report.json)包含全操作严格编译、26条逐行类型负例、原有客户端状态检查、两次基础 HTTP 收发，以及35个方法的105次真实本机回环收发。合成服务用同一 HTTP 适配器解析收到的原始请求；每方法覆盖正常回执、投影不可用、旧输入在发送前拒绝、旧结果收到后拒绝且只发送一次。回环不执行发布、真实授权或产品业务。

旧[类型客户端](../typed-client/README.md)保留其原选择。本包没有浏览器、真实设备、生产身份服务或产品集成验证；已有提供者须分别迁移并核对完整选择，阶段0继续开放。
