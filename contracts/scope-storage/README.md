# 注册对象持久化候选

本目录把 [scope-registry](../scope-registry/README.md) 的不可变 Profile、Selector 和撤销墓碑落到真实 SQLite 参考库，定义提交查原及当前读取的边界。它属于阶段 0 的可执行设计；`approved=false`、`runtime_ready=false`。来源固定在 [sources.json](sources.json) 指定的 SDK 提交，不改变已广告的契约组合。

## 数据与写入

[registry.sql](registry.sql) 声明七个 STRICT 表。`sr_metadata` 固定发布服务、库实例及角色；`sr_object` 保存身份、完整 JCS 正文、独立批准 Ref 和父 Profile；`sr_operation` 保存操作 ID、完整请求及其 JCS SHA256；`sr_revocation` 保存永久撤销事实；`sr_audit`、`sr_outbox` 和 `sr_seal` 分别保存审计、通知意图和封存关联。

安装和撤销均先取得 `BEGIN IMMEDIATE`，分别执行对象或墓碑、操作、审计、通知、封存五次写入，再提交。双向延迟外键要求写集整体存在，漏掉任何一步由实际 `COMMIT` 拒绝。Selector 的父身份与父类型同时非空且指向 Profile。七表禁止更新和删除；连接启用并读回 `foreign_keys=ON`、`recursive_triggers=ON` 和 `synchronous=FULL`，覆盖普通 UPDATE、DELETE 及 REPLACE 的破坏路径。连接配置和 SQL 执行权属于可信适配层，不能交给远端调用方；本包不防御可修改数据库文件或关闭约束的本机写入者。

[storage.py](storage.py) 校验完整规范正文、引用摘要、列值、父引用和操作关联。摘要只证明完整性；批准 Ref 与 Grant 仍必须来自独立可信提供者。对象身份不允许覆盖；相同操作 ID 和相同完整请求查原返回原回执，相同 ID 不同请求拒绝，新的操作 ID 也不能重装已有身份。变更需要新的修订身份。撤销永久保留，旧安装回执可查但不恢复当前资格。

对象正文 262144 字节、操作正文 524288 字节是本候选的有界存储限制，尚未完成产品负载与容量评估。通知表仅证明通知意图与注册变更同提交，不证明消息送达、订阅关闭或最终发送出口已经失效。

## 提交与读取边界

提交后丢失观察结果时，调用方按原操作 ID 查原。`committed` 只说明历史操作已提交；`None` 只说明当前读视图不可见，不能推断并发事务回滚，也不能据此重建新操作。检查器在另一连接实际持写锁且尚未提交时验证这一差异。

`current_registry` 要求显式一致读事务，其结果只对该读取点成立。WAL 下，另一连接提交撤销后，旧读快照仍可能看到旧资格；检查器保留这个实际反例，并核对旧读升级写入得到 `SQLITE_BUSY_SNAPSHOT`。`authorize_at_writer` 拒绝继承外部事务，在新的 writer 切点重读注册并调用既有订阅授权模型，撤销后的新读取拒绝释放旧计划。

该 writer 切点结束后仍存在网络释放时序边界，尚未实现最终释放门。不能持数据库写锁等待网络来替代该设计，也不能把本包返回的计划当作持续有效的授权凭证。认证来源、权限变更传播、订阅关闭、真实传输与最终释放门需要后续完整设计与运行验证。

## 验证

在安装了 [资料验证依赖](../negotiation/requirements-validation.txt) 的 Python 环境中运行：

```sh
python -I -B contracts/scope-storage/check.py
python -I -B contracts/scope-storage/check.py --report
python -I -B contracts/scope-storage/check.py --check-report
```

前两条创建新的临时测试目录，默认位于仓库忽略的 `logs/scope-storage-tests/`；也可用 `--work` 指定尚不存在的目录。`--report` 更新 [report.json](report.json)，`--check-report` 仅核报告输入绑定，不重新运行行为检查。

验证包括四类操作各五步的异常与漏写，共 40 条故障路径；每条比较七表全部内容并确认事务退出。真实磁盘用例覆盖 DELETE、WAL 双连接锁竞争、提交观察丢失、查原、关闭重开，以及 WAL 旧快照反例。执行版本记录于报告，是宿主 Python 的 SQLite，尚未批准为产品原生依赖。关闭重开不是进程强杀、系统崩溃或断电测试，这些测试及服务、认证、浏览器、设备运行验收均未执行。

本包不包含完整生产 DDL、迁移流程或产品服务。下一步需要归并 Suite 的接口与存储交付、冻结最终释放时序，并继续处理其余领域投影和完整契约选择，阶段 0 仍未关闭。
