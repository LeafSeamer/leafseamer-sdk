"""快照消费与原子投影替换的合成检查。"""
import argparse
import copy
import json
import importlib.util
from pathlib import Path
import sqlite3
import sys
import threading
import uuid
sys.path.insert(0,str(Path(__file__).resolve().parent))
import consumer as C
R=C.R;S=C.S;M=C.M
CONTROLLER=('devices','catalogs','commands','controls','observations','sources')
SEAMER=('definitions','runs','business_states','executions','schedule_activations','occurrences','sources')


def inputs():
    paths=[p for p in C.ROOT.iterdir() if p.is_file() and p.name!='report.json']
    paths += [C.B.G.SDK/p for p in S.G.load(C.ROOT/'sources.json')['inputs']]
    return {p.relative_to(C.B.G.SDK).as_posix():C.B.G.checksum(p.read_bytes()) for p in sorted(set(paths))}


def seal(packet):
    m=packet['manifest'];pages=packet['pages']
    m['pages']=[dict(page_index=i,content_bytes=len(C.canonical(p['content'])),content_digest=R.digest(p['content'])) for i,p in enumerate(pages)]
    m['page_count']=len(pages);m['total_content_bytes']=sum(x['content_bytes'] for x in m['pages'])
    m['manifest_digest']=R.digest({k:v for k,v in m.items() if k!='manifest_digest'})
    packet['expected']['snapshot_ref']=dict(snapshot_id=m['binding']['snapshot_id'],manifest_digest=m['manifest_digest'],snapshot_cursor=m['snapshot_cursor'])
    for p,d in zip(pages,m['pages']):p.update(manifest_digest=m['manifest_digest'],content_digest=d['content_digest'])


def packet(kinds=CONTROLLER,empty=False,snapshot='snapshot'):
    data=S.G.load(C.ROOT.parent/'event-projection/source/snapshot-cases.json')['records']
    data['commands']=S.G.load(C.ROOT.parent/'event-projection/examples.json')['records']['queued']
    records=sorted([copy.deepcopy(data[k]) for k in kinds] if not empty else [],key=C.identity)
    ref=dict(authority_service_id='controller',database_instance_id='database',entity_kind='projection_profile',entity_id='profile',entity_epoch='epoch',revision='1',content_digest='a'*64)
    cb=dict(snapshot_id=snapshot,subscription_id='subscription',publisher_service_id='controller',publisher_database_instance_id='database',
        stream_id='stream',stream_epoch='stream_epoch',scope_digest='b'*64,authorization_revision='1',projection_profile_ref=ref,
        publisher_domain_ref=dict(clock_domain_id='clock_'+'c'*64,descriptor_digest='sha256:'+'d'*64))
    delivery={k:v for k,v in cb.items() if k not in ('snapshot_id','projection_profile_ref','publisher_domain_ref')};delivery['connection_generation']='1'
    mapping=R.assets()['mapping.json'];schemas={k:dict(schema_id=mapping['source_graph_id'],definition=mapping['collection_models'][k],schema_digest=mapping['source_graph_digest']) for k in kinds}
    watermarks=[dict(source_key=r['view']['source_key'],binding_ref=r['view']['binding_ref'],baseline_sequence=r['view']['contiguous_sequence'],
        source_state_revision=r['entity_revision'],baseline_ref=r['view']['baseline_ref'],gap_summary=r['view']['gaps']) for r in records if r['entity_kind']=='sources']
    m=dict(format_version=C.VERSION,binding=cb,snapshot_cursor='9007199254740993',collections=[dict(entity_kind=k,count='0' if empty else '1',view_schema_ref=schemas[k]) for k in sorted(kinds)],
        source_watermarks=watermarks,pages=[],page_count=1,total_content_bytes=0,created_at='2026-10-27T00:00:00Z',expires_at='2026-10-27T00:00:30Z',manifest_digest='0'*64)
    chunks=[records[i:i+3] for i in range(0,len(records),3)] or [[]]
    pages=[dict(manifest_digest='0'*64,content_digest='0'*64,delivery_binding=copy.deepcopy(delivery),content=dict(format_version=C.VERSION,binding=copy.deepcopy(cb),
        page_index=i,next_page_index=i+1 if i+1<len(chunks) else None,records=chunk)) for i,chunk in enumerate(chunks)]
    result=dict(manifest=m,pages=pages,expected=dict(content_binding=copy.deepcopy(cb),delivery_binding=delivery,snapshot_ref={},schemas=schemas,deadline_tick=30))
    seal(result);return result


def begin(c,p):return c.start(p['expected'],C.canonical(p['manifest']))
def download(c,p):
    for page in p['pages']:c.page(C.canonical(page))
def rows(db):return {t:db.execute('SELECT * FROM '+t+' ORDER BY 1').fetchall() for t in C.TABLES}


def run(work):
    work.mkdir(parents=True,exist_ok=False);checks=[];files=0
    def check(name,value,expected=True):
        assert value==expected,(name,value,expected);checks.append(dict(name=name,passed=True))
    def denied(name,fn,reason=None,error=ValueError):
        try:fn()
        except error as e:check(name,str(e),reason) if reason is not None else check(name,True)
        else:raise AssertionError(name+':应拒绝')
    def setup():
        nonlocal files
        files+=1;path=work/(str(files)+'.sqlite');db=C.connect(path);tick=[0]
        return path,db,C.Consumer(db,'main',lambda:tick[0]),tick
    for label,kinds,empty in [('Controller',CONTROLLER,False),('Seamer',SEAMER,False),('空集合',CONTROLLER,True)]:
        path,db,c,tick=setup()
        try:
            p=packet(kinds,empty);gen=begin(c,p)
            denied(label+'部分页不可见',c.view,'projection_not_applied')
            for page in reversed(p['pages']):check(label+'乱序页暂存'+str(page['content']['page_index']),c.page(C.canonical(page)),'staged')
            check(label+'重复页幂等',c.page(C.canonical(p['pages'][0])),'duplicate')
            ack=c.apply();M.validate('channel__SnapshotApplied',ack)
            check(label+'完整投影数量',len(c.view()),0 if empty else len(kinds))
            check(label+'大整数游标保留',ack['snapshot']['snapshot_cursor'],'9007199254740993')
            before=rows(db);check(label+'重复应用返回原确认',c.apply(),ack);check(label+'重复应用无新增写入',rows(db),before)
            c.invalidate();denied(label+'关闭后投影隐藏',c.view,'consumer_inactive');denied(label+'关闭后不返回确认',c.apply,'consumer_inactive')
            check(label+'关闭保留已提交历史',db.execute('SELECT count(*) FROM sp_receipt').fetchone()[0],1)
        finally:db.close()
    path,db,c,tick=setup()
    try:
        p=packet();begin(c,p);c.page(C.canonical(p['pages'][-1]))
        denied('末页不能替代完整集合',c.apply,'pages_incomplete');check('缺页无确认记录',db.execute('SELECT count(*) FROM sp_receipt').fetchone()[0],0)
        c.page(C.canonical(p['pages'][0]));check('补齐后可以确认',c.apply()['type'],'client.snapshot.applied')
    finally:db.close()
    for mutation in ('binding','generation','digest','next','duplicate_key','expired','revoke'):
        path,db,c,tick=setup()
        try:
            p=packet();begin(c,p);page=copy.deepcopy(p['pages'][0]);reason=None
            if mutation=='binding':page['content']['binding']['stream_epoch']='other';reason='content_binding'
            if mutation=='generation':page['delivery_binding']['connection_generation']='2';reason='delivery_binding'
            if mutation=='digest':page['content']['records'][0]['entity_revision']='2';reason='page_digest'
            if mutation=='next':page['content']['next_page_index']=None;reason='page_layout'
            if mutation=='expired':tick[0]=30;reason='consumer_expired'
            if mutation=='revoke':
                thread=threading.Thread(target=c.invalidate);thread.start();thread.join(2);assert not thread.is_alive();reason='consumer_inactive'
            raw=C.canonical(page)
            if mutation=='duplicate_key':raw=b'{"manifest_digest":"x",'+raw[1:]
            denied(mutation+'下载拒绝',lambda:c.page(raw),reason)
            check(mutation+'拒绝不产生暂存页',db.execute('SELECT count(*) FROM sp_page').fetchone()[0],0)
        finally:db.close()
    for mutation in ('duplicate_entity','wrong_count','missing_collection','schema','watermark','source_frontier','record_order','double_epoch','manifest_digest','cursor'):
        path,db,c,tick=setup()
        try:
            p=packet();m=p['manifest'];pages=p['pages'];expected=p['expected'];phase='apply'
            if mutation=='duplicate_entity':pages[1]['content']['records'].append(copy.deepcopy(pages[0]['content']['records'][0]));reason='entity_order_or_duplicate'
            if mutation=='wrong_count':m['collections'][0]['count']='2';reason='collection_count'
            if mutation=='missing_collection':m['collections'].pop();phase='start';reason='collection_set'
            if mutation=='schema':m['collections'][0]['view_schema_ref']=dict(m['collections'][0]['view_schema_ref'],definition='Other');phase='start';reason='collection_schema'
            if mutation=='watermark':m['source_watermarks']=[];reason='source_watermarks'
            if mutation=='source_frontier':
                next(r for pg in pages for r in pg['content']['records'] if r['entity_kind']=='sources')['view']['contiguous_sequence']='9';reason='source_frontier'
            if mutation=='record_order':pages[0]['content']['records'].reverse();reason='entity_order_or_duplicate'
            if mutation=='double_epoch':
                record=copy.deepcopy(pages[0]['content']['records'][0]);record['entity_epoch']='zz';pages[0]['content']['records'].insert(1,record);reason='entity_epoch_reused'
            seal(p)
            if mutation=='manifest_digest':m['manifest_digest']='0'*64;phase='start';reason='manifest_digest'
            if mutation=='cursor':expected['snapshot_ref']['snapshot_cursor']='3';phase='start';reason='snapshot_cursor'
            if phase=='start':denied(mutation+'清单拒绝',lambda:begin(c,p),reason)
            else:
                begin(c,p);download(c,p);denied(mutation+'整包拒绝',c.apply,reason)
            check(mutation+'不生成确认',db.execute('SELECT count(*) FROM sp_receipt').fetchone()[0],0)
        finally:db.close()
    # 每条记录、确认行和活动指针之后故障，都必须保持同一完整preimage。
    for fault in range(1,len(CONTROLLER)+3):
        path,db,c,tick=setup()
        try:
            p=packet();begin(c,p);download(c,p);before=rows(db)
            denied('原子写集故障'+str(fault),lambda:c.apply(fail_after=fault),str(fault),C.InjectedFailure)
            check('原子写集回滚'+str(fault),rows(db),before)
            check('故障后原输入重试'+str(fault),c.apply()['snapshot'],p['expected']['snapshot_ref'])
        finally:db.close()
    path,db,c,tick=setup()
    try:
        first=packet();begin(c,first);download(c,first);c.apply();old=c.view()
        second=packet(empty=True,snapshot='second');begin(c,second);download(c,second)
        observer=sqlite3.connect(path,isolation_level=None,timeout=0);seen=[]
        try:
            def observe(step):
                active=observer.execute('SELECT generation FROM sp_active WHERE slot=?',('main',)).fetchone()[0]
                seen.append(observer.execute('SELECT count(*) FROM sp_record WHERE generation=?',(active,)).fetchone()[0])
            c.apply(after_step=observe)
            check('第二连接提交前只见完整旧投影',seen,[len(old),len(old)])
            check('空快照原子清除原scope',c.view(),[])
        finally:observer.close()
        # 另一个slot使用独立投影，新授权不能清空它。
        other=C.Consumer(db,'other',lambda:tick[0]);p=packet();begin(other,p);download(other,p);other.apply()
        c.invalidate();check('撤销一个slot保留另一个投影',len(other.view()),6)
    finally:db.close()
    path,db,c,tick=setup()
    try:
        p=packet();begin(c,p);download(c,p)
        denied('提交观察丢失不会返回确认',lambda:c.apply(lose_observation=True),'commit_observation_lost',C.ObservationLost)
        denied('观察丢失前不暴露成功投影',c.view,'projection_not_applied')
        before=rows(db);ack=c.apply();check('查原返回准确原快照',ack['snapshot'],p['expected']['snapshot_ref']);check('查原不重放写集',rows(db),before)
        reopened_db=C.connect(path)
        try:
            reopened=C.Consumer(reopened_db,'main',lambda:tick[0]);denied('重建消费者不从库自动恢复授权',reopened.view,'consumer_inactive')
            replacement=packet(snapshot='replacement');begin(reopened,replacement)
            denied('第二连接新代使旧投影不可见',c.view,'consumer_replaced');denied('旧代不能重发已存确认',c.apply,'consumer_replaced')
            download(reopened,replacement);reopened.apply();check('新代投影可见',len(reopened.view()),6)
            check('读取投影不留下事务',reopened_db.in_transaction,False)
        finally:reopened_db.close()
    finally:db.close()
    path,db,c,tick=setup()
    try:
        p=packet();begin(c,p);download(c,p);before=rows(db)
        denied('提交末尾期限再核验',lambda:c.apply(after_step=lambda _:tick.__setitem__(0,30)),'consumer_expired')
        check('最终过期整包回滚',rows(db),before)
        tick[0]=0;denied('单调时钟回退关闭',c.apply,'clock_invalid')
    finally:db.close()
    # 由当前服务端模型接收实际消费器确认，随后经过唯一出口交付第一帧。
    spec=importlib.util.spec_from_file_location('channel_release_cases',C.ROOT.parent/'channel-release/check.py')
    upstream=importlib.util.module_from_spec(spec);spec.loader.exec_module(upstream)
    path,db,c,tick=setup();files+=1
    try:
        with upstream.Case(work) as producer:
            ctx,_=producer.owner.store.authorize_at_writer(producer.f['scope'],producer.f['purpose'],producer.grant,producer.ctx)
            sub=M.Subscription('snapshot_subscription',ctx,producer.f['scope'],producer.f['purpose'])
            p=packet(('commands','sources'));cb=p['manifest']['binding'];cb.update({k:v for k,v in sub.view['binding'].items() if k!='connection_generation'})
            cb['projection_profile_ref']=copy.deepcopy(producer.f['scope']['projection_profile_ref'])
            delivery=copy.deepcopy(sub.view['binding']);delivery['connection_generation']='1'
            p['expected'].update(content_binding=copy.deepcopy(cb),delivery_binding=delivery)
            for page in p['pages']:page['content']['binding']=copy.deepcopy(cb);page['delivery_binding']=copy.deepcopy(delivery)
            seal(p);sub.publish(p['expected']['snapshot_ref'],30,ctx)
            request=dict(schema_version=M.B.VERSION,type='client.attach',owner=ctx['owner'],
                **{k:sub.view['binding'][k] for k in ('subscription_id','stream_id','stream_epoch','scope_digest','authorization_revision')},
                expected_connection_generation='0',replace_existing=True,resume=None,connection_attempt_id='snapshot_attempt')
            channel=dict(binding_id='snapshot_channel',selection=ctx['selection'],publisher_service_id=ctx['publisher_service_id'],
                publisher_database_instance_id=ctx['publisher_database_instance_id'],service_boot_id=ctx['service_boot_id'],owner=ctx['owner'],
                subscription_id='snapshot_subscription',transport=ctx['transport'])
            sub.attach(request,'snapshot_transport',ctx,channel)
            begin(c,p);download(c,p);receipt=c.apply()
            check('消费确认被实际订阅模型接受',sub.applied(receipt,'snapshot_transport',ctx),'baseline_confirmed')
            producer.session=C.B.Session(producer.owner,sub,producer.current,producer.read_body)
            frame=producer.data();ticket=producer.session.enqueue(frame);sink=upstream.Sink()
            check('基线确认后真实接线交付第一帧',producer.session.release(ticket,sink)['status'],'handed_off')
            check('第一帧前驱绑定已应用快照',frame['previous_cursor'],receipt['snapshot']['snapshot_cursor'])
            check('原子应用没有伪造实时状态',producer.session.state()['subscription']['state'],'catching_up')
    finally:db.close()
    return dict(format='snapshot-consumer-check/1',all_passed=True,approved=False,runtime_ready=False,cases_passed=len(checks),checks=checks,
        entity_kinds=12,sqlite_file_scenarios=files,atomic_failure_points=8,sqlite_tables=len(C.TABLES),
        product_runtime_tests_executed=0,authentication_tests_executed=0,browser_tests_executed=0,device_tests_executed=0,power_loss_tests_executed=0,
        scope='真实SQLite快照暂存与原子投影替换；不证明认证、浏览器存储、来源完整性或消费触发事务',inputs=inputs())


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);g=p.add_mutually_exclusive_group();g.add_argument('--report',action='store_true');g.add_argument('--check-report',action='store_true');p.add_argument('--work',type=Path);a=p.parse_args()
    if a.check_report:
        r=S.G.load(C.ROOT/'report.json');assert r['all_passed'] and r['inputs']==inputs();print(json.dumps(dict(all_passed=True,bindings=len(r['inputs']))))
    else:
        r=run(a.work or C.B.G.SDK/'logs/snapshot-consumer-tests'/uuid.uuid4().hex)
        if a.report:(C.ROOT/'report.json').write_bytes(S.G.C.encode(r))
        print(json.dumps({k:v for k,v in r.items() if k not in ('checks','inputs')},ensure_ascii=False))
