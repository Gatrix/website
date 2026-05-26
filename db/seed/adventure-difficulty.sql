-- У всех приключений доступны оба режима сложности.
-- TRUNCATE adventure_difficulty;

INSERT INTO adventure_difficulty (adventure_id, difficulty_id)
SELECT a.adventure_id, d.difficulty_id
FROM adventures a
CROSS JOIN difficulty d
ORDER BY a.adventure_id, d.difficulty_id
ON CONFLICT (adventure_id, difficulty_id) DO NOTHING;
