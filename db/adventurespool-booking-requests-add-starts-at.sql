-- Время начала игры в заявке (если таблица создана до booking_schedule).
-- sudo -u postgres psql -d adventurespool -f adventurespool-booking-requests-add-starts-at.sql

ALTER TABLE booking_requests
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;

COMMENT ON COLUMN booking_requests.starts_at IS 'Выбранное игроком время начала игры';

-- Заполнить из booking_schedule для уже созданных заявок.
UPDATE booking_requests br
SET starts_at = bs.starts_at
FROM booking_schedule bs
WHERE bs.booking_request_id = br.id
  AND br.starts_at IS NULL;
