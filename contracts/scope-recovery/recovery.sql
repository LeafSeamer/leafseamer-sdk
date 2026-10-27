-- 同库附加恢复账本；不替代原注册撤销写集。
CREATE TABLE rg_configuration (
 singleton INTEGER PRIMARY KEY CHECK(singleton=1),
 format TEXT NOT NULL CHECK(format='scope-owner-recovery/1'),
 lock_root_digest TEXT NOT NULL CHECK(length(lock_root_digest)=64)
) STRICT;
CREATE TABLE rg_session (
 owner_epoch TEXT PRIMARY KEY,
 ordinal INTEGER NOT NULL UNIQUE CHECK(ordinal>0)
) STRICT;
CREATE TABLE rg_stop (
 owner_epoch TEXT PRIMARY KEY REFERENCES rg_session(owner_epoch)
) STRICT;
CREATE TABLE rg_deny (
 deny_id TEXT PRIMARY KEY,
 owner_epoch TEXT NOT NULL REFERENCES rg_session(owner_epoch),
 kind TEXT NOT NULL CHECK(kind IN ('revoke','recovery')),
 object_key TEXT NOT NULL REFERENCES sr_object(object_key),
 body TEXT NOT NULL CHECK(length(CAST(body AS BLOB)) BETWEEN 1 AND 524288),
 body_digest TEXT NOT NULL CHECK(length(body_digest)=64)
) STRICT;
CREATE INDEX rg_deny_object ON rg_deny(object_key);
CREATE TABLE rg_recovery (
 previous_owner TEXT PRIMARY KEY REFERENCES rg_session(owner_epoch),
 recovering_owner TEXT NOT NULL REFERENCES rg_session(owner_epoch),
 inventory TEXT NOT NULL,
 inventory_digest TEXT NOT NULL CHECK(length(inventory_digest)=64),
 object_count INTEGER NOT NULL CHECK(object_count>=0),
 CHECK(previous_owner<>recovering_owner)
) STRICT;
CREATE TRIGGER rg_configuration_immutable_update BEFORE UPDATE ON rg_configuration BEGIN SELECT RAISE(ABORT,'immutable_recovery'); END;
CREATE TRIGGER rg_configuration_immutable_delete BEFORE DELETE ON rg_configuration BEGIN SELECT RAISE(ABORT,'immutable_recovery'); END;
CREATE TRIGGER rg_session_immutable_update BEFORE UPDATE ON rg_session BEGIN SELECT RAISE(ABORT,'immutable_recovery'); END;
CREATE TRIGGER rg_session_immutable_delete BEFORE DELETE ON rg_session BEGIN SELECT RAISE(ABORT,'immutable_recovery'); END;
CREATE TRIGGER rg_stop_immutable_update BEFORE UPDATE ON rg_stop BEGIN SELECT RAISE(ABORT,'immutable_recovery'); END;
CREATE TRIGGER rg_stop_immutable_delete BEFORE DELETE ON rg_stop BEGIN SELECT RAISE(ABORT,'immutable_recovery'); END;
CREATE TRIGGER rg_deny_immutable_update BEFORE UPDATE ON rg_deny BEGIN SELECT RAISE(ABORT,'immutable_recovery'); END;
CREATE TRIGGER rg_deny_immutable_delete BEFORE DELETE ON rg_deny BEGIN SELECT RAISE(ABORT,'immutable_recovery'); END;
CREATE TRIGGER rg_recovery_immutable_update BEFORE UPDATE ON rg_recovery BEGIN SELECT RAISE(ABORT,'immutable_recovery'); END;
CREATE TRIGGER rg_recovery_immutable_delete BEFORE DELETE ON rg_recovery BEGIN SELECT RAISE(ABORT,'immutable_recovery'); END;
