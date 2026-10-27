# 完整正文解码的浏览器验收

本包验证固定 `wire-routing` 制品在实际 Windows Chromium 浏览器中的主线程及模块 Worker 运行。覆盖原候选的 201 项 API、52 类 worker 消息、281 个静态根及全部正文绑定；不是生产 SDK、网络服务或设备验收。`approved=false`、`runtime_ready=false`。

| 浏览器模式 | 主线程通过 | 模块 Worker 通过 | 每个上下文跳过 |
| --- | ---: | ---: | ---: |
| 普通页面 | 7,767 | 7,767 | 100 项共享缓冲检查 |
| 跨源隔离页面 | 7,867 | 7,867 | 0 |

四个上下文合计实际执行并通过 31,268 项断言。普通页面没有 SharedArrayBuffer，不能构造对应负例，因此显式跳过，不计入通过数；跨源隔离页面实际验证这些拒绝路径。原 2,529 条 Python 接受集对照、52 类 worker 正例、36 条 WS 帧及 36 条快照响应均在四个上下文执行。每个上下文另有六项浏览器检查，确认隔离条件、共享缓冲可用性、执行数、真实缓冲转移、首次让出执行前复制及无效 UTF-8 拒绝。

两种页面均实际拒绝动态字符串代码与内联脚本，模块 Worker 也拒绝动态字符串代码。CSP 为：

```text
default-src 'none'; script-src 'self'; worker-src 'self'; connect-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'
```

隔离模式另设置 `Cross-Origin-Opener-Policy: same-origin`、`Cross-Origin-Embedder-Policy: require-corp` 和 `Cross-Origin-Resource-Policy: same-origin`；普通模式不添加这三项头。此处配置用于隔离技术验收，不代表产品部署已采用或验收这些策略。

## 复现

从 SDK 根运行：

```text
node contracts/wire-browser/build.mjs --output <新的目录>
node contracts/wire-browser/serve.mjs --result <本地原始结果文件>
node contracts/wire-browser/record.mjs <本地原始结果文件>
node contracts/wire-browser/check.mjs --report
node contracts/wire-browser/check.mjs --check-report
```

服务器使用两个临时回环端口，仅提供白名单固定资产。使用真实浏览器分别打开控制台输出的两个地址；每个页面执行主线程检查后启动模块 Worker，保存结果并展示 PASS。两个模式均收到结果后服务器自动关闭。完整原始明细留在本地，`record.mjs` 生成可提交的 [验收收据](browser-report.json)，保存每个上下文的检查数、完整明细摘要、实际加载路径、CSP 头、拦截事件及浏览器标识。

[生成器](build.mjs) 不复制或修改 SDK 运行制品，只对固定测试脚本调整导入路径，并为共享缓冲测试加能力检测。适配后源码逐字节核验；测试断言身份由原运行报告加六个明确新增断言推导。收据检查器对四个完整断言序列逐一校验摘要，不能靠填写总数冒充通过。

[检查报告](report.json) 绑定固定来源和当前验收资产，并验证漏模式、错误计数、伪造隔离、跳过项、缺加载、放宽 CSP、Worker 失败及明细摘要漂移均被拒绝。`check.mjs` 不自动打开浏览器；它核验已有实际验收记录与当前字节。`--check-report` 更只核验报告输入绑定。变更已验收运行制品或页面后，必须重新实际运行两种模式。

本次仅验证所记录的 Windows Chromium 环境；Firefox、Safari、其他平台、实际服务 HTTP／WS、认证授权、生产 CSP 和设备均未验收。模块 Worker 运行通过不等于实现任务取消后的强制终止协议，也不证明时限硬抢占。临时回环资产请求不是产品网络会话验证；全入口模式覆盖也不表示全部业务正例完成。
