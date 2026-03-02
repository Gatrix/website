"use server";

import { readJson, getStorageImageUrl } from "@/lib/storage-client";

let photosCache: string[] | null = null;

export async function getFrontpagePhotos(): Promise<string[]> {
  if (photosCache) return photosCache;
  try {
    const data = await readJson<string[]>("frontpage-photos.json");
    if (!Array.isArray(data) || data.length === 0) return [];
    photosCache = data
      .map((p) => getStorageImageUrl(p))
      .filter((url): url is string => url != null);
    return photosCache;
  } catch (err) {
    console.error("Error loading frontpage-photos.json:", err);
    return [];
  }
}
