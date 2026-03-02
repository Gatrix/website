"use server";

import { readJson, getStorageImageUrl } from "@/lib/storage-client";
import type { Adventure } from "@/lib/db";

export interface AdventureOptions {
  base_setting: string[];
  setting_relations: Record<string, string[]>;
  subsetting: string[];
  genre: string[];
  universe: string[];
  session_duration?: string[];
  player_count?: string[];
}

let adventuresCache: Adventure[] | null = null;
let optionsCache: AdventureOptions | null = null;

async function loadAdventures(): Promise<Adventure[]> {
  if (adventuresCache) return adventuresCache;
  try {
    const data = await readJson<Adventure[]>("adventures.json");
    adventuresCache = Array.isArray(data) ? data : [];
    return adventuresCache;
  } catch (err) {
    console.error("Error loading adventures.json:", err);
    return [];
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
    imageUrl: getStorageImageUrl(a.img_url || a.poster) ?? null,
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
    imageUrl: getStorageImageUrl(a.img_url || a.poster) ?? null,
  };
}

export async function getAdventureOptions(): Promise<AdventureOptions | null> {
  if (optionsCache) return optionsCache;
  try {
    const data = await readJson<AdventureOptions>("adventure-options.json");
    optionsCache = data;
    return data;
  } catch (err) {
    console.error("Error loading adventure-options.json:", err);
    return null;
  }
}
