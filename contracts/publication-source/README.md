# 发布内容与元数据的不可变关联

本包交付发布原件关联契约、29模型闭包和独立SQLite参考，补齐“固定发布版本读取完整源内容及发布时metadata”的存储形状。它不是发布服务，不产生编译、鉴权、布防或面板发送资格；`approved=false`、`runtime_ready=false`、`installed=false`。来源选择为panel3，既有完整选择与HTTP／WS字节不改。

## 事实与设计裁决

已知事实：当前PublishedVersion含完整scope、definition/version、source_draft_revision、artifact_ref、program/bindings摘要和published_by，但没有完整DraftContent或固定metadata引用。DraftRecord同时带独立的内容与metadata修订；现有Publish请求固定草稿修订及content／selection摘要，不含metadata期望。来源和固定提交见[sources.json](sources.json)、[原发布事务合同副本](source/lifecycle.txt)及[结果提供者要求](../panel-results/RESULTS.md)。

本候选裁决：发布事务在最终writer锁内复核原请求的草稿修订、内容摘要、选择摘要及全部编译来源后，读取该时刻的metadata及metadata_revision，与原发布结果一起不可变保存。metadata在编译期间可独立更新；发布捕获提交时的版本，不能使用编译开始时的可变对象缓存。此选择不暗中给Publish请求添加新的期望字段，也不把metadata变更当作执行内容变更。

来源原件不得由面板或外部API调用者传入。definition提供者须从可信发布事务或按完整PublishedVersion查原取得记录；Schema合法、摘要正确仅证明一致性。调用者可自行构造一致的假记录，因此本包不把`freeze`或`append`作为生产信任入口。

## 不可变记录

[record.schema.json](record.schema.json)包含以下六个必填字段，拒绝额外根字段：

| 字段 | 绑定内容 |
| --- | --- |
| format | 本独立候选版本 |
| selection | 固定panel3来源选择，不能作为此候选已安装的声明 |
| published | 原PublishedVersion全部字段，不能只保存版本号或裸artifact_id |
| source | 发布时完整DraftRecord，含内容、选择数组、metadata及各自修订 |
| metadata_digest | 完整metadata的JCS SHA-256，含名称、说明和layout |
| record_digest | 除自身外上述全部字段的JCS SHA-256，含来源选择 |

摘要均使用`sha256:`前缀。source.content_digest覆盖完整content，selection_digest覆盖selections数组原顺序，不排序或去重。scope须在published、source及artifact_ref中完全相同；definition_id和source_draft_revision须精确对应source。内容修订与metadata_revision独立，不能强制相等。artifact/program/bindings摘要来自原发布对象；本关联参考不重新编译、不派生新artifact摘要，也不证明编译产物正确。

存储键为authority/database/definition/version；另有同authority/database内artifact_id/artifact_revision唯一约束。本候选要求每份发布制品身份唯一归属于一次定义发布，同字节复用也须取得新制品身份。实际发布器须在采用前审阅并遵守此约束，不能把它当作现行生产行为。

## 事务与查询

生产采用需要将以下步骤放在既有发布writer事务中，不能在发布成功后另起事务补写本记录：

1. 按现有完整请求身份查幂等结果。已存在时返回原发布，不重新编译、换metadata或分配新版本；内容冲突按原规则拒绝。
2. 核当前主体、权限、草稿期望和全部编译来源；读取当前metadata及独立修订。任何来源过期或缺失均停止本次新发布。
3. 写原PublishedVersion、不可变program／artifact／proof、完整本关联、原请求结果及审计。任一步失败时回滚整个写集；提交响应丢失后查原，不创建替代发布。
4. 提交后，提供者以权威原PublishedVersion查询本关联，逐字段比较完整published对象。找不到关联或字段不符时整体不可用，禁止读取最新草稿、当前metadata或其他版本补齐。

[store.py](store.py)的`append`要求调用方已经拥有事务，自己不提交；测试实际验证回滚、双连接可见性和丢失响应后的精确重试。参考表用单行保存完整封装，SQL校验函数同时核所有索引列与规范JSON字节。缺少校验函数的连接无法合法插入。UPDATE、DELETE、REPLACE被阻止，关闭recursive_triggers也不能绕过显式插入冲突守卫。`read`返回副本，修改返回值不能改库存。

精确重复只返回existing，原版本任何字段变化均冲突。读到新metadata不改变已发布关联；旧发布查询的名称和layout仍来自旧快照。后续新发布可捕获新metadata，并使用新的定义版本及制品身份。

## 投影、保留与容量

存储完整原件不是允许向面板输出完整原件。definition/dynamic提供者仍须核当前读权、完整动态Schema批准、发布制品原件及全部父子关联；任一必要字段不可读时，完整编辑／发布内容投影整体不可用，不能裁剪后回写。持久化不能把内部scope、发布者或编译材料自动暴露为面板字段，当前包不生成面板View。

参考上限为8 MiB规范JSON、200000节点、64层，先检查形状预算再做递归Schema验证。它们是本候选的硬上限，不是协商后的运行预算；生产仍取会话、字段及服务预算的有效交集，超限拒绝而不截断。保留记录直至所有定义版本、运行、恢复、请求查原、审计和合法保留需求均解除。本参考禁止删除，没有GC或迁移；生产GC必须与上述引用及其他发布表同事务审阅，不允许删除后回退到最新草稿。磁盘失败不能降级为仅保存摘要。

## 验证范围

使用已安装`jsonschema`及`rfc8785`的Python运行：

```text
python -I -B contracts/publication-source/build.py
python -B contracts/publication-source/check.py --report
```

第二条需要本目录模块导入，脚本入口会自动将所在目录加入模块路径，不使用`-I`。83项检查覆盖来源／Schema、字段与摘要错配、SQL绕过、不可变重试、回滚、DELETE/WAL双连接竞争、提交可见性和关闭重开。[report.json](report.json)记录实际环境及输入摘要。测试目录位于忽略的logs，保留文件供复核。

真实发布器的原请求／产物／审计同事务、编译验证、动态字段授权、生产鉴权、面板出口、浏览器、网络、掉电和设备均未验。本包只完成原件关联的候选布局与局部SQLite证据，不能据此关闭C04、C09、DF04或阶段0。
