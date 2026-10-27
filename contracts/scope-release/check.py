"""局部释放门的SQLite、线程顺序和本机socket检查；不执行产品服务。"""
import argparse
import copy
import json
from pathlib import Path
import socket
import sys
import threading
import uuid
sys.path.insert(0,str(Path(__file__).resolve().parent))
import gate as G
import fixtures as F

AUTHORITY=dict(authority_service_id='controller',database_instance_id='database',authority_role='controller')


class Sink:
    def __init__(self,mode='full',before=None):self.mode=mode;self.payloads=[];self.before=before
    def write_once(self,payload):
        if self.before:self.before()
        if self.mode=='blocked':raise BlockingIOError()
        if self.mode=='unknown':self.payloads.append(payload);raise OSError('synthetic observation loss')
        if self.mode=='partial':self.payloads.append(payload[:1]);return 1
        if self.mode=='zero':return 0
        if self.mode=='invalid':return True
        if self.mode=='blocked_partial':raise BlockingIOError(11,'synthetic partial buffer',1)
        self.payloads.append(payload);return len(payload)


def inputs():
    files=[p for p in G.ROOT.iterdir() if p.is_file() and p.name!='report.json']
    files += [G.SDK/p for p in G.S.G.load(G.ROOT/'sources.json')['inputs']]
    return {p.relative_to(G.SDK).as_posix():G.checksum(p.read_bytes()) for p in sorted(set(files))}


def local_pair():
    """显式超时的回环连接，禁止平台socketpair初始化无限等待。"""
    left=socket.socket();listener=socket.socket()
    try:
        left.settimeout(2);listener.settimeout(2)
        listener.bind(('127.0.0.1',0));listener.listen(1);left.connect(listener.getsockname())
        right,_=listener.accept();return left,right
    except BaseException:left.close();raise
    finally:listener.close()


def run(work):
    work.mkdir(parents=True,exist_ok=False);checks=[]
    def check(name,value,expected=True):
        assert value==expected,(name,value,expected);checks.append(dict(name=name,passed=True))
    def denied(name,fn,reason):
        try:fn()
        except ValueError as error:check(name,str(error),reason)
        else:raise AssertionError(name+':应拒绝')
    class Fixture:
        def __init__(self,file=None,limit=16):
            self.f=F.fixture();self.tick=[0];self.gate=G.Gate('owner_epoch',lambda:self.tick[0],max_items=limit)
            self.db=G.S.connect(file or ':memory:',journal='WAL' if file else 'DELETE',authority=AUTHORITY)
            self.store=G.S.Store(self.db,AUTHORITY)
            self.store.install('profile',self.f['profile'],G.R.reference(self.f['profile']))
            for i,body in enumerate(self.f['selectors']):self.store.install('selector_'+str(i),body,G.R.reference(body))
            self.ctx=copy.deepcopy(self.f['ctx']);self.ctx.update(content_authorized=True,transport_credential_binding='credential')
            self.binding=dict(owner_epoch='owner_epoch',subscription_id='subscription',connection_generation='1',transport_id='transport',credential_binding='credential')
            self.handle=self.open()
        def open(self):return self.gate.open(self.store,self.f['scope'],self.f['purpose'],self.f['grant'],self.ctx,self.binding)
        def reader(self,digest):return G.CurrentRead(self.f['grant'],self.ctx,self.binding,digest)
        def release(self,ticket,sink,reader=None):return self.gate.release(self.handle,ticket,self.store,reader or self.reader,sink)
        def close(self):self.db.close()
    f=Fixture()
    try:
        payload=b'{"synthetic":"fixed release bytes"}\n';sink=Sink(before=lambda:check('出口没有数据库事务',f.db.in_transaction,False))
        a=f.gate.enqueue(f.handle,payload);b=f.gate.enqueue(f.handle,b'second')
        denied('不允许跳过FIFO',lambda:f.release(b,sink),'not_queue_head')
        check('完整写入状态',f.release(a,sink)['status'],'handed_off')
        check('精确字节交付',sink.payloads,[payload])
        denied('已消费ticket不重发',lambda:f.release(a,sink),'not_queue_head')
        check('第二项顺序交付',f.release(b,Sink())['status'],'handed_off')
        check('队列容量回收',f.gate.state(f.handle)['queued_bytes'],0)
        denied('同owner不复用transport',f.open,'transport_reused')
        denied('远端样式对象不是handle',lambda:f.gate.enqueue(object(),b'x'),'foreign_handle')
        denied('可变字节拒绝',lambda:f.gate.enqueue(f.handle,bytearray(b'x')),'payload_size_or_type')
        denied('过大正文拒绝',lambda:f.gate.enqueue(f.handle,b'x'*262145),'payload_size_or_type')
        for _ in range(16):f.gate.enqueue(f.handle,b'x')
        denied('队列有界',lambda:f.gate.enqueue(f.handle,b'x'),'queue_capacity')
        f.gate.close(f.handle);check('关闭丢弃全部待发',f.gate.state(f.handle)['queued'],0)
        denied('关闭后入队拒绝',lambda:f.gate.enqueue(f.handle,b'x'),'channel_closed')
    finally:f.close()
    for mode,status in [('partial','partial_closed'),('zero','partial_closed'),('unknown','indeterminate'),('invalid','indeterminate'),('blocked_partial','indeterminate')]:
        f=Fixture();sink=Sink(mode)
        try:
            a=f.gate.enqueue(f.handle,b'abcdef');f.gate.enqueue(f.handle,b'later')
            check(mode+'结果',f.release(a,sink)['status'],status)
            check(mode+'丢弃余项',f.gate.state(f.handle)['queued'],0)
            denied(mode+'禁止自动续发',lambda:f.release(a,sink),'channel_closed')
        finally:f.close()
    f=Fixture()
    try:
        a=f.gate.enqueue(f.handle,b'blocked');sink=Sink('blocked')
        check('背压不释放',f.release(a,sink),dict(status='would_block',bytes_accepted=0))
        check('背压保留原队首',f.gate.state(f.handle)['queued'],1)
        f.tick[0]=100
        denied('背压重试重核到期',lambda:f.release(a,Sink()),'authority_expired')
        check('到期清队列',f.gate.state(f.handle)['queued'],0)
    finally:f.close()
    for label,mutate,reason in [
        ('凭据失效',lambda f:setattr(f,'ctx',dict(f.ctx,credential_current=False)),'authority_unavailable'),
        ('内容授权失效',lambda f:setattr(f,'ctx',dict(f.ctx,content_authorized=False)),'content_not_authorized'),
        ('凭据换接',lambda f:setattr(f,'ctx',dict(f.ctx,transport_credential_binding='other')),'credential_binding'),
        ('服务重启',lambda f:setattr(f,'ctx',dict(f.ctx,service_boot_id='other')),'runtime_binding_changed'),
        ('运行域换接',lambda f:setattr(f,'ctx',dict(f.ctx,publisher_domain='other')),'runtime_binding_changed'),
        ('日志世代变化',lambda f:setattr(f,'ctx',dict(f.ctx,stream_epoch='other')),'runtime_binding_changed'),
        ('连接代际变化',lambda f:f.binding.update(connection_generation='2'),'binding_changed'),
        ('进程epoch变化',lambda f:f.binding.update(owner_epoch='other'),'binding_changed')]:
        f=Fixture();sink=Sink()
        try:
            a=f.gate.enqueue(f.handle,b'guarded');mutate(f)
            denied(label,lambda:f.release(a,sink),reason);check(label+'无字节',sink.payloads,[])
        finally:f.close()
    f=Fixture()
    try:
        a=f.gate.enqueue(f.handle,b'body')
        denied('批准摘要不能替换正文',lambda:f.release(a,Sink(),lambda _:f.reader('0'*64)),'payload_authority')
    finally:f.close()
    f=Fixture()
    try:
        a=f.gate.enqueue(f.handle,b'body');f.tick[0]=50
        def expire(digest):f.tick[0]=100;return f.reader(digest)
        denied('预检后到期在出口拒绝',lambda:f.release(a,Sink(),expire),'release_expired')
    finally:f.close()
    f=Fixture()
    try:
        a=f.gate.enqueue(f.handle,b'body');f.tick[0]=50
        check('先建立时间下界',f.release(a,Sink('blocked'))['status'],'would_block');f.tick[0]=49
        denied('时钟倒退关闭owner',lambda:f.release(a,Sink()),'clock_invalid')
        check('时钟异常不保留队列',f.gate.state(f.handle)['queued'],0)
        denied('停止owner不重开',f.open,'owner_stopped')
    finally:f.close()
    f=Fixture()
    try:
        a=f.gate.enqueue(f.handle,b'body')
        def failed_clock():raise OSError('synthetic clock unavailable')
        f.gate.clock=failed_clock
        denied('时钟读取失败关闭owner',lambda:f.release(a,Sink()),'clock_invalid')
        check('时钟读取失败清队列',f.gate.state(f.handle)['queued'],0)
    finally:f.close()
    for fault in ('none','fail_after','lose_observation'):
        f=Fixture();ref=G.R.reference(f.f['profile']);a=f.gate.enqueue(f.handle,b'body')
        try:
            if fault=='none':result=f.gate.revoke(f.store,'revoke',ref);check('撤销同时有关闭切点和回执',result['storage_receipt']['status'],'committed')
            else:
                try:f.gate.revoke(f.store,'revoke',ref,**{fault:1 if fault=='fail_after' else True})
                except (G.S.InjectedFailure,G.S.CommitObservationLost):check(fault+'实际异常',True)
                else:raise AssertionError(fault)
            check(fault+'门保持关闭',f.gate.state(f.handle)['closed'],'reference_invalidated')
            denied(fault+'旧队首不释放',lambda:f.release(a,Sink()),'channel_closed')
            f.binding['transport_id']='replacement'
            denied(fault+'原Ref不重开',f.open,'reference_blocked')
            check(fault+'持久撤销事实',f.store.object(ref)['revoked'],fault!='fail_after')
        finally:f.close()
    # 在数据库授权读取中途关闭：返回旧结果也不能越过generation切点。
    f=Fixture();a=f.gate.enqueue(f.handle,b'body')
    try:
        def close_during_read(digest):f.gate.close(f.handle);return f.reader(digest)
        denied('预检中关闭不释放',lambda:f.release(a,Sink(),close_during_read),'channel_closed')
    finally:f.close()
    # 两个真实线程共享同一Gate；每个线程创建自己的SQLite连接。
    f=Fixture(work/'ordering.sqlite');started=threading.Event();finish=threading.Event();closed=threading.Event();attempted=threading.Event()
    results={};errors=[];a=f.gate.enqueue(f.handle,b'ordered')
    def sender():
        db=G.S.connect(work/'ordering.sqlite',journal='WAL',initialize=False)
        try:
            def at_sink():
                assert not db.in_transaction;started.set();assert finish.wait(5)
            results['send']=f.gate.release(f.handle,a,G.S.Store(db,AUTHORITY),f.reader,Sink(before=at_sink))
        except BaseException as error:errors.append(repr(error))
        finally:db.close()
    def closer():
        attempted.set()
        try:results['close']=f.gate.close(f.handle);closed.set()
        except BaseException as error:errors.append(repr(error))
    t=threading.Thread(target=sender);u=threading.Thread(target=closer)
    try:
        t.start();assert started.wait(5);u.start();assert attempted.wait(5)
        check('已进出口时关闭尚未确认',closed.is_set(),False);finish.set();t.join(5);u.join(5)
        check('双线程有界完成',t.is_alive() or u.is_alive(),False);check('线程无错误',errors,[])
        check('出口先行切点早于关闭',results['send']['cut']<results['close']['cut'])
        check('已交付不伪称撤回',results['send']['status'],'handed_off')
    finally:finish.set();t.join(5);u.join(5);f.close()
    f=Fixture();sink=Sink();a=f.gate.enqueue(f.handle,b'never sent')
    try:
        u=threading.Thread(target=lambda:f.gate.close(f.handle));u.start();u.join(5);assert not u.is_alive()
        denied('关闭先行不调用出口',lambda:f.release(a,sink),'channel_closed');check('关闭先行无字节',sink.payloads,[])
    finally:f.close()
    # 真实本机明文socket验证精确字节；不代表HTTP/WS/TLS适配器验收。
    f=Fixture();left,right=local_pair();right.settimeout(2)
    try:
        payload=b'synthetic local socket payload';a=f.gate.enqueue(f.handle,payload)
        check('真实非阻塞socket交付',f.release(a,G.SocketSink(left))['status'],'handed_off')
        received=b''
        while len(received)<len(payload):
            part=right.recv(len(payload)-len(received));assert part,'unexpected EOF';received+=part
        check('真实socket精确字节',received,payload)
        a=f.gate.enqueue(f.handle,b'blocked mode');sink=G.SocketSink(left);left.setblocking(True)
        check('拒绝被改回阻塞的出口',f.release(a,sink)['status'],'indeterminate')
        f.gate.stop();denied('owner停止不复用旧handle',lambda:f.gate.enqueue(f.handle,b'x'),'owner_stopped')
    finally:left.close();right.close();f.close()
    return dict(format='scope-release-check/1',all_passed=True,approved=False,runtime_ready=False,cases_passed=len(checks),checks=checks,
        local_thread_order_scenarios=2,local_plain_socket_scenarios=1,sqlite_file_scenarios=1,
        product_runtime_tests_executed=0,authentication_tests_executed=0,http_ws_tls_tests_executed=0,
        browser_tests_executed=0,device_tests_executed=0,process_crash_tests_executed=0,power_loss_tests_executed=0,
        scope='局部Python出口顺序及真实SQLite/线程/明文socket；可信提供者为合成，产品适配与跨进程唯一出口未验',inputs=inputs())


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);group=parser.add_mutually_exclusive_group()
    group.add_argument('--report',action='store_true');group.add_argument('--check-report',action='store_true');parser.add_argument('--work',type=Path)
    args=parser.parse_args()
    if args.check_report:
        if args.work:parser.error('--check-report不创建测试目录')
        r=G.S.G.load(G.ROOT/'report.json');assert r['all_passed'] and r['inputs']==inputs()
        print(json.dumps(dict(all_passed=True,bindings=len(r['inputs']))))
    else:
        r=run(args.work or G.SDK/'logs/scope-release-tests'/uuid.uuid4().hex)
        if args.report:(G.ROOT/'report.json').write_bytes(G.S.G.C.encode(r))
        print(json.dumps({k:v for k,v in r.items() if k not in ('checks','inputs')},ensure_ascii=False))
