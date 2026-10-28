# 当前领域模型的面板结果候选

本包提供 `panel-results/0.3.0-draft.1`：21 类视图、23 个结果变体、35 个方法结果绑定、181 个顶层输出字段来源登记及 14 个具名提供者职责。`approved=false`、`runtime_ready=false`、`installed=false`，阶段 0 尚未完成。

- [RESULTS.md](RESULTS.md)：结果读取、字段转换、失败与释放规范。
- [bindings.json](bindings.json)：完整方法、视图、来源模型和逐字段计划；由 [catalog.py](catalog.py) 显式定义。
- [result.schema.json](result.schema.json)：封闭结果结构和方法分派验证根，不是新的线上信封。
- [sources.json](sources.json)：五份 SDK 原件及一份 Suite 合成样例副本的固定提交和字节摘要。
- [report.json](report.json)：本轮实际执行的结构、来源覆盖与有限显示语义检查；[check.py](check.py) 可复验。

从 SDK 根使用 Python 3.14、`jsonschema==4.25.1`、`referencing==0.36.2` 执行：

```text
python -I -B contracts/panel-results/build.py
python -I -B contracts/panel-results/check.py --report
```

生成器仅用标准库；检查器只注册本地固定 Schema，不下载远端引用。`build.py` 覆盖本包两份生成文件；`--report` 重写报告。来源漂移立即失败。更新来源需要重新审阅字段、关联和版本，不能只重算摘要。

覆盖单位是“每个变体的顶层输出字段”，不是嵌套叶字段、真实权限或完整领域状态机覆盖。QualifiedValue 的 `value` 在静态模型中仍是动态槽；摘要封装通过不证明内容获准。真实投影器、提供者、句柄持久化、新完整选择及生产事务尚未实现。本轮没有运行真实投影、认证、数据库、浏览器、网络或设备测试；报告逐项记录为零，不能继承其他包的运行结论。

现有 [events2 选择](../event-integration/preview/selection.json)及其模型保持原样。新结果与[当前输入候选](../panel-methods/METHODS.md)须一同纳入后续完整契约归并；本包不能直接安装或替换旧 SchemaRef。
