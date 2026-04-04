import React from "react";
import { getAdventures } from "@/lib/actions/adventures";
import { getFrontpagePhotos } from "@/lib/actions/home";
import { getStorageImageUrl } from "@/lib/storage-client";
import HomeClient from "./HomeClient";

const HERO_POSTER_KEY = "banners/frontposter.webp";

// Динамический рендеринг: приключения загружаются при каждом запросе (не кэшируются на build)
export const dynamic = "force-dynamic";

export default async function Home() {
  const [adventures, frontpagePhotos] = await Promise.all([
    getAdventures(),
    getFrontpagePhotos(),
  ]);

  const heroPosterUrl = getStorageImageUrl(HERO_POSTER_KEY);

  return (
    <HomeClient
      initialAdventures={adventures}
      frontpagePhotos={frontpagePhotos}
      heroPosterUrl={heroPosterUrl}
    />
  );
}
