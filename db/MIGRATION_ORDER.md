# PostgreSQL Migration Order

Canonical production database: `adventurespool`.

Apply SQL manually from the repository root on the VM:

```bash
sudo -u postgres psql -d adventurespool -f db/<file>.sql
```

## Fresh `adventurespool` setup

1. `db/adventurespool-schema.sql` — catalog tables and M2M link tables (single source of truth).
2. `db/adventurespool-links-schema.sql` — optional no-op if step 1 was applied (kept for older runbooks).
3. `db/seed/gameformat.sql` — game formats (names and descriptions for the booking form).
4. `db/seed/adventure-*.sql` — lookup data and link rows for the catalog (see list below).
5. `db/adventurespool-booking-requests.sql` — booking request table used by the public form.
6. `db/adventurespool-booking-schedule.sql` — occupied time intervals for the booking calendar.
7. `db/adventurespool-grants.sql` — least-privilege app/bot grants (table-level).
8. `db/adventurespool-booking-schedule-grants.sql` — INSERT/SELECT on `booking_schedule` if not covered in step 7.

### Required seed files (after obsolete lookups are dropped)

Do **not** seed `settings`, `gametime`, or `difficulty` — those tables were removed by `adventurespool-drop-obsolete-lookups.sql`.

Apply in this order:

1. `db/seed/tags.sql`
2. `db/seed/adventure-subsettings.sql`
3. `db/seed/adventure-genres.sql`
4. `db/seed/adventure-universes.sql`
5. `db/seed/adventure-gameformat.sql`
6. `db/seed/adventure-gamesystems.sql` (or `adventure-gamesystems-migration.sql` on existing DBs)
7. `db/seed/adventure-tags.sql`
8. `db/seed/reorder-adventure-links.sql` — optional ordering fix

Booking schedule demo blocks (optional): `db/seed/booking-schedule-*.sql`.

## Existing database patches

Apply only patches that are relevant to the current DB state:

1. `db/adventurespool-drop-obsolete-lookups.sql` — drops `settings`, `gametime`, `difficulty` and related `adventure_*` link tables. Re-run required seeds above if links were lost.
2. `db/adventurespool-gameformat-description.sql` — adds `gameformat_description` and fills copy for booking form.
3. `db/adventurespool-gamesystems.sql` — game systems lookup/link setup if missing.
4. `db/adventurespool-booking-requests-migrate-from-legacy.sql` — one-time migration from legacy JSONB `booking_requests`.
5. `db/adventurespool-booking-requests-add-phone.sql` — adds `phone` to older booking tables.
6. `db/adventurespool-booking-schedule.sql` — adds `booking_schedule` and `booking_requests.starts_at` if missing.
7. `db/adventurespool-booking-requests-add-starts-at.sql` — adds `starts_at` if `booking_schedule` exists but the column on `booking_requests` is missing.
8. `db/adventurespool-booking-production-patch.sql` — one-shot fix: `starts_at` + `booking_schedule` grants (run if booking form returns 503).
9. `db/adventurespool-booking-requests-grants.sql` — grants fix for existing booking tables.
10. `db/adventurespool-booking-schedule-grants.sql` — grants for schedule table.
11. `db/adventurespool-grants.sql` — final least-privilege grants after roles are created.
12. `db/adventurespool-fallout.sql` — NFC board phrases (`fallout`: character_name + text).

## Roles

Create roles with passwords outside migration files:

```sql
CREATE ROLE appuser LOGIN PASSWORD '...';
CREATE ROLE botuser LOGIN PASSWORD '...';
```

`appuser` is used by the Next.js app. `botuser` is used by the Telegram worker and only needs to read `booking_requests` and update `telegram_notified_at`.
