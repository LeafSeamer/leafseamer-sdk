# 当前面板动态值与发布原件

隔离参考候选，`approved=false`、`runtime_ready=false`、`installed=false`。使用 [panel-wire 完整契约](../panel-wire/README.md) 的 `leafseamer.api.v1.panel4` 选择、Registry 和模型；[旧动态值提供者](../panel-dynamic/README.md) 保留原选择。当前选择不能搭配旧 Registry 或旧 Bundle 激活引用。

`Authority` 仍由可信宿主提供安装审批、字段权利与完整上下文。它校验封闭 Schema 资源，复制完整值，逐项检查根、容器与叶节点的 JSON Pointer 权利，再启动有截止期限的一次性 Python 校验进程。候选仅在创建它的权威实例内消费一次；准备期间及消费前均复核撤权和完整上下文。没有默认值填充、类型强转或字段裁剪。

## 发布原件适配

`PublicationAuthority` 仅适配 `seamer.publishDefinition` 的 `/content`、`/metadata`，要求 `purpose=definition`、`access=read`。宿主明确提供完整 PublishedVersion、原件选择及当前批准配置；`prepare(db, context)` 不接受自报值。

- 通过 [publication-current 存储](../publication-current/README.md) 的当前或显式历史入口读取整份已提交原件。panel4 当前面板可在当前批准下读取 panel3 历史原件，但不得重标原件选择或退回最新草稿。
- 来源引用的 authority/database 必须与发布 scope 一致；`entity_kind=publication_source`，`entity_id=definition_id`，`revision=definition_version`。`content_digest` 必须为完整 `record_digest` 去掉 `sha256:` 前缀的值。`entity_epoch` 仍由可信生命周期权威提供，存储记录本身不证明生命周期有效性。
- 当前／历史入口各自验证原格式、完整选择、完整 PublishedVersion、摘要与规范字节。之后才提取指定内容，并独立通过当前批准 Schema 与全部字段权限。
- 同连接存在活动事务即拒绝，不替调用方提交或回滚。宿主须独占或串行使用连接，且连接必须来自受信的该存储实例；调用方不得并发改变连接事务状态、替换连接实现或直接操作其内部候选表。
- 撤权或上下文变化使候选失效；引用、发布参数、Schema 文档与来源选择均保存副本，调用方后改输入不改变批准状态或实际存储值。

```python
candidate = authority.prepare(database, current_context)
qualified = authority.consume(current_context, candidate)
```

构造入口并非外部审批 API。普通 `Authority` 仍要求各来源适配器自行建立真实来源关联，本包没有实现所有动态槽的生产提供者，也未接入最终投影输出 Gate、真实安装审批或当前读权服务。

## 验证

在安装 jsonschema、referencing、rfc8785 的 Python 环境执行：

```text
python -B contracts/panel-current/check.py --report
```

[报告](report.json) 分开列出基础检查和 `publication_source` 的实际检查。基础包含封闭解析、预算、字段权限、一次性候选、撤权线程和真实超时；发布检查用旧实现子进程创建磁盘库，显式升级后验证当前／历史 content 与 metadata、完整身份和摘要、未提交与回滚记录、拒绝裁剪、撤权及原件字节保持，并实际启动旧消费者验证其选择边界。

发布测试使用宿主显式批准的完整合成值 `const` Schema；这是测试配置，不是从生产数据自动生成审批。实际数据库场景为 WAL，DELETE/WAL 升级与存活旧连接覆盖由上一包报告单列。没有真实数据库迁移、业务编译、生产授权、设备、浏览器或网络验收；工作进程硬内存限制、进程级全局调度和真实最终投影仍未实现。

[sources.json](sources.json) 固定父 SDK 提交及输入文件；`source/` 保留固定 Bundle 校验资料。报告对本包与全部依赖做字节绑定，原有交付物保持不变。
