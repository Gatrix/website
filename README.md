# Гильдия ПОЛИГОН

Сайт красноярской гильдии настольных ролевых игр — площадка для записи на живые сессии НРИ с ведущим.

## ⚠️ Временно отключено (раскомментировать позже)

Следующие функции **закомментированы** и не работают:
- **Авторизация** (вход/регистрация) — `src/app/login/page.tsx`, `src/components/Header.tsx`, `src/app/layout.tsx`
- **Личные кабинеты** (профиль) — `src/app/profile/page.tsx`
- **Бронирование** — `src/components/BookingDrawer.tsx`, `src/app/schedule/ScheduleClient.tsx`

Сейчас активны только: главная, сюжеты, календарь с открытыми/закрытыми слотами (день/вечер), страница «Гильдия».

## Технологии

| Слой | Технология |
|------|------------|
| Фреймворк | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Анимации | Framer Motion |
| Авторизация | NextAuth v5 (Credentials, JWT) |
| Пароли | bcryptjs |
| Данные | PostgreSQL |
| Медиа | Yandex Object Storage (постеры и фото; presigned или публичный URL) |
| Развёртывание | Docker (Node 20 Alpine) |

## PostgreSQL

Контент сайта читается из БД: приключения, пользователи, опционально справочник фильтров (`adventure_options`), пути к фото главной (`site_settings`). Порядок для фильтров сюжетов: таблица `adventure_options` → иначе файл **`data/adventure-options.json` в Object Storage** (нужны `YC_STORAGE_*` и `YC_STORAGE_PREFIX=data/`) → иначе значения **выводятся из полей приключений**. Пример таблиц — `db/schema.sql`.

**Нормализованная схема приключений:** в `adventures` хранятся FK (`base_setting_id`, `subsetting_id`, `universe_id`, жанры через `adventure_genres` → `genres`, `difficulty_id`, `adventure_type_id` как строка `oneshot` / `adventure` / `campaign`, и т.д.). Сайт делает JOIN к справочникам и подставляет **подписи** для карточек и фильтров. Файл `adventure-options.json` в бакете задаёт **полный список** вариантов фильтров и связи базовый/подсеттинг; в БД — только ссылки по id на строки тех же сущностей.

Если в справочнике колонка называется иначе, чем в коде по умолчанию, задайте переменные: `PG_LOOKUP_BASE_SETTINGS_COLUMN`, `PG_LOOKUP_SUBSETTINGS_COLUMN`, `PG_LOOKUP_UNIVERSES_COLUMN`, `PG_LOOKUP_GENRES_COLUMN` (часто `name`), `PG_LOOKUP_SESSION_DURATIONS_COLUMN`, `PG_LOOKUP_PLAYER_COUNTS_COLUMN` (часто `label`), `PG_LOOKUP_DIFFICULTIES_COLUMN` (по умолчанию временно `id` — лучше заменить на колонку с человекочитаемой сложностью). Отключить JOIN: `PG_ADVENTURES_NORMALIZED=0`. Постер: `PG_ADVENTURES_POSTER_COLUMN`. Запрос — `src/lib/adventures-db.ts`.

Нужна переменная `DATABASE_URL`.

## Yandex Cloud (Object Storage)

В бакете — **изображения** (постеры в `posters/` и т.д.) и опционально **JSON справочника фильтров** `data/adventure-options.json`. Картинки — presigned или публичный URL; JSON читается сервером по ключу `YC_STORAGE_PREFIX` + `adventure-options.json`, если в PostgreSQL нет таблицы `adventure_options`.

| Переменная | Описание |
|------------|----------|
| `YC_STORAGE_BUCKET` | Имя бакета |
| `YC_STORAGE_ACCESS_KEY` | Static Access Key |
| `YC_STORAGE_SECRET_KEY` | Secret Key |
| `YC_STORAGE_PREFIX` | Префикс к JSON в бакете, например `data/` → объект `data/adventure-options.json` |
| `YC_STORAGE_ENDPOINT` | URL (по умолчанию: `https://storage.yandexcloud.net`) |
| `YC_STORAGE_REGION` | Регион (по умолчанию: `ru-central1`) |
| `YC_STORAGE_IMAGES_PREFIX` | Доп. префикс к ключу объекта (обычно пусто, путь уже в поле БД) |
| `YC_STORAGE_IMAGES_BASE` | Базовый URL картинок (сервер), альтернатива `NEXT_PUBLIC_*` |
| `NEXT_PUBLIC_YC_STORAGE_IMAGES_BASE` | Базовый URL для публичного бакета |
| `NEXT_PUBLIC_YC_STORAGE_IMAGES_PREFIX` | Префикс для публичного URL (опционально) |

Подпись запросов — AWS4 через встроенный `crypto` (без AWS SDK v3).

### Режимы загрузки изображений

- **Приватный бакет (рекомендуется)**: заданы `YC_STORAGE_BUCKET`, `YC_STORAGE_ACCESS_KEY`, `YC_STORAGE_SECRET_KEY` — сервер генерирует presigned URL (в том числе при `npm run dev`, если ключи в `.env.local`).
- **Публичный бакет**: задайте `NEXT_PUBLIC_YC_STORAGE_IMAGES_BASE` или `YC_STORAGE_IMAGES_BASE` (и при необходимости `NEXT_PUBLIC_YC_STORAGE_IMAGES_PREFIX`).
- **Без Object Storage**: только файлы в `public/` по путям вроде `posters/имя.webp`.

Серверная переменная `YC_STORAGE_IMAGES_BASE` дублирует смысл `NEXT_PUBLIC_*` для URL, которые собираются только на сервере (как у постеров).

### Связка сайт + PostgreSQL + бакет (чеклист)

1. **PostgreSQL** — в `.env.local` / на сервере задан `DATABASE_URL`. Сайт и БД в одной сети (или публичный доступ к Postgres с вашей машины / ВМ с Docker).
2. **Таблица приключений** — в строке есть поле с именем файла постера (`poster` или `img_url`). Если в БД только имя файла (`Foo.webp`), приложение само подставит ключ объекта `posters/Foo.webp` в бакете.
3. **Совпадение имён** — объект в бакете должен называться **точно так же**, как в БД (с учётом регистра), плюс префикс папки `posters/` в консоли Yandex.
4. **Картинки из бакета** — выберите один вариант:
   - **Приватный бакет:** `YC_STORAGE_BUCKET`, `YC_STORAGE_ACCESS_KEY`, `YC_STORAGE_SECRET_KEY` (сервисный аккаунт → статический ключ). Поле `YC_STORAGE_IMAGES_PREFIX` оставьте **пустым**, если в БД уже полный путь `posters/...`.
   - **Публичный доступ к чтению:** в консоли для префикса `posters/` включён публичный read, и задан базовый URL, например `https://storage.yandexcloud.net/polygon-ttrpg` или `https://polygon-ttrpg.storage.yandexcloud.net`.
5. **Перезапуск** — после смены `.env.local` остановите и снова запустите `npm run dev`.

**Что прислать для отладки (без секретов):** хост БД (доступен ли с машины, где крутится Next), имя бакета, формат значения `poster` в одной строке из БД, включён ли публичный доступ к `posters/` или используете только ключи, и фрагмент **готового** URL картинки из DevTools (Network → запрос к `.webp` — домен и путь, без query-параметров подписи можно замазать).

---

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy

Сборка и запуск через Docker (порт 8080):

```bash
docker build -t my-rpg-club .
docker run -p 8080:8080 \
  -e DATABASE_URL=postgresql://... \
  -e AUTH_SECRET=... \
  -e YC_STORAGE_BUCKET=... \
  -e YC_STORAGE_ACCESS_KEY=... \
  -e YC_STORAGE_SECRET_KEY=... \
  -e YC_STORAGE_PREFIX=data/ \
  -e YC_STORAGE_IMAGES_PREFIX= \
  my-rpg-club
```

Для картинок из приватного бакета задайте `YC_STORAGE_*`; текст и сущности — в PostgreSQL.
