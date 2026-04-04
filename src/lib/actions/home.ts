"use server";

import { getStorageImageUrl } from "@/lib/storage-client";
import { fetchFrontpagePhotoPathsFromDatabase } from "@/lib/site-settings-db";

let photosCache: string[] | null = null;

export async function getFrontpagePhotos(): Promise<string[]> {
  if (photosCache) return photosCache;
  try {
    const paths = await fetchFrontpagePhotoPathsFromDatabase();
    if (paths.length === 0) return [];
    photosCache = paths
      .map((p) => getStorageImageUrl(p))
      .filter((url): url is string => url != null);
    return photosCache;
  } catch (err) {
    console.error("Error loading frontpage photos from PostgreSQL:", err);
    return [];
  }
}
