# 面板35方法当前输入候选

本包把 35 个面板方法的输入绑定到当前命令、控制与自动化领域格式，交付新版本 Schema、逐字段归属、28 类对象/领域约束及旧版本差异。完整规则见 [METHODS.md](METHODS.md)，机器清单见 [bindings.json](bindings.json)。

候选保持 `approved=false`、`runtime_ready=false`、`installed=false`；现有事件选择、HTTP、通道和旧方法输入均不修改。新输入只有在 Registry、结果投影、存储与完整选择共同归并后才能安装，不能凭本包通过检查启用。

- [policy.py](policy.py)：35方法的目标类别、领域提供者及固定宿主字段。
- [build.py](build.py)：核验来源并生成 [input.schema.json](input.schema.json) 和绑定清单。
- [fixtures.py](fixtures.py)：35个独立合成格式样例，包含当前完整修订与引用。
- [check.py](check.py)：输入正反例、旧字段注入拒绝及完整 HTTP 参数/正文合成映射。
- [sources.json](sources.json)：固定 SDK 提交与 Suite 来源副本，不通过工作区未提交内容决定契约。
- [report.json](report.json)：实际检查结果、环境版本、输入摘要与未运行项目。

从 SDK 根目录使用已有 Python 环境复验；检查器依赖报告记录的 `jsonschema==4.25.1`、`referencing==0.36.2`，构建器仅用标准库：

```console
python -I -B contracts/panel-methods/build.py
python -I -B contracts/panel-methods/check.py --report
```

本轮 771 项格式和映射检查通过，包括全部 35 个合成 HTTP 映射。检查仅注册本地固定 Schema，不联网。真实句柄、授权、结果投影、浏览器、网络和设备测试均未执行；合成 Ref 能通过格式但属于错误原件的反例被明确保留。
