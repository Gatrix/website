-- Только таблица (если схема уже развёрнута без adventure_gamesystems)
CREATE TABLE IF NOT EXISTS adventure_gamesystems (
  adventure_id TEXT NOT NULL REFERENCES adventures (adventure_id) ON DELETE CASCADE,
  gamesystem_id TEXT NOT NULL REFERENCES gamesystems (gamesystem_id) ON DELETE CASCADE,
  PRIMARY KEY (adventure_id, gamesystem_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON adventure_gamesystems TO appuser;
