import React, { Suspense } from "react";
import { getAdventures } from "@/lib/actions/adventures";
import ScheduleClient from "./ScheduleClient";

export default async function SchedulePage() {
  const adventures = await getAdventures();

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0c0a09] flex items-center justify-center">
        <div className="text-amber-100 uppercase tracking-widest animate-pulse">
          Загрузка календаря...
        </div>
      </div>
    }>
      <ScheduleClient initialAdventures={adventures} />
    </Suspense>
  );
}
