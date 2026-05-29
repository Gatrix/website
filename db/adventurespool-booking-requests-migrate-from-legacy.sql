-- Только если раньше применяли db/booking-schema.sql с колонкой payload (JSONB).
-- Проверка: \d booking_requests — если есть payload, выполните этот файл.
--
-- sudo -u postgres psql -d adventurespool -f adventurespool-booking-requests-migrate-from-legacy.sql

BEGIN;

ALTER TABLE booking_requests RENAME TO booking_requests_legacy;

-- Затем отдельно: psql -d adventurespool -f adventurespool-booking-requests.sql

INSERT INTO booking_requests (
  adventure_id,
  adventure_title,
  game_system_id,
  game_system_name,
  difficulty_id,
  difficulty_name,
  universe_id,
  universe_name,
  player_count,
  duration_hours,
  adventure_type,
  player_note,
  warning_ids,
  warning_messages,
  telegram_notified_at,
  client_meta,
  created_at
)
SELECT
  l.adventure_id,
  COALESCE(l.adventure_title, l.payload->>'adventureTitle', l.adventure_id),
  l.payload->>'gameSystemId',
  l.payload->>'gameSystemName',
  l.payload->>'difficultyId',
  l.payload->>'difficultyName',
  l.payload->>'universeId',
  l.payload->>'universeName',
  (l.payload->>'playerCount')::integer,
  (l.payload->>'durationHours')::numeric,
  COALESCE(l.payload->>'adventureType', 'adventure'),
  COALESCE(l.payload->>'playerNote', ''),
  COALESCE(l.warning_ids, '{}'),
  '{}',
  NOW(),
  l.client_meta,
  l.created_at
FROM booking_requests_legacy l
WHERE l.payload IS NOT NULL;

COMMIT;

-- После проверки: DROP TABLE booking_requests_legacy;
