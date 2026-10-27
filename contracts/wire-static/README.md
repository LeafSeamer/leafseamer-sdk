# 静态报文校验候选

阶段 0 的独立技术验证制品，`approved=false`、`runtime_ready=false`。构建期将固定模型转换为 ESM；浏览器运行期只加载静态函数，不安装 Ajv、不编译 Schema。

[策略](policy.json) 明确导出五个入口：协商选择、客户端事件帧、服务端事件帧、快照清单、快照页。未知模型拒绝，没有任意 Schema 编译入口或隐式回退。测试入口使用独立注册表，其句柄不能用于契约入口。

```javascript
import {decodeWire, getSchema} from './preview/contracts-wire.mjs';
const decoded = await decodeWire(bytes, getSchema('server_frame'));
```

`bytes` 必须是允许的 Uint8Array；扫描器在首次让出执行前复制输入。预算、UTF-8 与重复键检查、原始数字整数约束、取消检查和冻结 DTO 保持固定前版语义。完整模型图的 146 个整数位置记录在 [映射](preview/integer-map.json)。Schema 校验不验证快照摘要、跨页引用、权限或业务状态转换。

运行期仅需相应 `contracts-*.mjs` 与 `helpers.mjs`，许可随 [LICENSES](preview/LICENSES.txt) 提供。`test-*.mjs`、夹具与浏览器验收页用于验证。构建器仅接受 [sources.json](sources.json) 的固定原件及前版锁定依赖；固定转换正文中的动态代码执行仅发生于构建期。

验证使用固定 Node 24.22.0，以及能够运行前版快照检查器的 Python 环境。先按 `contracts/wire-js` 的锁文件安装构建依赖，再从仓库根运行：

```text
node contracts/wire-static/check.mjs --python <python> --report
node contracts/wire-static/check.mjs --check-report
node --disallow-code-generation-from-strings contracts/wire-static/node-static.mjs
node contracts/wire-static/build.mjs --output <尚不存在的目录>
node contracts/wire-static/serve.mjs --result <本地结果文件>
```

服务器只绑定回环地址，控制台输出临时 URL；使用浏览器打开后，页面执行检查并提交结果，服务器自动退出。CSP 为 `default-src 'none'; script-src 'self'; connect-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'`。页面主动尝试动态代码和内联脚本，以验证两者确实被阻止。

[浏览器验收记录](browser-report.json) 来自实际浏览器执行，331 项检查通过，动态代码与内联脚本均被 CSP 拦截；记录绑定验收时所有页面与模块字节。Node 在禁止字符串代码生成的进程中另行通过相同 331 项检查，包括 18 个契约样本、41 条夹具报文、64 路异步交错及 200 条固定种子报文。

[检查报告](report.json) 还验证重复构建、夹具重建、整数映射、59 条静态与动态校验差分，以及浏览器记录和当前文件的摘要一致性。命令行检查不重新启动浏览器；`--check-report` 仅验证报告输入绑定。任何验收页面或运行制品变化后，旧浏览器记录失效，须重新实际验收。

这些结果不代表完整 SDK、全部 API 导出、生产站点 CSP 配置、业务运行、部署或真实设备验收。JSON.parse 与 Schema 函数仍同步执行，当前切片不是硬抢占。业务实现仍须遵守项目阶段批准边界。
