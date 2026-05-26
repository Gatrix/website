-- Длина одной сессии: от 1 до 8 часов (шаг 1 ч). Любое приключение × любая длина.
TRUNCATE adventure_gametime;

INSERT INTO adventure_gametime (adventure_id, gametime_id)
SELECT a.adventure_id, g.gametime_id
FROM adventures a
CROSS JOIN gametime g
ORDER BY a.adventure_id, g.gametime_id;
