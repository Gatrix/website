-- Минимальные права для сайта и Telegram-бота.
-- Роли appuser/botuser создаются отдельно с паролями, этот файл только выдаёт права.

GRANT CONNECT ON DATABASE adventurespool TO appuser;
GRANT USAGE ON SCHEMA public TO appuser;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO appuser;
GRANT INSERT ON booking_requests TO appuser;
GRANT USAGE, SELECT ON SEQUENCE booking_requests_id_seq TO appuser;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO appuser;

-- Если бот работает под отдельной ролью, создайте её заранее:
--   CREATE ROLE botuser LOGIN PASSWORD '...';
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'botuser') THEN
    GRANT CONNECT ON DATABASE adventurespool TO botuser;
    GRANT USAGE ON SCHEMA public TO botuser;
    GRANT SELECT ON booking_requests TO botuser;
    GRANT UPDATE (telegram_notified_at) ON booking_requests TO botuser;
  ELSE
    RAISE NOTICE 'Role botuser does not exist, skipping bot grants';
  END IF;
END
$$;
