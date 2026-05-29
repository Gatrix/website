-- Права appuser на заявки (если таблица уже создана, а INSERT падает с
-- "permission denied for sequence booking_requests_id_seq").
-- sudo -u postgres psql -d adventurespool -f adventurespool-booking-requests-grants.sql

GRANT SELECT, INSERT, UPDATE ON booking_requests TO appuser;
GRANT USAGE, SELECT ON SEQUENCE booking_requests_id_seq TO appuser;
