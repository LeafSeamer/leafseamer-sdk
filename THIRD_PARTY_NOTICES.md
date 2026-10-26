# 来源与许可说明

本仓主许可为 [Apache-2.0](LICENSE)。

`contracts/draft4/assemble_candidate.py` 与 `contracts/draft4/source/` 原样迁自 LeafSeamer Suite 的 `docs/contracts/df01-source/`，来源提交和逐文件 SHA-256 见 [migration.json](contracts/draft4/migration.json)。重组得到的六份文件对照 Suite 提交 `595a6b772fed2dce48e3a28511111b41ad3e7fc3` 的 `docs/contracts/draft4/`，不以可变分支证明来源。

`contracts/draft4/check_migration.py` 的逐节点比较及 SE01—SE16 变异用例改编自同一 Suite 来源提交的 `docs/contracts/df01-source/check_candidate.py`。新增部分负责独立仓库的来源绑定、隔离生成与迁移核验。上述契约资料和验证脚本沿用 Suite 的 Apache-2.0；本仓 LICENSE 与该来源提交的 LICENSE 字节一致。

纯数据源内 `license_provenance_paths` 原样保留，指向其 `source_repository/source_commit` 下的来源文件，并不是本仓路径。Suite 中旧设计文档及设备目录的 MIT 许可声明适用于相应材料；本次没有迁入这些文档、目录或旧业务源码，不声称对它们重新授权。后续引入代码、依赖或素材须另行保留相应版权和许可声明。

此次迁入不包含第三方运行依赖。执行标准库生成不等于已完成未来 SDK 依赖的许可审查。
