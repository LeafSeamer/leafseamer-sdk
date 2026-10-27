CREATE TABLE IF NOT EXISTS sp_generation (
 id TEXT PRIMARY KEY,slot TEXT NOT NULL,expected TEXT NOT NULL,manifest TEXT NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS sp_slot (
 slot TEXT PRIMARY KEY,generation TEXT NOT NULL REFERENCES sp_generation(id)
) STRICT;
CREATE TABLE IF NOT EXISTS sp_page (
 generation TEXT NOT NULL REFERENCES sp_generation(id),ordinal INTEGER NOT NULL CHECK(ordinal>=0 AND ordinal<128),body TEXT NOT NULL,
 PRIMARY KEY(generation,ordinal)
) STRICT;
CREATE TABLE IF NOT EXISTS sp_record (
 generation TEXT NOT NULL REFERENCES sp_generation(id),kind TEXT NOT NULL,entity_id TEXT NOT NULL,epoch TEXT NOT NULL,
 revision TEXT NOT NULL,digest TEXT NOT NULL,body TEXT NOT NULL,
 PRIMARY KEY(generation,kind,entity_id,epoch),UNIQUE(generation,kind,entity_id)
) STRICT;
CREATE TABLE IF NOT EXISTS sp_receipt (
 generation TEXT PRIMARY KEY REFERENCES sp_generation(id),body TEXT NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS sp_active (
 slot TEXT PRIMARY KEY,generation TEXT NOT NULL REFERENCES sp_receipt(generation)
) STRICT;
CREATE TRIGGER IF NOT EXISTS sp_page_immutable BEFORE UPDATE ON sp_page BEGIN SELECT RAISE(ABORT,'page_immutable'); END;
CREATE TRIGGER IF NOT EXISTS sp_receipt_immutable BEFORE UPDATE ON sp_receipt BEGIN SELECT RAISE(ABORT,'receipt_immutable'); END;
