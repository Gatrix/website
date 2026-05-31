-- Права на booking_schedule для сайта.
-- sudo -u postgres psql -d adventurespool -f adventurespool-booking-schedule-grants.sql

GRANT SELECT, INSERT ON booking_schedule TO appuser;
GRANT USAGE, SELECT ON SEQUENCE booking_schedule_id_seq TO appuser;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'botuser') THEN
    GRANT SELECT ON booking_schedule TO botuser;
  END IF;
END
$$;
