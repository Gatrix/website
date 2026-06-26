# Гильдия ПОЛИГОН

Сайт красноярской гильдии настольных ролевых игр — площадка для записи на живые сессии НРИ с ведущим.

## Пользовательский поток

Главная → каталог приключений → карточка сюжета → форма заявки → `POST /api/booking-requests` → Telegram-бот уведомляет мастера.

## Технологии

| Слой | Технология |
|------|------------|
| Фреймворк | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Анимации | Framer Motion |
| Данные | PostgreSQL (`adventurespool`) |
| Медиа | Yandex Object Storage (постеры и фото; presigned или публичный URL) |
| Уведомления | Telegram booking bot (`services/telegram-booking-bot`) |
| Развёртывание | Docker (Node 20 Alpine) |

## Яндекс.Метрика

Счётчик подключён в `src/components/YandexMetrika.tsx` (SPA: дополнительный `hit` при смене маршрута). Номер по умолчанию: **109390759**.

| Переменная | Описание |
|------------|----------|
| `NEXT_PUBLIC_YANDEX_METRIKA_ID` | ID счётчика (в Docker передаётся на этапе `docker build` через `--build-arg`) |

## PostgreSQL

Контент сайта читается из БД `adventurespool`: приключения, справочники фильтров, пути к фото главной (`site_settings`). Порядок SQL-файлов — `db/MIGRATION_ORDER.md`.

**Каталог:** таблица `adventures` (`adventure_id`, `adventure_name`, `adventure_intro`) и справочники через M2M: `subsettings`, `genres`, `universes`, `gameformat`, `gamesystems`, `tags` (связи `adventure_subsettings`, `adventure_genres`, `adventure_universes`, `adventure_gameformat`, `adventure_gamesystems`, `adventure_tags`).

Таблицы `settings`, `gametime`, `difficulty` и связанные `adventure_*` **удалены** — см. `db/adventurespool-drop-obsolete-lookups.sql`. Сложность и длительность задаются в форме заявки (константы в `src/lib/booking-db.ts`).

Сайт читает каталог через JOIN в `src/lib/adventures-db.ts`. Постеры: **`posters/{adventure_id}.webp`** в Object Storage или `public/posters/`.

**Бронирование:** `GET /api/adventures/[id]/booking-config` — форматы из `adventure_gameformat`+`gameformat`, системы из `adventure_gamesystems`+`gamesystems`. Календарь слотов — `booking_schedule`. Заявки — `booking_requests`.

| Переменная | Описание |
|------------|----------|
| `DATABASE_URL` | Подключение к PostgreSQL |
| `PG_ADVENTURES_TABLE` | Таблица приключений (по умолчанию `adventures`) |
| `PG_ADVENTURES_SCHEMA` | `legacy` — старая плоская таблица; иначе схема adventurespool (по умолчанию) |
| `BOOKING_RATE_LIMIT_MAX` | Максимум заявок с одного IP за окно (по умолчанию 5) |
| `BOOKING_RATE_LIMIT_WINDOW_MS` | Окно rate limit в миллисекундах (по умолчанию 15 минут) |
| `BOOKING_IDEMPOTENCY_TTL_MS` | Сколько хранить ключи повторной отправки в памяти процесса (один процесс Node) |

Фильтры на странице сюжетов: справочники adventurespool → таблица `adventure_options` → `data/adventure-options.json` в бакете → значения из полей приключений.

## Yandex Cloud (Object Storage)

В бакете — изображения (`posters/` и т.д.) и опционально JSON справочника `data/adventure-options.json`.

| Переменная | Описание |
|------------|----------|
| `YC_STORAGE_BUCKET` | Имя бакета |
| `YC_STORAGE_ACCESS_KEY` | Static Access Key |
| `YC_STORAGE_SECRET_KEY` | Secret Key |
| `YC_STORAGE_PREFIX` | Префикс к JSON в бакете, например `data/` |
| `YC_STORAGE_ENDPOINT` | URL (по умолчанию: `https://storage.yandexcloud.net`) |
| `YC_STORAGE_REGION` | Регион (по умолчанию: `ru-central1`) |
| `YC_STORAGE_IMAGES_PREFIX` | Доп. префикс к ключу объекта |
| `YC_STORAGE_IMAGES_BASE` | Базовый URL картинок (сервер) |
| `NEXT_PUBLIC_YC_STORAGE_IMAGES_BASE` | Базовый URL для публичного бакета |
| `NEXT_PUBLIC_YC_STORAGE_IMAGES_PREFIX` | Префикс для публичного URL |

Подпись запросов — AWS4 через встроенный `crypto`.

### Режимы загрузки изображений

- **Приватный бакет:** `YC_STORAGE_BUCKET`, `YC_STORAGE_ACCESS_KEY`, `YC_STORAGE_SECRET_KEY` — presigned URL.
- **Публичный бакет:** `NEXT_PUBLIC_YC_STORAGE_IMAGES_BASE` или `YC_STORAGE_IMAGES_BASE`.
- **Без Object Storage:** файлы в `public/` по путям вроде `posters/имя.webp`.

## Разработка

```bash
npm install
npm run dev
```

Проверки перед релизом:

```bash
npm run typecheck
npm run lint
npm run build
```

Откройте [http://localhost:3000](http://localhost:3000).

## Deploy

Сборка и запуск через Docker (порт 8080):

```bash
docker build -t my-rpg-club --build-arg NEXT_PUBLIC_YANDEX_METRIKA_ID=109390759 .
docker run -p 8080:8080 \
  -e DATABASE_URL=postgresql://... \
  -e YC_STORAGE_BUCKET=... \
  -e YC_STORAGE_ACCESS_KEY=... \
  -e YC_STORAGE_SECRET_KEY=... \
  -e YC_STORAGE_PREFIX=data/ \
  -e YC_STORAGE_IMAGES_PREFIX= \
  my-rpg-club
```

SQL-файлы — `db/MIGRATION_ORDER.md`. Telegram-бот — `services/telegram-booking-bot/README.md`.
