# 面板完整选择的 HTTP 信封消费者

本包是 `leafseamer.api.v1.panel4` 的隔离参考适配器，固定完整选择见[选择](../panel-wire/contract/selection.json)，来源提交和逐文件摘要见[sources.json](sources.json)。保留 `approved=false`、`runtime_ready=false`。它与[正文消费者](../panel-wire/README.md)使用同一完整选择，不能接受 events2、panel3 或混合的 ID／摘要。

适配器覆盖201项操作、2148个响应绑定和58个独立标量参数定义。它从原始目标、原始头字段对和字节正文建立请求／响应句柄，检查路径与查询编码、参数重复、单值头、媒体类型、正文长度、契约选择和正文 Schema。字段格式通过不授予权限；返回句柄始终保留 `authorization_granted=false`。四个 WS 入口只包含握手信封元数据，普通 HTTP 回环不代表实际 WS 升级成功。

```javascript
import {createHttpAdapter} from './adapter.mjs';
const adapter = createHttpAdapter(installedSelection);
const request = adapter.prepareRequest('controller', 'POST', rawTarget, rawHeaderPairs);
const dto = await adapter.decodeRequest(rawBytes, request);
const response = adapter.prepareResponse(request, '200', rawResponseHeaderPairs);
const receipt = await adapter.decodeResponse(rawResponseBytes, response);
```

调用方必须先由受控安装路径选择契约；服务端须另行校验身份、Origin、目标归属、授权和操作幂等性。`prepareRequest` 要求未经框架合并的头字段对。正文校验不能替代网络层分帧和大小限制。

[独立 Python 对照](oracle.py)核对9159个绑定和2204个参数变体。[35方法样本](panel-cases.json)由另一[生成器](panel_cases.py)从固定完整契约与当前方法样本生成，实际 panel3 输入／结果引用必须被新消费者拒绝。当前回执、已受理但投影不可用的回执分别验证；`available` 配合空投影必须失败。旧适配器仍只接受原 events2 选择。

```powershell
node contracts/panel-http/build.mjs --output <新建目录>
python -I -B contracts/panel-http/oracle.py --output <对照文件>
node contracts/panel-http/check.mjs --python <验证环境的python> --report
```

Node 和依赖摘要由已有[依赖清单](../wire-js/dependencies.json)固定，Python 使用[验证依赖](../composition/requirements-validation.txt)。生成器输出应与交付的 `preview` 完全相同。`--check-report` 只核对报告绑定，不重新执行行为检查。

[实际报告](report.json)记录主检查、静态运行和10次本机回环收发；数量属于不同检查集合，不能相加为系统覆盖率。本包没有运行产品服务、真实认证、浏览器或设备验证。发布数据与动态面板等提供者仍保持各自固定选择，采用时必须分别对齐，阶段0继续开放。
