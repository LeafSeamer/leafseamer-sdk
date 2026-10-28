-- 当前写入口须注册此函数；旧连接没有该函数，不能继续追加旧选择。
CREATE TRIGGER publication_source_current_insert BEFORE INSERT ON publication_source
 WHEN publication_current_body(NEW.body)<>1
 BEGIN SELECT RAISE(ABORT,'current_publication_required'); END;
