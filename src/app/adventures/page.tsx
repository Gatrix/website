import React from "react";
import { getAdventures, getAdventureOptions } from "@/lib/actions/adventures";
import AdventuresClient from "./AdventuresClient";

export const revalidate = 3600;

export default async function AdventuresPage() {
  const [adventures, options] = await Promise.all([
    getAdventures(),
    getAdventureOptions(),
  ]);

  return (
    <AdventuresClient
      initialAdventures={adventures}
      adventureOptions={options}
    />
  );
}
