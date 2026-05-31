-- Расписание занятости стола (непрерывные интервалы игр).
-- Применение на ВМ:
--   sudo -u postgres psql -d adventurespool -f adventurespool-booking-schedule.sql
--
-- Игровой день: 10:00–02:00 (следующего календарного дня), Asia/Krasnoyarsk.
-- Свободное время не хранится — вычисляется из непересекающихся интервалов.

CREATE TABLE IF NOT EXISTS booking_schedule (
  id BIGSERIAL PRIMARY KEY,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  duration_hours NUMERIC(4, 1) NOT NULL CHECK (duration_hours > 0),
  status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('open', 'confirmed', 'blocked', 'cancelled')),
  booking_request_id BIGINT UNIQUE REFERENCES booking_requests (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_booking_schedule_starts
  ON booking_schedule (starts_at)
  WHERE status <> 'cancelled';

CREATE INDEX IF NOT EXISTS idx_booking_schedule_range
  ON booking_schedule (starts_at, ends_at)
  WHERE status <> 'cancelled';

-- Запрет пересечения активных интервалов (нужен postgres-contrib / btree_gist).
CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'booking_schedule_no_overlap'
  ) THEN
    ALTER TABLE booking_schedule
      ADD CONSTRAINT booking_schedule_no_overlap
      EXCLUDE USING gist (
        tstzrange(starts_at, ends_at, '[)') WITH &&
      )
      WHERE (status IN ('open', 'confirmed', 'blocked'));
  END IF;
END
$$;

ALTER TABLE booking_requests
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;

COMMENT ON TABLE booking_schedule IS 'Занятые интервалы стола; свободное время вычисляется на лету';
COMMENT ON COLUMN booking_requests.starts_at IS 'Выбранное игроком время начала игры';
