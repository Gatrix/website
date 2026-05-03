/**
 * Контакты клуба (единая точка для шапки, главной, расписания).
 *
 * Как обновить карту Яндекса:
 * 1. Откройте https://yandex.ru/maps и найдите нужную точку (или заранее созданную организацию).
 * 2. Нажмите «Поделиться» → вкладка «Карта сайта» / «HTML-код» (в конструкторе карт: «Сохранить и получить код»).
 * 3. Скопируйте только значение атрибута src у тега <iframe> (длинная ссылка на map-widget).
 * 4. В корне проекта в файле .env.local добавьте строку:
 *    NEXT_PUBLIC_YANDEX_MAP_EMBED_SRC="вставьте_сюда_скопированный_src"
 * 5. Перезапустите dev-сервер (npm run dev), чтобы подтянулась переменная.
 *
 * Без .env используется запасная точка на ул. Сурикова, 6 (Красноярск) — замените через шаги выше.
 */
export const SITE_PHONE_DISPLAY = "+7 (950) 976-25-14";
/** Для ссылок tel: */
export const SITE_PHONE_TEL = "+79509762514";

/** Telegram ведущего — запись на игры, кнопки «Записаться» и т.п. */
export const SITE_TELEGRAM_BOOKING_URL = "https://t.me/gatriks";

/** Сообщество клуба во ВКонтакте */
export const SITE_VK_URL = "https://vk.com/polygon20fun";

/** Discord ведущего */
export const SITE_DISCORD_URL = "https://discord.com/users/gatriks";

export const SITE_ADDRESS_LINE =
  "г. Красноярск, ул. Сурикова, 6, цокольный этаж (слева от 1 подъезда)";

/** Короткая строка для шапки сайта */
export const SITE_ADDRESS_SHORT = "Сурикова, 6, цоколь";

/** Карта из конструктора Яндекса (клуб); переопределение: NEXT_PUBLIC_YANDEX_MAP_EMBED_SRC */
const DEFAULT_YANDEX_EMBED =
  "https://yandex.ru/map-widget/v1/?um=constructor%3A72e917290bee63c069d2e37aa31a9d06f757fc0cd6265c9d199ab06733a87909&source=constructor";

export function getYandexMapEmbedSrc(): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_YANDEX_MAP_EMBED_SRC?.trim()) {
    return process.env.NEXT_PUBLIC_YANDEX_MAP_EMBED_SRC.trim();
  }
  return DEFAULT_YANDEX_EMBED;
}
