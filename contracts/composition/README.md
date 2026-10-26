# 按服务分离的接口归并审阅预览

状态：**审阅预览，approved=false、runtime_ready=false，不可用于部署或生成生产客户端。** 本包解决已有接口资料的机械归并、来源追踪及冲突拒绝，不把结构通过当成统一协议已冻结。旧 [draft.4](../draft4/README.md) 不变。

已知事实：Suite 原归并表列出 14 份 OpenAPI，后续公共命令已有 10 操作的统一消费包、继续运行增加两份内部 API；其当前 worker 协议是 IPC 0.14。本包从固定 Suite 提交 `5a2847524316a80cf5d6e2e663d91854d4d15675` 选择 15 份资料，替代早期分散命令输入。具体文件、摘要、所属服务和挂载位置见 [policy.json](policy.json)。该版本仍为候选，选择输入不等于批准它的全部设计或运行行为。

| 交付物 | 职责 |
| --- | --- |
| [source.json](source.json) | 单一源保存 927 个命名空间模型及 15 份操作骨架；骨架仅引用模型，不再复制模型正文 |
| [policy.json](policy.json) | 逐项固定 27 个替换、6 个退役，以及源所属 authority、原 server 和路径挂载 |
| [模型图](preview/models.schema.json)及[身份映射](preview/model-identities.json) | 每个模型反查固定来源文档 URI 和 JSON Pointer；声明的 canonical URI 单独保留，不推断未证明的模型等价 |
| [Controller 预览](preview/controller.preview.openapi.json) | 90 项操作，包括一个 WS 升级入口 |
| [Seamer 预览](preview/seamer.preview.openapi.json) | 87 项操作，包括一个 WS 升级入口 |
| [归并清单](preview/inventory.json) | 每项操作的源、版本、被替换源及退役记录 |
| [验收报告](report.json) | 实际检查结果、固定来源重新提取和完整本包输入摘要 |

170 条原始文档声明按两个 authority 展开为 210 条。27 项明确替换、6 项旧时间接口退役后保留 177 项；这不是 177 项已实现功能。面板、订阅、安装及时间服务分别属于各自宿主；Controller 设备扩展与 Seamer 数据源不共享安装批准、会话或 writer。依据为 Suite `rebirth-c09-extension-design.md` 的职责和宿主路由约定，而不是新增第三个中心服务。

## 机械归并规则

1. 主键为 `(authority, method, 已挂载路径)`。来源及裁决加载顺序不影响结果；未登记重合、多余或错身份裁决、同服务重复 operationId、等价路径模板均拒绝。
2. 控制权候选用 `servers: /api/v1` 配合 `/devices/...`。只对该固定来源显式消费此挂载；预览使用 `/api/v1/devices/...`，server 归一为 `/`，不会重复拼接。其他操作不得自行新增 server。原 server 保留在来源元数据中；预览根不是实际 nginx 配置。
3. 完整保留所选操作的参数、响应码、headers、对象守卫、版本头和扩展元数据。继承的 security 显式展开到操作，安全方案名称按来源隔离，不合并同名但不同定义的认证方案。WS 的票据和帧 Schema 引用参加闭包。
4. 模型按固定来源身份定位，不按短名或结构相似自动去重。仅两份 draft.4 骨架明确共用原基线命名空间，且模型不一致即拒绝；其他来源保持独立。来源往返重建必须与固定提交原件逐字节一致。
5. 引用转换区分 Schema 关键字与成员名：名为 `default`、`enum`、`examples` 的属性仍转换其 Schema 引用；真实 const/example/default 数据中的 `$ref` 文本不改。此边界包含正例和回归用例。
6. 模型图根禁止直接作为消息接受入口，须选具名定义。生成出的 components 不表示全部可公开导出；内部模型仅因闭包需要存在，不授予读取权限。

## 可复现检查

生成器仅需 Python 3.10+ 标准库；完整验收的直接依赖列于 [requirements-validation.txt](requirements-validation.txt)，不是生产工具链锁。实际平台和版本见报告。

```text
python -I contracts/composition/compose.py
python -I contracts/composition/compose.py --output <尚不存在的目录>
python -I contracts/composition/check_composition.py
python -I contracts/composition/check_composition.py --suite <本地Suite仓库> --report
python -I contracts/composition/import_sources.py --suite <本地Suite仓库> --output <尚不存在的目录>
```

默认检查不依赖 Suite；带 `--suite` 时按固定提交重提取，不按 Suite 工作区或当前分支猜选最新输入。报告中逐操作完整元数据检查为 177 项，另有 25 项拒绝用例、引用字面量和同名属性边界、Schema/OpenAPI 结构、加载顺序、来源往返与标准库隔离生成。全部是离线资料验收，不是 HTTP 认证、跨进程屏障或真实设备验收。

## 尚须完成的统一冻结

这是后续归并的可审阅输入，不是多个旧协议可在同一服务上回退解析的许可。当前保留各来源 `X-LeafSeamer-Contract` 和正文版本；统一候选必须一起重绑所选接受集及协商规则。剩余工作在生成清单的 `blockers` 中机器列出：跨域 Ref 和数字接受集、当前 IPC 0.14 与其他独立通道、授权及面板操作映射（含 ingestEvent 改为 submitProviderEvent）、快照投影、具名摘要与 DDL 映射、候选审阅和阶段 0 交接。未经逐项绑定不得把 info.version 当作统一 wire 版本。

本轮为提交周期第 2/3 轮。下一轮须把 SDK 两轮交付引用及当前输入修正同步到 Suite 权威设计稿，再审查本周期涉及的仓库后推送。真实服务和平台验收仍在实施后完成，不以未实现的服务阻塞设计定稿。

## 来源与许可

上述 15 份接口资料及其模型来自 [LeafSeamer Suite 固定提交](https://github.com/LeafSeamer/leafseamer-suite/tree/5a2847524316a80cf5d6e2e663d91854d4d15675)，沿用 [Apache-2.0](../../LICENSE)。来源路径与原件 SHA-256 在 policy 中登记；拆出模型和改写局部引用仅用于可逆归并，不改变源契约的批准状态。原件声明的 canonical URI 仍归其来源含义；不声称完成未来第三方模块或运行依赖的许可审查。
