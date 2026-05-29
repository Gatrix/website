# Документация по работе (актуально на `adventurespool`)

## Основная БД: `adventurespool`
Мы работаем с PostgreSQL каталогом `adventurespool`.
Контент для сайта берётся из:

- `adventures(adventure_id, adventure_name, adventure_intro)`
- справочников: `settings`, `subsettings`, `universes`, `genres`, `difficulty`, `gametime`, `gameformat`, `gamesystems`, `tags`
- связей M2M (таблицы вида `adventure_*`):
  - `adventure_settings`, `adventure_subsettings`
  - `adventure_universes`, `adventure_genres`
  - `adventure_difficulty` (difficulty_id = `narrative`/`tactic`)
  - `adventure_gametime` (gametime_id = длительность сессии)
  - `adventure_gameformat` (oneshot/adventure/campaign)
  - `adventure_gamesystems` (список систем доступных для конкретного приключения)
  - `adventure_tags`

### `adventure_gamesystems` (выбор системы на бронировании)
В таблице `gamesystems` лежат и полные, и упрощенные версии систем:

- полная: например `original-full`, `dnd5e`, `pathfinder2e`
- упрощенная: те же id с суффиксом `-simple` (например `dnd5e-simple`)

`adventure_gamesystems` задаёт доступные системы конкретному приключению.
В интерфейсе бронирования показывается список из `adventure_gamesystems` + `gamesystems`.

### `adventure_gametime` (длительность сессии)
Наполнение в `adventure_gametime` соответствует требованию: минимум 4 часа.
Поэтому для приключений используются только `gametime_id` 4..8.

## Бронирование
### Конфиг формы
Параметры формы берутся из API:

- `GET /api/adventures/[id]/booking-config`

Источник данных в `adventurespool`:

- сложности: `adventure_difficulty` + `difficulty`
- длительность: `adventure_gametime` + `gametime`
- формат: `adventure_gameformat` + `gameformat`
- система (на конкретное приключение): `adventure_gamesystems` + `gamesystems`

### Заявка
Таблица в `adventurespool`: **`booking_requests`** — схема `db/adventurespool-booking-requests.sql`.

Колонки: приключение, система, сложность, вселенная, игроки, длительность, формат, комментарий (Telegram), предупреждения, `telegram_notified_at` (когда бот отправил уведомление).

Поток: `POST /api/booking-requests` → INSERT → бот на ВМ опрашивает строки с `telegram_notified_at IS NULL`.

Опционально предупреждения в legacy-режиме: `booking_warnings`, `booking_warning_rules` (`db/booking-schema.sql`).

Установка бота: `services/telegram-booking-bot/README.md`

## Legacy-режим
Совместимость со старой схемой включается переменной:

- `PG_ADVENTURES_SCHEMA=legacy`

В legacy-режиме набор таблиц для параметров бронирования отличается (используются таблицы из `db/booking-schema.sql`).
