import React, { Suspense } from "react";
import ScheduleClient from "./ScheduleClient";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0c0a09] flex items-center justify-center">
        <div className="text-amber-100 uppercase tracking-widest animate-pulse">
          Загрузка календаря...
        </div>
      </div>
    }>
      <ScheduleClient />
    </Suspense>
  );
}
