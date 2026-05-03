import React from "react";
import { getAdventures } from "@/lib/actions/adventures";
import { getStorageImageUrl } from "@/lib/storage-client";
import HomeClient, { type HeroCarouselSlide } from "./HomeClient";

const FRONTPAGE_PHOTOS: { key: string; alt: string }[] = [
  { key: "photos/frontpage/фото игроки 2.webp", alt: "Фото игроки 2" },
  { key: "photos/frontpage/фото игроки 1.webp", alt: "Фото игроки 1" },
  { key: "photos/frontpage/фото клуб 1.webp", alt: "Фото клуб 1" },
  { key: "photos/frontpage/фото клуб 2.webp", alt: "Фото клуб 2" },
  { key: "photos/frontpage/Phenya on golden hords.jpg", alt: "Phenya — Golden Horde" },
];

// Динамический рендеринг: приключения загружаются при каждом запросе (не кэшируются на build)
export const dynamic = "force-dynamic";

export default async function Home() {
  const adventures = await getAdventures();
  const heroCarouselSlides: HeroCarouselSlide[] = FRONTPAGE_PHOTOS.flatMap(
    ({ key, alt }) => {
      const src = getStorageImageUrl(key);
      return src ? [{ src, alt }] : [];
    },
  );

  return (
    <HomeClient initialAdventures={adventures} heroCarouselSlides={heroCarouselSlides} />
  );
}
