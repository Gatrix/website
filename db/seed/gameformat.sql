-- Справочник gameformat (имена и описания для формы бронирования).
INSERT INTO gameformat (gameformat_id, gameformat_name, gameformat_description)
VALUES
  (
    'oneshot',
    'ваншот',
    'Игра на одну встречу. Быстрый старт, простая цель, минимум подготовки. Прекрасно подходит новичкам как отправная точка в мир НРИ.'
  ),
  (
    'adventure',
    'приключение',
    'Законченная история длиной в несколько встреч. Сбалансированный вариант. Идеально для знакомства с правилами и миром игры.'
  ),
  (
    'campaign',
    'кампания',
    'Длинная история на десятки игровых встреч. Глубокий сюжет и персонажи, развитие игроков. Для создания историй, о которых помнят всю жизнь.'
  )
ON CONFLICT (gameformat_id) DO UPDATE SET
  gameformat_name = EXCLUDED.gameformat_name,
  gameformat_description = EXCLUDED.gameformat_description;
