"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Adventure } from "@/hooks/useAdventures";

const AdventureBookingForm = dynamic(() => import("@/components/booking/AdventureBookingForm"), {
  ssr: false,
  loading: () => (
    <p className="text-sm text-amber-200/70 py-4" role="status">
      Загрузка формы…
    </p>
  ),
});

interface AdventureModalProps {
  adventure: Adventure | null;
  isOpen: boolean;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export default function AdventureModal({
  adventure,
  isOpen,
  onClose,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}: AdventureModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const scrollPositionRef = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [slideDirection, setSlideDirection] = useState(1);
  const [bookingOpen, setBookingOpen] = useState(false);

  const canSwipeUpClose = () => {
    const left = leftScrollRef.current?.scrollTop ?? 0;
    const right = rightScrollRef.current?.scrollTop ?? 0;
    return left <= 8 && right <= 8;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (absX < 24 && absY < 24) return;

    if (!bookingOpen && absX >= absY && absX > 48) {
      if (dx > 0 && hasPrevious && onPrevious) {
        setSlideDirection(-1);
        onPrevious();
      } else if (dx < 0 && hasNext && onNext) {
        setSlideDirection(1);
        onNext();
      }
      return;
    }

    if (absY > absX && dy < -56 && canSwipeUpClose()) {
      onClose();
    }
  };

  // Управление с клавиатуры (Escape, стрелки влево/вправо)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (bookingOpen) setBookingOpen(false);
        else onClose();
      } else if (!bookingOpen && e.key === "ArrowLeft" && hasPrevious && onPrevious) {
        e.preventDefault();
        onPrevious();
      } else if (!bookingOpen && e.key === "ArrowRight" && hasNext && onNext) {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [isOpen, onClose, onPrevious, onNext, hasPrevious, hasNext, bookingOpen]);

  useEffect(() => {
    if (!isOpen) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });
    return () => {
      // Не возвращаем фокус на карточку — она в overflow-hidden карусели, ring обрезается.
      // Вместо этого снимаем фокус, чтобы не было странного выделения.
      const el = previouslyFocusedRef.current;
      if (el?.closest?.("[data-adventure-card]")) {
        (el as HTMLElement).blur();
      } else if (el?.focus) {
        requestAnimationFrame(() => el.focus());
      }
    };
  }, [isOpen]);

  useEffect(() => {
    setBookingOpen(false);
  }, [adventure?.id]);

  // Предотвращение скролла фона + компенсация ширины скроллбара (убирает тряску при закрытии)
  useEffect(() => {
    if (isOpen) {
      scrollPositionRef.current = window.scrollY;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollPositionRef.current, behavior: "auto" });
      });
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen]);

  const imageUrl = adventure?.imageUrl ?? null;
  const playerIntro = adventure?.intro?.trim() || "";
  const fullDescription = adventure?.description?.trim() || adventure?.logline?.trim() || "";
  const displayText = playerIntro || fullDescription;
  const handleDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (!adventure) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Затемненный фон */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50"
            onClick={onClose}
          />

          {/* Модальное окно */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 pointer-events-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="adventure-title"
              aria-describedby={displayText ? "adventure-description" : undefined}
              onKeyDown={handleDialogKeyDown}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="relative w-[min(94vw,85rem)] h-[min(92vh,56rem)] max-h-[92vh] bg-[#14110f] border-2 border-amber-700/40 rounded-lg sm:rounded-xl overflow-hidden shadow-2xl pointer-events-auto flex flex-col touch-manipulation"
            >
              {/* Декоративные углы */}
              <div className="absolute top-0 left-0 w-4 h-4 sm:w-6 md:w-8 border-t-2 border-l-2 border-amber-500/60 z-20" />
              <div className="absolute top-0 right-0 w-4 h-4 sm:w-6 md:w-8 border-t-2 border-r-2 border-amber-500/60 z-20" />
              <div className="absolute bottom-0 left-0 w-4 h-4 sm:w-6 md:w-8 border-b-2 border-l-2 border-amber-500/60 z-20" />
              <div className="absolute bottom-0 right-0 w-4 h-4 sm:w-6 md:w-8 border-b-2 border-r-2 border-amber-500/60 z-20" />

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={adventure.id}
                  initial={{ opacity: 0, x: slideDirection * 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: slideDirection * -40 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex-1 min-h-0 flex flex-col md:flex-row md:items-stretch overflow-hidden"
                >
                  <>
                  {/* Мобилка: order-1 — заголовок, описание и характеристики; md: правая колонка (только текст) */}
                  <div className="order-1 md:order-2 flex flex-1 min-h-0 min-w-0 md:basis-1/2 flex-col overflow-hidden relative bg-[#14110f] md:bg-transparent">
                    <button
                      onClick={onClose}
                      aria-label="Закрыть"
                      ref={closeButtonRef}
                      className="absolute top-4 right-4 z-40 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-[#14110f]/90 border border-amber-900/30 rounded-md text-amber-600/70 hover:text-amber-500/90 hover:bg-amber-950/30 hover:border-amber-800/30 transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-700/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110f]"
                    >
                      <X size={18} className="sm:w-5 sm:h-5" />
                    </button>
                    <div
                      ref={rightScrollRef}
                      className="flex-1 min-h-0 p-4 sm:p-[min(1.5rem,2vw)] md:p-[min(2rem,2.5vw)] pr-14 sm:pr-16 overflow-y-auto"
                    >
                      <h2 id="adventure-title" className="text-[clamp(1.125rem,2.5vw,2.25rem)] md:text-[clamp(1.5rem,3vw,2.5rem)] font-extrabold uppercase tracking-tight text-amber-100 leading-tight mb-4">
                        {adventure.title}
                      </h2>
                      {bookingOpen ? (
                        <AdventureBookingForm adventure={adventure} onBack={() => setBookingOpen(false)} />
                      ) : (
                        <>
                          {displayText ? (
                            <p
                              id="adventure-description"
                              className="text-[clamp(0.875rem,1.5vw,1.125rem)] md:text-[clamp(1rem,1.8vw,1.25rem)] text-amber-200/80 leading-relaxed whitespace-pre-line"
                            >
                              {displayText}
                            </p>
                          ) : null}
                        </>
                      )}
                      {/* Блок «Архетипичные персонажи» — временно отключён (данные не подключены)
                      <div className="mt-6">
                        <h3 className="text-amber-300/90 font-semibold text-sm sm:text-base uppercase tracking-wide mb-3 text-center">
                          Архетипичные персонажи
                        </h3>
                        <div className="grid grid-cols-4 gap-5 sm:gap-8 w-[67.5%] mx-auto">
                          {Array.from({ length: 8 }, (_, idx) => (
                            <div
                              key={`archetype-slot-${idx + 1}`}
                              className="relative aspect-square w-full rounded-md border border-amber-800/60 bg-[#14110f] overflow-hidden flex items-center justify-center text-center"
                            >
                              <span className="text-amber-500/60 text-xs sm:text-sm font-medium uppercase tracking-wide">
                                {idx + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      */}
                    </div>
                    {!bookingOpen ? (
                      <div className="hidden md:block flex-shrink-0 p-4 sm:p-[min(1.5rem,2vw)] md:p-[min(2rem,2.5vw)] pt-0">
                        <button
                          type="button"
                          onClick={() => setBookingOpen(true)}
                          className="btn btn-primary w-full inline-flex items-center justify-center focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110f]"
                        >
                          Забронировать игру
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {/* Мобилка: order-2 — постер; md: левая колонка (постер на всю высоту блока) */}
                  <div className="order-2 md:order-1 relative w-full min-h-0 min-w-0 md:basis-1/2 md:flex-1 flex flex-col bg-[#0f0d0c] border-b md:border-b-0 md:border-r border-amber-900/30 min-h-[min(52vh,520px)] md:min-h-0 p-3 sm:p-4 md:p-4">
                    <div
                      ref={leftScrollRef}
                      className="flex-1 min-h-0 w-full h-full flex items-center justify-center"
                    >
                      <div className="relative h-full max-h-full w-auto max-w-full min-h-[280px] min-w-[min(200px,70vw)] aspect-[3/4] overflow-hidden rounded-md shadow-inner">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={`Постер: ${adventure.title}`}
                            fill
                            className="object-contain transition-transform duration-500"
                            sizes="(max-width: 768px) 94vw, 46vw"
                            unoptimized
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 to-amber-950/40 flex items-center justify-center">
                            <span className="text-amber-900/30 text-xs sm:text-sm uppercase font-bold">Нет изображения</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Мобилка: order-3 — CTA под постером; на md скрыто (кнопка в правой колонке) */}
                  {!bookingOpen ? (
                    <div className="order-3 md:hidden flex-shrink-0 p-4 sm:p-[min(1.5rem,2vw)] pt-0 border-t border-amber-900/25 bg-[#14110f]">
                      <button
                        type="button"
                        onClick={() => setBookingOpen(true)}
                        className="btn btn-primary w-full inline-flex items-center justify-center focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110f]"
                      >
                        Забронировать игру
                      </button>
                    </div>
                  ) : null}
                  </>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
