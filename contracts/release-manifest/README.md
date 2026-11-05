# 发行清单运行入口

独立选择`leafseamer.release-manifest.1`提供`native-release/0.2.0-draft.1`与`release-revocations/1`的严格解码。固定旧输入和设计身份见`source.json`；新格式按DF05第2／8／10节落实组件、入口、协议、存储、运行时、镜像及部署闭包，旧native-release/0.1接受集保持原样。

`scripts/release-manifest-schema.mjs`是新增字段的定义源；构建同时生成具名TypeScript、静态校验器和Schema。输入最多4MiB，拒绝重复键、未知字段和畸形UTF8。原件身份由完整原字节计算，发行序号使用规范十进制字符串；不以JSON重排后的摘要替代TUF target的字节摘要。created_at固定UTC整秒，只表示声明，不提供可信时间。

路径核可移植ASCII、保留名和大小写／父目录冲突。声明的文件、组件、入口及运行时依赖必须无环；五仓来源均保留。协议端点逐对核角色、方向及同一完整选择，三种公共通道共享选择。部署profile的全部所需入口、文件、运行时、协议、存储和镜像引用须齐全；本机部署不要求同时启动远端通信端点。解析与关联检查分别限5秒，关联检查最多2097152次访问；超限拒绝，不能以部分图检查代替通过。

业务和安装SQLite要求WAL／FULL，监督journal要求DELETE／EXTRA，NodeCG保持独立格式；可写修订必须可读，迁移绑定schema_id及from/to原件摘要。镜像归档、配置摘要和有序DiffID分别保存，标签不作为身份。报告引用与内容真实、实际运行ABI、引擎设置、镜像字节、复现以及部署资格分别验证。

撤销快照按信任域持久采用，revision跨TUF缓存代际不下降；快照缺少旧项不能撤回已记录的撤销。此入口仅检查格式和输入内关系，不证明签名、发行授权、平台报告或真实撤销来源，不自动批准任何设备或安装。

扩展归档的TUF target在`custom.leafseamer`保存`leafseamer.release-extension/1`，由`decodeReleaseExtensionBinding`解码。它绑定完整发行清单的target路径、原字节长度与摘要、归档artifact_id、部署profile_id以及C09扩展清单的JCS摘要。归档自身的长度与hash仍由TUF target绑定，并须匹配完整清单中`extension_archive`条目；所选部署profile须包含该条目。此接受集只处理独立C09扩展归档，不用于包含完整发行清单自身的组合归档，后者仍须独立受签关联以避免摘要环。
