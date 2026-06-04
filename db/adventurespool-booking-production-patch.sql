-- Патч для production: заявки с календарём не сохраняются, если
--   • в booking_requests нет starts_at;
--   • у appuser нет прав на booking_schedule_id_seq.
--
-- sudo -u postgres psql -d adventurespool -f adventurespool-booking-production-patch.sql

ALTER TABLE booking_requests
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;

COMMENT ON COLUMN booking_requests.starts_at IS 'Выбранное игроком время начала игры';

UPDATE booking_requests br
SET starts_at = bs.starts_at
FROM booking_schedule bs
WHERE bs.booking_request_id = br.id
  AND br.starts_at IS NULL;

GRANT SELECT, INSERT ON booking_schedule TO appuser;
GRANT USAGE, SELECT ON SEQUENCE booking_schedule_id_seq TO appuser;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'botuser') THEN
    GRANT SELECT ON booking_schedule TO botuser;
  END IF;
END
$$;
