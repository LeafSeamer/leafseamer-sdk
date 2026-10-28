# 完整HTTP信封适配器

阶段0候选参考实现，将当前`leafseamer.api.v1.events2`的201项操作、2148个精确响应状态与58种参数定义接入同一HTTP入口。路径、查询和头先校验，再使用既有完整正文解码器；`approved=false`、`runtime_ready=false`。源码固定于[sources.json](sources.json)，完整元数据见[清单](preview/inventory.json)。本模块尚非生产服务或已批准SDK发行物。

```javascript
import {createHttpAdapter} from './adapter.mjs';
const http = createHttpAdapter(installedSelection);
const request = http.prepareRequest('controller', method, rawTarget, rawHeaderPairs);
const decoded = await http.decodeRequest(bodyBytes, request);
const response = http.prepareResponse(request, statusString, responseHeaderPairs);
const result = await http.decodeResponse(responseBytes, response);
```

`authority`来自已确认的服务挂载，不能从请求正文、Host或查询参数推断。`rawTarget`为挂载还原后的服务内原始origin-form路径及查询，不能先交给会消除点段、替换坏UTF8或合并查询参数的URL解析器；外层`/services/<service_id>`映射属于部署适配。传输层须先完成HTTP消息分帧并保留重复头为二元组数组。禁止以已合并的Fetch Headers对象代替原始头来声称重复字段检测有效。

## 行为

- 以authority、精确大写方法和路径选择操作，具体路径优先于模板；同等优先级匹配、未知路径／参数／状态均拒绝。句柄仅在创建它的适配器实例有效，响应绑定原请求操作，调用方不能用另一模式替换正文。返回对象递归冻结，不授予权限。
- 路径和查询只做一次严格UTF8百分号解码；查询采用form的加号空格规则，`%2B`保留加号。百分号别名导致的重复查询名也拒绝。十进制字符串计数器保持字符串；只有当前三类有界integer参数转安全整数，不自动填默认值。
- 头名不区分大小写，值仅去首尾SP／HTAB。契约、摘要、Origin及认证／分帧等单值字段拒绝重复；已声明响应头按原Schema校验。Set-Cookie保留多行语义，验证时不以逗号拼接。未知头不成为业务参数；返回DTO不包含Cookie、令牌、CSRF或票据头值。
- 常规HTTP要求精确契约ID与摘要；四条WS入口分别保留人员双token和服务单token要求。已选响应必须回显精确选择，101只回显契约token。发现端点独立于已选状态。未完成选择时的认证／协商拒绝由外层处理，不能伪造一个成功选择句柄来接受它；此模块不做票据消费、升级握手或WS首帧运行验证。
- JSON媒体类型接受大小写及可选单一UTF-8 charset（含引号），再向底层传规范媒体类型。当前profile只接受identity内容编码，无正文声明要求空bytes且无Content-Type。Content-Length存在时与解码bytes长度比较，CL和TE共存拒绝；完整HTTP分帧、TE规则及压缩解码由外层HTTP引擎负责。
- 入口预算固定为原始target 16384字节、头65536字节／256行、查询128对。拒绝空路径段、点段、解码后的斜杠／反斜杠／百分号、控制字符和非ASCII原始target，避免路由层再次解释。这些是本候选入口profile的明确限制，未暗改原Schema；需要放宽时须连同所有路由层及验收显式版本化。

基础序列化和响应头元数据依据[OpenAPI 3.1参数与Header定义](https://spec.openapis.org/oas/v3.1.0.html#parameter-object)，头字段大小写、OWS及Set-Cookie多行边界依据[RFC 9110第5节](https://www.rfc-editor.org/rfc/rfc9110.html#name-fields)，百分号只解码一次依据[RFC 3986第2.4节](https://www.rfc-editor.org/rfc/rfc3986.html#section-2.4)。上述预算、严格词法及额外拒绝规则属于本项目候选profile，并非这些标准要求所有HTTP实现如此处理。

所有原操作的security组合、对应scheme定义和`x-*`扩展均保存在只读`describe(authority, operationId)`元数据中；它们未变成鉴权实现。Origin格式有效不等于可信来源，参数和正文通过不等于当前对象授权、语义规则、持久提交或设备效果通过。

## 验证与复现

使用`wire-js`锁定依赖、固定Node 24.22.0和现有Python jsonschema环境：

```text
node contracts/http-envelope/build.mjs --output <新的目录>
python -I -B contracts/http-envelope/oracle.py --output <对照文件>
node contracts/http-envelope/check.mjs --python <python> --report
node contracts/http-envelope/check.mjs --check-report
```

独立Python遍历OpenAPI核对9159项绑定，生成2204项参数接受集预期。URI部分使用明确列出的有限语料预期，未依赖缺失时会静默跳过的可选format插件；它不是通用URI解析器。JavaScript在禁止动态代码生成的进程内运行所有请求／响应绑定、参数差分、缺字段／重复字段／摘要错配、缓冲转移、原始整数、取消和空正文反例。原生Node HTTP另执行10次127.0.0.1临时端口交换，验证原始重复头、错误编码、实际响应头及正文；验收服务只返回合成拒绝并在结束时关闭。

准确结果、执行明细和全部输入绑定见[报告](report.json)。`--check-report`只核对文件摘要。此轮未运行浏览器、TLS、代理、真实认证／授权、实际WS升级、生产服务或设备验收；既有浏览器正文验证不能替代本适配器的浏览器接线验证。无自动发送、动作重试或认证状态迁移。后续需将本入口接入真实传输与权限提供者，并补齐TS客户端及其余完整语义绑定。静态校验器复用的第三方辅助模块和许可见[既有许可](../wire-routing/preview/LICENSES.txt)。
