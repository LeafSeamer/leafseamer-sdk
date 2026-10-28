# 动态Schema批准与完整值校验参考

本包把已批准Bundle中的精确导出、当前宿主绑定和动态值的嵌套验证接起来。包含一次性Python校验子进程、逐节点字段权限、进程内单次候选、撤权与有限容量检查。它是独立设计参考，`approved=false`、`runtime_ready=false`、`installed=false`，没有接入生产鉴权、面板投影器或发送出口。

## 来源与适用位置

已知事实：当前panel3的QualifiedValue只固定SchemaRef及value槽，静态外壳不验证动态value。既有Bundle合同已经要求整文档JCS摘要、精确exports、可信安装批准及独立投影Schema，禁止删字段后沿用原摘要。固定原件见[sources.json](sources.json)、[Bundle合同副本](source/bundle.txt)及[当前结果计划](../panel-results/RESULTS.md)。本包复用原[Bundle闭包检查器](source/check_bundle.py)，并实际验证实例，而非把旧结构检查改名为运行验证。

基于这些约束，本候选使用以下调用点。表中路径表示宿主语义位置，不是让面板选择任意对象的通配符；重复元素必须展开为具体路径和精确source_ref。

| 当前位置 | 导出用途与要求 |
| --- | --- |
| controller.getCapabilities的参数／结果／触发／状态SchemaRef | 使用相应parameters/action_result/trigger/state导出；prepare_reference只返回当前精确SchemaRef |
| controller.getDeviceState的values | state；同时通过外层ObservationView和动态实例校验，integrity与字段过滤状态仍独立 |
| controller.submitCommand的parameters | parameters；当前写权限和动作／能力版本固定，验证通过不代替命令准入 |
| seamer.createDefinition／updateDraft的content及返回内容 | definition；完整当前DraftContent与专用动态Schema双重校验，所有节点须可写或可读，不能裁剪后保存 |
| 创建定义metadata及草稿／发布结果metadata | definition用途下独立binding_key；全部名称、说明及layout按专用批准Schema校验，不能只检layout或把布局当可执行代码 |
| seamer.publishDefinition返回的content／metadata | 从[不可变发布原件](../publication-source/README.md)读取，再按该版本和当前读权校验；不用最新草稿 |
| seamer.previewRecovery的逐项evidence_summaries／parameters_summary | 专门批准的action_result／parameters摘要导出；每个非空值独立检查，任何必要摘要失败则整份确认预览不可用，禁止删步骤或证据 |

表单不支持的必需动态语言不能静默舍弃，必须采用批准的专用入口或新profile。此包不替换35方法Registry，不新增HTTP调用，也不放宽静态领域模型。

## 可信宿主接口

`Authority(approved_context, manifest, documents, approved_profile, allowed_paths)`只能由宿主安装与字段权威建立。参数不是外部请求可携带的证明；本包没有对外的安装批准或字段授权API。宿主必须先验证安装审批、当前主体和委托、对象归属、能力版本、source_ref原件以及字段策略。测试用合成宿主配置承担这一前提，不声称真实权限已验证。

approved_context是封闭对象，必须包含：

| 字段 | 精确绑定 |
| --- | --- |
| selection | 当前panel3完整身份和摘要 |
| public_binding | panel_session、panel_instance、document_generation、channel及协议版本 |
| activation_ref | activation、固定Registry、scope_revision及非空Bundle身份／摘要 |
| installation_ref、approval_ref、authorization_ref | 宿主可查的完整ObjectRef，含authority/database、对象、epoch、revision及摘要；authorization_ref指向当前主体／委托／字段权威快照，不是凭证 |
| source_ref | 当前原件的完整ObjectRef；相同裸ID或摘要不足以跨authority或代次复用 |
| input_digest | 规范化完整方法输入的JCS SHA-256，不是仅动态子树摘要 |
| method、slot | 当前固定方法和具体动态槽，由宿主选定；相同Schema不授予其他方法或槽的用途 |
| binding_key、purpose、access | 精确匹配Manifest导出；读写方向显式为read或write，不互相授权 |

安装权威审阅method／slot与导出用途的关系；本参考只核批准后的精确绑定，不从字段名推断权限。源对象与动态子值的真实提取关联仍由提供者负责，schema_digest不证明某个value来自该source_ref。current_context必须由当前可信宿主重新获取，不能让面板把旧上下文回送来续权。

准备时和消费时都要求上下文完全相同。安装、权限、来源或作用域变化时宿主撤销旧Authority，重新读取原件和策略后建立新对象；不能原地修改内部属性续用旧候选。缓存仅缓存完整字节，不延续许可。

## Schema与实例

构造时核完整Manifest、每资源／分块摘要、精确Registry、profile_ref、SchemaRef整文档摘要、真正Schema位置、资源可达闭包和同实例环；保留下降到子实例的递归。Schema中的const／enum数据和名为`$ref`的普通业务字段不被误当引用。

profile摘要绑定Python解释器、jsonschema／referencing实际版本、模式名单、format名单及其实现版本和值预算。当前参考实现的format映射为date-time与uuid，分别绑定rfc3339-validator包及Python标准库版本；声明未知或本机缺失的实现直接拒绝，不能降为只注解。模式须在精确批准名单中，即使批准也仍受子进程期限限制。更新引擎或配置必须形成新的profile摘要和批准，不继承旧结果。

`prepare(current_context, {schema_ref,value})`核对导出后先复制候选值，校验全部具体节点的字段权限，再在独立子进程中执行2020-12嵌套校验。子进程只预注册Bundle资源，缺失URI由显式拒绝解析器处理；不下载Schema，不执行默认值注入、类型强转或额外属性删除。成功和失败仅返回布尔值，不回传验证路径、实例片段或内部异常。引用无法解析、子进程异常、超时均为不可用。

实例权限使用严格JSON Pointer节点集合，根、容器、数组元素和叶节点均须有独立覆盖。授予父路径不会隐式授予整个子树；`~0/~1`精确转义，数字数组索引不是通配符，空容器仍需要权限。当前实现不做通用裁剪：任一节点缺权则整个值失败。专用投影须先由批准的投影器构建，使用自己的Schema和来源绑定，再进入此校验；它不允许靠删除隐藏值使原编辑内容“合法”。

`prepare_reference`用于能力目录中只展示SchemaRef的位置，只生成当前导出的精确引用候选。整个被交付Schema的title／description／const等也须事先审阅，本包不能从字符串合法性推断没有敏感内容。

## 候选、撤权与释放

候选仅为本进程登记的对象身份，值以规范JSON字节私有保存；面板自报`valid=true`或构造一个新对象都无法消费。单次consume后再次消费拒绝，跨Authority拒绝。撤权清空待消费集合并推进内部代次；正在执行的校验返回后还要重核代次，旧结果不能重新登记。单Authority最多64份待消费候选及1个在途验证，满额拒绝且不挤掉旧记录。

consume只完成本参考内的单次取值，不是实际网络释放。生产必须在既有最终输出Gate内再次复核当前主体、源原件、scope、批准及字段权限，并完成排队／发送；不能把consume返回值放入无条件发送队列。撤权后通知可晚到，已显示或已交给传输的字节不可撤回。写请求即使投影失败也不重试领域操作，仍按原请求身份查原。

## 预算与验证范围

每值最多256 KiB规范字节、32768节点和48层；先检查节点、字符和数值，再递归验证。Bundle沿用原1 MiB总文档、32资源、128导出等上限。单次子进程墙钟期限由批准profile固定在100—5000 ms范围；超时会结束该子进程、拒绝结果并释放在途槽。墙钟期限覆盖启动与校验，不承诺CPU精确计时。这里没有生产worker内存硬限额、跨Authority全局调度或浏览器沙箱，因此不得直接加载任意不可信生产Schema。

```text
python -B contracts/panel-dynamic/check.py --report
```

[report.json](report.json)记录103项检查、17次实际验证子进程调用、一次验证期间撤权的线程场景和一次实际超时拒绝。检查包含完整上下文隔离、字段策略、实例类型、引用／递归、模式与format、候选容量、同权威并发拒绝及超时后恢复。可信审批由合成配置提供；生产鉴权、真正的字段投影、发布writer接入、worker内存限额、数据库、浏览器、网络和设备验收均未执行，C09与阶段0保持开放。
