"use server";

import { unstable_cache } from "next/cache";
import { getStorageImageUrl } from "@/lib/storage-client";
import type { Adventure, AdventureOptions } from "@/lib/db";
import {
  fetchAdventuresFromDatabase,
  fetchAdventureOptionsFromDatabase,
  fetchAdventureOptionsFromLookups,
  fetchAdventureOptionsFromObjectStorage,
} from "@/lib/adventures-db";

/** undefined — успешный ответ ещё не кэшировали (ошибку БД не кэшируем, чтобы следующий запрос повторил загрузку). */
let adventuresCache: Adventure[] | undefined = undefined;
/** undefined — ещё не грузили; null — в БД нет/пусто */
let optionsCache: AdventureOptions | null | undefined = undefined;

const FALLBACK_SESSION_DURATION = "1–8 часов";

/** Data Cache Next.js: список с imageUrl (те же URL → браузер кэширует картинки при F5). */
const ADVENTURES_REVALIDATE_SECONDS = Number(
  process.env.ADVENTURES_REVALIDATE_SECONDS ?? 3600
);

function resolveImagePathForStorage(a: Pick<Adventure, "id" | "poster" | "img_url">): string | null {
  const raw = a.img_url?.trim() || a.poster?.trim();
  if (raw) {
    if (raw.startsWith("http") || raw.startsWith("/")) return raw;
    if (!raw.includes("/")) return `posters/${raw}`;
    return raw;
  }
  const id = a.id?.trim();
  if (id) return `posters/${id}.webp`;
  return null;
}

async function loadAdventures(): Promise<Adventure[]> {
  if (adventuresCache !== undefined) return adventuresCache;
  try {
    adventuresCache = await fetchAdventuresFromDatabase();
    return adventuresCache;
  } catch (err) {
    console.error("Error loading adventures from PostgreSQL:", err);
    return [];
  }
}

function normalizeGenre(genre: unknown): string[] | undefined {
  if (!genre) return undefined;
  if (Array.isArray(genre)) return genre.filter((g): g is string => typeof g === "string");
  if (typeof genre === "string") return [genre];
  return undefined;
}

function enrichAdventure(a: Adventure): Adventure {
  return {
    ...a,
    genre: normalizeGenre(a.genre),
    player_count: a.player_count?.trim() || a.players?.trim() || "4-6 игроков",
    session_duration: a.session_duration?.trim() || FALLBACK_SESSION_DURATION,
    imageUrl: getStorageImageUrl(resolveImagePathForStorage(a)) ?? null,
  };
}

const getEnrichedAdventuresCached = unstable_cache(
  async (): Promise<Adventure[]> => {
    const list = await loadAdventures();
    return list.map(enrichAdventure);
  },
  ["adventures-enriched-v1"],
  {
    revalidate: ADVENTURES_REVALIDATE_SECONDS,
    tags: ["adventures"],
  }
);

export async function getAdventures(): Promise<Adventure[]> {
  return getEnrichedAdventuresCached();
}

export async function getAdventureById(id: string): Promise<Adventure | null> {
  const list = await getAdventures();
  return list.find((a) => a.id === id) ?? null;
}

export async function getAdventureOptions(): Promise<AdventureOptions | null> {
  if (optionsCache !== undefined) return optionsCache;

  const usePoolSchema = process.env.PG_ADVENTURES_SCHEMA !== "legacy";
  let result: AdventureOptions | null = null;

  if (!usePoolSchema) {
    result = await fetchAdventureOptionsFromDatabase();
  }
  if (result == null) {
    result = await fetchAdventureOptionsFromLookups();
  }
  if (result == null) {
    result = await fetchAdventureOptionsFromObjectStorage();
  }

  optionsCache = result;
  return optionsCache;
}
