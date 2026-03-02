"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SLIDE_DURATION_MS = 5000;
const TRANSITION_DURATION = 0.6;

interface PhotoCarouselProps {
  photos: string[];
}

export default function PhotoCarousel({ photos }: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"prev" | "next">("next");
  const [timerKey, setTimerKey] = useState(0);

  const resetAutoAdvance = useCallback(() => {
    setTimerKey((k) => k + 1);
  }, []);

  const goTo = useCallback(
    (index: number, dir: "prev" | "next") => {
      if (photos.length === 0) return;
      setDirection(dir);
      setCurrentIndex((index + photos.length) % photos.length);
    },
    [photos.length]
  );

  const goPrev = useCallback(() => {
    resetAutoAdvance();
    goTo(currentIndex - 1, "prev");
  }, [currentIndex, goTo, resetAutoAdvance]);

  const goNext = useCallback(() => {
    resetAutoAdvance();
    goTo(currentIndex + 1, "next");
  }, [currentIndex, goTo, resetAutoAdvance]);

  // Автопрокрутка каждые 5 секунд (таймер сбрасывается при ручной смене фото)
  useEffect(() => {
    if (photos.length <= 1) return;
    const timer = setInterval(() => {
      setDirection("next");
      setCurrentIndex((i) => (i + 1) % photos.length);
    }, SLIDE_DURATION_MS);
    return () => clearInterval(timer);
  }, [photos.length, timerKey]);

  if (photos.length === 0) {
    return (
      <div className="relative aspect-video max-h-[500px] bg-[#1a1614] border border-amber-900/30 overflow-hidden flex items-center justify-center">
        <p className="text-amber-900/40 text-sm italic">Добавьте фото в photos/frontpage</p>
      </div>
    );
  }

  const variants = {
    enter: (dir: "prev" | "next") => ({
      x: dir === "next" ? "100%" : "-100%",
    }),
    center: {
      x: 0,
    },
    exit: (dir: "prev" | "next") => ({
      x: dir === "next" ? "-100%" : "100%",
    }),
  };

  return (
    <div className="relative aspect-video max-h-[500px] overflow-hidden group">
      {/* Декоративная рамка */}
      <div className="absolute -inset-4 bg-amber-900/5 border border-amber-900/20 -rotate-2 group-hover:rotate-0 transition-transform duration-500" />
      <div className="relative w-full h-full bg-[#1a1614] border border-amber-900/30 overflow-hidden shadow-2xl">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "tween", duration: TRANSITION_DURATION, ease: [0.25, 0.46, 0.45, 0.94] },
            }}
            className="absolute inset-0"
          >
            <Image
              src={photos[currentIndex]}
              alt={`Фото клуба ${currentIndex + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={currentIndex === 0}
            />
          </motion.div>
        </AnimatePresence>

        {/* Кнопки навигации */}
        {photos.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-amber-100 transition-colors border border-amber-900/30"
              aria-label="Предыдущее фото"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-amber-100 transition-colors border border-amber-900/30"
              aria-label="Следующее фото"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Индикаторы */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    resetAutoAdvance();
                    setDirection(i > currentIndex ? "next" : "prev");
                    setCurrentIndex(i);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentIndex
                      ? "bg-amber-500 w-6"
                      : "bg-amber-900/50 hover:bg-amber-800/60"
                  }`}
                  aria-label={`Перейти к фото ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
