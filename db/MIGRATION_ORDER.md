# PostgreSQL Migration Order

Canonical production database: `adventurespool`.

Apply SQL manually from the repository root on the VM:

```bash
sudo -u postgres psql -d adventurespool -f db/<file>.sql
```

## Fresh `adventurespool` setup

1. `db/adventurespool-schema.sql` - catalog tables.
2. `db/adventurespool-links-schema.sql` - M2M link tables.
3. `db/seed/adventure-*.sql` - lookup data and link data needed by the catalog.
4. `db/adventurespool-booking-requests.sql` - booking request table used by the public form.
5. `db/adventurespool-booking-schedule.sql` - occupied time intervals for the booking calendar.
6. `db/adventurespool-grants.sql` - minimal app/bot privileges.
7. `db/adventurespool-booking-schedule-grants.sql` - INSERT/SELECT on `booking_schedule`.

## Existing database patches

Apply only patches that are relevant to the current DB state:

1. `db/adventurespool-gamesystems.sql` - game systems lookup/link setup if missing.
2. `db/adventurespool-booking-requests-migrate-from-legacy.sql` - one-time migration from legacy JSONB `booking_requests`.
3. `db/adventurespool-booking-requests-add-phone.sql` - adds `phone` to older booking tables.
4. `db/adventurespool-booking-schedule.sql` - adds `booking_schedule` and `booking_requests.starts_at` if missing.
5. `db/adventurespool-booking-requests-grants.sql` - grants fix for existing booking tables.
6. `db/adventurespool-booking-schedule-grants.sql` - grants for schedule table.
7. `db/adventurespool-grants.sql` - final least-privilege grants after roles are created.

## Roles

Create roles with passwords outside migration files:

```sql
CREATE ROLE appuser LOGIN PASSWORD '...';
CREATE ROLE botuser LOGIN PASSWORD '...';
```

`appuser` is used by the Next.js app. `botuser` is used by the Telegram worker and only needs to read `booking_requests` and update `telegram_notified_at`.
