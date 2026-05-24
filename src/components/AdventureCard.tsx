"use client";

import React from "react";
import Image from "next/image";
import type { Adventure } from "@/hooks/useAdventures";

type AdventureCardProps = {
  adventure: Adventure;
  as?: React.ElementType;
  className?: string;
  imageSizes?: string;
  onClick?: () => void;
};

export default function AdventureCard({
  adventure,
  as: Component = "div",
  className = "",
  imageSizes = "300px",
  ...rest
}: AdventureCardProps & Record<string, unknown>) {
  const imageUrl = adventure.imageUrl ?? null;
  const themeLabel = adventure.theme?.trim();

  return (
    <Component
      role={rest.onClick ? "button" : undefined}
      tabIndex={rest.onClick ? 0 : undefined}
      aria-label={rest.onClick ? `Открыть сюжет: ${adventure.title}` : undefined}
      onDragStart={(event: React.DragEvent) => {
        event.preventDefault();
      }}
      onKeyDown={(event: React.KeyboardEvent) => {
        if (!rest.onClick) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          rest.onClick();
        }
      }}
      data-adventure-card
      className={`group relative w-full flex flex-col bg-[#14110f] rounded-lg overflow-hidden border border-amber-900/30 shadow-xl cursor-pointer hover:border-amber-600/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-inset ${className}`}
      {...rest}
    >
      {/* Постер: фиксированный aspect для одинакового размера всех карточек */}
      <div className="group/poster relative w-full aspect-[3/4] bg-[#0f0d0c] overflow-hidden flex-shrink-0 [contain:layout_paint]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={adventure.title}
            fill
            className="object-cover"
            sizes={imageSizes}
            loading="lazy"
            draggable={false}
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-amber-900/10 flex items-center justify-center">
            <span className="text-amber-900/30 text-[10px] font-bold tracking-widest">Нет свитка</span>
          </div>
        )}
        {themeLabel ? (
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 z-10 flex min-h-[18%] -translate-y-1/2 items-center justify-center bg-black/90 px-2 py-2 transition-opacity duration-200 group-hover/poster:opacity-0"
            aria-hidden
          >
            <span className="font-fantasy-serif text-center text-sm sm:text-base font-semibold uppercase tracking-[0.18em] text-white leading-snug">
              {themeLabel}
            </span>
          </div>
        ) : null}
      </div>
    </Component>
  );
}
