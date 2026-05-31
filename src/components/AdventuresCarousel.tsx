"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animate, motion, useMotionValue, type PanInfo } from "framer-motion";
import type { Adventure } from "@/lib/db";
import AdventureCard from "@/components/AdventureCard";

interface AdventuresCarouselProps {
  adventures: Adventure[];
  onAdventureClick: (adventure: Adventure) => void;
  isPaused?: boolean;
}

const CARD_WIDTH_MOBILE = 300;
const CARD_WIDTH_DESKTOP = 350;
const CARD_GAP = 20;
const AUTO_SCROLL_SPEED = 128; // px/sec

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
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [cardWidth, setCardWidth] = useState(CARD_WIDTH_DESKTOP);
  const x = useMotionValue(0);
  const snapAnimationRef = useRef<ReturnType<typeof animate> | null>(null);
  const lastTickRef = useRef(0);
  const movedByDragRef = useRef(false);
  const suppressClickUntilRef = useRef(0);

  const cardFullWidth = cardWidth + CARD_GAP;
  const totalWidth = count * cardFullWidth;
  const extendedAdventures = useMemo(
    () => (count > 0 ? [...adventures, ...adventures, ...adventures] : []),
    [adventures, count],
  );

  const normalizeX = useCallback(() => {
    if (count <= 0) return;
    const minX = -2 * totalWidth;
    const maxX = -totalWidth;
    let nextX = x.get();
    while (nextX <= minX) nextX += totalWidth;
    while (nextX > maxX) nextX -= totalWidth;
    if (nextX !== x.get()) x.set(nextX);
  }, [count, totalWidth, x]);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const syncWidth = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setCardWidth(mobile ? CARD_WIDTH_MOBILE : CARD_WIDTH_DESKTOP);
    };
    syncWidth();
    window.addEventListener("resize", syncWidth);
    return () => window.removeEventListener("resize", syncWidth);
  }, []);

  useEffect(() => {
    if (count === 0) return;
    x.set(-totalWidth);
    lastTickRef.current = performance.now();
  }, [count, totalWidth, x]);

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
    const snappedBase = Math.round(projectedX / cardFullWidth) * cardFullWidth;
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
    <div className="relative w-full overflow-hidden rounded-xl py-4 sm:py-6">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-8 sm:w-20 bg-gradient-to-r from-[#0f0d0c] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-8 sm:w-20 bg-gradient-to-l from-[#0f0d0c] to-transparent" />

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
        {extendedAdventures.map((adventure, index) => (
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
              onClick={() => {
                if (performance.now() > suppressClickUntilRef.current && !movedByDragRef.current) {
                  onAdventureClick(adventure);
                }
              }}
              imageSizes="(max-width: 768px) 300px, 350px"
              draggable={false}
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
