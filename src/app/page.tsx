import React from "react";
import { getAdventures } from "@/lib/actions/adventures";
import { getStorageImageUrl } from "@/lib/storage-client";
import HomeClient from "./HomeClient";

const TABLE_PHOTO_KEY = "photos/frontpage/Table photo.png";

// Динамический рендеринг: приключения загружаются при каждом запросе (не кэшируются на build)
export const dynamic = "force-dynamic";

export default async function Home() {
  const adventures = await getAdventures();
  const tablePhotoUrl = getStorageImageUrl(TABLE_PHOTO_KEY);

  return (
    <HomeClient
      initialAdventures={adventures}
      tablePhotoUrl={tablePhotoUrl}
    />
  );
}
