-- Таблица игровых систем для БД adventurespool.
-- sudo -u postgres psql -d adventurespool -f adventurespool-gamesystems.sql

CREATE TABLE IF NOT EXISTS gamesystems (
  gamesystem_id TEXT PRIMARY KEY,
  gamesystem_name TEXT NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON gamesystems TO appuser;
