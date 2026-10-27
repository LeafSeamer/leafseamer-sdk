"""真实SQLite注册与固定订阅模型的接线检查；传输使用显式合成接收器。"""
import argparse
import copy
from dataclasses import replace
import json
from pathlib import Path
import sys
import threading
import uuid
from jsonschema.exceptions import ValidationError
sys.path.insert(0,str(Path(__file__).resolve().parent))
import bridge as B
import fixtures as F
M=B.M;R=B.R;S=B.S;O=B.O
AUTHORITY=dict(authority_service_id='controller',database_instance_id='database',authority_role='controller')


def inputs():
    paths=[p for p in B.ROOT.iterdir() if p.is_file() and p.name!='report.json']
    paths += [B.G.SDK/p for p in S.G.load(B.ROOT/'sources.json')['inputs']]
    return {p.relative_to(B.G.SDK).as_posix():B.G.checksum(p.read_bytes()) for p in sorted(set(paths))}


class Sink:
    def __init__(self,mode='full'):self.mode=mode;self.calls=[]
    def write_once(self,payload):
        self.calls.append(payload)
        if self.mode=='block':raise BlockingIOError()
        if self.mode=='unknown':raise OSError('synthetic')
        if self.mode=='partial':return len(payload)-1
        if self.mode=='zero':return 0
        if self.mode=='boolean':return True
        return len(payload)


class Case:
    def __init__(self,work,service=False,canonical=False):
        self.f=F.fixture(service,canonical);self.tick=0;self.current_hook=None;self.body_hook=None;self.bodies={}
        self.ctx=dict(self.f['ctx'],transport_credential_binding='credential',snapshot_complete=True,content_authorized=True)
        self.grant=self.f['grant']
        # 本包的来源记录属于当前合成发布实例；旧包的独立示例原件保持不变。
        for key in ('source_key','binding_ref','baseline_ref'):
            self.f['source']['view'][key].update(authority_service_id='controller',database_instance_id='database')
        name=uuid.uuid4().hex;dbpath=work/(name+'.sqlite');locks=work/(name+'_locks')
        db=S.connect(dbpath,journal='WAL',authority=AUTHORITY);store=S.Store(db,AUTHORITY)
        try:
            store.install('profile',self.f['profile'],R.reference(self.f['profile']))
            for i,s in enumerate(self.f['selectors']):store.install('selector_'+str(i),s,R.reference(s))
            O.initialize_layout(db,locks)
        finally:db.close()
        self.owner=O.Owner(dbpath,locks,AUTHORITY,'owner',lambda:self.tick)
        try:
            bound,_=self.owner.store.authorize_at_writer(self.f['scope'],self.f['purpose'],self.grant,self.ctx)
            sub=M.Subscription('subscription',bound,self.f['scope'],self.f['purpose'])
            sub.publish(dict(snapshot_id='snapshot',manifest_digest='a'*64,snapshot_cursor='9007199254740993'),30,bound)
            binding=sub.view['binding']
            request=dict(schema_version=M.B.VERSION,type='client.attach',owner=copy.deepcopy(bound['owner']),
                **{k:binding[k] for k in ('subscription_id','stream_id','stream_epoch','scope_digest','authorization_revision')},
                expected_connection_generation='0',replace_existing=True,resume=None,connection_attempt_id='attempt')
            channel=dict(binding_id='channel',selection=copy.deepcopy(bound['selection']),publisher_service_id='controller',
                publisher_database_instance_id='database',service_boot_id=bound['service_boot_id'],owner=copy.deepcopy(bound['owner']),
                subscription_id='subscription' if not service else None,transport=bound['transport'])
            sub.attach(request,'transport',bound,channel)
            sub.applied(dict(schema_version=M.B.VERSION,type='client.snapshot.applied',binding=copy.deepcopy(sub.view['binding']),
                             snapshot=copy.deepcopy(sub.view['snapshot_ref'])),'transport',bound)
            self.original=sub
            self.session=B.Session(self.owner,sub,self.current,self.read_body)
        except Exception:self.owner.close();raise
    def current(self):
        if self.current_hook:self.current_hook()
        return self.grant,self.ctx
    def read_body(self,digest):
        if self.body_hook:self.body_hook()
        return self.bodies[digest]
    def body(self,frame,facts):
        body=B.FrameBody(copy.deepcopy(frame),{k:self.ctx[k] for k in B.ORIGIN},copy.deepcopy(facts))
        self.bodies[R.digest(frame)]=body
        return frame
    def data(self,previous=None,mode=None,record=None):
        state=self.session.state();previous=previous or state['last_sent']
        record=copy.deepcopy(record or self.f['command']);cursor=M.inc(previous)
        entry=dict(entry_kind='entity.upsert',payload=record)
        frame=dict(format_version='snapshot-projection/0.2.0-draft.1',type='server.data',binding=state['subscription']['binding'],
            cursor=cursor,previous_cursor=previous,delivery_mode=mode or ('live' if state['subscription']['state']=='live' else 'reconcile'),
            entry=entry,payload_digest=M.digest(entry))
        return self.body(frame,F.candidate(record,cursor,current=True))
    def checkpoint(self,previous=None):
        state=self.session.state();previous=previous or state['last_sent'];snapshot=state['subscription']['snapshot_ref']['snapshot_id']
        frame=dict(schema_version=M.B.VERSION,type='server.sync.ready',binding=state['subscription']['binding'],
            baseline_snapshot_id=snapshot,cursor=M.inc(previous),previous_cursor=previous,
            payload_digest=M.digest(dict(entry_kind='sync.ready',payload=dict(baseline_snapshot_id=snapshot))),delivery_mode='reconcile')
        return self.body(frame,dict(baseline_snapshot_id=snapshot,through_cursor=previous))
    def ack(self,frame):
        return dict(schema_version=M.B.VERSION,type='client.ack',binding=copy.deepcopy(frame['binding']),cursor=frame['cursor'],
            payload_digest=frame['payload_digest'],ack_kind='durable_ingest' if self.f['purpose']=='canonical_trigger' else 'projection_applied')
    def close(self):self.owner.close()
    def __enter__(self):return self
    def __exit__(self,*args):self.close()


def run(work):
    work.mkdir(parents=True,exist_ok=False);checks=[];scenarios=0
    def check(name,value,expected=True):
        assert value==expected,(name,value,expected);checks.append(dict(name=name,passed=True))
    def denied(name,fn,reason=None):
        try:fn()
        except (ValueError,KeyError,ValidationError) as e:
            if reason is not None:check(name,str(e),reason)
            else:check(name,True)
        else:raise AssertionError(name+':应拒绝')
    for service,canonical in ((False,False),(True,False),(True,True)):
        scenarios+=1
        with Case(work,service,canonical) as c:
            label=('规范' if canonical else '服务' if service else '人员');s=c.session;before=s.state();f=c.data()
            t=s.enqueue(f);check(label+'入队不推进发送',s.state()['last_sent'],before['last_sent'])
            check(label+'入队不登记已交付映射',s.state()['delivered'],before['delivered'])
            block=Sink('block');check(label+'阻塞可重试',s.release(t,block)['status'],'would_block')
            check(label+'阻塞不推进ACK',s.state()['subscription']['ack_cursor'],before['subscription']['ack_cursor'])
            check(label+'阻塞保留队首',s.state()['gate']['queued'],1)
            sink=Sink();check(label+'完整出口',s.release(t,sink)['status'],'handed_off')
            check(label+'完整字节',sink.calls,[S.raw(f).encode('utf8')]);check(label+'完整出口推进发送',s.state()['last_sent'],f['cursor'])
            check(label+'出口不伪造ACK',s.state()['subscription']['ack_cursor'],before['subscription']['ack_cursor'])
            check(label+'当前ACK推进',s.ack(c.ack(f)),'advanced');check(label+'重复ACK',s.ack(c.ack(f)),'duplicate')
            check(label+'外部原订阅副本不受改写',c.original.last_sent,before['last_sent'])
            cp=c.checkpoint();ct=s.enqueue(cp);s.release(ct,Sink())
            check(label+'屏障交付仍在补齐',s.state()['subscription']['state'],'catching_up')
            check(label+'屏障ACK后进入实时',s.ack(c.ack(cp)),'advanced');check(label+'实时状态',s.state()['subscription']['state'],'live')
            live=c.data();lt=s.enqueue(live);s.release(lt,Sink());check(label+'实时帧ACK',s.ack(c.ack(live)),'advanced')
            check(label+'传输阶段无数据库事务',c.owner.db.in_transaction,False)
    scenarios+=1
    with Case(work) as c:
        f=c.data();c.session.enqueue(f);before=c.session.state()
        denied('未交付帧不能ACK',lambda:c.session.ack(c.ack(f)),'ack_unsent')
        check('未交付ACK不改游标',c.session.state()['subscription'],before['subscription'])
        check('错误ACK关闭出口',c.session.state()['usable'],False)
    scenarios+=1
    with Case(work) as c:
        a=c.data();b=c.data(previous=a['cursor']);ta=c.session.enqueue(a);tb=c.session.enqueue(b)
        c.session.release(ta,Sink());c.session.ack(c.ack(a));c.session.release(tb,Sink())
        check('ACK后重建队列影子保持链',c.session.state()['last_sent'],b['cursor'])
        check('后一帧未ACK不跨越确认',c.session.state()['subscription']['ack_cursor'],a['cursor'])
    for mode in ('partial','zero','unknown','boolean'):
        scenarios+=1
        with Case(work) as c:
            f=c.data();g=c.data(previous=f['cursor']);t=c.session.enqueue(f);c.session.enqueue(g);before=c.session.state();sink=Sink(mode)
            result=c.session.release(t,sink)
            check(mode+'失败类别',result['status'],'partial_closed' if mode in ('partial','zero') else 'indeterminate')
            check(mode+'不推进发送',c.session.state()['last_sent'],before['last_sent']);check(mode+'清空整队列',c.session.state()['gate']['queued'],0)
            denied(mode+'不重发后缀',lambda:c.session.release(t,sink),'not_queue_head')
            check(mode+'仅一次出口',len(sink.calls),1)
    scenarios+=1
    with Case(work) as c:
        f=c.data();t=c.session.enqueue(f);c.session.release(t,Sink('block'))
        c.ctx['credential_current']=False;sink=Sink()
        denied('阻塞后重试重核资格',lambda:c.session.release(t,sink),'authority_unavailable')
        check('资格变化没有出口字节',sink.calls,[])
    for mutation in ('entity','epoch','origin','history','body','cursor','digest','connection','checkpoint'):
        scenarios+=1
        with Case(work) as c:
            f=c.checkpoint() if mutation=='checkpoint' else c.data();body=c.bodies[R.digest(f)]
            facts=copy.deepcopy(body.facts);origin=copy.deepcopy(body.origin)
            if mutation=='entity':f['entry']['payload']['entity_id']='outside';facts['record']=copy.deepcopy(f['entry']['payload'])
            if mutation=='epoch':facts['record']['entity_epoch']='other'
            if mutation=='origin':origin['publisher_database_instance_id']='other'
            if mutation=='history':
                f['cursor']='9007199254740999';facts.update(journal_cursor=f['cursor'],current=False,unresolved=False)
            if mutation=='body':body=replace(body,frame=dict(f,cursor='999'))
            if mutation=='cursor':facts['journal_cursor']='0'
            if mutation=='digest':f['payload_digest']='0'*64
            if mutation=='connection':f['binding']['connection_generation']='9'
            if mutation=='checkpoint':facts['through_cursor']='0'
            if mutation=='entity':f['payload_digest']=M.digest(f['entry'])
            c.bodies[R.digest(f)]=replace(body,frame=body.frame if mutation=='body' else copy.deepcopy(f),facts=facts,origin=origin)
            before=c.session.state();denied(mutation+'正文变异拒绝',lambda:c.session.enqueue(f))
            check(mutation+'正文变异不改交付历史',c.session.state()['delivered'],before['delivered'])
    scenarios+=1
    with Case(work) as c:
        f=c.data();t=c.session.enqueue(f);body=c.bodies[R.digest(f)];c.bodies[R.digest(f)]=replace(body,origin={})
        sink=Sink();denied('入队后正文来源改变',lambda:c.session.release(t,sink),'body_origin');check('正文改变无字节',sink.calls,[])
    scenarios+=1
    with Case(work) as c:
        cp=c.checkpoint();c.session.enqueue(cp)
        denied('同步屏障ACK前禁止后续排队',lambda:c.session.enqueue(c.data(previous=cp['cursor'])),'checkpoint_ack_required')
    for phase in ('enqueue','release','ack'):
        scenarios+=1
        with Case(work) as c:
            f=c.data();t=c.session.enqueue(f)
            if phase=='ack':c.session.release(t,Sink())
            before=c.session.state();ref=R.reference(c.f['profile'])
            # 真线程只执行同步关门，不跨线程共用SQLite连接。
            def cut():
                thread=threading.Thread(target=lambda:c.owner.gate.invalidate_ref(ref));thread.start();thread.join(2)
                assert not thread.is_alive()
            c.current_hook=cut;sink=Sink()
            fn=(lambda:c.session.enqueue(c.data(previous=f['cursor']))) if phase=='enqueue' else (lambda:c.session.release(t,sink)) if phase=='release' else (lambda:c.session.ack(c.ack(f)))
            denied(phase+'重读期间撤权拒绝',fn,'channel_closed')
            check(phase+'撤权不推进确认',c.session.state()['subscription']['ack_cursor'],before['subscription']['ack_cursor'])
            check(phase+'撤权后无出口',sink.calls,[])
    scenarios+=1
    with Case(work) as c:
        f=c.data();t=c.session.enqueue(f);c.owner.revoke('deny',R.reference(c.f['profile']))
        sink=Sink();denied('持久撤销接入帧出口',lambda:c.session.release(t,sink),'channel_closed')
        check('持久撤销旧队列无出口',sink.calls,[])
    scenarios+=1
    with Case(work) as c:
        f=c.data();t=c.session.enqueue(f);c.tick=100;sink=Sink()
        denied('过期帧不能交付',lambda:c.session.release(t,sink),'authority_expired');check('过期无字节',sink.calls,[])
    scenarios+=1
    with Case(work) as c:
        f=c.data();t=c.session.enqueue(f);c.session.release(t,Sink());before=c.session.state()
        c.body_hook=lambda:None
        c.current_hook=lambda:setattr(c,'tick',100)
        denied('ACK重读后期限到达',lambda:c.session.ack(c.ack(f)),'state_expired')
        check('最终期限拒绝不推进ACK',c.session.state()['subscription'],before['subscription'])
    scenarios+=1
    with Case(work) as c:
        f=c.data();record=copy.deepcopy(f['entry']['payload']);f['entry']=dict(entry_kind='entity.remove',payload={k:record[k] for k in ('entity_kind','entity_id','entity_epoch','entity_revision')})
        f['entry']['payload']['reason']='left_scope';f['payload_digest']=M.digest(f['entry']);c.body(f,F.candidate(record,f['cursor'],current=True))
        t=c.session.enqueue(f);c.session.release(t,Sink());check('原身份移除帧可交付',c.session.ack(c.ack(f)),'advanced')
    for mutate in (None,'authority','source_epoch','sequence','member','purpose','json_type'):
        scenarios+=1
        with Case(work,True,mutate!='purpose') as c:
            source=copy.deepcopy(c.f['source']);key=copy.deepcopy(source['view']['source_key'])
            payload=dict(source_key=key,event_id='event',source_sequence='7',trigger_id='trigger',capability_version='1',
                occurred_at=None,observed_at='2026-10-27T00:00:00.000Z',origin_digest='a'*64,
                age_evidence_ref=copy.deepcopy(source['view']['binding_ref']),
                payload=dict(value=True,schema_ref=dict(schema_id='synthetic.payload',definition='value',schema_digest='a'*64)))
            if mutate=='authority':key['authority_service_id']='other'
            if mutate=='source_epoch':key['source_epoch']='other'
            if mutate=='sequence':payload['source_sequence']='8'
            if mutate=='member':source['entity_id']='other'
            f=c.data();f['entry']=dict(entry_kind='source.event',payload=payload);f['payload_digest']=M.digest(f['entry']);c.body(f,dict(source_record=source))
            if mutate=='json_type':c.bodies[R.digest(f)].frame['entry']['payload']['payload']['value']=1
            if mutate:
                reason={'authority':'source_binding','source_epoch':'source_binding','sequence':'source_not_contiguous',
                        'member':'source_outside_scope','purpose':'canonical_required','json_type':'body_mismatch'}[mutate]
                denied('规范事件'+mutate+'拒绝',lambda:c.session.enqueue(f),reason)
            else:
                t=c.session.enqueue(f);c.session.release(t,Sink());check('规范事件durable ACK',c.session.ack(c.ack(f)),'advanced')
    scenarios+=1
    with Case(work) as c:
        f=c.data();t=c.session.enqueue(f);original=c.owner.gate.release
        def handoff_then_close(*args):
            result=original(*args)
            thread=threading.Thread(target=lambda:c.owner.gate.invalidate_ref(R.reference(c.f['profile'])))
            thread.start();thread.join(2);assert not thread.is_alive()
            return result
        c.owner.gate.release=handoff_then_close
        check('完整交付后撤权仍返回实际交付',c.session.release(t,Sink())['status'],'handed_off')
        check('关闭不抹去已经发送的历史',c.session.state()['last_sent'],f['cursor'])
        check('关闭后保留历史不代表可发送',c.session.state()['usable'],False)
        denied('关闭后不能推进ACK',lambda:c.session.ack(c.ack(f)),'channel_closed')
    scenarios+=1
    with Case(work) as c:
        f=c.data();t=c.session.enqueue(f)
        denied('同一订阅generation不能重复注册',lambda:B.Session(c.owner,c.original,c.current,c.read_body),'generation_reused')
        check('重复注册不影响原出口',c.session.state()['usable'])
        new=copy.deepcopy(c.original);ctx,_=c.owner.store.authorize_at_writer(c.f['scope'],c.f['purpose'],c.grant,c.ctx)
        request=copy.deepcopy(new.attempts['attempt']['request'])
        request.update(expected_connection_generation='1',connection_attempt_id='replacement',resume=dict(
            cursor=new.view['ack_cursor'],payload_digest=new.view['ack_payload_digest'],ack_kind=new.ack_kind()))
        channel=dict(binding_id='channel2',selection=ctx['selection'],publisher_service_id='controller',publisher_database_instance_id='database',
            service_boot_id=ctx['service_boot_id'],owner=ctx['owner'],subscription_id='subscription',transport=ctx['transport'])
        ctx['projection_preserved']=True;new.attach(request,'replacement_transport',ctx,channel)
        replacement=B.Session(c.owner,new,c.current,c.read_body)
        check('替换连接先关闭旧出口',c.session.state()['usable'],False)
        check('替换连接清除旧队列',c.session.state()['gate']['queued'],0)
        check('新generation可以使用',replacement.state()['usable'])
        sink=Sink();denied('旧ticket替换后无效',lambda:c.session.release(t,sink),'not_queue_head')
        check('旧ticket不会写入新传输',sink.calls,[])
    scenarios+=1
    with Case(work) as c:
        c.owner.gate.max_items=1;f=c.data();c.session.enqueue(f)
        denied('出口排队容量拒绝',lambda:c.session.enqueue(c.data(previous=f['cursor'])),'queue_capacity')
        check('容量拒绝清空旧排队',c.session.state()['gate']['queued'],0)
    scenarios+=1
    with Case(work) as c:
        f=c.data();t=c.session.enqueue(f);c.session.release(t,Sink());a=c.ack(f);a['ack_kind']='durable_ingest'
        denied('人员订阅拒绝durable ACK',lambda:c.session.ack(a),'ack_kind')
    scenarios+=1
    with Case(work) as c:
        f=c.data();t=c.session.enqueue(f);errors=[]
        def foreign():
            try:c.session.release(t,Sink())
            except ValueError as e:errors.append(str(e))
        thread=threading.Thread(target=foreign);thread.start();thread.join(2);assert not thread.is_alive()
        check('外线程不能访问owner数据库',errors,['owner_thread_required'])
        check('外线程拒绝不损坏有效出口',c.session.state()['usable'])
    return dict(format='channel-release-check/1',all_passed=True,approved=False,runtime_ready=False,cases_passed=len(checks),checks=checks,
        sqlite_file_scenarios=scenarios,thread_invalidation_scenarios=4,
        product_runtime_tests_executed=0,authentication_tests_executed=0,http_ws_tls_tests_executed=0,
        browser_tests_executed=0,device_tests_executed=0,power_loss_tests_executed=0,
        scope='真实SQLite与内存订阅状态的参考接线；出口为合成接收器，未证明生产传输、页完整性或消费端落库',inputs=inputs())


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);g=p.add_mutually_exclusive_group();g.add_argument('--report',action='store_true');g.add_argument('--check-report',action='store_true');p.add_argument('--work',type=Path)
    a=p.parse_args()
    if a.check_report:
        r=S.G.load(B.ROOT/'report.json');assert r['all_passed'] and r['inputs']==inputs();print(json.dumps(dict(all_passed=True,bindings=len(r['inputs']))))
    else:
        r=run(a.work or B.G.SDK/'logs/channel-release-tests'/uuid.uuid4().hex)
        if a.report:(B.ROOT/'report.json').write_bytes(S.G.C.encode(r))
        print(json.dumps({k:v for k,v in r.items() if k not in ('checks','inputs')},ensure_ascii=False))
