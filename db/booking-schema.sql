-- Legacy/совместимость: схема для формы заявки и хранения заявок.
-- В текущем режиме параметры формы берутся из `adventurespool` (endpoint `/api/adventures/[id]/booking-config`),
-- а здесь хранятся таблицы заявок (`booking_requests`) и (опционально) предупреждения/правила (`booking_warnings`, `booking_warning_rules`).
-- Тип `adventure_id` должен совпадать с типом `adventures.id`/`adventurespool.adventures.adventure_id` (часто TEXT или UUID).

CREATE TABLE IF NOT EXISTS game_systems (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS adventure_game_systems (
  adventure_id TEXT NOT NULL,
  game_system_id INTEGER NOT NULL REFERENCES game_systems (id) ON DELETE CASCADE,
  PRIMARY KEY (adventure_id, game_system_id)
);

CREATE INDEX IF NOT EXISTS idx_adventure_game_systems_adventure ON adventure_game_systems (adventure_id);

-- Диапазоны для ползунков «игроки» и «длительность одной сессии» (часы).
CREATE TABLE IF NOT EXISTS adventure_booking_bounds (
  adventure_id TEXT PRIMARY KEY,
  min_players INTEGER NOT NULL DEFAULT 3,
  max_players INTEGER NOT NULL DEFAULT 6,
  min_duration_hours NUMERIC(4, 1) NOT NULL DEFAULT 3.0,
  max_duration_hours NUMERIC(4, 1) NOT NULL DEFAULT 8.0
);

-- Пояснения к режимам: ваншот / приключение / кампания (можно переопределить из БД).
CREATE TABLE IF NOT EXISTS game_format_info (
  format_id TEXT PRIMARY KEY CHECK (format_id IN ('oneshot', 'adventure', 'campaign')),
  title TEXT NOT NULL,
  description TEXT NOT NULL
);

INSERT INTO game_format_info (format_id, title, description) VALUES
(
  'oneshot',
  'Ваншот',
  'Одна завершённая история за столом: приходите с нуля и за вечер получаете цельный опыт. Идеально, чтобы познакомиться с миром и правилами без долгих обязательств.'
),
(
  'adventure',
  'Приключение',
  'Несколько связанных сессий с общим сюжетом и развитием персонажей. Баланс между глубиной истории и понятным горизонтом планирования.'
),
(
  'campaign',
  'Кампания',
  'Долгая арка: растущие ставки, побочные линии и память мира между встречами. Требует стабильного состава и терпения к паузам между играми.'
)
ON CONFLICT (format_id) DO NOTHING;

-- Тексты предупреждений по id.
CREATE TABLE IF NOT EXISTS booking_warnings (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL
);

-- Правила: какие комбинации выбора показывают предупреждение.
-- adventure_id NULL — правило для всех приключений; иначе только для указанного.
-- match_json — условия «И»: все перечисленные поля должны совпасть с выбором игрока.
-- Пример: {"adventureType":"oneshot","durationHours":4}
-- Допускаются durationHours (точное значение), minDurationHours / maxDurationHours, playerCount, adventureType.
CREATE TABLE IF NOT EXISTS booking_warning_rules (
  id SERIAL PRIMARY KEY,
  warning_id INTEGER NOT NULL REFERENCES booking_warnings (id) ON DELETE CASCADE,
  adventure_id TEXT,
  match_json JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_booking_warning_rules_adv ON booking_warning_rules (adventure_id);

-- Хранение заявок (бот на ВМ может читать из таблицы или вызывать вебхук отдельно).
CREATE TABLE IF NOT EXISTS booking_requests (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
  adventure_id TEXT NOT NULL,
  adventure_title TEXT,
  payload JSONB NOT NULL,
  warning_ids INTEGER[] DEFAULT '{}',
  client_meta JSONB
);

CREATE INDEX IF NOT EXISTS idx_booking_requests_created ON booking_requests (created_at DESC);

-- Пример предупреждения и правила (раскомментируйте при необходимости):
-- INSERT INTO booking_warnings (message) VALUES
--   ('Ваншот на 4 часа часто ощущается сжатым: мало времени на раскрытие персонажей и финал. Рассмотрите 5–6 часов или формат «приключение».');
-- INSERT INTO booking_warning_rules (warning_id, adventure_id, match_json)
-- VALUES (1, NULL, '{"adventureType":"oneshot","durationHours":4}'::jsonb);
