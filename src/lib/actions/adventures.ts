"use server";

import { getStorageImageUrl } from "@/lib/storage-client";
import type { Adventure, AdventureOptions } from "@/lib/db";
import {
  fetchAdventuresFromDatabase,
  fetchAdventureOptionsFromDatabase,
  fetchAdventureOptionsFromObjectStorage,
} from "@/lib/adventures-db";

let adventuresCache: Adventure[] | null = null;
/** undefined — ещё не грузили; null — в БД нет/пусто */
let optionsCache: AdventureOptions | null | undefined = undefined;

function resolveImagePathForStorage(a: Pick<Adventure, "poster" | "img_url">): string | null {
  const raw = a.img_url?.trim() || a.poster?.trim();
  if (!raw) return null;
  if (raw.startsWith("http") || raw.startsWith("/")) return raw;
  if (!raw.includes("/")) return `posters/${raw}`;
  return raw;
}

async function loadAdventures(): Promise<Adventure[]> {
  if (adventuresCache) return adventuresCache;
  try {
    adventuresCache = await fetchAdventuresFromDatabase();
    return adventuresCache;
  } catch (err) {
    console.error("Error loading adventures from PostgreSQL:", err);
    adventuresCache = [];
    return adventuresCache;
  }
}

const adventuresById = async () => {
  const list = await loadAdventures();
  return new Map(list.map((a) => [a.id, a]));
};

function normalizeGenre(genre: unknown): string[] | undefined {
  if (!genre) return undefined;
  if (Array.isArray(genre)) return genre.filter((g): g is string => typeof g === "string");
  if (typeof genre === "string") return [genre];
  return undefined;
}

export async function getAdventures(): Promise<Adventure[]> {
  const list = await loadAdventures();
  return list.map((a) => ({
    ...a,
    genre: normalizeGenre(a.genre),
    player_count: a.player_count?.trim() || a.players?.trim() || "4-6 игроков",
    session_duration: a.session_duration?.trim() || a.time?.trim() || a.durationHours?.trim() || "5-6 часов",
    imageUrl: getStorageImageUrl(resolveImagePathForStorage(a)) ?? null,
  }));
}

export async function getAdventureById(id: string): Promise<Adventure | null> {
  const index = await adventuresById();
  const a = index.get(id) ?? null;
  if (!a) return null;
  return {
    ...a,
    genre: normalizeGenre(a.genre),
    player_count: a.player_count?.trim() || a.players?.trim() || "4-6 игроков",
    session_duration: a.session_duration?.trim() || a.time?.trim() || a.durationHours?.trim() || "5-6 часов",
    imageUrl: getStorageImageUrl(resolveImagePathForStorage(a)) ?? null,
  };
}

export async function getAdventureOptions(): Promise<AdventureOptions | null> {
  if (optionsCache !== undefined) return optionsCache;
  optionsCache = await fetchAdventureOptionsFromDatabase();
  if (optionsCache == null) {
    optionsCache = await fetchAdventureOptionsFromObjectStorage();
  }
  return optionsCache;
}
