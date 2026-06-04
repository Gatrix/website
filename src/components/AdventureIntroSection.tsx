"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

const GENRE_SEPARATOR = "·";
/** ~3× от базового sm; подстраивается вниз, если строка не влезает */
const MAX_GENRE_FONT_PX = 48;
const MIN_GENRE_FONT_PX = 13;

function fitGenreFontSize(el: HTMLElement): number {
  let size = MAX_GENRE_FONT_PX;
  el.style.fontSize = `${size}px`;
  while (size > MIN_GENRE_FONT_PX && el.scrollWidth > el.clientWidth + 1) {
    size -= 1;
    el.style.fontSize = `${size}px`;
  }
  return size;
}

type AdventureIntroSectionProps = {
  genres: string[];
  text: string;
  descriptionId?: string;
  genresClassName?: string;
  textClassName?: string;
};

export default function AdventureIntroSection({
  genres,
  text,
  descriptionId,
  genresClassName = "mb-3 w-full min-w-0 font-fantasy-serif font-semibold text-amber-400/95 tracking-wide leading-snug",
  textClassName = "text-body whitespace-pre-line",
}: AdventureIntroSectionProps) {
  const genresRef = useRef<HTMLParagraphElement>(null);
  const [genreFontPx, setGenreFontPx] = useState(MAX_GENRE_FONT_PX);
  const [genreWrap, setGenreWrap] = useState(false);
  const genresKey = genres.join("\u0000");

  const remeasureGenres = useCallback(() => {
    const el = genresRef.current;
    if (!el || genres.length === 0) return;
    if (el.clientWidth <= 0) return;

    setGenreWrap(false);
    el.style.fontSize = `${MAX_GENRE_FONT_PX}px`;
    const size = fitGenreFontSize(el);
    const stillOverflows = el.scrollWidth > el.clientWidth + 1;
    setGenreFontPx(size);
    setGenreWrap(stillOverflows);
  }, [genresKey, genres.length]);

  useLayoutEffect(() => {
    remeasureGenres();
    const raf = requestAnimationFrame(remeasureGenres);
    const el = genresRef.current;
    if (!el) return () => cancelAnimationFrame(raf);

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(remeasureGenres);
    });
    ro.observe(el);
    const container = el.parentElement;
    if (container) ro.observe(container);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [remeasureGenres]);

  const hasGenres = genres.length > 0;
  const hasText = Boolean(text);
  if (!hasGenres && !hasText) return null;

  return (
    <section
      className="min-w-0 w-full"
      aria-describedby={hasText && descriptionId ? descriptionId : undefined}
    >
      {hasGenres ? (
        <p
          ref={genresRef}
          className={`${genresClassName} ${genreWrap ? "flex flex-wrap items-baseline gap-x-2 gap-y-1" : "whitespace-nowrap"}`}
          style={{ fontSize: `${genreFontPx}px` }}
        >
          {genres.map((genre, index) => (
            <span key={`${genre}-${index}`}>
              {index > 0 ? (
                <span
                  className="mx-[0.35em] text-amber-500/55 font-normal select-none"
                  style={{ fontSize: "0.85em" }}
                  aria-hidden
                >
                  {GENRE_SEPARATOR}
                </span>
              ) : null}
              {genre}
            </span>
          ))}
        </p>
      ) : null}
      {hasText ? (
        <p id={descriptionId} className={textClassName}>
          {text}
        </p>
      ) : null}
    </section>
  );
}
