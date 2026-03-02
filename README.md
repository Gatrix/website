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
| Данные | JSON-файлы (локально или Yandex Object Storage) |
| Развёртывание | Docker (Node 20 Alpine) |

## Yandex Cloud (Object Storage)

Данные (`users.json`, `adventures.json`) могут храниться в **Yandex Object Storage** (S3-совместимый API). Для этого задайте переменные окружения:

| Переменная | Описание |
|------------|----------|
| `YC_STORAGE_BUCKET` | Имя бакета |
| `YC_STORAGE_ACCESS_KEY` | Static Access Key |
| `YC_STORAGE_SECRET_KEY` | Secret Key |
| `YC_STORAGE_ENDPOINT` | URL (по умолчанию: `https://storage.yandexcloud.net`) |
| `YC_STORAGE_REGION` | Регион (по умолчанию: `ru-central1`) |
| `YC_STORAGE_PREFIX` | Префикс пути в бакете (например, `data/`) |
| `YC_STORAGE_IMAGES_PREFIX` | Префикс для `posters/photos` (по умолчанию пустой = корень бакета) |
| `NEXT_PUBLIC_YC_STORAGE_IMAGES_BASE` | Базовый URL картинок для публичного бакета |
| `NEXT_PUBLIC_YC_STORAGE_IMAGES_PREFIX` | Префикс картинок для публичного URL (опционально) |

Если переменные не заданы — данные читаются и пишутся из локальной папки `data/`.

Реализация использует собственный AWS4 signing (подпись запросов через Node.js crypto), чтобы избежать несовместимости AWS SDK v3 с Yandex Object Storage.

### Режимы загрузки изображений

- **Приватный бакет (рекомендуется)**: заданы `YC_STORAGE_BUCKET`, `YC_STORAGE_ACCESS_KEY`, `YC_STORAGE_SECRET_KEY` — сервер генерирует presigned URL.
- **Публичный бакет**: задайте `NEXT_PUBLIC_YC_STORAGE_IMAGES_BASE` (и при необходимости `NEXT_PUBLIC_YC_STORAGE_IMAGES_PREFIX`), изображения отдаются по прямым URL.
- **Локальная разработка без Object Storage**: используется путь вида `/<poster-or-photo-path>` из `public/`.

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
  -e AUTH_SECRET=... \
  -e YC_STORAGE_BUCKET=... \
  -e YC_STORAGE_ACCESS_KEY=... \
  -e YC_STORAGE_SECRET_KEY=... \
  -e YC_STORAGE_PREFIX=data/ \
  -e YC_STORAGE_IMAGES_PREFIX= \
  my-rpg-club
```

Для продакшена на Yandex Cloud задайте переменные `YC_STORAGE_*` — данные будут храниться в Object Storage.
