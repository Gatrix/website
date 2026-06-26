"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Adventure } from "@/lib/db";
import { adventureGenres } from "@/lib/adventure-genres";
import { shouldBypassImageOptimization } from "@/lib/image-url";
import AdventureIntroSection from "@/components/AdventureIntroSection";

const MD_BREAKPOINT_PX = 768;
const MD_MAX_WIDTH = `(max-width: ${MD_BREAKPOINT_PX - 1}px)`;
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

type MobileSwipeHintOverlayProps = {
  visible: boolean;
  hasPrevious: boolean;
  hasNext: boolean;
  onDismiss: () => void;
};

function MobileSwipeHintOverlay({
  visible,
  hasPrevious,
  hasNext,
  onDismiss,
}: MobileSwipeHintOverlayProps) {
  if (!visible || (!hasPrevious && !hasNext)) return null;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.35 }}
          className="md:hidden absolute inset-x-0 bottom-0 z-30"
          role="note"
        >
          <button
            type="button"
            onClick={onDismiss}
            className="w-full bg-gradient-to-t from-[#0a0908]/92 via-[#14110f]/72 to-transparent pt-14 pb-4 sm:pb-5 px-3 sm:px-4 text-center"
          >
            <div className="flex items-end justify-center gap-6 sm:gap-10 max-w-sm mx-auto pointer-events-none">
              {hasPrevious ? (
                <div className="flex flex-col items-center gap-1.5 min-w-[4.5rem]">
                  <div className="w-11 h-11 rounded-sm bg-black/35 border border-amber-700/25 flex items-center justify-center">
                    <ChevronLeft className="w-6 h-6 text-amber-300/70" aria-hidden />
                  </div>
                  <span className="text-[10px] sm:text-xs uppercase tracking-wider text-amber-200/65 font-medium">
                    Назад
                  </span>
                </div>
              ) : null}
              {hasNext ? (
                <div className="flex flex-col items-center gap-1.5 min-w-[4.5rem]">
                  <div className="w-11 h-11 rounded-sm bg-black/35 border border-amber-700/25 flex items-center justify-center">
                    <ChevronRight className="w-6 h-6 text-amber-300/70" aria-hidden />
                  </div>
                  <span className="text-[10px] sm:text-xs uppercase tracking-wider text-amber-200/65 font-medium">
                    Далее
                  </span>
                </div>
              ) : null}
            </div>
            <p className="text-amber-200/45 text-[10px] sm:text-[11px] mt-3 tracking-wide pointer-events-none">
              Смахните для переключения · нажмите, чтобы скрыть
            </p>
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

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
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const scrollPositionRef = useRef(0);
  const [slideDirection, setSlideDirection] = useState(1);
  const [swipeHintsVisible, setSwipeHintsVisible] = useState(false);
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

  const dismissSwipeHints = useCallback(() => {
    setSwipeHintsVisible(false);
  }, []);

  useEffect(() => {
    if (isOpen && isMobile && !bookingOpen) {
      setSwipeHintsVisible(true);
    }
  }, [isOpen, isMobile, bookingOpen]);

  useEffect(() => {
    if (!isOpen || !isMobile || !swipeHintsVisible || bookingOpen) return;
    const timer = window.setTimeout(dismissSwipeHints, 7000);
    return () => window.clearTimeout(timer);
  }, [isOpen, isMobile, swipeHintsVisible, bookingOpen, dismissSwipeHints]);

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
    const el = dialogRef.current;
    if (!el) return;

    const GESTURE_LOCK_PX = 8;
    const gesture = { x: 0, y: 0, axis: null as "x" | "y" | null };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      gesture.axis = null;
      gesture.x = event.touches[0].clientX;
      gesture.y = event.touches[0].clientY;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const dx = event.touches[0].clientX - gesture.x;
      const dy = event.touches[0].clientY - gesture.y;
      if (
        gesture.axis === null &&
        (Math.abs(dx) > GESTURE_LOCK_PX || Math.abs(dy) > GESTURE_LOCK_PX)
      ) {
        gesture.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }
      if (gesture.axis === "x") {
        event.preventDefault();
      }
    };

    const onTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      if (!touch) {
        gesture.axis = null;
        return;
      }
      const dx = touch.clientX - gesture.x;
      const dy = touch.clientY - gesture.y;

      if (gesture.axis === "x" && Math.abs(dx) > SWIPE_THRESHOLD_PX) {
        if (dx > 0 && hasPrevious && onPrevious) {
          setSlideDirection(-1);
          onPrevious();
          dismissSwipeHints();
        } else if (dx < 0 && hasNext && onNext) {
          setSlideDirection(1);
          onNext();
          dismissSwipeHints();
        }
      } else if (
        Math.abs(dx) < TAP_SLOP_PX &&
        Math.abs(dy) < TAP_SLOP_PX &&
        !isTouchInteractiveTarget(event.target)
      ) {
        dismissSwipeHints();
      }

      gesture.axis = null;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [
    isOpen,
    isMobile,
    bookingOpen,
    hasPrevious,
    hasNext,
    onPrevious,
    onNext,
    dismissSwipeHints,
  ]);

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
    "mb-4 shrink-0 inline-flex text-xs sm:text-sm font-semibold uppercase tracking-wide text-amber-400/90 hover:text-amber-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110f]";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50"
            onClick={onClose}
            aria-hidden
          />

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
                  className={`relative w-full h-[min(100dvh,56rem)] md:h-[min(92vh,56rem)] max-h-[100dvh] md:max-h-[92vh] bg-[#14110f] border-2 border-amber-700/40 rounded-lg sm:rounded-xl overflow-hidden shadow-2xl pointer-events-auto flex flex-col touch-manipulation outline-none ${
                    !bookingOpen ? "select-none [-webkit-touch-callout:none]" : ""
                  }`}
                >
                  {isMobile && !bookingOpen ? (
                    <p className="sr-only" role="note">
                      Смахните влево или вправо для переключения приключений. Кнопка «Забронировать
                      игру» внизу открывает форму записи.
                    </p>
                  ) : null}
                  <MobileSwipeHintOverlay
                    visible={isMobile && swipeHintsVisible && !bookingOpen}
                    hasPrevious={hasPrevious}
                    hasNext={hasNext}
                    onDismiss={dismissSwipeHints}
                  />

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
                      className="flex-1 min-h-0 flex flex-col overflow-hidden"
                    >
                      <div className="flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden relative bg-[#14110f]">
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
                          className={`flex-1 min-h-0 overscroll-y-contain p-4 sm:p-[min(1.5rem,2vw)] md:px-[min(2rem,2.5vw)] md:pb-[min(2rem,2.5vw)] ${
                            bookingOpen
                              ? "flex flex-col overflow-hidden"
                              : "overflow-y-auto md:overflow-hidden"
                          }`}
                        >
                          {bookingOpen ? (
                            <div className="flex min-h-0 flex-1 flex-col">
                              <button type="button" onClick={closeBooking} className={bookingBackLinkClass}>
                                ← Назад к описанию
                              </button>
                              <AdventureBookingForm adventure={adventure} onBack={closeBooking} />
                            </div>
                          ) : (
                            <div className="flex flex-col md:flex-row md:gap-[min(1.5rem,2vw)] md:min-h-0 md:h-full">
                              <div
                                className={`order-1 md:order-2 min-w-0 ${
                                  imageUrl
                                    ? "md:w-[60%] md:min-h-0 md:overflow-y-auto md:overscroll-y-contain"
                                    : "md:w-full"
                                }`}
                              >
                                {showIntroSection ? (
                                  <AdventureIntroSection
                                    genres={genres}
                                    text={displayText}
                                    descriptionId="adventure-description"
                                    textClassName="text-body text-[clamp(0.875rem,1.5vw,1.125rem)] md:text-[clamp(1rem,1.8vw,1.25rem)] whitespace-pre-line"
                                  />
                                ) : null}
                              </div>
                              {imageUrl ? (
                                <div className="order-2 md:order-1 mt-6 sm:mt-8 md:mt-0 w-full md:w-[40%] shrink-0 flex justify-center md:items-start">
                                  <div className="relative w-full max-w-[min(100%,18rem)] sm:max-w-xs md:max-w-none aspect-[3/4] overflow-hidden rounded-md border border-amber-900/30 bg-[#0f0d0c] shadow-inner">
                                    <Image
                                      src={imageUrl}
                                      alt={`Постер: ${adventure.title}`}
                                      fill
                                      className="object-contain"
                                      sizes="(max-width: 768px) 94vw, 40vw"
                                      unoptimized={shouldBypassImageOptimization(imageUrl)}
                                    />
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          )}
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

                      {!bookingOpen ? (
                        <div className="md:hidden flex-shrink-0 p-4 sm:p-[min(1.5rem,2vw)] pt-0 border-t border-amber-900/25 bg-[#14110f] pb-[max(1rem,env(safe-area-inset-bottom))]">
                          <button
                            type="button"
                            onClick={openBooking}
                            className="btn btn-primary w-full inline-flex items-center justify-center focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110f]"
                          >
                            Забронировать игру
                          </button>
                        </div>
                      ) : null}
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
