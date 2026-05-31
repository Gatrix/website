-- Дополнительные блокировки июня 2026 (Asia/Krasnoyarsk).
-- sudo -u postgres psql -d adventurespool -f booking-schedule-june-2026-blocked-days-extra.sql

BEGIN;

-- Полные дни: 19, 22 — заменить частичные blocked на этих датах.
DELETE FROM booking_schedule b
WHERE b.status = 'blocked'
  AND EXISTS (
    SELECT 1
    FROM (VALUES ('2026-06-19'::date), ('2026-06-22'::date)) AS t(d)
    WHERE b.starts_at < (((t.d + INTERVAL '1 day') + TIME '02:00') AT TIME ZONE 'Asia/Krasnoyarsk')
      AND b.ends_at > ((t.d + TIME '10:00') AT TIME ZONE 'Asia/Krasnoyarsk')
  );

INSERT INTO booking_schedule (starts_at, ends_at, duration_hours, status)
VALUES
  (
    ('2026-06-19 10:00:00+07')::timestamptz,
    ('2026-06-20 02:00:00+07')::timestamptz,
    16,
    'blocked'
  ),
  (
    ('2026-06-22 10:00:00+07')::timestamptz,
    ('2026-06-23 02:00:00+07')::timestamptz,
    16,
    'blocked'
  ),
  (
    ('2026-06-13 10:00:00+07')::timestamptz,
    ('2026-06-13 15:00:00+07')::timestamptz,
    5,
    'blocked'
  ),
  (
    ('2026-06-14 20:00:00+07')::timestamptz,
    ('2026-06-15 02:00:00+07')::timestamptz,
    6,
    'blocked'
  ),
  (
    ('2026-06-20 10:00:00+07')::timestamptz,
    ('2026-06-20 15:00:00+07')::timestamptz,
    5,
    'blocked'
  );

COMMIT;
