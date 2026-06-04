"use server";

import { getStorageImageUrl } from "@/lib/storage-client";
import type { Adventure, AdventureOptions } from "@/lib/db";
import {
  fetchAdventuresFromDatabase,
  fetchAdventureOptionsFromDatabase,
  fetchAdventureOptionsFromLookups,
  fetchAdventureOptionsFromObjectStorage,
} from "@/lib/adventures-db";

/** undefined — ещё не грузили; null — в БД нет/пусто */
let optionsCache: AdventureOptions | null | undefined = undefined;

const FALLBACK_SESSION_DURATION = "1–8 часов";

/** Краткий in-memory кэш только для непустого успешного ответа (пустой список и ошибки не кэшируем). */
const ADVENTURES_MEMORY_TTL_MS = Number(process.env.ADVENTURES_MEMORY_TTL_MS ?? 60_000);
let adventuresMemoryCache: { data: Adventure[]; fetchedAt: number } | null = null;

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

async function loadAdventuresFromDb(): Promise<Adventure[]> {
  const cached = adventuresMemoryCache;
  if (
    cached &&
    cached.data.length > 0 &&
    Date.now() - cached.fetchedAt < ADVENTURES_MEMORY_TTL_MS
  ) {
    return cached.data;
  }

  try {
    const rows = await fetchAdventuresFromDatabase();
    const enriched = rows.map(enrichAdventure);
    if (enriched.length > 0) {
      adventuresMemoryCache = { data: enriched, fetchedAt: Date.now() };
    } else {
      adventuresMemoryCache = null;
    }
    return enriched;
  } catch (err) {
    adventuresMemoryCache = null;
    console.error("Error loading adventures from PostgreSQL:", err);
    throw err;
  }
}

export async function getAdventures(): Promise<Adventure[]> {
  try {
    return await loadAdventuresFromDb();
  } catch {
    return [];
  }
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
