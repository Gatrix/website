import type { Adventure } from "@/lib/db";
import type { BookingConfigPayload, BookingDifficulty } from "@/lib/booking-types";
import { defaultFormatFromAdventure, getBookingInitialValues } from "@/lib/booking-config-utils";

const MOCK_SYSTEMS = [
  {
    id: "dnd5",
    slug: "dnd5",
    name: "D&D 5e",
    description: "Классическая фэнтези-система: героические приключения, кубики d20 и понятные правила для новичков.",
    rulebook: "https://storage.yandexcloud.net/example/dnd5-rules.pdf",
  },
  {
    id: "coc",
    slug: "coc",
    name: "Зов Ктулху",
    description: "Хоррор и расследования: навыки важнее уровня, атмосфера напряжения и следственные сюжеты.",
    rulebook: "https://storage.yandexcloud.net/example/coc-rules.pdf",
  },
  {
    id: "pf2",
    slug: "pf2",
    name: "Pathfinder 2e",
    description: "Тактические бои и глубокая кастомизация персонажа; больше опций, чем в упрощённых системах.",
    rulebook: null,
  },
] as const;

const MOCK_DIFFICULTIES: BookingDifficulty[] = [
  {
    id: "narrative",
    name: "Для новичков",
    description: "Мягкий темп, подсказки мастера, меньше смертельных ловушек.",
  },
  {
    id: "tactic",
    name: "Стандарт",
    description: "Баланс вызова и комфорта — как в большинстве клубных игр.",
  },
];

const MOCK_FORMATS: BookingConfigPayload["formats"] = [
  {
    id: "oneshot",
    title: "Ваншот",
    description:
      "Игра на одну встречу. Быстрый старт, простая цель, минимум подготовки. Прекрасно подходит новичкам как отправная точка в мир НРИ.",
  },
  {
    id: "adventure",
    title: "Приключение",
    description:
      "Законченная история длиной в несколько встреч. Сбалансированный вариант. Идеально для знакомства с правилами и миром игры.",
  },
  {
    id: "campaign",
    title: "Кампания",
    description:
      "Длинная история на десятки игровых встреч. Глубокий сюжет и персонажи, развитие игроков. Для создания историй, о которых помнят всю жизнь.",
  },
];

const MOCK_BOUNDS = {
  minPlayers: 3,
  maxPlayers: 6,
  minDurationHours: 4,
  maxDurationHours: 8,
};

/** Синхронный конфиг формы — запасной вариант без API/БД. */
export function getMockBookingConfig(adventure: Adventure): BookingConfigPayload {
  return {
    adventureId: adventure.id,
    adventureTitle: adventure.title ?? "",
    systems: MOCK_SYSTEMS.map((s) => ({ ...s })),
    difficulties: MOCK_DIFFICULTIES,
    universes: [],
    bounds: { ...MOCK_BOUNDS },
    formats: MOCK_FORMATS,
    warningRules: [],
    warnings: [],
    defaultAdventureType: defaultFormatFromAdventure(adventure),
  };
}

export function getMockInitialValues(adventure: Adventure) {
  return getBookingInitialValues(getMockBookingConfig(adventure));
}
