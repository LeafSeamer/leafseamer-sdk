# 显式契约选择的 HTTP／WS 候选

本包是 C01／DF01 设计资料，`approved=false`、`runtime_ready=false`。在固定 SDK `9eb9cf5` 的共源图上生成新的传输候选，保留原候选原件；不修改业务实现。完整字段、拒绝规则、信任来源、升级保留和失败时序见 [PROTOCOL.md](PROTOCOL.md)。

| 文件 | 用途 |
| --- | --- |
| [policy.json](policy.json)／[sources.json](sources.json) | 新选择规则与上一轮固定输入摘要 |
| [统一模型](preview/models.schema.json) | 新Selection、发现／错误及WS首帧，Context与票据固定选择，旧基线响应同步版本 |
| [Controller API](preview/controller.openapi.json)／[Seamer API](preview/seamer.openapi.json) | 原177项操作补选择规则，两服务各增加1个发现入口，共179项 |
| [路由表](preview/routing.json) | 175项普通HTTP、2项WS及2项发现的完整分派边界；原版本头溯源 |
| [worker入口](preview/worker-ipc.schema.json)／[方向表](preview/worker-messages.json) | 52类IPC仅重绑模型URI，未改变IPC 0.14 wire |
| [manifest](preview/manifest.json)／[Selection](preview/selection.json) | 精确产物字节摘要及无自指的JCS manifest摘要 |
| [样例](examples.json)／[报告](report.json) | 可审阅的合成正例及实际离线检查范围 |

每份广告只列部署实际就绪的精确组合。相同ID不同摘要、HTTP重复头、Context跨契约使用、票据选择错配和错误首帧均拒绝。匹配不授予权限；原认证方式和逐操作主体约束保留。浏览器通过WS子协议传递契约选择和单次秘密，服务器只回显契约token。单次消费提交后即使101丢失也不恢复票据，不重发原业务命令。

`model.py` 是设计验收的纯关系／串行状态模型，可信主体、期限及授权条件由合成提供者给出；它不实现认证、网络、数据库或设备发送。有限双版本路由只证明精确选择逻辑，不代表存在已支持的第二个生产协议。WS数据仍采用既有payload图，当前C05快照／游标／双向ACK和授权投影仍需归并。

## 复现

依赖为 [requirements-validation.txt](requirements-validation.txt)，使用既定Python验证器及 rfc8785 0.1.4，不是生产依赖锁。默认不依赖Suite源码或网络。

```text
python -I -B contracts/negotiation/build.py
python -I -B contracts/negotiation/build.py --output <尚不存在的目录>
python -I -B contracts/negotiation/check.py --examples
python -I -B contracts/negotiation/check.py --report
python -I -B contracts/negotiation/check.py --check-report
```

生成不覆盖既有输出目录。`--examples` 只生成合成夹具；`--report` 实际执行结构、逐路由、选择／绑定拒绝、串行票据消费及首帧失败用例；`--check-report` 仅核输入摘要。报告明确分别记录浏览器、真实服务、并发票据和设备检查的执行数量，不能将它们从离线通过推断为通过。

本轮是提交周期第2/3轮，只在SDK的main提交。下一轮将两轮成果与剩余冻结项归并到Suite，再按依赖顺序审查和推送。原API语义、数字接受集、权限／投影／DDL、其他IPC通道和阶段0放行仍需完成；全部系统设计完成后才进入业务实现。

来源为 [LeafSeamer SDK 固定提交](https://github.com/LeafSeamer/leafseamer-sdk/tree/9eb9cf5ec9715ce9290279d973c69a5c03a271a5)，沿用 [Apache-2.0](../../LICENSE)。只包含成果规范、生成资料和合成验收，不携带运行秘密或设备原始材料。
