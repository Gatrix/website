# PostgreSQL Migration Order

Canonical production database: `adventurespool`.

Apply SQL manually from the repository root on the VM:

```bash
sudo -u postgres psql -d adventurespool -f db/<file>.sql
```

## Fresh `adventurespool` setup

1. `db/adventurespool-schema.sql` - catalog tables.
2. `db/adventurespool-links-schema.sql` - M2M link tables.
3. `db/seed/gameformat.sql` - форматы игры (имена и описания).
4. `db/seed/adventure-*.sql` - lookup data and link data needed by the catalog.
5. `db/adventurespool-booking-requests.sql` - booking request table used by the public form.
6. `db/adventurespool-booking-schedule.sql` - occupied time intervals for the booking calendar.
7. `db/adventurespool-grants.sql` - minimal app/bot privileges.
8. `db/adventurespool-booking-schedule-grants.sql` - INSERT/SELECT on `booking_schedule`.

## Existing database patches

Apply only patches that are relevant to the current DB state:

1. `db/adventurespool-gameformat-description.sql` - adds `gameformat_description` and fills copy for booking form.
2. `db/adventurespool-gamesystems.sql` - game systems lookup/link setup if missing.
3. `db/adventurespool-booking-requests-migrate-from-legacy.sql` - one-time migration from legacy JSONB `booking_requests`.
4. `db/adventurespool-booking-requests-add-phone.sql` - adds `phone` to older booking tables.
5. `db/adventurespool-booking-schedule.sql` - adds `booking_schedule` and `booking_requests.starts_at` if missing.
6. `db/adventurespool-booking-requests-add-starts-at.sql` - adds `starts_at` if `booking_schedule` exists but the column on `booking_requests` is missing.
7. `db/adventurespool-booking-production-patch.sql` - one-shot fix: `starts_at` + `booking_schedule` grants (run if booking form returns 503).
8. `db/adventurespool-booking-requests-grants.sql` - grants fix for existing booking tables.
9. `db/adventurespool-booking-schedule-grants.sql` - grants for schedule table.
10. `db/adventurespool-grants.sql` - final least-privilege grants after roles are created.

## Roles

Create roles with passwords outside migration files:

```sql
CREATE ROLE appuser LOGIN PASSWORD '...';
CREATE ROLE botuser LOGIN PASSWORD '...';
```

`appuser` is used by the Next.js app. `botuser` is used by the Telegram worker and only needs to read `booking_requests` and update `telegram_notified_at`.
