# 按操作选择的静态正文解码

阶段 0 技术验证：将完整 `leafseamer.api.v1.events2` 候选中的 201 项 API、四条双向 WS 入口和 52 类 worker 消息接入原始字节解码。`approved=false`、`runtime_ready=false`，不启动网络或设备。

固定来源为 [sources.json](sources.json)。[生成器](build.mjs) 逐操作提取请求、精确响应状态、WS 双向及首帧、worker 类型与方向，形成 [清单](preview/inventory.json)。共有 2,313 个 JSON 绑定和 100 个无正文绑定，去重为 281 个静态校验根。请求缺正文声明、101 升级及发现接口部分错误响应均显式保留无正文语义，不回退到任意 JSON。

```javascript
import {createDecoder} from './decoder.mjs';
const decoder = createDecoder(installedSelection);
const response = decoder.http('controller', 'openEvents', 'response', '401');
const decoded = await decoder.decode(bytes, response, {contentType: 'application/json'});
const upgrade = decoder.http('controller', 'openEvents', 'response', '101');
decoder.assertEmpty(new Uint8Array(), upgrade);
const first = decoder.websocket('controller', 'openEvents', 'first_server');
const message = decoder.worker(installedIpcVersion, 'c2w', 'AUTH_FENCE');
```

`installedSelection` 必须与固定候选的 ID 和摘要精确匹配；它只绑定本地安装的模式，不证明服务器已完成协商或授予权限。HTTP 状态使用三位字符串，操作 ID 同时受 authority 限定，WS 方向为 `client`／`server`／`first_server`。worker 必须提供精确 IPC 版本、方向和类型；回复因果与会话顺序仍由上层验证。

句柄在创建它的 decoder 实例内有效，不能伪造、跨实例或替换为任意 Schema。HTTP JSON 入口要求已经由传输层解析规范化的 `contentType: 'application/json'`；此 API 不解析 HTTP 原始头，带参数的字符串不能直接传入。WS／worker 不接受该 HTTP 参数。无正文入口只能调用 `assertEmpty`，拒绝任何非零长度或共享缓冲。未知操作、方向、状态、版本、媒体类型均失败，不尝试其他模式、不重发动作。

构建期复用固定扫描器与原始整数转换，运行期只导入静态函数和封闭辅助模块，路由元数据递归冻结。输入复制、预算、取消与冻结 DTO 继承固定解码器；候选默认预算不是已批准的逐操作生产 profile，`JSON.parse` 和模式验证仍不能硬抢占。源码与第三方许可见 [制品清单](preview/manifest.json) 和 [LICENSES](preview/LICENSES.txt)。

从 SDK 根使用固定 Node 24.22.0、前版 `wire-js` 锁定依赖，以及能运行 `wire-json` 的 Python 环境执行：

```text
node contracts/wire-routing/check.mjs --python <python> --report
node contracts/wire-routing/check.mjs --check-report
node --disallow-code-generation-from-strings contracts/wire-routing/node-check.mjs
node contracts/wire-routing/build.mjs --output <新的目录>
```

[Python 对照器](oracle.py) 独立遍历两份 OpenAPI 与消息表，核对 2,413 个绑定及来源位置，再计算 281 个根共 2,529 条报文接受结果。Node 在禁止动态代码生成的进程中比较接受集，并实际解码全部 52 类 worker 正例、36 条 WS 帧、36 条快照 HTTP 响应、两服务请求正例及错误响应；还检查空正文、错误状态、首帧、句柄隔离和取消传递。具体结果与输入摘要见 [报告](report.json)。`--check-report` 仅核验报告输入，不重新执行行为。

本轮没有执行浏览器、真实 HTTP／WS、认证、部署或设备验收，不能继承前版五入口的浏览器 CSP 结论。此模块不校验路径／查询／响应头，不完成协商状态机、授权、完整语义规则、快照摘要或设备效果；模式可导入不代表该主体可以调用操作。全入口映射与接受集差分也不代表所有业务正例均已覆盖，完整 SDK 客户端和跨平台验证仍待完成。
