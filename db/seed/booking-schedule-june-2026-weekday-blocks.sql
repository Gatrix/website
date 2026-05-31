-- Блокировка будних дней июня 2026: 10:00–17:00 (Asia/Krasnoyarsk).
-- Применение:
--   sudo -u postgres psql -d adventurespool -f booking-schedule-june-2026-weekday-blocks.sql

INSERT INTO booking_schedule (starts_at, ends_at, duration_hours, status)
SELECT
  ((d::date + TIME '10:00') AT TIME ZONE 'Asia/Krasnoyarsk') AS starts_at,
  ((d::date + TIME '17:00') AT TIME ZONE 'Asia/Krasnoyarsk') AS ends_at,
  7::numeric(4, 1) AS duration_hours,
  'blocked' AS status
FROM generate_series('2026-06-01'::date, '2026-06-30'::date, INTERVAL '1 day') AS gs(d)
WHERE EXTRACT(ISODOW FROM d) BETWEEN 1 AND 5
  AND NOT EXISTS (
    SELECT 1
    FROM booking_schedule b
    WHERE b.status <> 'cancelled'
      AND b.starts_at < ((d::date + TIME '17:00') AT TIME ZONE 'Asia/Krasnoyarsk')
      AND b.ends_at > ((d::date + TIME '10:00') AT TIME ZONE 'Asia/Krasnoyarsk')
  );
