-- Описания форматов игры (ваншот / приключение / кампания).
-- sudo -u postgres psql -d adventurespool -f db/adventurespool-gameformat-description.sql

ALTER TABLE gameformat
  ADD COLUMN IF NOT EXISTS gameformat_description TEXT NOT NULL DEFAULT '';

ALTER TABLE gameformat
  ALTER COLUMN gameformat_description DROP DEFAULT;

UPDATE gameformat
SET gameformat_description = 'Игра на одну встречу. Быстрый старт, простая цель, минимум подготовки. Прекрасно подходит новичкам как отправная точка в мир НРИ.'
WHERE gameformat_id = 'oneshot';

UPDATE gameformat
SET gameformat_description = 'Законченная история длиной в несколько встреч. Сбалансированный вариант. Идеально для знакомства с правилами и миром игры.'
WHERE gameformat_id = 'adventure';

UPDATE gameformat
SET gameformat_description = 'Длинная история на десятки игровых встреч. Глубокий сюжет и персонажи, развитие игроков. Для создания историй, о которых помнят всю жизнь.'
WHERE gameformat_id = 'campaign';

COMMENT ON COLUMN gameformat.gameformat_description IS 'Текст для формы бронирования под выбором формата игры';
