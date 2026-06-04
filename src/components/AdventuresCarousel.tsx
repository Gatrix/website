"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  type PanInfo,
} from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Adventure } from "@/lib/db";
import AdventureCard from "@/components/AdventureCard";

interface AdventuresCarouselProps {
  adventures: Adventure[];
  onAdventureClick: (adventure: Adventure) => void;
  isPaused?: boolean;
}

const CARD_WIDTH_DESKTOP = 350;
const CARD_GAP = 20;
const MOBILE_CARD_WIDTH_RATIO = 0.72;
const MD_BREAKPOINT_PX = 768;
const AUTO_SCROLL_SPEED = 128; // px/sec

function mobileCardCascadeStyle(
  trackX: number,
  cardIndex: number,
  cardFullWidth: number,
  containerWidth: number,
): { scale: number; opacity: number } {
  if (containerWidth <= 0) return { scale: 1, opacity: 1 };
  const cardCenter = trackX + cardIndex * cardFullWidth + cardFullWidth / 2;
  const distance = Math.abs(cardCenter - containerWidth / 2);
  const t = Math.min(distance / (containerWidth * 0.55), 1);
  return {
    scale: 1 - t * 0.1,
    opacity: 1 - t * 0.42,
  };
}

function closestCyclicValue(current: number, base: number, cycle: number): number {
  if (!Number.isFinite(cycle) || cycle <= 0) return base;
  const candidates = [base - cycle, base, base + cycle];
  let best = candidates[0];
  let bestDistance = Math.abs(candidates[0] - current);
  for (let i = 1; i < candidates.length; i += 1) {
    const distance = Math.abs(candidates[i] - current);
    if (distance < bestDistance) {
      best = candidates[i];
      bestDistance = distance;
    }
  }
  return best;
}

export default function AdventuresCarousel({
  adventures,
  onAdventureClick,
  isPaused = false,
}: AdventuresCarouselProps) {
  const count = adventures.length;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [cardWidth, setCardWidth] = useState(CARD_WIDTH_DESKTOP);
  const [containerWidth, setContainerWidth] = useState(0);
  const [trackOffset, setTrackOffset] = useState(0);
  const [trackX, setTrackX] = useState(0);
  const x = useMotionValue(0);
  const snapAnimationRef = useRef<ReturnType<typeof animate> | null>(null);
  const lastTickRef = useRef(0);
  const movedByDragRef = useRef(false);
  const suppressClickUntilRef = useRef(0);

  const cardFullWidth = cardWidth + CARD_GAP;
  const totalWidth = count * cardFullWidth;
  const snapOrigin = trackOffset - totalWidth;

  useMotionValueEvent(x, "change", (latest) => {
    setTrackX(latest);
  });
  const extendedAdventures = useMemo(
    () => (count > 0 ? [...adventures, ...adventures, ...adventures] : []),
    [adventures, count],
  );

  const normalizeX = useCallback(() => {
    if (count <= 0) return;
    const minX = snapOrigin - totalWidth;
    const maxX = snapOrigin;
    let nextX = x.get();
    while (nextX <= minX) nextX += totalWidth;
    while (nextX > maxX) nextX -= totalWidth;
    if (nextX !== x.get()) x.set(nextX);
  }, [count, snapOrigin, totalWidth, x]);

  const [isMobile, setIsMobile] = useState(false);

  const syncLayout = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const nextContainerWidth = el.clientWidth;
    const mobile = window.innerWidth < MD_BREAKPOINT_PX;
    setIsMobile(mobile);
    setContainerWidth(nextContainerWidth);

    if (mobile) {
      const nextCardWidth = Math.round(nextContainerWidth * MOBILE_CARD_WIDTH_RATIO);
      const nextCardFullWidth = nextCardWidth + CARD_GAP;
      setCardWidth(nextCardWidth);
      setTrackOffset((nextContainerWidth - nextCardFullWidth) / 2);
      return;
    }

    setCardWidth(CARD_WIDTH_DESKTOP);
    setTrackOffset(0);
  }, []);

  useEffect(() => {
    syncLayout();
    window.addEventListener("resize", syncLayout);
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") {
      return () => window.removeEventListener("resize", syncLayout);
    }

    const observer = new ResizeObserver(() => syncLayout());
    observer.observe(el);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncLayout);
    };
  }, [syncLayout]);

  useEffect(() => {
    if (count === 0 || cardFullWidth <= 0) return;

    const origin = trackOffset - count * cardFullWidth;
    const current = x.get();
    const nextX =
      Math.abs(current) < 1
        ? origin
        : origin + Math.round((current - origin) / cardFullWidth) * cardFullWidth;
    x.set(nextX);
    setTrackX(nextX);
    normalizeX();
    lastTickRef.current = performance.now();
  }, [cardFullWidth, count, normalizeX, trackOffset, x]);

  useEffect(() => {
    if (count <= 1) return;

    let rafId = 0;
    let mounted = true;

    const tick = (now: number) => {
      if (!mounted) return;
      const last = lastTickRef.current || now;
      const deltaSeconds = Math.min((now - last) / 1000, 0.08);
      lastTickRef.current = now;

      // Автоскролл только на десктопе; на мобильных — только свайп
      if (!isMobile && !isPaused && !isHovered && !isDragging) {
        x.set(x.get() - AUTO_SCROLL_SPEED * deltaSeconds);
        normalizeX();
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      cancelAnimationFrame(rafId);
    };
  }, [count, isDragging, isHovered, isMobile, isPaused, normalizeX, x]);

  const handleDragStart = () => {
    setIsDragging(true);
    movedByDragRef.current = false;
    if (snapAnimationRef.current) {
      snapAnimationRef.current.stop();
      snapAnimationRef.current = null;
    }
  };

  const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 8) {
      movedByDragRef.current = true;
    }
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const currentX = x.get();
    // Проекция инерции в сторону жеста: positive velocity -> движение вправо.
    const projectedX = currentX + info.velocity.x * 0.22;
    const snappedBase =
      Math.round((projectedX - snapOrigin) / cardFullWidth) * cardFullWidth + snapOrigin;
    // Берём ближайший циклический эквивалент к текущей позиции, чтобы не было отскока в "начало".
    const targetX = closestCyclicValue(currentX, snappedBase, totalWidth);

    if (movedByDragRef.current) {
      suppressClickUntilRef.current = performance.now() + 180;
    }

    snapAnimationRef.current = animate(x, targetX, {
      type: "spring",
      stiffness: 280,
      damping: 34,
      mass: 0.8,
      onComplete: () => {
        normalizeX();
        snapAnimationRef.current = null;
        setIsDragging(false);
        movedByDragRef.current = false;
      },
      onStop: () => setIsDragging(false),
    });
  };

  if (count === 0) return null;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl py-4 sm:py-6"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-5 md:w-20 bg-gradient-to-r from-[#0f0d0c]/55 md:from-[#0f0d0c] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-5 md:w-20 bg-gradient-to-l from-[#0f0d0c]/55 md:from-[#0f0d0c] to-transparent" />

      {count > 1 ? (
        <>
          <div
            className="md:hidden pointer-events-none absolute left-1.5 top-1/2 z-30 -translate-y-1/2"
            aria-hidden
          >
            <motion.div
              animate={{ x: [-2, 2, -2] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronLeft className="h-5 w-5 text-amber-200/35" strokeWidth={1.25} aria-hidden />
            </motion.div>
          </div>
          <div
            className="md:hidden pointer-events-none absolute right-1.5 top-1/2 z-30 -translate-y-1/2"
            aria-hidden
          >
            <motion.div
              animate={{ x: [2, -2, 2] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronRight className="h-5 w-5 text-amber-200/35" strokeWidth={1.25} aria-hidden />
            </motion.div>
          </div>
        </>
      ) : null}

      <motion.div
        style={{ x, willChange: "transform" }}
        className="flex cursor-grab items-start active:cursor-grabbing"
        drag="x"
        dragElastic={0.06}
        dragMomentum={false}
        dragConstraints={{ left: -Infinity, right: Infinity }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {extendedAdventures.map((adventure, index) => {
          const cascade =
            isMobile && containerWidth > 0
              ? mobileCardCascadeStyle(trackX, index, cardFullWidth, containerWidth)
              : { scale: 1, opacity: 1 };

          return (
            <div
              key={`${adventure.id}-${index}`}
              className="relative shrink-0 px-[10px]"
              style={{ width: cardFullWidth }}
            >
              {count > 1 && index % count === 0 && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0 top-3 bottom-3 z-10 w-[3px] bg-amber-400/80 shadow-[0_0_10px_rgba(251,191,36,0.45)]"
                />
              )}
              <AdventureCard
                as={motion.div}
                adventure={adventure}
                style={{
                  scale: cascade.scale,
                  opacity: cascade.opacity,
                  transformOrigin: "center center",
                }}
                onClick={() => {
                  if (performance.now() > suppressClickUntilRef.current && !movedByDragRef.current) {
                    onAdventureClick(adventure);
                  }
                }}
                imageSizes={`(max-width: ${MD_BREAKPOINT_PX}px) ${Math.round(
                  MOBILE_CARD_WIDTH_RATIO * 100,
                )}vw, 350px`}
                draggable={false}
              />
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
