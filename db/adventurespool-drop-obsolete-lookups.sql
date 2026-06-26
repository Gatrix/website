-- Удаление устаревших справочников adventurespool.
-- gametime/adventure_gametime — длительность фиксирована в форме заявки (4–7 ч).
-- difficulty/adventure_difficulty — все приключения доступны на обоих уровнях.
-- settings/adventure_settings — больше не используются (сеттинг через subsettings).
--
-- sudo -u postgres psql -d adventurespool -f db/adventurespool-drop-obsolete-lookups.sql

BEGIN;

DROP TABLE IF EXISTS adventure_gametime;
DROP TABLE IF EXISTS adventure_difficulty;
DROP TABLE IF EXISTS adventure_settings;

DROP TABLE IF EXISTS gametime;
DROP TABLE IF EXISTS difficulty;
DROP TABLE IF EXISTS settings;

COMMIT;
