import React from "react";
import { getAdventures, getAdventureOptions } from "@/lib/actions/adventures";
import { deriveAdventureOptionsFromAdventures } from "@/lib/adventure-options-derive";
import AdventuresClient from "./AdventuresClient";

export const revalidate = 3600;

export default async function AdventuresPage() {
  const [adventures, optionsFromDb] = await Promise.all([
    getAdventures(),
    getAdventureOptions(),
  ]);

  const adventureOptions =
    optionsFromDb ??
    (adventures.length > 0 ? deriveAdventureOptionsFromAdventures(adventures) : null);

  return (
    <AdventuresClient
      initialAdventures={adventures}
      adventureOptions={adventureOptions}
    />
  );
}
