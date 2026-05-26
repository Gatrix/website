-- Любое приключение можно вести в любом формате (oneshot / adventure / campaign).
TRUNCATE adventure_gameformat;

INSERT INTO adventure_gameformat (adventure_id, gameformat_id)
SELECT a.adventure_id, g.gameformat_id
FROM adventures a
CROSS JOIN gameformat g
ORDER BY a.adventure_id, g.gameformat_id;
