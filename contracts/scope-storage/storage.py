"""真实SQLite上的注册写集参考；不提供产品服务、认证来源或网络释放保证。"""
import hashlib
from pathlib import Path
import sqlite3
import sys
import rfc8785

ROOT = Path(__file__).resolve().parent
SDK = ROOT.parents[1]
sys.path.insert(0, str(ROOT.parent / 'scope-registry'))
import registry as R
import generate as G

TABLES = ('sr_metadata','sr_object','sr_operation','sr_revocation','sr_audit','sr_outbox','sr_seal')


def raw(value): return rfc8785.dumps(value).decode('utf8')
def key(ref): return raw(list(R.identity(ref)))


def decode(value):
    result = G.C.decode(value.encode('utf8'))
    R.need(raw(result) == value, 'noncanonical_storage')
    return result


def verify_sources():
    sources = G.load(ROOT / 'sources.json')
    for path, checksum in sources['inputs'].items():
        R.need(hashlib.sha256((SDK / path).read_bytes()).hexdigest() == checksum, 'source_drift:' + path)


def connect(path=':memory:', journal='DELETE', initialize=True, authority=None):
    R.need(journal in ('DELETE','WAL'), 'journal_mode')
    if initialize:
        R.need(isinstance(authority, dict) and set(authority) == {'authority_service_id','database_instance_id','authority_role'}, 'bootstrap_authority')
        for field in ('authority_service_id','database_instance_id'): R.validate('snapshot__Id', authority[field])
        R.need(authority['authority_role'] in ('controller','seamer'), 'bootstrap_role')
    db = sqlite3.connect(path, isolation_level=None, timeout=0)
    db.row_factory = sqlite3.Row
    try:
        db.execute('PRAGMA foreign_keys=ON'); db.execute('PRAGMA recursive_triggers=ON'); db.execute('PRAGMA synchronous=FULL')
        mode = db.execute('PRAGMA journal_mode=' + journal).fetchone()[0]
        R.need(mode == ('memory' if str(path) == ':memory:' else journal.lower()), 'journal_configuration')
        R.need(db.execute('PRAGMA foreign_keys').fetchone()[0] == 1 and db.execute('PRAGMA recursive_triggers').fetchone()[0] == 1 and
               db.execute('PRAGMA synchronous').fetchone()[0] == 2, 'database_configuration')
        if initialize:
            db.executescript((ROOT / 'registry.sql').read_text(encoding='utf8'))
            db.execute('INSERT INTO sr_metadata VALUES(1,?,?,?,?)', ('scope-registry-storage/0.1',
                authority['authority_service_id'],authority['database_instance_id'],authority['authority_role']))
        return db
    except Exception:
        db.close(); raise


class InjectedFailure(RuntimeError): pass
class CommitObservationLost(RuntimeError): pass


class Store:
    def __init__(self, db, authority):
        verify_sources(); self.db = db; self.last_steps = []
        R.need(not db.in_transaction and db.execute('PRAGMA foreign_keys').fetchone()[0] == 1 and
               db.execute('PRAGMA recursive_triggers').fetchone()[0] == 1, 'connection_not_ready')
        row = db.execute('SELECT * FROM sr_metadata WHERE singleton=1').fetchone()
        R.need(row is not None and row['format'] == 'scope-registry-storage/0.1' and
               {k:row[k] for k in ('authority_service_id','database_instance_id','authority_role')} == authority, 'database_authority')
        self.authority = dict(authority)

    def _authority(self, ref):
        R.need(all(ref[k] == self.authority[k] for k in ('authority_service_id','database_instance_id')), 'object_authority')

    def _operation(self, operation_id):
        row = self.db.execute('SELECT * FROM sr_operation WHERE operation_id=?', (operation_id,)).fetchone()
        if row is None: return None
        request = decode(row['request_body'])
        self._authority(request['object_ref'])
        R.need(R.digest(request) == row['request_digest'] and request['operation_id'] == operation_id and
               request['action'] == row['action'] and key(request['object_ref']) == row['object_key'], 'operation_columns')
        for table in ('sr_audit','sr_outbox'):
            linked = self.db.execute('SELECT * FROM ' + table + ' WHERE operation_id=?', (operation_id,)).fetchone()
            R.need(linked is not None and all(linked[k] == row[k] for k in ('operation_id','request_digest','object_key','action')), 'incomplete_operation')
        seal = self.db.execute('SELECT request_digest FROM sr_seal WHERE operation_id=?', (operation_id,)).fetchone()
        R.need(seal is not None and seal[0] == row['request_digest'], 'unsealed_operation')
        return request

    def lookup(self, operation_id):
        """None只表示当前读视图中不可见，不能据此断定并发事务已经回滚。"""
        R.validate('snapshot__Id', operation_id)
        request = self._operation(operation_id)
        if request is None: return None
        return dict(format='scope-registry-receipt/1', operation_id=operation_id, action=request['action'],
                    object_ref=request['object_ref'], request_digest=R.digest(request), status='committed')

    def object(self, ref):
        """历史读取保留完整正文及撤销事实，不返回可释放资格。"""
        R.validate('snapshot__ObjectRef', ref)
        self._authority(ref)
        row = self.db.execute('SELECT * FROM sr_object WHERE object_key=?', (key(ref),)).fetchone()
        R.need(row is not None, 'object_missing')
        body = decode(row['body']); stored_ref = decode(row['ref_body'])
        R.validate('registry__Profile' if row['kind'] == 'projection_profile' else 'registry__Selector', body)
        R.need(R.reference(body) == stored_ref == ref and row['content_digest'] == ref['content_digest'] and
               row['kind'] == body['kind'], 'object_columns')
        expected_profile = key(body['profile_ref']) if body['kind'] == 'selector' else None
        R.need(row['profile_key'] == expected_profile and row['profile_kind'] == ('projection_profile' if expected_profile else None), 'profile_columns')
        operation = self._operation(row['install_operation'])
        R.need(operation is not None and operation['action'] == 'install' and operation['body'] == body and operation['object_ref'] == ref, 'install_binding')
        revoked = self.db.execute('SELECT * FROM sr_revocation WHERE object_key=?', (key(ref),)).fetchone()
        if revoked:
            request = self._operation(revoked['operation_id'])
            R.need(request is not None and request['action'] == 'revoke' and request['object_ref'] == ref and
                   request['reason'] == revoked['reason'] and decode(revoked['ref_body']) == ref, 'revocation_binding')
        return dict(body=body, revoked=revoked is not None, install_operation=row['install_operation'],
                    revocation_operation=revoked['operation_id'] if revoked else None)

    def current_registry(self, scope):
        """调用者必须建立一致读事务；其结果只描述该事务的读取点。"""
        R.need(self.db.in_transaction, 'read_transaction_required')
        model = R.Registry(); profile_ref = scope['projection_profile_ref']
        profile = self.object(profile_ref); R.need(not profile['revoked'], 'profile_revoked')
        model.install(profile['body'], profile_ref)
        for collection in scope['collections']:
            ref = collection['selector_ref']; selector = self.object(ref)
            R.need(not selector['revoked'], 'selector_revoked')
            model.install(selector['body'], ref)
        return model

    def authorize_at_writer(self, scope, purpose, grant, ctx, previous_plan=None):
        """新writer切点重读；返回之后仍需最终释放门，不能持数据库锁等待网络。"""
        R.need(not self.db.in_transaction, 'nested_transaction')
        try:
            self.db.execute('BEGIN IMMEDIATE')
            value = R.authorize(self.current_registry(scope), scope, purpose, grant, ctx, previous_plan)
            self.db.commit(); return value
        except Exception:
            if self.db.in_transaction: self.db.rollback()
            raise

    def install(self, operation_id, body, trusted_ref, **faults):
        R.validate('registry__Profile' if body.get('kind') == 'projection_profile' else 'registry__Selector', body)
        return self._apply(dict(format='scope-registry-write/1', action='install', operation_id=operation_id,
                                object_ref=trusted_ref, body=body), **faults)

    def revoke(self, operation_id, ref, reason='configuration_revoked', **faults):
        R.need(reason in ('configuration_revoked','retired'), 'revocation_reason')
        return self._apply(dict(format='scope-registry-write/1', action='revoke', operation_id=operation_id,
                                object_ref=ref, reason=reason), **faults)

    def _apply(self, request, fail_after=None, skip_step=None, lose_observation=False, after_step=None):
        R.validate('snapshot__Id', request['operation_id']); R.validate('snapshot__ObjectRef', request['object_ref'])
        self._authority(request['object_ref'])
        R.need(not self.db.in_transaction, 'nested_transaction')
        operation_id = request['operation_id']; ref = request['object_ref']; object_key = key(ref)
        digest = R.digest(request); self.last_steps = []
        def write(table, values):
            self.last_steps.append(table); index = len(self.last_steps)
            if index != skip_step:
                columns = ','.join(values); placeholders = ','.join('?' for _ in values)
                self.db.execute('INSERT INTO ' + table + '(' + columns + ') VALUES(' + placeholders + ')', tuple(values.values()))
            if index == fail_after: raise InjectedFailure(table)
            if after_step is not None: after_step(index)
        try:
            self.db.execute('BEGIN IMMEDIATE')
            original = self._operation(operation_id)
            if original is not None:
                R.need(original == request, 'operation_conflict')
                receipt = self.lookup(operation_id); self.db.commit(); return receipt
            if request['action'] == 'install':
                body = request['body']; model = R.Registry(); profile_key = None
                if body['kind'] == 'projection_profile': R.need(body['authority_role'] == self.authority['authority_role'], 'profile_role')
                if body['kind'] == 'selector':
                    parent = self.object(body['profile_ref']); R.need(not parent['revoked'], 'profile_revoked')
                    model.install(parent['body'], body['profile_ref']); profile_key = key(body['profile_ref'])
                model.install(body, ref)
                R.need(self.db.execute('SELECT 1 FROM sr_object WHERE object_key=?', (object_key,)).fetchone() is None, 'identity_exists')
                write('sr_object', dict(object_key=object_key, kind=body['kind'], body=raw(body), ref_body=raw(ref),
                    content_digest=ref['content_digest'], profile_key=profile_key,
                    profile_kind='projection_profile' if profile_key else None, install_operation=operation_id))
            else:
                stored = self.object(ref); R.need(not stored['revoked'], 'already_revoked')
                write('sr_revocation', dict(object_key=object_key, operation_id=operation_id, ref_body=raw(ref), reason=request['reason']))
            common = dict(operation_id=operation_id, request_digest=digest, object_key=object_key, action=request['action'])
            write('sr_operation', dict(common, request_body=raw(request),
                installed_key=object_key if request['action'] == 'install' else None,
                revoked_key=object_key if request['action'] == 'revoke' else None))
            write('sr_audit', common); write('sr_outbox', common)
            write('sr_seal', dict(operation_id=operation_id, request_digest=digest))
            # 故障用例实际由COMMIT的延迟外键拒绝缺写，不以预检查代替提交判据。
            self.db.commit()
        except Exception:
            if self.db.in_transaction: self.db.rollback()
            raise
        if lose_observation: raise CommitObservationLost(operation_id)
        return self.lookup(operation_id)
