import React from "react";
import nextDynamic from "next/dynamic";
import { getAdventures } from "@/lib/actions/adventures";
import { deriveAdventureOptionsFromAdventures } from "@/lib/adventure-options-derive";
import AdventuresPageSkeleton from "./AdventuresPageSkeleton";

const AdventuresClient = nextDynamic(() => import("./AdventuresClient"), {
  loading: () => <AdventuresPageSkeleton />,
});

/** Как на главной: без этого страница пререндерится при `next build` без DATABASE_URL и уйдёт в образ с пустым списком. */
export const dynamic = "force-dynamic";

export default async function AdventuresPage() {
  const adventures = await getAdventures();

  const adventureOptions =
    adventures.length > 0 ? deriveAdventureOptionsFromAdventures(adventures) : null;

  return (
    <AdventuresClient
      initialAdventures={adventures}
      adventureOptions={adventureOptions}
    />
  );
}
