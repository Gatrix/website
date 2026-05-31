"use server";

import { getStorageImageUrl, listFrontpagePhotoKeys, FRONTPAGE_STORAGE_PREFIX } from "@/lib/storage-client";

export type FrontpageCarouselSlide = { src: string; alt: string };

const FRONTPAGE_KEYS_CACHE_MS = 5 * 60 * 1000;
let frontpageKeysCache: { keys: string[]; fetchedAt: number } | null = null;

function altFromObjectKey(key: string): string {
  const name = key.startsWith(FRONTPAGE_STORAGE_PREFIX)
    ? key.slice(FRONTPAGE_STORAGE_PREFIX.length)
    : pathBasename(key);
  const base = name.replace(/\.[^.]+$/, "");
  try {
    return decodeURIComponent(base) || "Фото клуба";
  } catch {
    return base || "Фото клуба";
  }
}

function pathBasename(key: string): string {
  const parts = key.split("/");
  return parts[parts.length - 1] ?? key;
}

async function getFrontpagePhotoKeys(): Promise<string[]> {
  if (
    frontpageKeysCache &&
    Date.now() - frontpageKeysCache.fetchedAt < FRONTPAGE_KEYS_CACHE_MS
  ) {
    return frontpageKeysCache.keys;
  }
  const keys = await listFrontpagePhotoKeys();
  frontpageKeysCache = { keys, fetchedAt: Date.now() };
  return keys;
}

export async function getFrontpageCarouselSlides(): Promise<FrontpageCarouselSlide[]> {
  try {
    const keys = await getFrontpagePhotoKeys();
    return keys.flatMap((key) => {
      const src = getStorageImageUrl(key);
      return src ? [{ src, alt: altFromObjectKey(key) }] : [];
    });
  } catch (err) {
    console.error("Error loading frontpage photos from object storage:", err);
    return [];
  }
}

export async function getFrontpagePhotos(): Promise<string[]> {
  const slides = await getFrontpageCarouselSlides();
  return slides.map((slide) => slide.src);
}
