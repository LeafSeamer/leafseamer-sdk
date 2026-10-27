"""增量消费、墓碑和确认原子边界的SQLite检查。"""
import argparse
import copy
import importlib.util
import json
from pathlib import Path
import sqlite3
import sys
import threading
import uuid
sys.path.insert(0,str(Path(__file__).resolve().parent))
import projection as P
C=P.C;R=P.R;S=P.S;M=P.M
spec=importlib.util.spec_from_file_location('snapshot_cases',P.ROOT.parent/'snapshot-consumer/check.py')
F=importlib.util.module_from_spec(spec);spec.loader.exec_module(F)


def inputs():
    paths=[p for p in P.ROOT.iterdir() if p.is_file() and p.name!='report.json']
    paths += [C.B.G.SDK/p for p in S.G.load(P.ROOT/'sources.json')['inputs']]
    return {p.relative_to(C.B.G.SDK).as_posix():C.B.G.checksum(p.read_bytes()) for p in sorted(set(paths))}


def frame(client,record,kind='entity.upsert',reason='left_scope'):
    view=client.view();payload=copy.deepcopy(record)
    if kind=='entity.remove':payload={k:payload[k] for k in ('entity_kind','entity_id','entity_epoch','entity_revision')};payload['reason']=reason
    entry=dict(entry_kind=kind,payload=payload)
    return dict(format_version=C.VERSION,type='server.data',binding=copy.deepcopy(client.snapshot._expected['delivery_binding']),
        cursor=M.inc(view['cursor']),previous_cursor=view['cursor'],delivery_mode='live' if view['phase']=='live' else 'reconcile',entry=entry,payload_digest=R.digest(entry))


def checkpoint(client):
    view=client.view();sid=client.snapshot._expected['snapshot_ref']['snapshot_id']
    return dict(schema_version=M.B.VERSION,type='server.sync.ready',binding=copy.deepcopy(client.snapshot._expected['delivery_binding']),
        cursor=M.inc(view['cursor']),previous_cursor=view['cursor'],delivery_mode='reconcile',baseline_snapshot_id=sid,
        payload_digest=R.digest(dict(entry_kind='sync.ready',payload=dict(baseline_snapshot_id=sid))))


def snapshot(db):return {t:db.execute('SELECT * FROM '+t+' ORDER BY 1,2').fetchall() for t in C.TABLES+P.TABLES}


def run(work):
    work.mkdir(parents=True,exist_ok=False);checks=[];files=0
    def check(name,value,expected=True):
        assert value==expected,(name,value,expected);checks.append(dict(name=name,passed=True))
    def denied(name,fn,reason,error=ValueError):
        try:fn()
        except error as e:check(name,str(e),reason)
        else:raise AssertionError(name+':应拒绝')
    def setup(kinds=F.CONTROLLER,**capacity):
        nonlocal files
        files+=1;path=work/(str(files)+'.sqlite');db=C.connect(path);tick=[0];consumer=C.Consumer(db,'main',lambda:tick[0]);p=F.packet(kinds)
        F.begin(consumer,p);F.download(consumer,p);consumer.apply();client=P.Projection(consumer,'status_projection',**capacity)
        return path,db,client,tick
    for kinds in (F.CONTROLLER,F.SEAMER):
        path,db,c,tick=setup(kinds)
        try:
            initial=c.view()
            for record in initial['records']:
                changed=copy.deepcopy(record);changed['entity_revision']='2';f=frame(c,changed);ack=c.receive(C.canonical(f));M.validate('channel__ClientAck',ack)
                check(record['entity_kind']+'确认类型',ack['ack_kind'],'projection_applied')
                current=next(r for r in c.view()['records'] if r['entity_kind']==record['entity_kind'])
                check(record['entity_kind']+'完整投影更新',current,changed)
                before=snapshot(db);check(record['entity_kind']+'重复帧查原',c.receive(C.canonical(f)),ack);check(record['entity_kind']+'查原无写入',snapshot(db),before)
            cp=checkpoint(c);ack=c.receive(C.canonical(cp));check('同步检查点后实时',c.view()['phase'],'live')
            check('同步检查点重复确认',c.receive(C.canonical(cp)),ack)
            check('高位游标未浮点化',int(c.view()['cursor'])>9007199254740992)
        finally:db.close()
    path,db,c,tick=setup()
    try:
        r=c.view()['records'][0];new=copy.deepcopy(r);new['entity_revision']='3';c.receive(C.canonical(frame(c,new)))
        old=copy.deepcopy(r);old['entity_revision']='2';f=frame(c,old);c.receive(C.canonical(f))
        check('旧修订不覆盖新状态',c.view()['records'][0]['entity_revision'],'3')
        check('忽略旧修订仍推进连续交付',c.view()['cursor'],f['cursor'])
        remove=frame(c,new,'entity.remove');c.receive(C.canonical(remove));check('同修订移除不保留可见记录',len(c.view()['records']),5)
        replay=frame(c,new);c.receive(C.canonical(replay));check('同修订迟到更新不能复活',len(c.view()['records']),5)
        new['entity_revision']='4';c.receive(C.canonical(frame(c,new)));check('离开范围后更高修订可重新显示',len(c.view()['records']),6)
        c.receive(C.canonical(frame(c,new,'entity.remove','deleted')));before=snapshot(db)
        new['entity_revision']='5';denied('删除身份不能靠更高修订复活',lambda:c.receive(C.canonical(frame(c,new))),'deleted_identity')
        check('永久删除冲突不改数据库',snapshot(db),before);denied('协议冲突关闭可见投影',c.view,'consumer_inactive')
    finally:db.close()
    for mutation in ('digest','binding','predecessor','mode','epoch','same_revision','same_cursor','checkpoint','collection'):
        path,db,c,tick=setup()
        try:
            record=c.view()['records'][0];f=frame(c,record);reason=''
            if mutation=='digest':f['payload_digest']='0'*64;reason='payload_digest'
            if mutation=='binding':f['binding']['connection_generation']='2';reason='delivery_binding'
            if mutation=='predecessor':f['previous_cursor']='0';reason='delivery_chain'
            if mutation=='mode':f['delivery_mode']='live';reason='delivery_mode'
            if mutation=='epoch':f['entry']['payload']['entity_epoch']='other';reason='entity_epoch_reused'
            if mutation=='same_revision':
                # catalogs的SchemaRef接受不同合法摘要，实体修订相同仍应冲突。
                f['entry']['payload']['view']['catalog_ref']['content_digest']='b'*64;reason='revision_conflict'
            if mutation=='same_cursor':
                c.receive(C.canonical(f));f['previous_cursor']='0';reason='cursor_conflict'
            if mutation=='checkpoint':f=checkpoint(c);f['baseline_snapshot_id']='other';reason='checkpoint_snapshot'
            if mutation=='collection':
                other=F.packet(F.SEAMER)['pages'][0]['content']['records'][0];f=frame(c,other);reason='collection_outside_scope'
            if mutation in ('epoch','same_revision'):f['payload_digest']=R.digest(f['entry'])
            before=snapshot(db);denied(mutation+'拒绝',lambda:c.receive(C.canonical(f)),reason);check(mutation+'保持提交前状态',snapshot(db),before)
        finally:db.close()
    for fault in (1,2,3):
        path,db,c,tick=setup()
        try:
            r=copy.deepcopy(c.view()['records'][0]);r['entity_revision']='2';f=frame(c,r);before=snapshot(db)
            denied('写集故障'+str(fault),lambda:c.receive(C.canonical(f),fail_after=fault),str(fault),C.InjectedFailure)
            check('写集回滚'+str(fault),snapshot(db),before)
            ack=c.receive(C.canonical(f));check('原帧故障重试'+str(fault),ack['cursor'],f['cursor'])
        finally:db.close()
    path,db,c,tick=setup()
    try:
        r=copy.deepcopy(c.view()['records'][0]);r['entity_revision']='2';f=frame(c,r)
        observer=sqlite3.connect(path,isolation_level=None,timeout=0);seen=[]
        try:
            def observe(step):
                revision=observer.execute('SELECT revision FROM dp_object WHERE generation=? AND kind=? AND entity_id=?',(c.gen,r['entity_kind'],r['entity_id'])).fetchone()[0]
                cursor=observer.execute('SELECT cursor FROM dp_head WHERE generation=?',(c.gen,)).fetchone()[0]
                receipt=observer.execute('SELECT count(*) FROM dp_delivery WHERE generation=?',(c.gen,)).fetchone()[0]
                seen.append((revision,cursor,receipt))
            c.receive(C.canonical(f),after_step=observe)
            check('第二连接无部分投影或提前ACK',seen,[('1',f['previous_cursor'],0)]*3)
        finally:observer.close()
        next_frame=frame(c,r);denied('提交观察丢失不返回ACK',lambda:c.receive(C.canonical(next_frame),lose_observation=True),'commit_observation_lost',C.ObservationLost)
        before=snapshot(db);ack=c.receive(C.canonical(next_frame));check('观察丢失按原帧查原',ack['cursor'],next_frame['cursor']);check('查原不重放投影',snapshot(db),before)
        restored=P.Projection(c.snapshot,'status_projection');check('同有效基线重建不重置游标',restored.view(),c.view())
    finally:db.close()
    for what in ('expiry','revocation','replacement','capacity','bytes'):
        capacity=dict(max_frames=1) if what=='capacity' else dict(max_history_bytes=1) if what=='bytes' else {}
        path,db,c,tick=setup(**capacity)
        try:
            f=frame(c,c.view()['records'][0]);reason=''
            if what=='expiry':tick[0]=30;reason='consumer_expired'
            if what=='revocation':
                t=threading.Thread(target=c.snapshot.invalidate);t.start();t.join(2);assert not t.is_alive();reason='consumer_inactive'
            if what=='replacement':
                db2=C.connect(path)
                try:F.begin(C.Consumer(db2,'main',lambda:0),F.packet(snapshot='new'))
                finally:db2.close()
                reason='consumer_replaced'
            if what=='capacity':c.receive(C.canonical(f));f=frame(c,c.view()['records'][0]);reason='delivery_capacity'
            if what=='bytes':reason='history_capacity'
            before=snapshot(db);denied(what+'拒绝确认',lambda:c.receive(C.canonical(f)),reason);check(what+'拒绝不推进数据库',snapshot(db),before)
        finally:db.close()
    path,db,c,tick=setup()
    try:
        before=snapshot(db);denied('规范摄取不能冒充展示消费',lambda:P.Projection(c.snapshot,'canonical_trigger'),'canonical_consumer_required');check('拒绝规范入口无改写',snapshot(db),before)
        f=frame(c,c.view()['records'][0]);before=snapshot(db)
        denied('最终期限复核回滚整帧',lambda:c.receive(C.canonical(f),after_step=lambda _:tick.__setitem__(0,30)),'consumer_expired')
        check('过期没有提前确认',snapshot(db),before)
    finally:db.close()
    path,db,c,tick=setup()
    try:
        f=frame(c,c.view()['records'][0]);db.execute('BEGIN IMMEDIATE')
        denied('不继承外部事务',lambda:c.receive(C.canonical(f)),'nested_transaction')
        check('拒绝后不回滚调用方事务',db.in_transaction)
        db.rollback()
    finally:db.close()
    spec=importlib.util.spec_from_file_location('projection_channel_cases',P.ROOT.parent/'channel-release/check.py')
    upstream=importlib.util.module_from_spec(spec);spec.loader.exec_module(upstream)
    files+=2;db=C.connect(work/'integrated.sqlite');consumer=C.Consumer(db,'integrated',lambda:0)
    try:
        with upstream.Case(work) as producer:
            ctx,_=producer.owner.store.authorize_at_writer(producer.f['scope'],producer.f['purpose'],producer.grant,producer.ctx)
            sub=M.Subscription('projection_subscription',ctx,producer.f['scope'],producer.f['purpose'])
            p=F.packet(('commands','sources'));cb=p['manifest']['binding'];cb.update({k:v for k,v in sub.view['binding'].items() if k!='connection_generation'})
            cb['projection_profile_ref']=copy.deepcopy(producer.f['scope']['projection_profile_ref'])
            delivery=copy.deepcopy(sub.view['binding']);delivery['connection_generation']='1'
            p['expected'].update(content_binding=copy.deepcopy(cb),delivery_binding=delivery)
            for page in p['pages']:page['content']['binding']=copy.deepcopy(cb);page['delivery_binding']=copy.deepcopy(delivery)
            F.seal(p);sub.publish(p['expected']['snapshot_ref'],30,ctx)
            request=dict(schema_version=M.B.VERSION,type='client.attach',owner=ctx['owner'],
                **{k:sub.view['binding'][k] for k in ('subscription_id','stream_id','stream_epoch','scope_digest','authorization_revision')},
                expected_connection_generation='0',replace_existing=True,resume=None,connection_attempt_id='projection_attempt')
            channel=dict(binding_id='projection_channel',selection=ctx['selection'],publisher_service_id=ctx['publisher_service_id'],
                publisher_database_instance_id=ctx['publisher_database_instance_id'],service_boot_id=ctx['service_boot_id'],owner=ctx['owner'],
                subscription_id='projection_subscription',transport=ctx['transport'])
            sub.attach(request,'projection_transport',ctx,channel);F.begin(consumer,p);F.download(consumer,p)
            sub.applied(consumer.apply(),'projection_transport',ctx)
            producer.session=C.B.Session(producer.owner,sub,producer.current,producer.read_body);client=P.Projection(consumer,'status_projection')
            for name in ('reconcile','checkpoint','live'):
                data=producer.checkpoint() if name=='checkpoint' else producer.data()
                ticket=producer.session.enqueue(data);sink=upstream.Sink();producer.session.release(ticket,sink)
                ack=client.receive(sink.calls[0]);check(name+'实际消费ACK被服务端接受',producer.session.ack(ack),'advanced')
                check(name+'两端游标一致',client.view()['cursor'],producer.session.state()['subscription']['ack_cursor'])
                before=snapshot(db);check(name+'丢失ACK重投返回同结果',client.receive(sink.calls[0]),ack)
                check(name+'重投不重写投影',snapshot(db),before)
            check('完整链路双端进入实时',client.view()['phase']==producer.session.state()['subscription']['state']=='live')
    finally:db.close()
    return dict(format='projection-delta-check/1',all_passed=True,approved=False,runtime_ready=False,cases_passed=len(checks),checks=checks,
        entity_kinds=12,sqlite_file_scenarios=files,atomic_failure_points=3,sqlite_tables=len(P.TABLES),
        product_runtime_tests_executed=0,authentication_tests_executed=0,browser_tests_executed=0,device_tests_executed=0,power_loss_tests_executed=0,
        scope='状态投影增量及projection_applied确认事务；不实现规范触发inbox或durable_ingest确认',inputs=inputs())


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);g=p.add_mutually_exclusive_group();g.add_argument('--report',action='store_true');g.add_argument('--check-report',action='store_true');p.add_argument('--work',type=Path);a=p.parse_args()
    if a.check_report:
        r=S.G.load(P.ROOT/'report.json');assert r['all_passed'] and r['inputs']==inputs();print(json.dumps(dict(all_passed=True,bindings=len(r['inputs']))))
    else:
        r=run(a.work or C.B.G.SDK/'logs/projection-delta-tests'/uuid.uuid4().hex)
        if a.report:(P.ROOT/'report.json').write_bytes(S.G.C.encode(r))
        print(json.dumps({k:v for k,v in r.items() if k not in ('checks','inputs')},ensure_ascii=False))
