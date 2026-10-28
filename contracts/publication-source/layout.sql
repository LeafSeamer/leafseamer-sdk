-- 单行保存完整关联；调用方将此写集纳入原发布writer事务。
CREATE TABLE IF NOT EXISTS publication_source (
 authority TEXT NOT NULL, database_id TEXT NOT NULL, definition_id TEXT NOT NULL, version TEXT NOT NULL,
 artifact_id TEXT NOT NULL, artifact_revision TEXT NOT NULL, artifact_digest TEXT NOT NULL,
 record_digest TEXT NOT NULL, body BLOB NOT NULL,
 PRIMARY KEY(authority,database_id,definition_id,version),
 UNIQUE(authority,database_id,artifact_id,artifact_revision),
 CHECK(typeof(body)='blob' AND length(body)<=8388608),
 CHECK(publication_source_valid(authority,database_id,definition_id,version,artifact_id,artifact_revision,artifact_digest,record_digest,body)=1)
) WITHOUT ROWID;
CREATE TRIGGER IF NOT EXISTS publication_source_no_update BEFORE UPDATE ON publication_source
 BEGIN SELECT RAISE(ABORT,'immutable_publication'); END;
CREATE TRIGGER IF NOT EXISTS publication_source_no_delete BEFORE DELETE ON publication_source
 BEGIN SELECT RAISE(ABORT,'immutable_publication'); END;
-- REPLACE会删除旧行；显式插入守卫不依赖recursive_triggers设置。
CREATE TRIGGER IF NOT EXISTS publication_source_no_replace BEFORE INSERT ON publication_source
 WHEN EXISTS(SELECT 1 FROM publication_source WHERE
  (authority=NEW.authority AND database_id=NEW.database_id AND definition_id=NEW.definition_id AND version=NEW.version)
  OR (authority=NEW.authority AND database_id=NEW.database_id AND artifact_id=NEW.artifact_id AND artifact_revision=NEW.artifact_revision))
 BEGIN SELECT RAISE(ABORT,'immutable_publication'); END;
