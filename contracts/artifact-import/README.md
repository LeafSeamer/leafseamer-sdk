# 安装导入独立选择

`leafseamer.artifact-import.1`采用source.json绑定的C09包、导入与安装Schema及路径政策，生成静态校验器和具名类型。独立协议固定extension-import/0.1.0-draft.1，不并入HTTP product1或worker控制协议。复制源保留原未批准标记，本选择不证明发行、安装、物化或运行已获授权。

`decodeArtifactDocument`处理Manifest和FileInventory等具名对象；`decodeImportFrame`核对九种导入帧及期望方向。控制文档至多4MiB，IPC至多64KiB，严格UTF-8／JSON入口拒重复键、非有限值、非法数字及超限结构。文件清单按file_id唯一递增，路径沿portable-ascii/1且按不区分大小写检测文件／父目录冲突；控制文件名不能作为payload。单文件256MiB、总量1GiB、文件65536和路径240字符沿C09。清单对象去重由线性身份／路径核对完成，避免大型对象数组逐对比较；其余结构接受集保持原Schema。

Schema及扫描成功只证明格式。包布局、实际解压字节／CRC／SHA256、Manifest引用闭包、目标平台、真实peer和当前授权由安装宿主核验。role解析、审批及物化观察不因为报文合法而成立。字段含本机路径的便利入口不属于此协议；source_attachment_id由受保护连接登记，不能解释为请求方可指定的文件路径。
