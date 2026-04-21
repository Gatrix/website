/**
 * Возвращает URL изображения (клиент-безопасная версия).
 * Используется только для локальной разработки и публичного бакета.
 * Для приватного бакета URL предвычисляется на сервере (storage-client).
 */
const IMAGES_BASE = process.env.NEXT_PUBLIC_YC_STORAGE_IMAGES_BASE;
const IMAGES_PREFIX = process.env.NEXT_PUBLIC_YC_STORAGE_IMAGES_PREFIX ?? "";

function encodeStoragePath(path: string): string {
  return path
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

export function getStorageImageUrl(
  filename: string | null | undefined
): string | null {
  if (!filename) return null;

  if (filename.startsWith("http")) return filename;
  if (filename.startsWith("/")) return filename;

  if (IMAGES_BASE) {
    const base = IMAGES_BASE.replace(/\/$/, "");
    const path = IMAGES_PREFIX ? `${IMAGES_PREFIX}${filename}` : filename;
    return `${base}/${encodeStoragePath(path)}`;
  }

  return `/${encodeStoragePath(filename)}`;
}
