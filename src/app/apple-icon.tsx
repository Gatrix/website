import { loadAgamaFaviconResponse } from "@/lib/home-assets";

export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default function AppleIcon() {
  return loadAgamaFaviconResponse();
}
