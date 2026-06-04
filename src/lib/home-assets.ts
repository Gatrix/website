import { readFile } from "fs/promises";
import path from "path";
import { unstable_noStore as noStore } from "next/cache";
import { getStorageImageUrl } from "@/lib/storage-client";

/** Ключ объекта в Yandex Object Storage (тот же бакет, что постеры и фото главной). */
export const SIGN_UP_BUTTON_STORAGE_KEY = "banners/ButtonForSignUp.webp";

export const POLYGON_LOGO_STORAGE_KEY = "logos/polygon-logo_new.webp";

export const AGAMA_FAVICON_STORAGE_KEY = "logos/agama-logo.png";

const AGAMA_FAVICON_LOCAL_PATH = path.join(
  process.cwd(),
  "public",
  "logos",
  "agama-logo.png"
);

export function getSignUpButtonImageUrl(): string | null {
  return getStorageImageUrl(SIGN_UP_BUTTON_STORAGE_KEY);
}

/** URL логотипа в шапке: Object Storage `logos/polygon-logo_new.webp` или `public/logos/polygon-logo_new.webp`. */
export function getPolygonLogoUrl(): string {
  noStore();
  return getStorageImageUrl(POLYGON_LOGO_STORAGE_KEY) ?? "/logos/polygon-logo_new.webp";
}

export function getAgamaFaviconUrl(): string | null {
  return getStorageImageUrl(AGAMA_FAVICON_STORAGE_KEY);
}

/** Байты favicon из Object Storage или public/logos/agama-logo.png. */
export async function loadAgamaFaviconResponse(): Promise<Response> {
  const remote = getAgamaFaviconUrl();
  if (remote?.startsWith("http")) {
    try {
      const res = await fetch(remote, { cache: "no-store" });
      if (res.ok && res.body) {
        return new Response(res.body, {
          headers: {
            "Content-Type": res.headers.get("content-type") ?? "image/png",
            "Cache-Control": "public, max-age=86400, immutable",
          },
        });
      }
    } catch {
      /* local fallback */
    }
  }

  const buf = await readFile(AGAMA_FAVICON_LOCAL_PATH);
  return new Response(buf, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
