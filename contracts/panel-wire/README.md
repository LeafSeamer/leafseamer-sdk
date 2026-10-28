# 完整面板选择与静态字节消费者

本成果在固定SDK提交基础上生成新的`leafseamer.api.v1.panel4`完整候选及静态消费者，保留`approved=false`、`runtime_ready=false`。旧events2及panel3文件保持不变。更正范围和采用边界见[协议说明](PROTOCOL.md)，固定输入与提交见[sources.json](sources.json)。

本轮严格构建实际发现panel3的52个worker消息schema_ref仍指向未包含在其清单中的events2模型URI。旧归并检查遗漏schema_ref字段，往返比较没有检测到它；这一失败在新检查中保留为必须成立的反例。新候选显式迁移这些资源引用，重新生成完整选择、输入／结果文档摘要及Registry，不改变worker正文、IPC版本与方向。不能只替换选择字符串后沿用旧客户端。

[完整契约](contract/manifest.json)包含1463模型、201项API（含四个WS入口）、35个面板方法和19类面板帧。新消费者包含300个静态校验根、2332个JSON绑定和100个无正文绑定；面板绑定逐一核对window、panel、host联合，Bundle别名只在本地图解析，循环失败关闭。[Python对照器](oracle.py)独立核对2432个绑定及2700个根报文，并验证460条当前面板正反例。Node在禁止动态代码生成的独立进程中实际解码全部52类worker正例、36条WS帧、36条HTTP快照响应及全部面板类型，完整结果见[报告](report.json)。检查数包含输入绑定及反例，不能相加为系统覆盖率。

```javascript
import {createDecoder} from './decoder.mjs';
const decoder = createDecoder(installedSelection);
const request = decoder.panel('panel', 'panel.request');
const dto = await decoder.decode(rawBytes, request);
const http = decoder.http('controller', 'openEvents', 'response', '401');
const error = await decoder.decode(rawHttpBody, http, {contentType: 'application/json'});
```

installedSelection必须与[完整选择](contract/selection.json)的ID及摘要完全一致。新消费者拒绝panel3、events2及混用ID／摘要；旧消费者仍接受events2并拒绝panel4。句柄不可伪造或跨decoder实例使用。panel的group只表示Schema分类，不证明实际窗口来源、port、方向授权或握手状态。面板正文不能夹带HTTP媒体参数。

35方法的Request／Result按精确整文档SchemaRef与当前输入／结果绑定；实际panel3引用、缺字段、额外字段、重复键、旧端口版本、错类型及不允许的订阅均拒绝。accepted与projection_state仍分开，不把不可显示改成未受理。格式合法但当前会话不同的报文仍能通过，是“Schema不等于认证”的明确反例；动态值的内部Schema、来源与字段许可须由真实提供者另行检查。

构建复用固定严格扫描器及整数词法转换，运行文件仅包含静态校验函数与封闭辅助模块。构建会核验锁定依赖的实际字节，生成清单绑定所有输出，第三方许可见[LICENSES](preview/LICENSES.txt)。默认预算不等于生产逐操作profile；JSON.parse和静态校验仍不能硬抢占。

```text
python -I -B contracts/panel-wire/compose.py --output <新的完整契约目录>
node contracts/panel-wire/build.mjs --output <新的静态制品目录>
node contracts/panel-wire/check.mjs --python <python> --report
node contracts/panel-wire/check.mjs --check-report
node --disallow-code-generation-from-strings contracts/panel-wire/node-check.mjs
```

使用sources绑定的Node及依赖、安装验证库的Python环境；完整检查会重新生成契约与静态制品作字节比较、校验跨制品URI及限定语义迁移、运行Python接受集和禁止动态代码生成的Node检查。check-report仅核对输入摘要。本轮未运行浏览器、真实HTTP／WS／port、身份提供者、业务存储、部署或设备；旧浏览器证据不能继承。HTTP原始头／路径／查询适配、TS客户端和其他动态提供者仍绑定各自旧选择，必须按本候选重建后采用，阶段0继续开放。
