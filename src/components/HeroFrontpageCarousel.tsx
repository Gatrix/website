"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const AUTO_ADVANCE_MS = 3500;
const MD_BREAKPOINT_PX = 768;

type CarouselSlide = { src: string; alt: string };

type HeroFrontpageCarouselProps = {
  slides: CarouselSlide[];
};

function isMobileViewport() {
  return typeof window !== "undefined" && window.innerWidth < MD_BREAKPOINT_PX;
}

export default function HeroFrontpageCarousel({ slides }: HeroFrontpageCarouselProps) {
  const [active, setActive] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToSlide = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTo({ left: index * el.clientWidth, behavior });
    },
    []
  );

  const goTo = useCallback(
    (index: number) => {
      const next = (index + slides.length) % slides.length;
      setActive(next);
      if (isMobileViewport()) {
        scrollToSlide(next);
      }
    },
    [slides.length, scrollToSlide]
  );

  const goPrev = () => goTo(active - 1);
  const goNext = () => goTo(active + 1);

  const handleMobileScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    const clamped = Math.max(0, Math.min(index, slides.length - 1));
    setActive((prev) => (prev === clamped ? prev : clamped));
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;
    const id = window.setInterval(() => {
      setActive((i) => {
        const next = (i + 1) % slides.length;
        if (isMobileViewport()) {
          scrollToSlide(next);
        }
        return next;
      });
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [slides.length, active, scrollToSlide]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onResize = () => {
      if (isMobileViewport()) {
        scrollToSlide(active, "instant");
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active, scrollToSlide]);

  if (slides.length === 0) return null;

  const hitZoneClass =
    "absolute inset-y-0 z-[2] hidden md:block w-1/2 border-0 p-0 cursor-pointer bg-transparent transition-colors hover:bg-black/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber-500/70";

  const frameClass =
    "relative w-full overflow-hidden rounded-lg border border-amber-900/35 bg-[#12100f] shadow-[0_24px_60px_rgba(0,0,0,0.5)] aspect-[16/9]";

  return (
    <div className="mt-7 sm:mt-8 md:mt-10">
      <div className={frameClass}>
        {/* Мобильные: горизонтальный скролл со snap */}
        <div
          ref={scrollRef}
          className="md:hidden absolute inset-0 z-[1] flex overflow-x-auto snap-x snap-mandatory overscroll-x-contain touch-pan-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          onScroll={handleMobileScroll}
          role="region"
          aria-roledescription="carousel"
          aria-label="Фотогалерея"
        >
          {slides.map(({ src, alt }, i) => (
            <div
              key={src}
              className="relative h-full w-full flex-shrink-0 snap-center snap-always"
            >
              <Image
                src={src}
                alt={alt}
                fill
                className="object-cover"
                unoptimized
                priority={i === 0}
                sizes="92vw"
                draggable={false}
              />
            </div>
          ))}
        </div>

        {/* Десктоп: затухание + зоны клика по краям */}
        <div className="hidden md:block absolute inset-0">
          {slides.map(({ src, alt }, i) => (
            <Image
              key={src}
              src={src}
              alt={alt}
              fill
              className={`object-cover transition-opacity duration-[1100ms] ease-in-out ${
                i === active ? "opacity-100 z-[1]" : "opacity-0 z-0 pointer-events-none"
              }`}
              unoptimized
              priority={i === 0}
              sizes="(max-width: 1280px) 90vw, 1200px"
            />
          ))}
          {slides.length > 1 ? (
            <>
              <button
                type="button"
                className={`${hitZoneClass} left-0 rounded-l-lg`}
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                aria-label="Предыдущее фото"
              />
              <button
                type="button"
                className={`${hitZoneClass} right-0 rounded-r-lg`}
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                aria-label="Следующее фото"
              />
            </>
          ) : null}
        </div>

        {slides.length > 1 ? (
          <div
            className="absolute bottom-3 inset-x-0 flex justify-center gap-2 z-[3] pointer-events-none"
            role="tablist"
            aria-label="Слайды фотогалереи"
          >
            {slides.map((slide, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`Показать: ${slide.alt}`}
                className={`pointer-events-auto h-2 rounded-full transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/90 ${
                  i === active
                    ? "w-8 bg-amber-500/90"
                    : "w-2 bg-amber-950/80 hover:bg-amber-700/70"
                }`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
