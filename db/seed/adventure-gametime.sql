-- Длина одной сессии: от 4 до 8 часов (шаг 1 ч). Любое приключение × допустимая длина.
TRUNCATE adventure_gametime;

INSERT INTO adventure_gametime (adventure_id, gametime_id)
SELECT a.adventure_id, g.gametime_id
FROM adventures a
CROSS JOIN gametime g
WHERE CAST(g.gametime_id AS INTEGER) >= 4
ORDER BY a.adventure_id, g.gametime_id;
