"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ChevronUp, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MD_MAX_WIDTH = "(max-width: 767px)";
const LONG_PRESS_MS = 550;
const SWIPE_THRESHOLD_PX = 48;
const TAP_SLOP_PX = 24;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(MD_MAX_WIDTH);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
}

function isTouchInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest("button, a, input, textarea, select, label, [role='button']"));
}

function isTouchInMobileHeader(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest("[data-adventure-mobile-header]"));
}

function clearTextSelection() {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return;
  selection.removeAllRanges();
}

type MobileGestureHintOverlayProps = {
  visible: boolean;
  hasPrevious: boolean;
  hasNext: boolean;
};

function MobileGestureHintOverlay({
  visible,
  hasPrevious,
  hasNext,
}: MobileGestureHintOverlayProps) {
  const hintIconClass =
    "w-11 h-11 rounded-sm bg-black/35 border border-amber-700/25 flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.28)]";
  const hintLabelClass =
    "text-[10px] sm:text-xs uppercase tracking-wider text-amber-200/65 font-medium";

  const showHorizontalHints = hasPrevious || hasNext;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.35 }}
          className="md:hidden absolute inset-x-0 bottom-0 z-30 pointer-events-none"
          aria-hidden
        >
          <div className="bg-gradient-to-t from-[#0a0908]/92 via-[#14110f]/72 to-transparent pt-14 pb-4 sm:pb-5 px-3 sm:px-4">
            <div
              className={`flex items-end justify-center gap-6 sm:gap-10 ${
                showHorizontalHints ? "max-w-sm mx-auto" : ""
              }`}
            >
              {hasPrevious ? (
                <div className="flex flex-col items-center gap-1.5 min-w-[4.5rem]">
                  <motion.div
                    className={hintIconClass}
                    animate={{ x: [-3, 3, -3] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ChevronLeft className="w-6 h-6 text-amber-300/70" aria-hidden />
                  </motion.div>
                  <span className={hintLabelClass}>Назад</span>
                </div>
              ) : null}

              <div className="flex flex-col items-center gap-1.5 min-w-[4.5rem]">
                <motion.div
                  className={hintIconClass}
                  animate={{ y: [2, -5, 2] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ChevronUp className="w-6 h-6 text-amber-300/70" aria-hidden />
                </motion.div>
                <span className={hintLabelClass}>Закрыть</span>
              </div>

              {hasNext ? (
                <div className="flex flex-col items-center gap-1.5 min-w-[4.5rem]">
                  <motion.div
                    className={hintIconClass}
                    animate={{ x: [3, -3, 3] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ChevronRight className="w-6 h-6 text-amber-300/70" aria-hidden />
                  </motion.div>
                  <span className={hintLabelClass}>Далее</span>
                </div>
              ) : null}
            </div>
            <p className="text-center text-amber-200/45 text-[10px] sm:text-[11px] mt-3 tracking-wide">
              Удержите карточку — бронь · коснитесь — скрыть подсказки
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
import type { Adventure } from "@/lib/db";
import { adventureGenres } from "@/lib/adventure-genres";
import AdventureIntroSection from "@/components/AdventureIntroSection";

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
  const isMobile = useIsMobile();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const scrollPositionRef = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number; target: EventTarget | null } | null>(
    null
  );
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);
  const [slideDirection, setSlideDirection] = useState(1);
  const [gestureHintsVisible, setGestureHintsVisible] = useState(false);
  const [bookingState, setBookingState] = useState<{ adventureId: string | null; open: boolean }>({
    adventureId: null,
    open: false,
  });
  const bookingOpen = bookingState.open && bookingState.adventureId === adventure?.id;
  const closeBooking = useCallback(() => {
    setBookingState((current) => ({ ...current, open: false }));
  }, []);
  const openBooking = useCallback(() => {
    setBookingState({ adventureId: adventure?.id ?? null, open: true });
  }, [adventure?.id]);

  const dismissGestureHints = useCallback(() => {
    setGestureHintsVisible(false);
  }, []);

  useEffect(() => {
    if (isOpen && isMobile && !bookingOpen) {
      setGestureHintsVisible(true);
    }
  }, [isOpen, isMobile, bookingOpen]);

  useEffect(() => {
    if (!isOpen || !isMobile || !gestureHintsVisible || bookingOpen) return;
    const timer = window.setTimeout(dismissGestureHints, 7000);
    return () => window.clearTimeout(timer);
  }, [isOpen, isMobile, gestureHintsVisible, bookingOpen, dismissGestureHints]);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const canSwipeUpClose = () => {
    const left = leftScrollRef.current?.scrollTop ?? 0;
    const right = rightScrollRef.current?.scrollTop ?? 0;
    return left <= 8 && right <= 8;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    touchStartRef.current = { x: e.clientX, y: e.clientY, target: e.target };
    longPressTriggeredRef.current = false;
    clearLongPressTimer();

    if (isMobile && !bookingOpen && !isTouchInteractiveTarget(e.target)) {
      clearTextSelection();
      longPressTimerRef.current = setTimeout(() => {
        longPressTriggeredRef.current = true;
        clearTextSelection();
        dismissGestureHints();
        openBooking();
      }, LONG_PRESS_MS);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const start = touchStartRef.current;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > TAP_SLOP_PX || Math.abs(dy) > TAP_SLOP_PX) {
      clearLongPressTimer();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    clearLongPressTimer();
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;

    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      clearTextSelection();
      return;
    }

    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (absX < TAP_SLOP_PX && absY < TAP_SLOP_PX) {
      if (isMobile && gestureHintsVisible && !isTouchInteractiveTarget(start.target)) {
        dismissGestureHints();
      }
      return;
    }

    if (!bookingOpen && absX >= absY && absX > SWIPE_THRESHOLD_PX) {
      if (dx > 0 && hasPrevious && onPrevious) {
        setSlideDirection(-1);
        onPrevious();
      } else if (dx < 0 && hasNext && onNext) {
        setSlideDirection(1);
        onNext();
      }
      return;
    }

    dismissGestureHints();

    if (absY > absX && dy < -56 && (canSwipeUpClose() || (isMobile && isTouchInMobileHeader(start.target)))) {
      onClose();
    }
  };

  const handlePointerCancel = () => {
    clearLongPressTimer();
    touchStartRef.current = null;
    longPressTriggeredRef.current = false;
  };

  // Управление с клавиатуры (Escape, стрелки влево/вправо)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (bookingOpen) closeBooking();
        else onClose();
      } else if (!bookingOpen && e.key === "ArrowLeft" && hasPrevious && onPrevious) {
        e.preventDefault();
        setSlideDirection(-1);
        onPrevious();
      } else if (!bookingOpen && e.key === "ArrowRight" && hasNext && onNext) {
        e.preventDefault();
        setSlideDirection(1);
        onNext();
      }
    };
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [isOpen, onClose, onPrevious, onNext, hasPrevious, hasNext, bookingOpen, closeBooking]);

  useEffect(() => {
    if (!isOpen) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => {
      if (isMobile) {
        dialogRef.current?.focus();
      } else {
        closeButtonRef.current?.focus();
      }
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
  }, [isOpen, isMobile]);

  useEffect(() => {
    if (!isOpen || !isMobile || bookingOpen) return;
    const scrollEl = rightScrollRef.current;
    if (!scrollEl) return;

    const onNativeTouchMove = (event: TouchEvent) => {
      const start = touchStartRef.current;
      if (!start) return;
      const t = event.touches[0];
      const dy = t.clientY - start.y;
      const dx = t.clientX - start.x;
      if (scrollEl.scrollTop <= 2 && dy < -10 && Math.abs(dy) > Math.abs(dx) * 1.15) {
        event.preventDefault();
      }
    };

    scrollEl.addEventListener("touchmove", onNativeTouchMove, { passive: false });
    return () => scrollEl.removeEventListener("touchmove", onNativeTouchMove);
  }, [isOpen, isMobile, bookingOpen, adventure?.id]);

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
  const genres = adventure ? adventureGenres(adventure) : [];
  const showIntroSection = genres.length > 0 || Boolean(displayText);
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

  const showNav = !bookingOpen && (onPrevious != null || onNext != null);

  const goPrevious = () => {
    if (!hasPrevious || !onPrevious) return;
    setSlideDirection(-1);
    onPrevious();
  };

  const goNext = () => {
    if (!hasNext || !onNext) return;
    setSlideDirection(1);
    onNext();
  };

  const navBtnBase =
    "flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/80";
  const navBtnDesktop = `${navBtnBase} pointer-events-auto hidden md:flex w-10 h-[4.5rem] lg:w-11 lg:h-24 shrink-0 rounded-lg bg-black/55 backdrop-blur-md border border-amber-900/25 text-amber-400/80 hover:text-amber-100 hover:bg-black/70 hover:border-amber-700/40 shadow-[0_8px_28px_rgba(0,0,0,0.55)]`;
  const modalHeaderCloseClass = `${navBtnBase} shrink-0 w-10 h-10 rounded-sm bg-black/35 border border-amber-700/25 text-amber-300/80 hover:text-amber-100 hover:bg-black/45 hover:border-amber-600/40 shadow-[0_4px_16px_rgba(0,0,0,0.28)]`;
  const bookingBackLinkClass =
    "mb-4 inline-flex text-xs sm:text-sm font-semibold uppercase tracking-wide text-amber-400/90 hover:text-amber-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110f]";

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
            onClick={() => {
              if (!isMobile) onClose();
            }}
          />

          {/* Модальное окно */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center pt-4 pb-4 px-2 sm:px-4 md:pt-12 pointer-events-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center gap-2 sm:gap-3 lg:gap-4 w-full max-w-[min(100vw-0.5rem,calc(85rem+6.5rem))] pointer-events-none">
              {showNav && hasPrevious && onPrevious ? (
                <button
                  type="button"
                  onClick={goPrevious}
                  aria-label="Предыдущее приключение"
                  className={navBtnDesktop}
                >
                  <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6" aria-hidden />
                </button>
              ) : showNav ? (
                <span className="hidden md:block w-10 lg:w-11 shrink-0" aria-hidden />
              ) : null}

              <div className="relative flex-1 min-w-0 w-full max-w-[min(94vw,85rem)]">
                <div
                  ref={dialogRef}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="adventure-title"
                  aria-describedby={showIntroSection ? "adventure-description" : undefined}
                  onKeyDown={handleDialogKeyDown}
                  tabIndex={-1}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerCancel}
                  onContextMenu={(e) => {
                    if (!bookingOpen) e.preventDefault();
                  }}
                  className={`relative w-full h-[min(92vh,56rem)] max-h-[92vh] bg-[#14110f] border-2 border-amber-700/40 rounded-lg sm:rounded-xl overflow-hidden shadow-2xl pointer-events-auto flex flex-col touch-manipulation outline-none ${
                    !bookingOpen ? "select-none [-webkit-touch-callout:none]" : ""
                  }`}
                >
              {isMobile && !bookingOpen ? (
                <p className="sr-only" role="note">
                  Смахните влево или вправо для переключения приключений. Смахните вверх с верха
                  текста или по шапке с названием, чтобы закрыть. Крестик справа вверху тоже закрывает
                  карточку. Удерживайте карточку для бронирования.
                </p>
              ) : null}
              <MobileGestureHintOverlay
                visible={isMobile && gestureHintsVisible && !bookingOpen}
                hasPrevious={hasPrevious}
                hasNext={hasNext}
              />
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
                    <div
                      data-adventure-mobile-header
                      className="sticky top-0 z-30 flex shrink-0 items-start justify-between gap-3 border-b border-amber-900/30 bg-[#14110f] px-4 pt-3 pb-3 md:px-[min(2rem,2.5vw)] md:pt-[min(2rem,2.5vw)] md:pb-4"
                    >
                      <h2
                        id="adventure-title"
                        className="flex-1 min-w-0 pr-2 text-[clamp(1.125rem,2.5vw,2.25rem)] md:text-[clamp(1.5rem,3vw,2.5rem)] font-extrabold uppercase tracking-tight text-amber-100 leading-tight"
                      >
                        {adventure.title}
                      </h2>
                      <button
                        type="button"
                        onClick={onClose}
                        aria-label="Закрыть"
                        ref={closeButtonRef}
                        className={modalHeaderCloseClass}
                      >
                        <X size={18} className="sm:w-5 sm:h-5" aria-hidden />
                      </button>
                    </div>
                    <div
                      ref={rightScrollRef}
                      className="flex-1 min-h-0 overscroll-y-contain p-4 sm:p-[min(1.5rem,2vw)] md:px-[min(2rem,2.5vw)] md:pb-[min(2rem,2.5vw)] overflow-y-auto"
                    >
                      {bookingOpen ? (
                        <>
                          <button type="button" onClick={closeBooking} className={bookingBackLinkClass}>
                            ← Назад к описанию
                          </button>
                          <AdventureBookingForm adventure={adventure} onBack={closeBooking} />
                        </>
                      ) : (
                        <>
                          {showIntroSection ? (
                            <AdventureIntroSection
                              genres={genres}
                              text={displayText}
                              descriptionId="adventure-description"
                              textClassName="text-body text-[clamp(0.875rem,1.5vw,1.125rem)] md:text-[clamp(1rem,1.8vw,1.25rem)] whitespace-pre-line"
                            />
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
                          onClick={openBooking}
                          className="btn btn-primary w-full inline-flex items-center justify-center focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110f]"
                        >
                          Забронировать игру
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {/* Постер: только md+; на мобилке карточка — только вводный текст */}
                  <div className="order-2 md:order-1 relative hidden md:flex w-full min-h-0 min-w-0 md:basis-1/2 md:flex-1 flex-col bg-[#0f0d0c] border-b md:border-b-0 md:border-r border-amber-900/30 min-h-0 p-3 sm:p-4 md:p-4">
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
                        onClick={openBooking}
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
              </div>

              {showNav && hasNext && onNext ? (
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Следующее приключение"
                  className={navBtnDesktop}
                >
                  <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6" aria-hidden />
                </button>
              ) : showNav ? (
                <span className="hidden md:block w-10 lg:w-11 shrink-0" aria-hidden />
              ) : null}
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
