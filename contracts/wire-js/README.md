# JavaScript 原始 JSON 解码参考

本包将 [Python 参考](../wire-json/README.md)的受限字节规则落实为 JavaScript 扫描与 Ajv 接线，属于独立阶段0候选。`approved=false`、`runtime_ready=false`，不接入服务，不改变既有契约选择的接受集。固定来源见 [sources.json](sources.json)。

## 字节、数字与校验

[wire.mjs](wire.mjs) 的 `decodeWire(bytes, schema, options)` 在首次 `await` 前复制普通 `Uint8Array`／Buffer 的当前范围；拒绝共享缓冲（包括跨 realm 的 SharedArrayBuffer）、DataView 和 Proxy 视图。原输入随后改变不影响本次处理。首期仅支持当前 realm 的字节视图；同进程恶意代码的完整隔离不由此 API 提供。

处理顺序为：可信 Schema／profile、长度与私有副本 → BOM和fatal UTF-8 → 显式容器栈审计 → 同文本 `JSON.parse` → 数字感知 Schema → 递归冻结。扫描检查重复解码键、Unicode scalar／非字符、单根、尾部语法和有限预算；键不做规范化。数字 token 保存私有 JSON Pointer、UTF-8 半开字节区间及精确系数／指数，禁止非有限数与非零下溢。整数按原始数学值和安全范围判定，普通 number 仍允许 binary64 近似。

[schema.mjs](schema.mjs)只在可信安装阶段编译 Schema。派生视图在相同条件和引用分支附加原始整数守卫，`integer|number` 保留 number 的接受范围；不预先挑选 `if` 或 `oneOf` 分支。每次调用把自己的 token Map 显式传给校验器，无共享的“当前请求”变量。外部引用禁止，未知引用和编译／执行异常失败关闭。关联语义、动态能力批准和当前授权仍由可信上层提供。

Ajv 8.20.0 的 `allSchemaProperties` 会过滤 properties 中的 `__proto__` 名称。本包将这种声明在私有视图中等价迁到精确 patternProperties，已有同名 pattern 通过 allOf 同时保留，required与额外字段约束继续有效。正文仍由 `JSON.parse` 创建自己的数据属性，不把它 merge 到其他对象。转换有独立正反例，公开 Schema 原件保持不变。

## 资源与错误边界

默认实验预算与 Python 相同：65536字节、深度32、16384值节点、每对象4096成员、键1024解码字节、字符串32768解码字节、数字128字符、指数绝对值4096。配置全为有限正整数，等号允许、超一拒绝，不能由报文自行选择大预算。

期限默认100ms，从取得私有副本前计起。扫描和冻结按 slice_units 计步，经 `yieldNow` 让出执行后再次检查取消与单调期限；默认实现使用定时任务。校验前后及返回前也检查，过期不交付 DTO。`TextDecoder`、`JSON.parse` 和 Ajv 单次调用仍同步，不能被这些检查点硬抢占；真实 worker池、保护通路时延和内存峰值尚未验收，实验期限不是生产实时保证。

错误仅返回阶段、固定代码及可选字节偏移，不含正文、秘密或动态属性路径。TextDecoder 的 UTF-8 错误不提供确定位置，因此该错误省略偏移；其他已定位错误以原始 UTF-8 字节计数。非法服务响应不等于原写请求未受理，不授权重投。结果及数字审计元数据冻结；审计 token 不得直接写公共日志。

## 固定依赖与复现

本候选使用 Node24.22.0／npm11.19.1、Ajv8.20.0和ajv-formats3.0.1。[传递锁](package-lock.json)固定六个包；[依赖核验](dependencies.json)记录官方npm制品integrity、实际归档SHA-256、许可和555个安装文件摘要。安装使用独立缓存并禁止生命周期脚本，已逐文件对照归档；摘要一致不等于供应链安全或发布批准。依赖目录不提交。

本轮使用 Windows x64 的固定 Node 制品，归档摘要与既有官方校验清单一致，执行文件与归档原件逐字节相同；检查器再次核对实际执行文件摘要。未验证发行签名，Linux和其他平台仍待单独登记制品及验收。

在本目录以固定运行时执行：

```text
npm ci --ignore-scripts --engine-strict --no-audit --no-fund
node check.mjs --python <安装了jsonschema与referencing的Python路径>
node check.mjs --check-report
```

[检查器](check.mjs)实际执行既有原始报文向量、预算边界、特殊属性、所有权复制、让出执行后的取消／过期和64次异步交错；通过 [独立进程桥](oracle.py)与固定 Python 参考对比接受集、错误码、值及数字 token。200条固定种子的生成报文参与差分；完整1351模型图的146整数路径逐项映射，并在真实具名根测试拒绝舍入和越界。结果和实际版本见 [报告](report.json)。`--check-report`仅核输入绑定。

当前 Ajv 在安装／测试阶段运行时编译，尚未生成可在浏览器严格 CSP 下使用的静态校验制品，也未执行浏览器、网络、设备或生产服务验收。传输分片／重组、动态Schema隔离、操作预算绑定及正式SDK打包仍需完成；本包不据此关闭全系统设计或项目目标。
