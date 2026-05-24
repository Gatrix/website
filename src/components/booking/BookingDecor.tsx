"use client";

import React from "react";

/** Декоративная рамка под стиль свитка / карты умения */
export function BookingPanelFrame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative rounded-xl border border-amber-700/35 bg-gradient-to-br from-[#1a1512]/95 via-[#14110f]/95 to-[#0c0a09]/95 shadow-[inset_0_1px_0_rgba(251,191,36,0.06),0_12px_40px_rgba(0,0,0,0.45)] ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/25 to-transparent" />
      <div className="pointer-events-none absolute inset-y-3 left-0 w-px bg-gradient-to-b from-transparent via-amber-600/15 to-transparent" />
      <div className="relative">{children}</div>
    </div>
  );
}

export function EmberGlow({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute -inset-6 rounded-full bg-[radial-gradient(circle_at_50%_40%,rgba(251,191,36,0.14),transparent_55%)] blur-xl opacity-70 ${className}`}
      aria-hidden
    />
  );
}
