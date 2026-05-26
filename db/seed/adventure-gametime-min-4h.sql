-- Убрать короткие сессии (1–3 ч): минимум 4 часа на игру.
-- sudo -u postgres psql -d adventurespool -f adventure-gametime-min-4h.sql

DELETE FROM adventure_gametime
WHERE gametime_id IN ('1', '2', '3');
