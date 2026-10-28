"""由设计明确登记提供者职责；这些声明不实例化可信身份或授权事实。"""
PROVIDERS={
 'identity':dict(owner='目标服务身份与配对存储',input=['入口实际凭据句柄','目标authority','固定认证分支'],output=['本地主体身份','credential/session/issuer代次','单audience','当前认证与撤销截止','实际对端与用途'],failure='认证无效拒绝；权威暂不可用不使用过期缓存'),
 'permission':dict(owner='目标服务当前权限策略',input=['identity句柄','固定操作permission','目标引用','当前委托引用'],output=['当前范围交集','授权修订','最早可证明截止'],failure='不足拒绝；不存在permission不能解释为全权'),
 'object':dict(owner='目标authority领域事务读取器',input=['固定操作','已校验path/query/body','identity句柄'],output=['规范目标引用','所属scope与owner','不可变原件/当前修订','列表逐项可见性'],failure='错域或无权不泄漏对象；缺原件或读取不完整不猜测归属'),
 'control':dict(owner='Controller控制与命令事务',input=['目标引用','identity句柄','当前control/gate/ready','原始命令与请求键','当前run/grant'],output=['当前holder/强制取得资格','邀请目标及期限','命令归属与当前取消权','手动或自动化来源约束'],failure='前态失效拒绝当前请求；不得用历史成功结果延续权限'),
 'context':dict(owner='目标服务Context与请求身份存储',input=['identity句柄','已校验Context/RequestKey','固定操作用途'],output=['同主体凭据链/委托域','目标audience与操作交集','请求世代及不扩展截止'],failure='错链错代拒绝；新凭据不能自行继承旧Context'),
 'session':dict(owner='Controller登录与会话事务',input=['原始Origin/CSRF与凭据句柄','一次性部署或登录证明','当前会话状态'],output=['登录/初始化前置资格','Cookie与Origin绑定','刷新轮换与定向签发交集','近期认证引用'],failure='失败不泄漏账号；初始化/轮换/票据消费必须由所属事务原子裁决'),
 'subscription':dict(owner='当前发布者订阅注册与释放门',input=['identity句柄','subscription/connection/snapshot/page引用','当前scope/profile/selector注册','consumer槽及purpose'],output=['精确owner与代次','当前集合可见性与完整性','有效票据/页期限','当前释放资格'],failure='失效关闭旧释放；完整性缺失进入重同步，不能用过滤后的集合冒充完整快照'),
 'extension':dict(owner='当前宿主安装审批与面板会话事务',input=['identity句柄','installation/slot/session/preview/request引用','当前激活及委托代次','固定方法目录'],output=['受信宿主来源','产物摘要及人员审批范围','窗口/实例/会话归属','方法与对象权限交集'],failure='旧产物/旧窗口/撤销后拒绝；确认提交仍须重核被代理操作，不能洗掉委托域'),
 'automation':dict(owner='Seamer定义与运行事务',input=['identity句柄','definition/artifact/program/proof/run/execution引用','固定操作与当前修订'],output=['定义及运行归属','草稿/发布/布防/恢复允许阶段','组织批准与当前预检','原请求命名空间'],failure='缺当前批准或原件拒绝；服务准备不代替人员发布/布防/恢复'),
 'source':dict(owner='Seamer来源注册与规范摄取事务',input=['identity句柄','来源注册与provider/boot/stream','目录或事件/commit引用'],output=['实际提供者归属及用途','当前来源代次与能力','摄取原件及可见性'],failure='自报provider/来源/耐久不作事实；接收事件不直接触发未经资格核验的动作'),
 'continuation':dict(owner='对象原权威的准备保护与延续事务',input=['实际mTLS对端句柄','continuation/preparation/grant/run引用','当前配对与保护代次'],output=['原origin或Controller对端归属','原动作范围','不可变查原及单调保护资格'],failure='错对端或错引用拒绝；保护/查原不能变成新动作授权'),
 'capacity':dict(owner='目标服务容量与认证时间策略',input=['固定操作','有界profile；已认证分支另绑定当前认证截止，发现入口使用公开预算','目标服务修订'],output=['有效profile引用','入口及评估预算','当前管理范围'],failure='耗尽或时间不可信不默认放行；普通日志故障与关键状态失败分开')
}

GUARD_PROVIDERS={
 'public_projection':['object'], 'own_session':['identity','object'], 'context_intersection':['context'],
 'subscription_owner':['subscription'], 'ticket_binding':['subscription','session'], 'device_scope':['object'],
 'command_scope':['object','control'], 'control_scope':['object','control'], 'manual_holder':['control'],
 'automation_grant':['control'], 'cancel_target':['control'], 'acquire_target':['control'], 'release_target':['control'],
 'offer_target':['control'], 'accept_target':['control'], 'grant_proposal':['control'], 'grant_revoke_target':['control'],
 'bootstrap_once':['session'], 'login_proof':['session','capacity'], 'cookie_binding':['session'], 'refresh_rotation':['session'],
 'token_intersection':['session','permission'], 'introspection_audience':['identity','object'], 'revocation_target':['identity','object'],
 'recent_auth':['session'], 'revocation_visibility':['object'], 'subject_visibility':['object'], 'capacity_profile':['capacity'],
 'provider_catalog':['source'], 'provider_event':['source'], 'definition_edit':['automation'], 'definition_publish':['automation'],
 'run_create_unarmed':['automation'], 'run_read':['automation'], 'preflight_readonly':['automation'], 'recovery_readonly':['automation'],
 'arm_approval':['automation'], 'pause_target':['automation'], 'recovery_confirm':['automation'], 'recovery_visibility':['automation'],
 'proof_visibility':['automation'], 'internal_object':['identity','object'], 'ticket_issue':['subscription','session'],
 'command_namespace':['context','control'], 'seamer_command_owner':['identity','control'], 'transfer_cancel':['control'],
 'extension_scope':['extension'], 'extension_consent':['extension'], 'panel_host':['extension'], 'panel_operation':['extension'],
 'panel_method':['extension','permission'], 'panel_subscription':['extension','subscription'], 'service_subscription':['subscription','identity'],
 'human_subscription':['subscription'], 'collection_scope':['subscription','permission'], 'definition_scope':['automation'],
 'run_retire':['automation'], 'automation_namespace':['context','automation'], 'origin_peer':['identity','continuation'],
 'controller_peer':['identity','continuation'], 'continuation_scope':['continuation'], 'ingress_scope':['source']
}
