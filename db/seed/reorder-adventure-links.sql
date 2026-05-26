-- Физически упорядочить строки в смежных таблицах по adventure_id (для просмотра в DBeaver).
-- sudo -u postgres psql -d adventurespool -f reorder-adventure-links.sql

BEGIN;

-- adventure_settings
CREATE TEMP TABLE _reorder_adventure_settings ON COMMIT DROP AS
SELECT * FROM adventure_settings ORDER BY adventure_id, setting_id;
TRUNCATE adventure_settings;
INSERT INTO adventure_settings SELECT * FROM _reorder_adventure_settings;
CLUSTER adventure_settings USING adventure_settings_pkey;

-- adventure_subsettings
CREATE TEMP TABLE _reorder_adventure_subsettings ON COMMIT DROP AS
SELECT * FROM adventure_subsettings ORDER BY adventure_id, subsetting_id;
TRUNCATE adventure_subsettings;
INSERT INTO adventure_subsettings SELECT * FROM _reorder_adventure_subsettings;
CLUSTER adventure_subsettings USING adventure_subsettings_pkey;

-- adventure_universes
CREATE TEMP TABLE _reorder_adventure_universes ON COMMIT DROP AS
SELECT * FROM adventure_universes ORDER BY adventure_id, universe_id;
TRUNCATE adventure_universes;
INSERT INTO adventure_universes SELECT * FROM _reorder_adventure_universes;
CLUSTER adventure_universes USING adventure_universes_pkey;

-- adventure_genres
CREATE TEMP TABLE _reorder_adventure_genres ON COMMIT DROP AS
SELECT * FROM adventure_genres ORDER BY adventure_id, genre_id;
TRUNCATE adventure_genres;
INSERT INTO adventure_genres SELECT * FROM _reorder_adventure_genres;
CLUSTER adventure_genres USING adventure_genres_pkey;

-- adventure_difficulty
CREATE TEMP TABLE _reorder_adventure_difficulty ON COMMIT DROP AS
SELECT * FROM adventure_difficulty ORDER BY adventure_id, difficulty_id;
TRUNCATE adventure_difficulty;
INSERT INTO adventure_difficulty SELECT * FROM _reorder_adventure_difficulty;
CLUSTER adventure_difficulty USING adventure_difficulty_pkey;

-- adventure_gametime
CREATE TEMP TABLE _reorder_adventure_gametime ON COMMIT DROP AS
SELECT * FROM adventure_gametime ORDER BY adventure_id, gametime_id;
TRUNCATE adventure_gametime;
INSERT INTO adventure_gametime SELECT * FROM _reorder_adventure_gametime;
CLUSTER adventure_gametime USING adventure_gametime_pkey;

-- adventure_gameformat
CREATE TEMP TABLE _reorder_adventure_gameformat ON COMMIT DROP AS
SELECT * FROM adventure_gameformat ORDER BY adventure_id, gameformat_id;
TRUNCATE adventure_gameformat;
INSERT INTO adventure_gameformat SELECT * FROM _reorder_adventure_gameformat;
CLUSTER adventure_gameformat USING adventure_gameformat_pkey;

-- adventure_tags
CREATE TEMP TABLE _reorder_adventure_tags ON COMMIT DROP AS
SELECT * FROM adventure_tags ORDER BY adventure_id, tag_id;
TRUNCATE adventure_tags;
INSERT INTO adventure_tags SELECT * FROM _reorder_adventure_tags;
CLUSTER adventure_tags USING adventure_tags_pkey;

COMMIT;
