-- Справочники и каталог приключений для БД adventurespool.
-- Применение на ВМ: sudo -u postgres psql -d adventurespool -f adventurespool-schema.sql

CREATE TABLE IF NOT EXISTS adventures (
  adventure_id TEXT PRIMARY KEY,
  adventure_name TEXT NOT NULL,
  adventure_intro TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  setting_id TEXT PRIMARY KEY,
  setting_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subsettings (
  subsetting_id TEXT PRIMARY KEY,
  subsetting_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS universes (
  universe_id TEXT PRIMARY KEY,
  universe_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS genres (
  genre_id TEXT PRIMARY KEY,
  genre_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS difficulty (
  difficulty_id TEXT PRIMARY KEY,
  difficulty_name TEXT NOT NULL,
  difficulty_description TEXT
);

CREATE TABLE IF NOT EXISTS gametime (
  gametime_id TEXT PRIMARY KEY,
  gametime_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS gameformat (
  gameformat_id TEXT PRIMARY KEY,
  gameformat_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
  tag_id TEXT PRIMARY KEY,
  tag_name TEXT NOT NULL
);

-- Связи many-to-many: приключение ↔ справочник

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
