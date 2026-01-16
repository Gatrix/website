"use client";

import React from "react";
import Image from "next/image";
import { getStorageImageUrl } from "@/lib/storage";
import { getUniverseFromTags } from "@/lib/adventureTags";
import type { Adventure } from "@/hooks/useAdventures";

type AdventureCardProps = {
  adventure: Adventure;
  as?: React.ElementType;
  className?: string;
  imageSizes?: string;
  onClick?: () => void;
};

const toList = (value?: string | string[]) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return value
    .split(/[,;|]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

export default function AdventureCard({
  adventure,
  as: Component = "div",
  className = "",
  imageSizes = "300px",
  ...rest
}: AdventureCardProps & Record<string, unknown>) {
  const genreList = toList(adventure.genre ?? adventure.focus);
  const toneList = toList(adventure.tone);
  const universe =
    adventure.universe || adventure.world || getUniverseFromTags(adventure.tags);
  const settingLabel = adventure.subsetting ?? adventure.base_setting ?? null;
  const atmosphereLabel = toneList[0] ?? null;
  const genreLabel = genreList[0] ?? null;

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
      className={`group relative w-full flex flex-col bg-[#14110f] rounded-lg overflow-hidden border border-amber-900/30 shadow-xl cursor-pointer hover:border-amber-600/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0d0c] ${className}`}
      {...rest}
    >
      {/* Постер */}
      <div className="relative w-full aspect-[2/3] bg-[#0f0d0c] overflow-hidden">
        {getStorageImageUrl(adventure.img_url || adventure.poster, "adventures") ? (
          <Image
            src={getStorageImageUrl(adventure.img_url || adventure.poster, "adventures")!}
            alt={adventure.title}
            fill
            className="object-contain transition-all duration-250"
            sizes={imageSizes}
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 bg-amber-900/10 flex items-center justify-center">
            <span className="text-amber-900/30 text-[10px] font-bold tracking-widest">Нет свитка</span>
          </div>
        )}
        {universe && (
          <div className="absolute top-3 left-3 right-3 flex justify-center pointer-events-none">
            <div className="max-w-full inline-flex items-center justify-center px-3 py-1 rounded-full bg-amber-900/40 border border-amber-600/70 text-[12px] sm:text-[14px] font-bold text-amber-100 tracking-wide truncate shadow-[0_0_10px_rgba(245,158,11,0.15)] text-center">
              {universe}
            </div>
          </div>
        )}
        {(settingLabel || atmosphereLabel || genreLabel) && (
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-10 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none">
            <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-amber-200/90 font-semibold text-center">
              {settingLabel && (
                <span className="px-1.5 py-0.5 rounded bg-black/50">{settingLabel}</span>
              )}
              {settingLabel && (atmosphereLabel || genreLabel) && <span>·</span>}
              {atmosphereLabel && (
                <span className="px-1.5 py-0.5 rounded bg-black/50">{atmosphereLabel}</span>
              )}
              {atmosphereLabel && genreLabel && <span>·</span>}
              {genreLabel && (
                <span className="px-1.5 py-0.5 rounded bg-black/50">{genreLabel}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Контент */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="text-lg font-bold text-amber-50 uppercase tracking-tight leading-tight line-clamp-2">
          {adventure.title}
        </h3>
      </div>
    </Component>
  );
}
