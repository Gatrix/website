-- Заявки на игру (форма «Записаться») в БД adventurespool.
-- Применение на ВМ:
--   sudo -u postgres psql -d adventurespool -f adventurespool-booking-requests.sql
--
-- Сайт пишет строки через POST /api/booking-requests.
-- Telegram-бот на ВМ читает строки с telegram_notified_at IS NULL и помечает отправленные.

CREATE TABLE IF NOT EXISTS booking_requests (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  adventure_id TEXT NOT NULL REFERENCES adventures (adventure_id) ON DELETE RESTRICT,
  adventure_title TEXT NOT NULL,
  game_system_id TEXT,
  game_system_name TEXT,
  difficulty_id TEXT,
  difficulty_name TEXT,
  universe_id TEXT,
  universe_name TEXT,
  player_count INTEGER NOT NULL CHECK (player_count >= 1 AND player_count <= 99),
  duration_hours NUMERIC(4, 1) NOT NULL CHECK (duration_hours > 0 AND duration_hours <= 99),
  adventure_type TEXT NOT NULL CHECK (adventure_type IN ('oneshot', 'adventure', 'campaign')),
  player_note TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL,
  warning_ids INTEGER[] NOT NULL DEFAULT '{}',
  warning_messages TEXT[] NOT NULL DEFAULT '{}',
  starts_at TIMESTAMPTZ,
  telegram_notified_at TIMESTAMPTZ,
  client_meta JSONB
);

CREATE INDEX IF NOT EXISTS idx_booking_requests_created
  ON booking_requests (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_booking_requests_telegram_pending
  ON booking_requests (id)
  WHERE telegram_notified_at IS NULL;

COMMENT ON TABLE booking_requests IS 'Заявки игроков на проведение игры по приключению';
COMMENT ON COLUMN booking_requests.starts_at IS 'Выбранное игроком время начала игры';
COMMENT ON COLUMN booking_requests.telegram_notified_at IS 'Когда Telegram-бот отправил уведомление мастеру';

-- Сайт пишет заявки от appuser: нужны права на таблицу и на sequence для id.
GRANT SELECT, INSERT ON booking_requests TO appuser;
GRANT USAGE, SELECT ON SEQUENCE booking_requests_id_seq TO appuser;

-- Бот только читает заявки и помечает отправленные уведомления.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'botuser') THEN
    GRANT SELECT ON booking_requests TO botuser;
    GRANT SELECT ON booking_schedule TO botuser;
    GRANT UPDATE (telegram_notified_at) ON booking_requests TO botuser;
  ELSE
    RAISE NOTICE 'Role botuser does not exist, skipping bot grants';
  END IF;
END
$$;
