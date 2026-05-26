-- Связи many-to-many (A-Settings … A-Tags). Применить после adventurespool-schema.sql.
-- sudo -u postgres psql -d adventurespool -f adventurespool-links-schema.sql

CREATE TABLE IF NOT EXISTS adventure_settings (
  adventure_id TEXT NOT NULL REFERENCES adventures (adventure_id) ON DELETE CASCADE,
  setting_id TEXT NOT NULL REFERENCES settings (setting_id) ON DELETE CASCADE,
  PRIMARY KEY (adventure_id, setting_id)
);

CREATE TABLE IF NOT EXISTS adventure_subsettings (
  adventure_id TEXT NOT NULL REFERENCES adventures (adventure_id) ON DELETE CASCADE,
  subsetting_id TEXT NOT NULL REFERENCES subsettings (subsetting_id) ON DELETE CASCADE,
  PRIMARY KEY (adventure_id, subsetting_id)
);

CREATE TABLE IF NOT EXISTS adventure_universes (
  adventure_id TEXT NOT NULL REFERENCES adventures (adventure_id) ON DELETE CASCADE,
  universe_id TEXT NOT NULL REFERENCES universes (universe_id) ON DELETE CASCADE,
  PRIMARY KEY (adventure_id, universe_id)
);

CREATE TABLE IF NOT EXISTS adventure_genres (
  adventure_id TEXT NOT NULL REFERENCES adventures (adventure_id) ON DELETE CASCADE,
  genre_id TEXT NOT NULL REFERENCES genres (genre_id) ON DELETE CASCADE,
  PRIMARY KEY (adventure_id, genre_id)
);

CREATE TABLE IF NOT EXISTS adventure_difficulty (
  adventure_id TEXT NOT NULL REFERENCES adventures (adventure_id) ON DELETE CASCADE,
  difficulty_id TEXT NOT NULL REFERENCES difficulty (difficulty_id) ON DELETE CASCADE,
  PRIMARY KEY (adventure_id, difficulty_id)
);

CREATE TABLE IF NOT EXISTS adventure_gametime (
  adventure_id TEXT NOT NULL REFERENCES adventures (adventure_id) ON DELETE CASCADE,
  gametime_id TEXT NOT NULL REFERENCES gametime (gametime_id) ON DELETE CASCADE,
  PRIMARY KEY (adventure_id, gametime_id)
);

CREATE TABLE IF NOT EXISTS adventure_gameformat (
  adventure_id TEXT NOT NULL REFERENCES adventures (adventure_id) ON DELETE CASCADE,
  gameformat_id TEXT NOT NULL REFERENCES gameformat (gameformat_id) ON DELETE CASCADE,
  PRIMARY KEY (adventure_id, gameformat_id)
);

CREATE TABLE IF NOT EXISTS adventure_tags (
  adventure_id TEXT NOT NULL REFERENCES adventures (adventure_id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags (tag_id) ON DELETE CASCADE,
  PRIMARY KEY (adventure_id, tag_id)
);
