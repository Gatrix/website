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
    description: "Одна завершённая история за вечер — без долгих обязательств.",
    enabled: true,
  },
  {
    id: "adventure",
    title: "Приключение",
    description: "Несколько связанных сессий с общим сюжетом (~5 игр).",
    enabled: true,
  },
  {
    id: "campaign",
    title: "Кампания",
    description: "Долгая арка: стабильный состав и развитие мира между встречами.",
    enabled: true,
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
