# Документация по работе (актуально на `adventurespool`)

## Основная БД: `adventurespool`

Контент для сайта берётся из:

- `adventures(adventure_id, adventure_name, adventure_intro)`
- справочников: `subsettings`, `universes`, `genres`, `gameformat`, `gamesystems`, `tags`
- связей M2M (таблицы вида `adventure_*`):
  - `adventure_subsettings`, `adventure_universes`, `adventure_genres`
  - `adventure_gameformat` (oneshot/adventure/campaign)
  - `adventure_gamesystems` (системы, доступные для конкретного приключения)
  - `adventure_tags`

Устаревшие таблицы `settings`, `gametime`, `difficulty` и связанные `adventure_settings`, `adventure_gametime`, `adventure_difficulty` удаляются патчем `db/adventurespool-drop-obsolete-lookups.sql`. Сложность и длительность сессии задаются в форме заявки (см. `src/lib/booking-db.ts`).

### `adventure_gamesystems` (выбор системы на бронировании)

В таблице `gamesystems` лежат и полные, и упрощённые версии систем:

- полная: например `original-full`, `dnd5e`, `pathfinder2e`
- упрощённая: те же id с суффиксом `-simple` (например `dnd5e-simple`)

`adventure_gamesystems` задаёт доступные системы конкретному приключению.

## Бронирование

### Конфиг формы

`GET /api/adventures/[id]/booking-config`

Источник данных в `adventurespool`:

- сложности и длительность — константы в приложении (`DEFAULT_DIFFICULTIES`, фиксированные часы 4–7)
- формат: `adventure_gameformat` + `gameformat`
- система: `adventure_gamesystems` + `gamesystems`

### Календарь слотов

Таблица `booking_schedule` — занятые интервалы. API: `GET /api/booking-schedule/availability`.

### Заявка

Таблица **`booking_requests`** — схема `db/adventurespool-booking-requests.sql`.

Поток: `POST /api/booking-requests` → INSERT → бот на ВМ опрашивает строки с `telegram_notified_at IS NULL`.

Сайт — роль `appuser`, бот — `botuser` с минимальными правами. Порядок SQL: `db/MIGRATION_ORDER.md`.

Опционально предупреждения в legacy-режиме: `booking_warnings`, `booking_warning_rules` (`db/booking-schema.sql`).

Установка бота: `services/telegram-booking-bot/README.md`

## NFC / Fallout board

Таблица **`fallout`** (`character_name`, `text`) в БД `adventurespool` — фразы для планшета.

- `/board` — «Приложись ко мне!»
- `/board/technik`, `/board/boets`, `/board/dozornyy`, `/board/tyagach`, `/board/ten`, `/board/litso` — текст персонажа из БД; через 10 с возврат на `/board`

SQL: `db/adventurespool-fallout.sql`.

## ВМ и миграции

SSH-доступ и хост production-ВМ хранятся в приватном runbook (не в репозитории).

Миграции БД на сервере:

```bash
sudo -u postgres psql -d adventurespool -f db/<файл>.sql
```

См. `db/MIGRATION_ORDER.md`.

## Legacy-режим

`PG_ADVENTURES_SCHEMA=legacy` — совместимость со старой плоской таблицей приключений и таблицами из `db/booking-schema.sql`.
