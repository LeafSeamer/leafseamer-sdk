# draft.4 独立契约源

本目录完成 DF01 的独立仓库等价迁入：`source/` 是本包唯一的模型及操作输入，`assemble_candidate.py` 从输入生成六份历史文件，不导入 Suite 生成器、不访问网络。公共模型只保存一次，HTTP 的 `components.schemas` 按配方生成。Suite 原目录保留为历史对账材料，不在两仓间双向同步。

这里冻结 `1.0.0-draft.4` / `ipc/0.3.0-draft.1`，保留历史接受集及原 `$id`。源 manifest 的 `authority_switched=false` 表示原提取候选没有批准新协议；迁入独立仓库也不批准后续 DF/C 候选、不改变公共导出权限。下一统一候选在 SDK 的新版本目录中演进，Suite 负责设计依据和历史验收，不再另建可变的同版模型源。

## 使用与核验

需要 Python 3.10 或更高版本的标准库；当前实际执行平台和版本记录在 [migration-report.json](migration-report.json)，不宣称全平台已验证。

```text
python -I contracts/draft4/assemble_candidate.py
python -I contracts/draft4/assemble_candidate.py --output <尚不存在的输出目录>
python -I contracts/draft4/check_migration.py
python -I contracts/draft4/check_migration.py --suite <本地Suite仓库路径> --report
python -I contracts/draft4/check_migration.py --check-report
```

前三条无需 Suite、Git 历史、网络或第三方 Python 包。核验器检查迁入文件摘要、源集合、完整引用、逐节点重组、两次隔离生成，以及重算局部摘要也不能改变冻结输出的变异用例。输出目录必须不存在，既有目录不覆盖。

`--suite` 增加固定提交的逐文件来源核验及六产物逐节点/字节对账，并实际运行 Suite 原版 232 例；该语义检查仍依赖 Suite 及其环境。它验证的旧版输入与迁入重组输出逐字节相同，但不把原语义判定器说成已移入 SDK。`--report` 要求 `--suite`，记录完整来源证据及本仓输入摘要；`--check-report` 只核本仓报告绑定，不重新执行历史测试，也不证明远端发布状态。

来源提交、源许可摘要、每份来源路径和原件摘要见 [migration.json](migration.json)，许可适用范围见 [来源声明](../../THIRD_PARTY_NOTICES.md)。来源路径属于 Suite，报告仅记录仓库相对路径及公开提交标识。

## 本轮边界与后续交付

- 本包只交付冻结契约及生成验证，不是 npm 包、TypeScript 客户端、服务或设备适配器。
- 原 `source-manifest.json` 中未提取的语义规则、具名摘要投影、wire profile、公开/内部导出规则及生产工具链继续待完成；不能用 components 的存在判定可公开导出。
- DF01 严格解码、JCS/大整数跨语言接受集和 reference-bound/1 等修订进入后续统一候选，不改历史样例使其“通过”。
- 后续统一候选须把 Schema/OpenAPI/IPC、路由与 WS 元数据、投影及持久映射一起归并，并完成跨项正反例；本次迁入不表示阶段 0 或项目完成。

本轮是当前三轮提交周期的第 1 轮，提交归属 SDK 仓库。每轮各自保留提交，第 3 轮统一核对本周期涉及仓库后推送；本文件不声称已推送。
