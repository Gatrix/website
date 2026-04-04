-- Опорная схема для сайта. Таблицу приключений вы можете уже иметь — сверяйте колонки с src/lib/adventures-db.ts.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  player_name TEXT,
  avatar_url TEXT,
  games_count INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS adventure_options (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

INSERT INTO site_settings (key, value)
VALUES ('frontpage_photos', '[]'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Вставьте одну строку в adventure_options: скопируйте JSON объекта фильтров (base_setting, setting_relations, …).
-- INSERT INTO adventure_options (data) VALUES ('{ ... }'::jsonb);
