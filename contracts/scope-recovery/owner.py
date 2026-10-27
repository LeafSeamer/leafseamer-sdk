"""同库持久拒绝库存与单机进程独占参考；可信提供者及产品传输另行接线。"""
import os
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'scope-release'))
import gate as G
S=G.S
R=G.R
ROOT=Path(__file__).resolve().parent
TABLES=('rg_configuration','rg_session','rg_stop','rg_deny','rg_recovery')


def root_digest(root):return G.checksum(os.path.normcase(str(Path(root).resolve())).encode('utf8'))


def native_path(path):
    value=str(Path(path).resolve())
    if os.name!='nt' or value.startswith('\\\\?\\'):return value
    return '\\\\?\\UNC\\'+value[2:] if value.startswith('\\\\') else '\\\\?\\'+value


class OwnerLock:
    def __init__(self,root,authority):
        root=Path(root).resolve();Path(native_path(root)).mkdir(parents=True,exist_ok=True)
        self.file=open(native_path(root/(R.digest(authority)+'.lock')),'a+b')
        try:
            os.set_inheritable(self.file.fileno(),False)
            self.file.seek(0,2)
            if self.file.tell()==0:self.file.write(b'0');self.file.flush()
            self.file.seek(0)
            if os.name=='nt':
                import msvcrt
                msvcrt.locking(self.file.fileno(),msvcrt.LK_NBLCK,1)
            else:
                import fcntl
                fcntl.flock(self.file.fileno(),fcntl.LOCK_EX|fcntl.LOCK_NB)
        except OSError as error:
            self.file.close();self.file=None;raise ValueError('owner_busy') from error
    def close(self):
        if self.file is not None:
            self.file.close();self.file=None


def initialize_layout(db,lock_root):
    """只用于独立初始化，已有布局不覆盖或重绑锁根。"""
    R.need(not db.in_transaction,'nested_transaction')
    try:
        db.executescript('BEGIN IMMEDIATE;\n'+(ROOT/'recovery.sql').read_text(encoding='utf8'))
        db.execute('INSERT INTO rg_configuration VALUES(1,?,?)',('scope-owner-recovery/1',root_digest(lock_root)))
        db.commit()
    except Exception:
        db.rollback();raise


def denial_id(body):
    return ('revoke_'+G.checksum(body['operation_id'].encode('utf8'))) if body['kind']=='revoke' else 'recovery_'+R.digest(body)


class IntentObservationLost(RuntimeError):pass


class Owner:
    def __init__(self,database,lock_root,authority,epoch,clock,skip_recovery_item=False):
        R.validate('snapshot__Id',epoch)
        for path,digest in S.G.load(ROOT/'sources.json')['inputs'].items():R.need(G.checksum((G.SDK/path).read_bytes())==digest,'source_drift:'+path)
        self.lock=OwnerLock(lock_root,authority);self.db=None;self.gate=None;self.epoch=epoch;self.closed=False;self.tainted=False
        try:
            self.db=S.connect(database,journal='WAL',initialize=False);self.store=S.Store(self.db,authority)
            config=self.db.execute('SELECT * FROM rg_configuration WHERE singleton=1').fetchone()
            R.need(config is not None and config['format']=='scope-owner-recovery/1' and config['lock_root_digest']==root_digest(lock_root),'lock_configuration')
            self.db.execute('BEGIN IMMEDIATE')
            self._validate_inventory()
            R.need(self.db.execute('SELECT 1 FROM rg_session WHERE owner_epoch=?',(epoch,)).fetchone() is None,'owner_epoch_reused')
            old=[r[0] for r in self.db.execute('SELECT owner_epoch FROM rg_session WHERE owner_epoch NOT IN (SELECT owner_epoch FROM rg_stop) AND owner_epoch NOT IN (SELECT previous_owner FROM rg_recovery) ORDER BY ordinal')]
            ordinal=self.db.execute('SELECT coalesce(max(ordinal),0)+1 FROM rg_session').fetchone()[0]
            self.db.execute('INSERT INTO rg_session VALUES(?,?)',(epoch,ordinal))
            inventory=[S.decode(r[0]) for r in self.db.execute('SELECT ref_body FROM sr_object ORDER BY object_key')]
            R.need(len(inventory)<=10000,'recovery_capacity')
            for previous in old:
                for i,ref in enumerate(inventory):
                    self.store.object(ref)
                    if not (skip_recovery_item and i==0):self._insert_denial(dict(format='scope-denial/1',kind='recovery',previous_owner=previous,object_ref=ref))
                self.db.execute('INSERT INTO rg_recovery VALUES(?,?,?,?,?)',(previous,epoch,S.raw(inventory),R.digest(inventory),len(inventory)))
            self._validate_inventory();self.db.commit()
            self.gate=G.Gate(epoch,clock)
            for row in self.db.execute('SELECT body FROM rg_deny'):self.gate.invalidate_ref(S.decode(row[0])['object_ref'])
            self.recovered_owners=old
        except Exception:
            if self.gate is not None:self.gate.stop()
            if self.db is not None:
                if self.db.in_transaction:self.db.rollback()
                self.db.close()
            self.lock.close();self.closed=True;raise

    def _ready(self):R.need(not self.closed and not self.tainted,'owner_unavailable')

    def _validate_body(self,body):
        R.need(body['format']=='scope-denial/1' and body['kind'] in ('revoke','recovery'),'denial_format')
        fields={'format','kind','object_ref'}|({'operation_id','reason'} if body['kind']=='revoke' else {'previous_owner'})
        R.need(set(body)==fields,'denial_fields');self.store.object(body['object_ref'])
        if body['kind']=='revoke':
            R.validate('snapshot__Id',body['operation_id']);R.need(body['reason'] in ('configuration_revoked','retired'),'revocation_reason')
        else:R.need(self.db.execute('SELECT 1 FROM rg_session WHERE owner_epoch=?',(body['previous_owner'],)).fetchone() is not None,'previous_owner_missing')

    def _insert_denial(self,body):
        self._validate_body(body);identity=denial_id(body)
        old=self.db.execute('SELECT body FROM rg_deny WHERE deny_id=?',(identity,)).fetchone()
        if old is not None:R.need(S.decode(old[0])==body,'denial_conflict');return
        self.db.execute('INSERT INTO rg_deny VALUES(?,?,?,?,?,?)',(identity,self.epoch,body['kind'],S.key(body['object_ref']),S.raw(body),R.digest(body)))

    def _validate_inventory(self):
        for row in self.db.execute('SELECT * FROM rg_deny'):
            body=S.decode(row['body']);self._validate_body(body)
            R.need(row['deny_id']==denial_id(body) and row['body_digest']==R.digest(body) and
                   row['kind']==body['kind'] and row['object_key']==S.key(body['object_ref']),'denial_columns')
        for row in self.db.execute('SELECT * FROM rg_recovery'):
            inventory=S.decode(row['inventory']);keys=[S.key(ref) for ref in inventory]
            R.need(len(keys)==len(set(keys))==row['object_count'] and R.digest(inventory)==row['inventory_digest'],'recovery_inventory')
            for ref in inventory:
                body=dict(format='scope-denial/1',kind='recovery',previous_owner=row['previous_owner'],object_ref=ref)
                actual=self.db.execute('SELECT body FROM rg_deny WHERE deny_id=?',(denial_id(body),)).fetchone()
                R.need(actual is not None and S.decode(actual[0])==body,'recovery_denial_missing')
        R.need(not self.db.execute('PRAGMA foreign_key_check').fetchall(),'recovery_foreign_keys')

    def open(self,scope,purpose,grant,context,binding):
        self._ready();return self.gate.open(self.store,scope,purpose,grant,context,binding)

    def revoke(self,operation_id,ref,reason='configuration_revoked',fail_before_intent=False,lose_intent_observation=False,after_intent=None,**storage_faults):
        self._ready();body=dict(format='scope-denial/1',kind='revoke',operation_id=operation_id,object_ref=ref,reason=reason)
        self._validate_body(body);cut=self.gate.invalidate_ref(ref)
        try:
            self.db.execute('BEGIN IMMEDIATE');self._insert_denial(body)
            if fail_before_intent:raise RuntimeError('injected_intent_failure')
            self.db.commit()
            if lose_intent_observation:raise IntentObservationLost(operation_id)
        except Exception:
            if self.db.in_transaction:self.db.rollback()
            self.tainted=True;self.gate.stop();raise
        if after_intent is not None:after_intent()
        receipt=self.store.revoke(operation_id,ref,reason,**storage_faults)
        return dict(local_cut=cut,denial_id=denial_id(body),storage_receipt=receipt)

    def reconcile(self):
        """只按持久原操作查原或补交撤销；不重放设备动作。"""
        self._ready()
        try:return self._reconcile()
        except Exception:
            self.tainted=True;self.gate.stop();raise

    def _reconcile(self):
        results=[]
        for row in self.db.execute("SELECT body FROM rg_deny WHERE kind='revoke' ORDER BY deny_id").fetchall():
            body=S.decode(row[0]);self.gate.invalidate_ref(body['object_ref'])
            existing=self.store.lookup(body['operation_id'])
            expected=dict(format='scope-registry-write/1',action='revoke',operation_id=body['operation_id'],object_ref=body['object_ref'],reason=body['reason'])
            if existing is not None:
                R.need(existing['request_digest']==R.digest(expected),'stored_operation_conflict');results.append(existing)
            elif self.store.object(body['object_ref'])['revoked']:
                results.append(dict(status='already_revoked',operation_id=body['operation_id'],winning_operation=self.store.object(body['object_ref'])['revocation_operation']))
            else:results.append(self.store.revoke(body['operation_id'],body['object_ref'],body['reason']))
        return results

    def close(self):
        if self.closed:return
        healthy=not self.tainted and not self.gate._stopped
        self.gate.stop()
        try:
            if healthy:
                self.db.execute('BEGIN IMMEDIATE');self.db.execute('INSERT INTO rg_stop VALUES(?)',(self.epoch,));self.db.commit()
        finally:
            if self.db.in_transaction:self.db.rollback()
            self.db.close();self.lock.close();self.closed=True
