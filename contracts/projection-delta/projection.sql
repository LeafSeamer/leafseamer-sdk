CREATE TABLE IF NOT EXISTS dp_head (
 generation TEXT PRIMARY KEY REFERENCES sp_receipt(generation),cursor TEXT NOT NULL,digest TEXT NOT NULL,
 phase TEXT NOT NULL CHECK(phase IN ('catching_up','live'))
) STRICT;
CREATE TABLE IF NOT EXISTS dp_object (
 generation TEXT NOT NULL REFERENCES dp_head(generation),kind TEXT NOT NULL,entity_id TEXT NOT NULL,epoch TEXT NOT NULL,
 revision TEXT NOT NULL,removed TEXT CHECK(removed IS NULL OR removed IN ('deleted','left_scope')),body TEXT NOT NULL,
 PRIMARY KEY(generation,kind,entity_id)
) STRICT;
CREATE TABLE IF NOT EXISTS dp_delivery (
 generation TEXT NOT NULL REFERENCES dp_head(generation),cursor TEXT NOT NULL,frame TEXT NOT NULL,ack TEXT NOT NULL,
 PRIMARY KEY(generation,cursor)
) STRICT;
