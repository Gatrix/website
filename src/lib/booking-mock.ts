import type { Adventure } from "@/lib/db";
import type { BookingConfigPayload, BookingDifficulty, GameFormatId } from "@/lib/booking-types";

const MOCK_SYSTEMS = [
  {
    id: 1,
    slug: "dnd5",
    name: "D&D 5e",
    description: "Классическая фэнтези-система: героические приключения, кубики d20 и понятные правила для новичков.",
    rulebook: "https://storage.yandexcloud.net/example/dnd5-rules.pdf",
  },
  {
    id: 2,
    slug: "coc",
    name: "Зов Ктулху",
    description: "Хоррор и расследования: навыки важнее уровня, атмосфера напряжения и следственные сюжеты.",
    rulebook: "https://storage.yandexcloud.net/example/coc-rules.pdf",
  },
  {
    id: 3,
    slug: "pf2",
    name: "Pathfinder 2e",
    description: "Тактические бои и глубокая кастомизация персонажа; больше опций, чем в упрощённых системах.",
    rulebook: null,
  },
] as const;

const MOCK_DIFFICULTIES: BookingDifficulty[] = [
  {
    id: 1,
    name: "Для новичков",
    description: "Мягкий темп, подсказки мастера, меньше смертельных ловушек.",
  },
  {
    id: 2,
    name: "Стандарт",
    description: "Баланс вызова и комфорта — как в большинстве клубных игр.",
  },
  {
    id: 3,
    name: "Хардкор",
    description: "Жёсткие последствия, меньше рельс — для опытных игроков.",
  },
];

const MOCK_FORMATS: BookingConfigPayload["formats"] = [
  {
    id: "oneshot",
    title: "Ваншот",
    description: "Одна завершённая история за вечер — без долгих обязательств.",
  },
  {
    id: "adventure",
    title: "Приключение",
    description: "Несколько связанных сессий с общим сюжетом (~5 игр).",
  },
  {
    id: "campaign",
    title: "Кампания",
    description: "Долгая арка: стабильный состав и развитие мира между встречами.",
  },
];

const MOCK_BOUNDS = {
  minPlayers: 3,
  maxPlayers: 6,
  minDurationHours: 3,
  maxDurationHours: 8,
};

function defaultFormatFromAdventure(adventure: Adventure): GameFormatId {
  const raw = (adventure.adventure_type ?? adventure.format ?? "").toLowerCase();
  if (raw.includes("ваншот") || raw === "oneshot") return "oneshot";
  if (raw.includes("кампан") || raw === "campaign") return "campaign";
  if (raw.includes("приключ") || raw === "adventure") return "adventure";
  return "adventure";
}

/** Синхронный конфиг формы — без запросов к API/БД. */
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
  const config = getMockBookingConfig(adventure);
  const b = config.bounds;
  const midPc = Math.round((b.minPlayers + b.maxPlayers) / 2);
  const midDh = Math.round(((b.minDurationHours + b.maxDurationHours) / 2) * 2) / 2;
  return {
    gameSystemId: config.systems[0]?.id ?? null,
    difficultyId: config.difficulties[1]?.id ?? config.difficulties[0]?.id ?? null,
    playerCount: Math.min(b.maxPlayers, Math.max(b.minPlayers, midPc)),
    durationHours: Math.min(b.maxDurationHours, Math.max(b.minDurationHours, midDh)),
    adventureType: config.defaultAdventureType,
  };
}
