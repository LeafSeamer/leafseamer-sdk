-- 注册对象、操作、撤销与审计通知在同一事务封存；不包含身份服务或网络释放门。
CREATE TABLE sr_metadata (
 singleton INTEGER PRIMARY KEY CHECK(singleton=1),
 format TEXT NOT NULL CHECK(format='scope-registry-storage/0.1'),
 authority_service_id TEXT NOT NULL,
 database_instance_id TEXT NOT NULL,
 authority_role TEXT NOT NULL CHECK(authority_role IN ('controller','seamer'))
) STRICT;

CREATE TABLE sr_object (
 object_key TEXT PRIMARY KEY,
 kind TEXT NOT NULL CHECK(kind IN ('projection_profile','selector')),
 body TEXT NOT NULL CHECK(length(CAST(body AS BLOB)) BETWEEN 1 AND 262144),
 ref_body TEXT NOT NULL,
 content_digest TEXT NOT NULL CHECK(length(content_digest)=64 AND content_digest NOT GLOB '*[^0-9a-f]*'),
 profile_key TEXT,
 profile_kind TEXT,
 install_operation TEXT NOT NULL UNIQUE,
 UNIQUE(object_key,kind), UNIQUE(object_key,install_operation),
 CHECK((kind='projection_profile' AND profile_key IS NULL AND profile_kind IS NULL) OR
       (kind='selector' AND profile_key IS NOT NULL AND profile_kind IS NOT NULL AND profile_kind='projection_profile')),
 FOREIGN KEY(profile_key,profile_kind) REFERENCES sr_object(object_key,kind) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(install_operation,object_key) REFERENCES sr_operation(operation_id,object_key) DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE TABLE sr_operation (
 operation_id TEXT PRIMARY KEY,
 action TEXT NOT NULL CHECK(action IN ('install','revoke')),
 object_key TEXT NOT NULL REFERENCES sr_object(object_key) DEFERRABLE INITIALLY DEFERRED,
 request_digest TEXT NOT NULL CHECK(length(request_digest)=64 AND request_digest NOT GLOB '*[^0-9a-f]*'),
 request_body TEXT NOT NULL CHECK(length(CAST(request_body AS BLOB)) BETWEEN 1 AND 524288),
 installed_key TEXT,
 revoked_key TEXT,
 UNIQUE(operation_id,object_key), UNIQUE(operation_id,request_digest),
 UNIQUE(operation_id,request_digest,object_key,action),
 CHECK((action='install' AND installed_key=object_key AND installed_key IS NOT NULL AND revoked_key IS NULL) OR
       (action='revoke' AND revoked_key=object_key AND revoked_key IS NOT NULL AND installed_key IS NULL)),
 FOREIGN KEY(installed_key,operation_id) REFERENCES sr_object(object_key,install_operation) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(revoked_key,operation_id) REFERENCES sr_revocation(object_key,operation_id) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(operation_id,request_digest) REFERENCES sr_seal(operation_id,request_digest) DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE TABLE sr_revocation (
 object_key TEXT PRIMARY KEY REFERENCES sr_object(object_key) DEFERRABLE INITIALLY DEFERRED,
 operation_id TEXT NOT NULL UNIQUE,
 ref_body TEXT NOT NULL,
 reason TEXT NOT NULL CHECK(reason IN ('configuration_revoked','retired')),
 UNIQUE(object_key,operation_id),
 FOREIGN KEY(operation_id,object_key) REFERENCES sr_operation(operation_id,object_key) DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE TABLE sr_audit (
 operation_id TEXT PRIMARY KEY,
 request_digest TEXT NOT NULL,
 object_key TEXT NOT NULL,
 action TEXT NOT NULL,
 FOREIGN KEY(operation_id,request_digest,object_key,action)
 REFERENCES sr_operation(operation_id,request_digest,object_key,action) DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE TABLE sr_outbox (
 operation_id TEXT PRIMARY KEY,
 request_digest TEXT NOT NULL,
 object_key TEXT NOT NULL,
 action TEXT NOT NULL,
 FOREIGN KEY(operation_id,request_digest,object_key,action)
 REFERENCES sr_operation(operation_id,request_digest,object_key,action) DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE TABLE sr_seal (
 operation_id TEXT PRIMARY KEY,
 request_digest TEXT NOT NULL,
 UNIQUE(operation_id,request_digest),
 FOREIGN KEY(operation_id,request_digest) REFERENCES sr_operation(operation_id,request_digest) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(operation_id) REFERENCES sr_audit(operation_id) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(operation_id) REFERENCES sr_outbox(operation_id) DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE TRIGGER sr_metadata_no_update BEFORE UPDATE ON sr_metadata BEGIN SELECT RAISE(ABORT,'immutable_metadata'); END;
CREATE TRIGGER sr_metadata_no_delete BEFORE DELETE ON sr_metadata BEGIN SELECT RAISE(ABORT,'immutable_metadata'); END;
CREATE TRIGGER sr_object_no_update BEFORE UPDATE ON sr_object BEGIN SELECT RAISE(ABORT,'immutable_object'); END;
CREATE TRIGGER sr_object_no_delete BEFORE DELETE ON sr_object BEGIN SELECT RAISE(ABORT,'immutable_object'); END;
CREATE TRIGGER sr_operation_no_update BEFORE UPDATE ON sr_operation BEGIN SELECT RAISE(ABORT,'immutable_operation'); END;
CREATE TRIGGER sr_operation_no_delete BEFORE DELETE ON sr_operation BEGIN SELECT RAISE(ABORT,'immutable_operation'); END;
CREATE TRIGGER sr_revocation_no_update BEFORE UPDATE ON sr_revocation BEGIN SELECT RAISE(ABORT,'immutable_revocation'); END;
CREATE TRIGGER sr_revocation_no_delete BEFORE DELETE ON sr_revocation BEGIN SELECT RAISE(ABORT,'immutable_revocation'); END;
CREATE TRIGGER sr_audit_no_update BEFORE UPDATE ON sr_audit BEGIN SELECT RAISE(ABORT,'immutable_audit'); END;
CREATE TRIGGER sr_audit_no_delete BEFORE DELETE ON sr_audit BEGIN SELECT RAISE(ABORT,'immutable_audit'); END;
CREATE TRIGGER sr_outbox_no_update BEFORE UPDATE ON sr_outbox BEGIN SELECT RAISE(ABORT,'immutable_outbox'); END;
CREATE TRIGGER sr_outbox_no_delete BEFORE DELETE ON sr_outbox BEGIN SELECT RAISE(ABORT,'immutable_outbox'); END;
CREATE TRIGGER sr_seal_no_update BEFORE UPDATE ON sr_seal BEGIN SELECT RAISE(ABORT,'immutable_seal'); END;
CREATE TRIGGER sr_seal_no_delete BEFORE DELETE ON sr_seal BEGIN SELECT RAISE(ABORT,'immutable_seal'); END;

CREATE TRIGGER sr_object_not_sealed BEFORE INSERT ON sr_object
WHEN EXISTS(SELECT 1 FROM sr_seal WHERE operation_id=NEW.install_operation)
BEGIN SELECT RAISE(ABORT,'operation_already_sealed'); END;
CREATE TRIGGER sr_operation_not_sealed BEFORE INSERT ON sr_operation
WHEN EXISTS(SELECT 1 FROM sr_seal WHERE operation_id=NEW.operation_id)
BEGIN SELECT RAISE(ABORT,'operation_already_sealed'); END;
CREATE TRIGGER sr_revocation_not_sealed BEFORE INSERT ON sr_revocation
WHEN EXISTS(SELECT 1 FROM sr_seal WHERE operation_id=NEW.operation_id)
BEGIN SELECT RAISE(ABORT,'operation_already_sealed'); END;
CREATE TRIGGER sr_audit_not_sealed BEFORE INSERT ON sr_audit
WHEN EXISTS(SELECT 1 FROM sr_seal WHERE operation_id=NEW.operation_id)
BEGIN SELECT RAISE(ABORT,'operation_already_sealed'); END;
CREATE TRIGGER sr_outbox_not_sealed BEFORE INSERT ON sr_outbox
WHEN EXISTS(SELECT 1 FROM sr_seal WHERE operation_id=NEW.operation_id)
BEGIN SELECT RAISE(ABORT,'operation_already_sealed'); END;
