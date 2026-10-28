# 当前发布原件与历史读取

本包新增 `leafseamer.api.v1.panel4` 发布原件入口，以及从固定旧布局显式升级的隔离参考。当前完整选择见[选择文件](../panel-wire/contract/selection.json)，212项固定SDK输入见[sources.json](sources.json)。`approved=false`、`runtime_ready=false`、`installed=false`；没有修改既有[panel3发布包](../publication-source/README.md)，也没有迁移任何生产数据库。

## 新写入与历史身份

当前封装版本为 `publication-current/0.2.0-draft.1`，沿用完整PublishedVersion、发布时DraftRecord、metadata_digest和record_digest。29个领域模型与原版本相同；完整契约选择和封装格式显式区分。新记录必须由当前发布writer在原发布、编译产物、请求查原及审计的同一事务内追加，本参考只实现关联表，尚未接入完整生产事务。

`freeze(published, source, selection)`要求精确当前选择；`append(db, record)`只接受当前封装，调用方必须已经拥有事务。主键仍为authority／database／definition／version，不增加选择字段来允许同一发布重复登记；制品身份仍保持唯一。把旧记录重标panel4并重新计算摘要不能覆盖同一发布版本。旧metadata不会被新草稿或新发布替换。

`read_current(db, expected_published, selection)`只返回当前记录。`read_history(db, expected_published, historical_selection)`只返回原panel3记录，必须明确给出完整旧选择；返回原封装和原摘要，不自动转换为当前结果。两个入口都核对完整PublishedVersion、结构、语义、摘要及规范原始字节，不回退到最新版本。读取成功仍不授予当前读权或面板输出资格。

```python
db = store.connect(isolated_database)
record = store.freeze(published, source_draft, installed_selection)
db.execute('BEGIN IMMEDIATE')
try:
    store.append(db, record)
    db.execute('COMMIT')
except Exception:
    db.execute('ROLLBACK')
    raise
current = store.read_current(db, published, installed_selection)
```

## 明确升级与旧连接门控

对既有旧布局，普通 `connect(path)`拒绝接管。受控迁移调用 `connect(path, upgrade=True)`才会执行升级；这不是生产迁移批准。升级只接受完整匹配的旧表、索引与不可变触发器，在 `BEGIN IMMEDIATE` 锁内再次核对，再追加[当前写入门控](admission.sql)。历史BLOB不重写、不重编码、不重新计算摘要。失败回滚，不自动修复未知布局；已有当前布局重开无需重复升级。

数据库的原校验函数仍能验证新旧完整记录，使混合历史的完整性检查保持有效。新增插入触发器另行要求当前封装及当前连接函数，因此：

- 新连接的直接SQL也不能插入新的旧格式记录。
- 升级前已打开的旧连接缺少当前门控函数，后续追加失败，仍能读取自己的旧记录。
- 旧writer仍持锁时升级失败；DELETE模式旧reader阻止DDL提交时整次升级回滚。
- WAL模式允许保留旧读快照，但该快照不能在升级后转为writer，实际返回 `SQLITE_BUSY_SNAPSHOT`。

这些保证针对遵守本接口的连接和固定旧实现，不防御有权任意改DDL或注册伪造SQL函数的数据库管理员。生产还需要统一迁移协调、备份恢复、完整业务表版本、权限与发布writer接线；不能仅以此单表门控宣布整库迁移完成。原UPDATE／DELETE／REPLACE禁令与8 MiB、200000节点、64层预算保持不变，未新增GC。

## 证据与限制

[验证报告](report.json)记录292项主检查，其中212项为固定输入核验，另记录74项迁移检查。测试在DELETE和WAL真实磁盘库中各保留一个独立旧Python进程，验证锁冲突、旧快照、旧writer门控、新旧读取隔离、回滚、重复升级、原BLOB不变及混合记录完整性。旧存储在子进程按原文件运行，没有通过替换它的全局配置伪造兼容。当前模块也验证宿主同名`build`模块不会污染其固定选择。

```text
python -I -B contracts/publication-current/build.py
python -B contracts/publication-current/check.py --report
```

第二条通过脚本目录导入本地测试模块，不使用`-I`。解释器摘要、Python／SQLite及依赖版本均写入报告，测试库只位于忽略的logs目录。检查数量属于不同集合，不能相加为系统覆盖率。

动态值提供者仍需独立迁移到panel4，历史发布值输出还须绑定其原选择、当前批准Bundle、字段权限、真实来源及最终输出Gate。本包未运行生产发布、真实编译、授权、浏览器、网络、设备、进程崩溃或掉电验收，阶段0继续开放。
