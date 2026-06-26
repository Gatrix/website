-- M2M-таблицы определены в db/adventurespool-schema.sql (единый источник правды).
-- Этот файл оставлен для совместимости с порядком миграций: шаг 2 можно пропустить,
-- если шаг 1 уже применён.
--
-- sudo -u postgres psql -d adventurespool -f db/adventurespool-links-schema.sql

DO $$ BEGIN
  RAISE NOTICE 'adventurespool-links-schema.sql: M2M tables are in adventurespool-schema.sql — no additional DDL.';
END $$;
