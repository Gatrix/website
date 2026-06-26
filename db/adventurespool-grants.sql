-- Минимальные права для сайта и Telegram-бота.
-- Роли appuser/botuser создаются отдельно с паролями, этот файл только выдаёт права.

GRANT CONNECT ON DATABASE adventurespool TO appuser;
GRANT USAGE ON SCHEMA public TO appuser;

-- Каталог приключений (только чтение)
GRANT SELECT ON adventures TO appuser;
GRANT SELECT ON subsettings TO appuser;
GRANT SELECT ON universes TO appuser;
GRANT SELECT ON genres TO appuser;
GRANT SELECT ON gameformat TO appuser;
GRANT SELECT ON gamesystems TO appuser;
GRANT SELECT ON tags TO appuser;
GRANT SELECT ON adventure_subsettings TO appuser;
GRANT SELECT ON adventure_universes TO appuser;
GRANT SELECT ON adventure_genres TO appuser;
GRANT SELECT ON adventure_gameformat TO appuser;
GRANT SELECT ON adventure_gamesystems TO appuser;
GRANT SELECT ON adventure_tags TO appuser;

-- Бронирование
GRANT SELECT ON booking_schedule TO appuser;
GRANT INSERT ON booking_requests TO appuser;
GRANT USAGE, SELECT ON SEQUENCE booking_requests_id_seq TO appuser;

-- Опциональные справочники / legacy
DO $$
BEGIN
  IF to_regclass('public.adventure_options') IS NOT NULL THEN
    EXECUTE 'GRANT SELECT ON adventure_options TO appuser';
  END IF;
  IF to_regclass('public.booking_warnings') IS NOT NULL THEN
    EXECUTE 'GRANT SELECT ON booking_warnings TO appuser';
  END IF;
  IF to_regclass('public.booking_warning_rules') IS NOT NULL THEN
    EXECUTE 'GRANT SELECT ON booking_warning_rules TO appuser';
  END IF;
  IF to_regclass('public.site_settings') IS NOT NULL THEN
    EXECUTE 'GRANT SELECT ON site_settings TO appuser';
  END IF;
END
$$;

-- Если бот работает под отдельной ролью, создайте её заранее:
--   CREATE ROLE botuser LOGIN PASSWORD '...';
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'botuser') THEN
    GRANT CONNECT ON DATABASE adventurespool TO botuser;
    GRANT USAGE ON SCHEMA public TO botuser;
    GRANT SELECT ON booking_requests TO botuser;
    GRANT SELECT ON booking_schedule TO botuser;
    GRANT UPDATE (telegram_notified_at) ON booking_requests TO botuser;
  ELSE
    RAISE NOTICE 'Role botuser does not exist, skipping bot grants';
  END IF;
END
$$;
