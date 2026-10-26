"""设计切片的结构、路由及串行状态验收；不执行真实HTTP/WS/数据库。"""
import argparse
import copy
import json
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
import build as B
import model as M
import fixtures as F
from jsonschema import Draft202012Validator, ValidationError
from openapi_spec_validator import validate as openapi_validate


def inputs():
    files=[p for p in B.ROOT.rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.name!='report.json']
    files += [B.SDK/n for n in B.load(B.ROOT/'sources.json')['inputs']]
    return {p.relative_to(B.SDK).as_posix():B.C.sha(p.read_bytes()) for p in sorted(files)}


def run():
    results=[]
    def check(name,actual,expected=True):
        assert actual==expected,(name,actual,expected);results.append(dict(name=name,passed=True))
    def denied(name,fn):
        try:fn()
        except (ValueError,ValidationError):check(name,True)
        else:raise AssertionError(name+':应拒绝')
    def denied_code(name,fn,expected):
        try:fn()
        except ValueError as error:check(name,str(error),expected)
        else:raise AssertionError(name+':应由指定关联规则拒绝')
    o=B.build();d=o['models.schema.json']['$defs'];api=o['subscriptions.openapi.json']
    for name,v in o.items():check('生成字节:'+name,(B.ROOT/'preview'/name).read_bytes()==B.C.encode(v))
    Draft202012Validator.check_schema(o['models.schema.json']);openapi_validate(api)
    source=B.load(B.ROOT.parent/'event-projection/preview/models.schema.json')['$defs']
    for name,v in source.items():check('快照定义不漂移:'+name,d[name]==v)
    examples=F.examples();check('正例字节固定',(B.ROOT/'examples.json').read_bytes()==B.C.encode(examples))
    for side,other in [('client','ServerFrame'),('server','ClientFrame')]:
        for frame in examples[side+'_frames']:
            M.validate('channel__'+('ClientFrame' if side=='client' else 'ServerFrame'),frame)
            check('帧方向:'+frame['type'],Draft202012Validator({'$ref':B.P+'channel__'+other,'$defs':d}).is_valid(frame),False)
    for name,key in [('HumanCreate','human_create'),('ServiceCreate','service_create'),('SubscriptionView','human_view'),('SubscriptionView','service_view')]:
        M.validate('channel__'+name,examples[key]);check('具名正例:'+key,True)
    for op in o['policy.json']['operations']:
        actual=api['paths'][op['path']][op['method']];service=op['profile']=='service';ws=op['path'].endswith('/events')
        expected={'serviceMtls':[]} if service else {'wsTicketHeader':[]} if ws else {'humanBearer':[]}
        if not service and op['method'] in ('post','delete'):expected['csrfHeader']=[]
        check('认证AND关系:'+op['operation_id'],actual['security'],[expected])
        check('逐释放复核:'+op['operation_id'],actual['x-release-recheck-required'])
    for service,canonical,label in [(False,False,'human'),(True,False,'service_status'),(True,True,'canonical')]:
        reg,sub,ctx,req=F.fixture(service,canonical)
        repeated,new=reg.create(copy.deepcopy(req),dict(ctx,new_capacity=False),'unused')
        check(label+'创建查原',repeated is sub and not new)
        bad=copy.deepcopy(req);bad['owner']=ctx['owner'];denied(label+'禁止自报owner',lambda:reg.create(bad,ctx,'other'))
        attach,applied=F.baseline(sub,ctx)
        check(label+'基线ACK非manifest',sub.view['ack_payload_digest']!=F.HEX)
        initial=sub.attempts['attempt']['response']
        check(label+'同连接attach重复',sub.attach(attach,'socket-1',ctx,F.channel(sub,ctx))==initial)
        denied(label+'attempt换socket拒绝',lambda:sub.attach(attach,'socket-2',ctx,F.channel(sub,ctx)))
        check(label+'applied重复',sub.applied(applied,'socket-1',ctx),'duplicate')
        frame=F.data(sub);sub.sent(frame,'socket-1',ctx)
        check(label+'数据仍reconcile',frame['delivery_mode'],'reconcile')
        before=copy.deepcopy(sub.__dict__);bad=F.ack(sub,frame);bad['cursor']=M.inc(frame['cursor'])
        denied(label+'ACK未发送拒绝',lambda:sub.ack(bad,'socket-1',ctx));check(label+'拒绝不变更ACK',sub.__dict__==before)
        valid=F.ack(sub,frame);check(label+'推进ACK',sub.ack(valid,'socket-1',ctx),'advanced')
        check(label+'ACK丢失重发',sub.ack(valid,'socket-1',ctx),'duplicate')
        cp=F.checkpoint(sub);sub.sent(cp,'socket-1',ctx)
        check(label+'checkpoint未确认仍catching_up',sub.view['state'],'catching_up')
        sub.ack(F.ack(sub,cp),'socket-1',ctx);check(label+'checkpoint已确认才live',sub.view['state'],'live')
        sub.ack(valid,'socket-1',ctx);check(label+'旧ACK不撤live',sub.view['state'],'live')
        live=F.data(sub);sub.sent(live,'socket-1',ctx)
        # 数据已收到但ACK丢失，重连只允许服务端已确认水位。
        resume=dict(cursor=sub.view['ack_cursor'],payload_digest=sub.view['ack_payload_digest'],ack_kind=sub.ack_kind())
        replacement=F.attach(sub,ctx,'replacement',resume)
        oldbinding=copy.deepcopy(sub.view['binding']);sub.attach(replacement,'socket-2',ctx,F.channel(sub,ctx))
        check(label+'重连不自动live',sub.view['state'],'catching_up')
        denied(label+'旧连接ACK拒绝',lambda:sub.ack(F.ack(sub,live),'socket-1',ctx))
        denied(label+'旧代际页拒绝',lambda:sub.page(oldbinding,'socket-2','snapshot',ctx))
        check(label+'历史attempt只查询',sub.attempt_view('attempt',ctx)['current'],False)
        denied(label+'旧attempt不得复活',lambda:sub.attach(attach,'socket-1',ctx,F.channel(sub,ctx)))
        for field,value in [('authorization_current',False),('credential_current',False),('authorization_revision','2'),
                ('publisher_domain','domain-2'),('service_boot_id','boot-2'),('stream_epoch','new'),('now_tick',100)]:
            denied(label+'释放前失效:'+field,lambda field=field,value=value:sub.release(sub.view['binding'],'socket-2',dict(ctx,**{field:value})))
        denied(label+'新凭据不得借旧socket',lambda:sub.release(sub.view['binding'],'socket-2',dict(ctx,transport_credential_binding='credential-2')))
        denied(label+'分页到期等号',lambda:sub.page(sub.view['binding'],'socket-2','snapshot',dict(ctx,now_tick=30)))
        close_revision=sub.view['revision'];closed=sub.close(close_revision,ctx)
        check(label+'重复关闭',sub.close(close_revision,ctx)==closed)
        same,new=reg.create(req,ctx,'unused');check(label+'重复创建不复活',same.view['state']=='closed' and not new)
        denied(label+'关闭后attach拒绝',lambda:sub.attach(F.attach(sub,ctx,'later'),'socket-3',ctx,F.channel(sub,ctx)))
    # 不共享人员logout与独立服务owner。
    _,human,hctx,_=F.fixture();_,service,sctx,_=F.fixture(True)
    M.logout([human,service],'issuer','issuer-epoch','session')
    check('logout只撤人员',human.view['state']=='revoked' and service.view['state']=='building')
    for field,value in [('csrf_valid',False),('http_authenticated',False),('request_context_current',False),('request_context_id','other'),('permissions',{'status.read'})]:
        reg,sub,ctx,req=F.fixture();denied('创建权限:'+field,lambda field=field,value=value:reg.create(req,dict(ctx,**{field:value}),'other'))
    reg,sub,ctx,req=F.fixture(True,True)
    for field,value in [('seamer_role',False),('canonical_scope_complete',False),('transport','human_ticket')]:
        denied('规范订阅资格:'+field,lambda field=field,value=value:reg.create(req,dict(ctx,**{field:value}),'other'))
    bad=copy.deepcopy(req);bad['request_id']='second';denied('一个consumer一个活跃槽',lambda:reg.create(bad,ctx,'second'))
    for problem in ('future_cursor','no_projection','retention'):
        _,sub,ctx,_=F.fixture();F.baseline(sub,ctx)
        resume=dict(cursor=sub.view['ack_cursor'],payload_digest=sub.view['ack_payload_digest'],ack_kind=sub.ack_kind())
        if problem=='future_cursor':resume['cursor']=M.inc(resume['cursor'])
        if problem=='no_projection':ctx=dict(ctx,projection_preserved=False)
        if problem=='retention':sub.map={}
        request=F.attach(sub,ctx,'bad-resume',resume)
        denied('不能跳尾恢复:'+problem,lambda:sub.attach(request,'socket-2',ctx,F.channel(sub,ctx)))
        check('失去恢复依据锁存:'+problem,sub.view['state'],'resync_required')
    # 实际两个请求按同一个旧预期代际竞争；串行模型只证明CAS判据，非数据库并发。
    _,sub,ctx,_=F.fixture();a=F.attach(sub,ctx,'A');b=F.attach(sub,ctx,'B');sub.attach(a,'A',ctx,F.channel(sub,ctx))
    denied('同旧generation第二附着拒绝',lambda:sub.attach(b,'B',ctx,F.channel(sub,ctx)))
    check('竞争失败保留第一连接',sub.transport,'A')
    sub.view['binding']['connection_generation']=str(M.MAX)
    denied('generation不回绕',lambda:sub.attach(F.attach(sub,ctx,'overflow'),'C',ctx,F.channel(sub,ctx)))
    check('耗尽停止旧连接释放',sub.inhibited)
    denied('耗尽后旧socket不可继续',lambda:sub.release(sub.view['binding'],'A',ctx))
    _,sub,ctx,_=F.fixture();F.baseline(sub,ctx);sub.map.update({str(i):F.HEX for i in range(255)})
    denied('映射容量满拒绝',lambda:sub.sent(F.data(sub),'socket-1',ctx))
    check('容量满锁存失步',sub.view['state'],'resync_required')
    _,sub,ctx,_=F.fixture();F.baseline(sub,ctx)
    for field,value,reason in [('payload_digest','0'*64,'payload_digest'),('previous_cursor','0','chain'),('delivery_mode','live','delivery_mode')]:
        frame=F.data(sub);frame[field]=value;before=copy.deepcopy(sub.__dict__)
        denied_code('有效结构的错数据:'+field,lambda frame=frame:sub.sent(frame,'socket-1',ctx),reason)
        check('错数据不推进链:'+field,sub.__dict__==before)
    frame=F.data(sub);frame['entry']['payload']=B.load(B.ROOT.parent/'event-projection/source/snapshot-cases.json')['records']['devices']
    frame['payload_digest']=M.digest(frame['entry'])
    denied_code('正确摘要仍不能越collection',lambda:sub.sent(frame,'socket-1',ctx),'collection_outside_scope')
    frame=F.data(sub)
    denied_code('当前selector撤销',lambda:sub.sent(frame,'socket-1',dict(ctx,content_authorized=False)),'content_selector')
    sub.sent(frame,'socket-1',ctx)
    for field,value,reason in [('payload_digest','0'*64,'ack_mapping'),('ack_kind','durable_ingest','ack_kind')]:
        request=F.ack(sub,frame);request[field]=value;before=copy.deepcopy(sub.__dict__)
        denied_code('有效结构的错ACK:'+field,lambda request=request:sub.ack(request,'socket-1',ctx),reason)
        check('错ACK不释放pin:'+field,sub.__dict__==before)
    wrong=copy.deepcopy(sub.view['snapshot_ref']);wrong['manifest_digest']='0'*64
    request=dict(schema_version=B.VERSION,type='client.snapshot.applied',binding=copy.deepcopy(sub.view['binding']),snapshot=wrong)
    denied_code('错快照不能确认',lambda:sub.applied(request,'socket-1',ctx),'snapshot_mismatch')
    _,sub,ctx,_=F.fixture();sub.publish(dict(snapshot_id='snapshot',manifest_digest=F.HEX,snapshot_cursor='1'),30,ctx)
    denied_code('过期快照附着不能半提交',lambda:sub.attach(F.attach(sub,ctx),'socket-1',dict(ctx,now_tick=30),F.channel(sub,ctx)),'snapshot_expired')
    check('附着失败代际未分配',sub.view['binding']['connection_generation'],'0')
    check('附着失败不留attempt',sub.attempts,{})
    check('过期原快照锁存失步',sub.view['state'],'resync_required')
    # 人员票据绑定具体订阅并一次消费；服务只提供契约token。
    _,sub,ctx,_=F.fixture();channel=F.channel(sub,ctx);token='leafseamer.contract.'+F.SELECTION['contract_id']+'.'+F.SELECTION['contract_digest'][7:]
    binding=dict(channel=channel,authorization_revision='1',scope_digest=sub.view['binding']['scope_digest'],origin=ctx['origin'],expires_at='2026-10-27T00:00:10Z',consumed=False)
    secret='synthetic_ticket_1234567890';protocols=[token,'leafseamer.ticket.'+secret]
    ticket=M.Ticket(secret,binding,10);echo,ready=ticket.consume(protocols,sub,ctx)
    check('只回显契约token',echo,token);M.validate('channel__Ready',ready)
    denied('101丢失票据仍已消费',lambda:ticket.consume(protocols,sub,ctx))
    for key,value in [('subscription_id','other'),('service_boot_id','other')]:
        wrong=copy.deepcopy(binding);wrong['channel'][key]=value;t=M.Ticket(secret,wrong,10)
        denied('票据不能错绑:'+key,lambda:t.consume(protocols,sub,ctx));check('错绑未消费:'+key,t.binding['consumed'],False)
    denied('票据截止等号',lambda:M.Ticket(secret,binding,10).consume(protocols,sub,dict(ctx,now_tick=10)))
    check('服务握手无人员票据',M.negotiate([token],'service_mtls',F.SELECTION),(token,None))
    denied('服务不得走人员票据',lambda:M.negotiate(protocols,'service_mtls',F.SELECTION))
    denied('人员缺票据',lambda:M.negotiate([token],'human_ticket',F.SELECTION))
    samples=F.examples();ready=samples['server_frames'][0];attach=samples['client_frames'][0]
    order=M.ClientOrder(ready['channel'],token,5)
    check('新Ready首帧',order.receive(ready,0),'transport_ready_only');order.send(attach)
    check('附着确认绑定',order.receive(samples['server_frames'][1],0),'attached_only')
    order.send(samples['client_frames'][1]);check('声明应用后数据',order.receive(samples['server_frames'][2],0),'bound_frame_only')
    check('重复attached不回退状态',order.receive(samples['server_frames'][1],0),'duplicate_ignored')
    for frame in samples['server_frames'][1:]:
        client=M.ClientOrder(ready['channel'],token,5)
        denied('不能抢在Ready之前:'+frame['type'],lambda frame=frame,client=client:client.receive(frame,0))
        check('首帧错误永久关闭:'+frame['type'],client.state,'closed')
    client=M.ClientOrder(ready['channel'],token,5)
    denied('Ready截止等号',lambda:client.receive(ready,5));check('Ready过期关闭',client.state,'closed')
    client=M.ClientOrder(ready['channel'],token,5);denied('不能先发送attach',lambda:client.send(attach))
    client=M.ClientOrder(ready['channel'],token,5);client.receive(ready,0);client.send(attach)
    client.receive(samples['server_frames'][1],0)
    denied('未应用快照不能收data',lambda:client.receive(samples['server_frames'][2],0))
    client=M.ClientOrder(ready['channel'],token,5);client.receive(ready,0)
    denied('重复Ready拒绝',lambda:client.receive(ready,0))
    check('入口未自动广告',api['x-advertisable'],False)
    return dict(format='event-channel-check/1',all_passed=True,approved=False,runtime_ready=False,models=len(d),operations=15,
        cases_passed=len(results),checks=results,runtime_tests_executed=0,browser_tests_executed=0,device_tests_executed=0,
        database_concurrency_tests_executed=0,inputs=inputs())


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);g=p.add_mutually_exclusive_group();g.add_argument('--examples',action='store_true');g.add_argument('--report',action='store_true');g.add_argument('--check-report',action='store_true');a=p.parse_args()
    if a.examples:(B.ROOT/'examples.json').write_bytes(B.C.encode(F.examples()))
    elif a.check_report:
        r=B.load(B.ROOT/'report.json');assert r['all_passed'] and r['inputs']==inputs();print(json.dumps(dict(all_passed=True,bindings=len(r['inputs']))))
    else:
        r=run()
        if a.report:(B.ROOT/'report.json').write_bytes(B.C.encode(r))
        print(json.dumps({k:v for k,v in r.items() if k not in ('checks','inputs')},ensure_ascii=False))
