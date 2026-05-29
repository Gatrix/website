-- Телефон в заявках (если таблица уже создана без колонки phone).
-- sudo -u postgres psql -d adventurespool -f adventurespool-booking-requests-add-phone.sql

ALTER TABLE booking_requests
  ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '';

ALTER TABLE booking_requests
  ALTER COLUMN phone DROP DEFAULT;

COMMENT ON COLUMN booking_requests.phone IS 'Телефон игрока в формате +7XXXXXXXXXX';
