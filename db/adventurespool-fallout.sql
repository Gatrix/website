-- Таблица фраз для NFC-страниц Fallout (планшет /board).
-- Применение на ВМ:
--   sudo -u postgres psql -d adventurespool -f db/adventurespool-fallout.sql

CREATE TABLE IF NOT EXISTS fallout (
  character_name TEXT PRIMARY KEY,
  text TEXT NOT NULL DEFAULT ''
);

INSERT INTO fallout (character_name, text) VALUES
  ('Техник', ''),
  ('Боец', ''),
  ('Дозорный', ''),
  ('Тягач', ''),
  ('Тень', ''),
  ('Лицо', '')
ON CONFLICT (character_name) DO NOTHING;

GRANT SELECT ON fallout TO appuser;
