"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Adventure } from "@/hooks/useAdventures";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const scrollPositionRef = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [slideDirection, setSlideDirection] = useState(1);

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

    if (absX >= absY && absX > 48) {
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
        onClose();
      } else if (e.key === "ArrowLeft" && hasPrevious && onPrevious) {
        e.preventDefault();
        onPrevious();
      } else if (e.key === "ArrowRight" && hasNext && onNext) {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [isOpen, onClose, onPrevious, onNext, hasPrevious, hasNext]);

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
  const adventureTypeLabel = (type?: string) => {
    if (!type) return null;
    const t = type.toLowerCase();
    if (t === "oneshot" || t === "ваншот") return "Ваншот (1 игра)";
    if (t === "adventure" || t === "приключение") return "Приключение (~5 игр)";
    if (t === "campaign" || t === "кампания") return "Кампания (10+ игр)";
    return type;
  };
  const universeDisplay = (v: string) => (v === "Иное" ? "Иной мир" : v);

  const durationLabel = useMemo(() => {
    if (!adventure) return "";
    if (adventure.session_duration?.trim()) return adventure.session_duration.trim();
    if (adventure.time?.trim()) return adventure.time.trim();
    if (adventure.durationHours?.trim()) return adventure.durationHours.trim();
    if (typeof adventure.durationMinutes === "number" && adventure.durationMinutes > 0) {
      const hours = adventure.durationMinutes / 60;
      return Number.isInteger(hours) ? `${hours} ч` : `${hours.toFixed(1)} ч`;
    }
    return "";
  }, [adventure]);

  const playersLabel = useMemo(() => {
    if (!adventure) return "";
    if (adventure.player_count?.trim()) return adventure.player_count.trim();
    if (adventure.players?.trim()) return adventure.players.trim();
    if (adventure.playerCount) return `${adventure.playerCount.min}-${adventure.playerCount.max} игроков`;
    return "";
  }, [adventure]);

  const paramsList = useMemo(() => {
    if (!adventure) return [];
    const items: { label: string; value: string }[] = [];
    if (adventure.universe)
      items.push({ label: "Вселенная", value: universeDisplay(adventure.universe) });
    const setting = adventure.subsetting?.trim() || "";
    if (setting) items.push({ label: "Сеттинг", value: setting });
    const genres = Array.isArray(adventure.genre)
      ? adventure.genre
      : adventure.genre
        ? [adventure.genre]
        : adventure.focus
          ? [adventure.focus]
          : [];
    if (genres.length) items.push({ label: "Жанр", value: genres.join(", ") });
    if (adventure.difficulty) items.push({ label: "Сложность", value: adventure.difficulty });
    const advType = adventureTypeLabel(adventure.adventure_type ?? adventure.format);
    if (advType) items.push({ label: "Тип", value: advType });
    if (durationLabel) items.push({ label: "Длительность игры", value: durationLabel });
    if (playersLabel) items.push({ label: "Количество игроков", value: playersLabel });
    return items;
  }, [adventure, durationLabel, playersLabel]);

  const handleChooseDate = () => {
    if (!adventure) return;
    onClose();
    router.push("/schedule#calendar");
  };

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
              className="relative w-[min(94vw,85rem)] h-[min(90vh,52rem)] max-h-[90vh] bg-[#14110f] border-2 border-amber-700/40 rounded-lg sm:rounded-xl overflow-hidden shadow-2xl pointer-events-auto flex flex-col touch-manipulation"
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
                  className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden"
                >
                  {/* Мобилка: order-1 — заголовок и вступление; md: правая колонка */}
                  <div className="order-1 md:order-2 flex flex-none md:flex-1 min-h-0 flex-col overflow-hidden relative bg-[#14110f] md:bg-transparent">
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
                      className="max-h-[min(38vh,22rem)] md:max-h-none flex-1 min-h-0 p-4 sm:p-[min(1.5rem,2vw)] md:p-[min(2rem,2.5vw)] pr-14 sm:pr-16 overflow-y-auto"
                    >
                      <h2 id="adventure-title" className="text-[clamp(1.125rem,2.5vw,2.25rem)] md:text-[clamp(1.5rem,3vw,2.5rem)] font-extrabold uppercase tracking-tight text-amber-100 leading-tight mb-4">
                        {adventure.title}
                      </h2>
                      {displayText && (
                        <p id="adventure-description" className="text-[clamp(0.875rem,1.5vw,1.125rem)] md:text-[clamp(1rem,1.8vw,1.25rem)] text-amber-200/80 leading-relaxed whitespace-pre-line">
                          {displayText}
                        </p>
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
                    <div className="hidden md:block flex-shrink-0 p-4 sm:p-[min(1.5rem,2vw)] md:p-[min(2rem,2.5vw)] pt-0">
                      <button
                        onClick={handleChooseDate}
                        className="btn btn-primary w-full focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110f]"
                      >
                        Записаться
                      </button>
                    </div>
                  </div>

                  {/* Мобилка: order-2 — постер и параметры; md: левая колонка */}
                  <div className="order-2 md:order-1 relative w-full md:w-[40.84%] md:min-w-[284px] md:max-w-[392px] flex-1 min-h-0 md:h-full bg-[#0f0d0c] border-b md:border-b-0 md:border-r border-amber-900/30 md:flex-none md:flex-shrink-0 flex flex-col p-[min(1rem,2vw)] sm:p-4 md:pt-[min(2rem,3vh)] md:pb-0">
                    <div ref={leftScrollRef} className="flex-1 min-h-0 overflow-y-auto flex flex-col">
                      <div className="relative w-full max-w-[min(337px,85%)] min-w-[198px] aspect-[3/4] max-h-[min(47vh,416px)] flex items-center justify-center overflow-hidden rounded-md shadow-inner mb-4 sm:mb-6 flex-shrink-0 self-center mx-auto">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={`Постер: ${adventure.title}`}
                            fill
                            className="object-cover transition-transform duration-500"
                            sizes="(max-width: 768px) 280px, 415px"
                            unoptimized
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 to-amber-950/40 flex items-center justify-center">
                            <span className="text-amber-900/30 text-xs sm:text-sm uppercase font-bold">Нет изображения</span>
                          </div>
                        )}
                      </div>
                      {paramsList.length > 0 && (
                        <div className="w-full max-w-[min(260px,75vw)] md:max-w-none mb-4 flex-shrink-0 space-y-2">
                          {paramsList.map(({ label, value }) => (
                            <p
                              key={label}
                              className="text-base sm:text-lg text-amber-200/90 leading-relaxed border-b border-amber-900/40 pb-2 last:border-b-0"
                            >
                              <span className="text-amber-500/80 font-medium">{label}: </span>
                              {value}
                            </p>
                          ))}
                          {adventure.contentWarnings?.length ? (
                            <p className="mt-2 text-base sm:text-lg text-amber-300/70">
                              <span className="text-amber-500/80 font-medium">Контент‑предупреждения: </span>
                              {adventure.contentWarnings.join(", ")}
                            </p>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Мобилка: order-3 — CTA под постером; на md скрыто (кнопка в правой колонке) */}
                  <div className="order-3 md:hidden flex-shrink-0 p-4 sm:p-[min(1.5rem,2vw)] pt-0 border-t border-amber-900/25 bg-[#14110f]">
                    <button
                      onClick={handleChooseDate}
                      className="btn btn-primary w-full focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110f]"
                    >
                      Записаться
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
