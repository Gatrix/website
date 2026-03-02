import React from "react";
import { getAdventures } from "@/lib/actions/adventures";
import { getFrontpagePhotos } from "@/lib/actions/home";
import HomeClient from "./HomeClient";

// Динамический рендеринг: приключения загружаются при каждом запросе (не кэшируются на build)
export const dynamic = "force-dynamic";

export default async function Home() {
  const [adventures, frontpagePhotos] = await Promise.all([
    getAdventures(),
    getFrontpagePhotos(),
  ]);

  return (
    <HomeClient
      initialAdventures={adventures}
      frontpagePhotos={frontpagePhotos}
    />
  );
}
