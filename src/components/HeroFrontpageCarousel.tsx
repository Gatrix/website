"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import FrontpagePhotoLightbox from "@/components/FrontpagePhotoLightbox";
import { shouldBypassImageOptimization } from "@/lib/image-url";

const AUTO_ADVANCE_MS = 3500;
const MD_BREAKPOINT_PX = 768;
const TAP_SLOP_PX = 10;
const GESTURE_LOCK_PX = 8;

type CarouselSlide = { src: string; alt: string };

type HeroFrontpageCarouselProps = {
  slides: CarouselSlide[];
};

type TouchGesture = {
  x: number;
  y: number;
  moved: boolean;
  axis: "x" | "y" | null;
};

function isMobileViewport() {
  return typeof window !== "undefined" && window.innerWidth < MD_BREAKPOINT_PX;
}

export default function HeroFrontpageCarousel({ slides }: HeroFrontpageCarouselProps) {
  const [active, setActive] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [verticalScrollGesture, setVerticalScrollGesture] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchGestureRef = useRef<TouchGesture | null>(null);

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

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  const handleMobileScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    const clamped = Math.max(0, Math.min(index, slides.length - 1));
    setActive((prev) => (prev === clamped ? prev : clamped));
  }, [slides.length]);

  const resetTouchGesture = useCallback(() => {
    touchGestureRef.current = null;
    setVerticalScrollGesture(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    touchGestureRef.current = { x: t.clientX, y: t.clientY, moved: false, axis: null };
    setVerticalScrollGesture(false);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const gesture = touchGestureRef.current;
    const t = e.touches[0];
    if (!gesture || !t) return;

    const dx = t.clientX - gesture.x;
    const dy = t.clientY - gesture.y;

    if (Math.abs(dx) > TAP_SLOP_PX || Math.abs(dy) > TAP_SLOP_PX) {
      gesture.moved = true;
    }

    if (gesture.axis === null && (Math.abs(dx) > GESTURE_LOCK_PX || Math.abs(dy) > GESTURE_LOCK_PX)) {
      gesture.axis = Math.abs(dy) > Math.abs(dx) ? "y" : "x";
      setVerticalScrollGesture(gesture.axis === "y");
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    const gesture = touchGestureRef.current;
    if (gesture && !gesture.moved && gesture.axis !== "y") {
      openLightbox(active);
    }
    resetTouchGesture();
  }, [active, openLightbox, resetTouchGesture]);

  useEffect(() => {
    if (slides.length <= 1 || lightboxIndex !== null) return;
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
  }, [slides.length, scrollToSlide, lightboxIndex]);

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

  const frameClass =
    "relative w-full overflow-hidden rounded-lg border border-amber-900/35 bg-[#12100f] shadow-[0_24px_60px_rgba(0,0,0,0.5)] aspect-[16/9]";

  const navButtonClass =
    "absolute top-1/2 -translate-y-1/2 z-[3] w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-amber-100 transition-colors border border-amber-900/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/90";

  return (
    <>
      <div className="mt-7 sm:mt-8 md:mt-10">
        <div className={frameClass}>
          {/* Мобильные: горизонтальный скролл со snap; вертикальный свайп — скролл страницы */}
          <div
            ref={scrollRef}
            className={`md:hidden absolute inset-0 z-[1] flex snap-x snap-mandatory overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [touch-action:pan-x_pan-y] ${
              verticalScrollGesture ? "overflow-x-hidden" : "overflow-x-auto"
            }`}
            onScroll={handleMobileScroll}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={resetTouchGesture}
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
                  className="object-cover pointer-events-none select-none"
                  unoptimized={shouldBypassImageOptimization(src)}
                  priority={i === 0}
                  sizes="92vw"
                  draggable={false}
                />
              </div>
            ))}
          </div>

          {/* Десктоп: затухание + клик для увеличения */}
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
                unoptimized={shouldBypassImageOptimization(src)}
                priority={i === 0}
                sizes="(max-width: 1280px) 90vw, 1200px"
              />
            ))}
            <button
              type="button"
              className="absolute inset-0 z-[2] cursor-zoom-in bg-transparent border-0 p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber-500/70"
              onClick={() => openLightbox(active)}
              aria-label={`Увеличить: ${slides[active]?.alt ?? "фото"}`}
            />
            {slides.length > 1 ? (
              <>
                <button
                  type="button"
                  className={`${navButtonClass} left-2`}
                  onClick={(e) => {
                    e.stopPropagation();
                    goPrev();
                  }}
                  aria-label="Предыдущее фото"
                />
                <button
                  type="button"
                  className={`${navButtonClass} right-2`}
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
              className="absolute bottom-3 inset-x-0 flex justify-center gap-2 z-[4] pointer-events-none"
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

      <FrontpagePhotoLightbox
        slides={slides}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={(i) => {
          setLightboxIndex(i);
          goTo(i);
        }}
      />
    </>
  );
}
