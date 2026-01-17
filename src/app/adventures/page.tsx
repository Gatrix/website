import React from "react";
import { getAdventures } from "@/lib/actions/adventures";
import AdventuresClient from "./AdventuresClient";

export const revalidate = 3600;

export default async function AdventuresPage() {
  const adventures = await getAdventures();

  return <AdventuresClient initialAdventures={adventures} />;
}
