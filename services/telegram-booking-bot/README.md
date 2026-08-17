# Telegram-бот: заявки из `adventurespool.booking_requests`

Сайт сохраняет заявку в PostgreSQL. Бот на ВМ каждые **15 секунд** (по умолчанию, `POLL_INTERVAL_MS=15000`) ищет строки без `telegram_notified_at`, помечает их в БД и отправляет сообщение в Telegram.

## 1. Таблица в БД

На ВМ:

```bash
sudo -u postgres psql -d adventurespool -f /path/to/db/adventurespool-booking-requests.sql
```

Если раньше была старая таблица с колонкой `payload` (из `booking-schema.sql`), см. `db/adventurespool-booking-requests-migrate-from-legacy.sql`.

## 2. Бот в Telegram

1. [@BotFather](https://t.me/BotFather) → `/newbot` → токен.
2. Узнать `chat_id`: [@userinfobot](https://t.me/userinfobot) или `getUpdates` после сообщения боту.

## 3. Установка на ВМ

```bash
cd /opt/my-rpg-club/services/telegram-booking-bot
npm install
cp .env.example .env
nano .env   # TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, DATABASE_URL

node index.mjs   # запускать из этой папки, где лежит .env
# отправьте тестовую заявку с сайта — в Telegram должно прийти сообщение
```

### Постоянный запуск (systemd)

Чтобы бот работал после закрытия SSH и перезагрузки ВМ:

```bash
# 1. Пути в unit-файле должны совпадать с вашей папкой
which node   # обычно /usr/bin/node — если другой, поправьте ExecStart в .service

# 2. Установить службу
sudo cp /opt/my-rpg-club/services/telegram-booking-bot/telegram-booking-bot.service /etc/systemd/system/
# Если папка не в /opt/my-rpg-club/services/telegram-booking-bot — отредактируйте пути в .service:
#   sudo nano /etc/systemd/system/telegram-booking-bot.service

sudo systemctl daemon-reload
sudo systemctl enable telegram-booking-bot
sudo systemctl start telegram-booking-bot

# 3. Проверка
sudo systemctl status telegram-booking-bot
```

Логи: `journalctl -u telegram-booking-bot -f`  
Остановить: `sudo systemctl stop telegram-booking-bot`  
Перезапустить после правки .env: `sudo systemctl restart telegram-booking-bot`

## 4. Сайт

В `.env.local` достаточно подключения к той же БД:

```env
DATABASE_URL=postgresql://appuser:…@host:5432/adventurespool
```

Для бота лучше использовать отдельную роль:

```env
DATABASE_URL=postgresql://botuser:…@host:5432/adventurespool
```

Права выдаются через `db/adventurespool-grants.sql` после создания роли `botuser`.
Для даты и времени игры боту также нужен `SELECT` на `booking_schedule` (есть в `db/adventurespool-booking-schedule-grants.sql` и в `adventurespool-grants.sql`).

Вебхук не нужен — бот сам читает таблицу.

После обновления кода на ВМ перезапустите службу: `sudo systemctl restart telegram-booking-bot`.

## 5. Проверка

```bash
# на ВМ, от appuser или postgres
psql -d adventurespool -c "
  SELECT br.id, br.adventure_title, br.starts_at, bs.starts_at AS schedule_starts_at, br.telegram_notified_at
  FROM booking_requests br
  LEFT JOIN booking_schedule bs ON bs.booking_request_id = br.id AND bs.status <> 'cancelled'
  ORDER BY br.id DESC LIMIT 5;"
```

После успешной отправки у строки появится `telegram_notified_at`. Если отправка в Telegram не удалась, поле остаётся `NULL` и бот повторит попытку.

## 6. Если заявки пишутся в БД, а в Telegram тишина

С ВМ в РФ исходящий HTTPS до `api.telegram.org` часто отваливается по таймауту (`ETIMEDOUT`). Проверка:

```bash
curl -4 -I --max-time 10 https://api.telegram.org
```

Если таймаут, нужен SOCKS5 за пределы блокировки. На этой ВМ используется Cloudflare WARP в режиме локального прокси (`127.0.0.1:40000`), без смены маршрутов всей машины:

```bash
warp-cli --accept-tos status
curl --proxy socks5h://127.0.0.1:40000 -4 -I --max-time 15 https://api.telegram.org
```

В `.env` бота:

```env
TELEGRAM_SOCKS_PROXY=127.0.0.1:40000
```

Затем `sudo systemctl restart telegram-booking-bot`.

Не ставьте WARP в режим `warp` (полный туннель) — можно потерять SSH. Нужен только `mode proxy`.
