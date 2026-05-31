-- Полная блокировка выбранных дней июня 2026 (10:00 – 02:00 следующего дня).
-- Шаг 1: убрать частичные blocked на этих датах.
-- Шаг 2: вставить полный игровой день.

BEGIN;

DELETE FROM booking_schedule b
WHERE b.status = 'blocked'
  AND EXISTS (
    SELECT 1
    FROM (
      VALUES
        ('2026-06-02'::date),
        ('2026-06-04'::date),
        ('2026-06-06'::date),
        ('2026-06-07'::date),
        ('2026-06-08'::date),
        ('2026-06-11'::date),
        ('2026-06-17'::date),
        ('2026-06-18'::date),
        ('2026-06-26'::date),
        ('2026-06-30'::date)
    ) AS t(d)
    WHERE b.starts_at < (((t.d + INTERVAL '1 day') + TIME '02:00') AT TIME ZONE 'Asia/Krasnoyarsk')
      AND b.ends_at > ((t.d + TIME '10:00') AT TIME ZONE 'Asia/Krasnoyarsk')
  );

INSERT INTO booking_schedule (starts_at, ends_at, duration_hours, status)
SELECT
  ((d + TIME '10:00') AT TIME ZONE 'Asia/Krasnoyarsk'),
  (((d + INTERVAL '1 day') + TIME '02:00') AT TIME ZONE 'Asia/Krasnoyarsk'),
  16,
  'blocked'
FROM (
  VALUES
    ('2026-06-02'::date),
    ('2026-06-04'::date),
    ('2026-06-06'::date),
    ('2026-06-07'::date),
    ('2026-06-08'::date),
    ('2026-06-11'::date),
    ('2026-06-17'::date),
    ('2026-06-18'::date),
    ('2026-06-26'::date),
    ('2026-06-30'::date)
) AS days(d);

COMMIT;
