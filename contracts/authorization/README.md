# 完整调用授权绑定候选

本包登记固定事件契约选择下 Controller 与 Seamer 的 201 个 HTTP/WS 操作、245 个主体分支，以及操作所需的权限、对象守卫、可信提供者和复核阶段。它是设计成果，`approved=false`、`runtime_ready=false`，不接入真实认证、事务或类型客户端，也不改变现有公共协议及选择摘要。

完整设计见 [AUTHORIZATION.md](AUTHORIZATION.md)，逐操作结果见 [bindings.json](bindings.json)。[sources.json](sources.json) 固定四项 SDK 输入及两项既有授权候选副本的提交与 SHA-256；副本只作为设计来源保留，不代表已批准的权限实现。

## 内容与约束

- [policy.py](policy.py) 显式列出操作与主体/用途守卫的关系；[providers.py](providers.py) 定义 12 类可信提供者职责，未知操作或认证方案不采用默认策略。
- [build.py](build.py) 核验固定输入，保留 OpenAPI 认证分支的 OR/AND 关系，生成完整绑定及旧候选变化清单。原始语义扩展只保留本轮登记字段，不声称解释全部领域语义；更新来源摘要须重新审阅策略。
- 62 个登记守卫中，61 个被当前操作引用。旧 `subscription_owner` 只保留来源记录，当前订阅改用具名人员/内部订阅守卫。一次性票据签发改为绑定已有订阅，差异在 `guard_changes` 中显式登记。
- 每个操作均标记 `authorization_granted=false`。提供者、句柄及阶段清单本身不能证明实际凭据有效、权限已授予或设备可发送。

## 复验

在 SDK 仓库根目录使用 Python 3 标准库运行，无额外依赖：

```console
python -I -B contracts/authorization/build.py
python -I -B contracts/authorization/check.py --report
```

[check.py](check.py) 检查来源字节、生成一致性、操作完整性、认证分支、权限/守卫/提供者闭包与复核阶段；含独立主体预期及 20 项反向变异。[report.json](report.json) 记录 655 项静态检查及输入摘要，不将登记数量等同于运行授权覆盖率。

本轮未执行真实认证、授权竞争、事务、网络、浏览器或设备验证。跨域引用、领域原子规则、面板方法语义及生产存储仍由所属契约完成；本包不关闭阶段 0 或全部系统验收。
