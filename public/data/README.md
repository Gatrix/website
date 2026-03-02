# Данные (локально или Yandex Object Storage)

Если не заданы переменные `YC_STORAGE_*`, данные читаются и пишутся из этой папки.

## users.json

Пользователи для входа. Пароли хранятся в виде bcrypt-хешей.

**Демо-пользователь:**
- Email: `demo@polygon.local`
- Пароль: `123456`

Для добавления нового пользователя вручную сгенерируйте хеш:
```bash
node -e "console.log(require('bcryptjs').hashSync('ваш_пароль', 10))"
```

## adventures.json

Список приключений. Поля: `id`, `title`, `poster`, `intro` (описание для игроков на карточке), `description` (сюжет для ведущего), `base_setting`, `subsetting`, `genre` (массив), `universe`, `difficulty`, `adventure_type`. Допустимые значения — в `adventure-options.json`.

Постеры: в Object Storage — `posters/ИмяФайла.webp` (или через префикс `YC_STORAGE_IMAGES_PREFIX`); локально — `public/posters/` при пути `posters/...`.

## adventure-options.json

Справочник допустимых значений для фильтров и при создании приключений:
- `base_setting` — базовые сеттинги
- `setting_relations` — связь базовый → подсеттинги
- `subsetting` — конкретные сеттинги
- `genre` — массив жанров (например, `["Путешествие", "Детектив"]`)
- `universe` — вселенные
- `difficulty` — сложность: 💀, 💀💀, 💀💀💀

---

## Yandex Object Storage

Для продакшена задайте в окружении:
- `YC_STORAGE_BUCKET` — имя бакета
- `YC_STORAGE_ACCESS_KEY` — Static Access Key
- `YC_STORAGE_SECRET_KEY` — Secret Key
- `YC_STORAGE_PREFIX` — префикс (например, `data/` для JSON)
- `YC_STORAGE_IMAGES_PREFIX` — префикс для posters/photos (по умолчанию пусто = в корне бакета)
- `NEXT_PUBLIC_YC_STORAGE_IMAGES_PREFIX` — префикс для публичного URL картинок (если используется `NEXT_PUBLIC_YC_STORAGE_IMAGES_BASE`)
- `NEXT_PUBLIC_YC_STORAGE_IMAGES_BASE` — базовый URL для картинок (например, `https://storage.yandexcloud.net/polygon-ttrpg`)

Файлы `adventures.json`, `adventure-options.json` и `users.json` — в папке `data/`. Постеры и фото — в корне бакета (`posters/`, `photos/`) либо под префиксом `YC_STORAGE_IMAGES_PREFIX`.
