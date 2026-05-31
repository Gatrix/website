import React from "react";
import { getAdventures } from "@/lib/actions/adventures";
import { getFrontpageCarouselSlides } from "@/lib/actions/home";
import HomeClient from "./HomeClient";

// Динамический рендеринг: приключения загружаются при каждом запросе (не кэшируются на build)
export const dynamic = "force-dynamic";

export default async function Home() {
  const [adventures, heroCarouselSlides] = await Promise.all([
    getAdventures(),
    getFrontpageCarouselSlides(),
  ]);

  return (
    <HomeClient initialAdventures={adventures} heroCarouselSlides={heroCarouselSlides} />
  );
}
