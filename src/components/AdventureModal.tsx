"use client";

import React, { useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getStorageImageUrl } from "@/lib/storage";
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
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const slideDirectionRef = useRef(1);

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
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen]);

  // Предотвращение скролла фона
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const imageUrl = adventure
    ? getStorageImageUrl(adventure.img_url || adventure.poster, "adventures")
    : null;
  const fullDescription = adventure?.description?.trim() || adventure?.logline?.trim() || "";
  const formatLabel = (format?: Adventure["format"]) => {
    if (!format) return null;
    const normalized = format.toString().toLowerCase();
    if (normalized === "oneshot") return "Ваншот";
    if (normalized === "mini-campaign") return "Мини-кампания";
    if (normalized === "campaign") return "Кампания";
    return format.toString();
  };
  const badges = useMemo(() => {
    if (!adventure) return [];
    const items: string[] = [];
    const genre = Array.isArray(adventure.genre) ? adventure.genre[0] : adventure.genre ?? adventure.focus;
    if (genre) items.push(genre);
    const tone = Array.isArray(adventure.tone) ? adventure.tone[0] : adventure.tone;
    if (tone) items.push(tone);
    if (adventure.difficulty) items.push(`Сложность: ${adventure.difficulty}`);
    const durationLabel = adventure.durationMinutes
      ? `${Math.round((adventure.durationMinutes / 60) * 10) / 10} ч`
      : adventure.durationHours ?? adventure.time;
    if (durationLabel) items.push(`Длительность: ${durationLabel}`);
    const players = adventure.playerCount
      ? `${adventure.playerCount.min}-${adventure.playerCount.max}`
      : adventure.players;
    if (players) items.push(`Игроки: ${players}`);
    const format = formatLabel(adventure.format);
    if (format) items.push(`Формат: ${format}`);
    if (adventure.isBeginnerFriendly) items.push("Новичкам ок");
    if (adventure.ageRating) items.push(`Возраст: ${adventure.ageRating}`);
    return items;
  }, [adventure]);

  const highlights = adventure?.highlights?.length
    ? adventure.highlights
    : adventure?.benefits?.length
      ? adventure.benefits
      : [
          "Атмосферная игра с живыми решениями",
          "Помощь с персонажем и правилами",
          "Продуманные сцены и реквизит",
          "Безопасные границы и поддержка ведущего",
          "Памятные моменты и награды",
        ];

  const handleChooseDate = () => {
    if (!adventure) return;
    onClose();
    const params = new URLSearchParams();
    params.set("view", "calendar");
    if (adventure.id) params.set("adventureId", adventure.id);
    params.set("availability", "available");
    router.push(`/schedule?${params.toString()}#calendar`);
  };

  const handleOtherAdventures = () => {
    onClose();
    router.push("/adventures");
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
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
              aria-describedby={fullDescription ? "adventure-description" : undefined}
              onKeyDown={handleDialogKeyDown}
              className="relative w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] bg-[#14110f] border-2 border-amber-700/40 rounded-lg sm:rounded-xl overflow-hidden shadow-2xl pointer-events-auto flex flex-col"
            >
              {/* Декоративные углы */}
              <div className="absolute top-0 left-0 w-4 h-4 sm:w-6 md:w-8 border-t-2 border-l-2 border-amber-500/60 z-20" />
              <div className="absolute top-0 right-0 w-4 h-4 sm:w-6 md:w-8 border-t-2 border-r-2 border-amber-500/60 z-20" />
              <div className="absolute bottom-0 left-0 w-4 h-4 sm:w-6 md:w-8 border-b-2 border-l-2 border-amber-500/60 z-20" />
              <div className="absolute bottom-0 right-0 w-4 h-4 sm:w-6 md:w-8 border-b-2 border-r-2 border-amber-500/60 z-20" />

              {/* Кнопка закрытия */}
              <button
                onClick={onClose}
                aria-label="Закрыть"
                ref={closeButtonRef}
                className="absolute top-2 right-2 sm:top-4 sm:right-4 z-40 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-amber-950/60 border border-amber-800/50 rounded-full text-amber-600 hover:text-amber-400 hover:bg-amber-900/40 transition-all shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110f]"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>

              {/* Стрелки навигации */}
              {hasPrevious && onPrevious && (
                <button
                  onClick={() => {
                    slideDirectionRef.current = -1;
                    onPrevious();
                  }}
                  aria-label="Предыдущее приключение"
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-amber-950/60 border border-amber-800/50 rounded-full text-amber-600 hover:text-amber-400 hover:bg-amber-900/40 transition-all shadow-lg"
                >
                  <ChevronLeft size={24} className="sm:w-6 sm:h-6" />
                </button>
              )}
              {hasNext && onNext && (
                <button
                  onClick={() => {
                    slideDirectionRef.current = 1;
                    onNext();
                  }}
                  aria-label="Следующее приключение"
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-amber-950/60 border border-amber-800/50 rounded-full text-amber-600 hover:text-amber-400 hover:bg-amber-900/40 transition-all shadow-lg"
                >
                  <ChevronRight size={24} className="sm:w-6 sm:h-6" />
                </button>
              )}

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={adventure.id}
                  initial={{ opacity: 0, x: slideDirectionRef.current * 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: slideDirectionRef.current * -40 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex flex-col md:flex-row overflow-y-auto"
                >
                  {/* Левая панель - Постер приключения */}
                  <div className="relative w-full md:w-[250px] lg:w-[300px] xl:w-[350px] bg-[#0f0d0c] border-b md:border-b-0 md:border-r border-amber-900/30 flex-shrink-0 flex flex-col items-center justify-start p-3 sm:p-4 md:pt-8">
                    {/* Зона постера с соотношением 2:3 */}
                    <div className="relative w-full max-w-[200px] sm:max-w-[250px] md:max-w-none aspect-[2/3] flex items-center justify-center overflow-hidden rounded-md shadow-inner mb-6 sm:mb-8">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={`Постер: ${adventure.title}`}
                          fill
                          className="object-cover transition-transform duration-500"
                          sizes="(max-width: 768px) 250px, 350px"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 to-amber-950/40 flex items-center justify-center">
                          <span className="text-amber-900/30 text-xs sm:text-sm uppercase font-bold">Нет изображения</span>
                        </div>
                      )}
                    </div>
                    <div className="w-full max-w-[220px] sm:max-w-[260px] md:max-w-none space-y-2">
                      <button
                        onClick={handleChooseDate}
                        className="btn btn-primary w-full focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110f]"
                      >
                        Подобрать дату
                      </button>
                      <button
                        onClick={handleOtherAdventures}
                        className="btn btn-secondary w-full focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110f]"
                      >
                        Другие приключения
                      </button>
                    </div>
                  </div>

                  {/* Правая панель - Информация о приключении */}
                  <div className="flex-1 min-h-[320px] flex flex-col">
                    <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 overflow-y-auto">
                      {/* Header */}
                      <div className="space-y-3 mb-6">
                        <h2 id="adventure-title" className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold uppercase tracking-tight text-amber-100 leading-tight">
                          {adventure.title}
                        </h2>
                        {fullDescription && (
                          <div className="max-h-[150px] sm:max-h-[200px] overflow-y-auto pr-2">
                            <p id="adventure-description" className="text-sm sm:text-base md:text-lg text-amber-200/80 leading-relaxed whitespace-pre-line">
                              {fullDescription}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mb-4">
                        <h3 className="text-amber-400/80 uppercase text-[10px] sm:text-xs font-bold mb-3 tracking-[0.2em] border-b border-amber-900/30 pb-1 font-sans">
                          Что вас ждет
                        </h3>
                        <ul className="space-y-2 text-[#d1c7bc] text-sm sm:text-base">
                          {highlights.slice(0, 6).map((benefit) => (
                            <li key={benefit} className="flex items-start gap-3">
                              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {badges.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-amber-400/80 uppercase text-[10px] sm:text-xs font-bold mb-3 tracking-[0.2em] border-b border-amber-900/30 pb-1 font-sans">
                            Параметры
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {badges.map((badge) => (
                              <span key={badge} className="chip">
                                {badge}
                              </span>
                            ))}
                          </div>
                          {adventure.contentWarnings?.length ? (
                            <p className="mt-3 text-xs text-amber-300/70">
                              Контент‑предупреждения: {adventure.contentWarnings.join(", ")}
                            </p>
                          ) : null}
                        </div>
                      )}
                    </div>

                    {(adventure.priceLabel || adventure.price) && (
                      <div className="border-t border-amber-900/30 px-4 sm:px-6 md:px-8 lg:px-10 py-4">
                        <div className="text-amber-400/80 text-xs uppercase tracking-[0.2em]">
                          {adventure.priceLabel ?? adventure.price}
                        </div>
                      </div>
                    )}
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
