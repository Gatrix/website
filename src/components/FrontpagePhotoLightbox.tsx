"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { shouldBypassImageOptimization } from "@/lib/image-url";

type Slide = { src: string; alt: string };

type Props = {
  slides: Slide[];
  index: number | null;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
};

const MIN_SCALE = 1;
const MAX_SCALE = 3;
const ZOOM_STEP = 0.35;

export default function FrontpagePhotoLightbox({ slides, index, onClose, onIndexChange }: Props) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const pinchRef = useRef<{ distance: number; scale: number } | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const open = index !== null && slides[index] != null;
  const slide = open ? slides[index!] : null;
  const hasMultiple = slides.length > 1;

  const resetView = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (!open) return;
    resetView();
  }, [index, open, resetView]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (!hasMultiple || index == null) return;
      if (e.key === "ArrowLeft") {
        onIndexChange?.((index - 1 + slides.length) % slides.length);
      }
      if (e.key === "ArrowRight") {
        onIndexChange?.((index + 1) % slides.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, hasMultiple, index, slides.length, onClose, onIndexChange]);

  const clampScale = (v: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, v));

  const zoomBy = (delta: number) => {
    setScale((s) => {
      const next = clampScale(s + delta);
      if (next <= MIN_SCALE) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    zoomBy(e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP);
  };

  const touchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchRef.current = { distance: touchDistance(e.touches), scale };
      dragRef.current = null;
      return;
    }
    if (e.touches.length === 1 && scale > 1) {
      dragRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        panX: pan.x,
        panY: pan.y,
      };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const dist = touchDistance(e.touches);
      if (dist > 0 && pinchRef.current.distance > 0) {
        const ratio = dist / pinchRef.current.distance;
        const next = clampScale(pinchRef.current.scale * ratio);
        setScale(next);
        if (next <= MIN_SCALE) setPan({ x: 0, y: 0 });
      }
      return;
    }
    if (e.touches.length === 1 && dragRef.current && scale > 1) {
      const dx = e.touches[0].clientX - dragRef.current.x;
      const dy = e.touches[0].clientY - dragRef.current.y;
      setPan({ x: dragRef.current.panX + dx, y: dragRef.current.panY + dy });
    }
  };

  const onTouchEnd = () => {
    dragRef.current = null;
    pinchRef.current = null;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (scale <= 1 || e.pointerType === "touch") return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || scale <= 1) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setPan({ x: dragRef.current.panX + dx, y: dragRef.current.panY + dy });
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  return (
    <AnimatePresence>
      {open && slide ? (
        <motion.div
          key="lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex flex-col bg-black/92 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={slide.alt}
          onClick={onClose}
        >
          <div
            className="flex items-center justify-between gap-3 px-3 py-3 sm:px-5 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-amber-100/80 truncate min-w-0">{slide.alt}</p>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => zoomBy(-ZOOM_STEP)}
                disabled={scale <= MIN_SCALE}
                className="p-2 rounded-lg text-amber-100/90 hover:bg-white/10 disabled:opacity-40"
                aria-label="Уменьшить"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => zoomBy(ZOOM_STEP)}
                disabled={scale >= MAX_SCALE}
                className="p-2 rounded-lg text-amber-100/90 hover:bg-white/10 disabled:opacity-40"
                aria-label="Увеличить"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-amber-100/90 hover:bg-white/10"
                aria-label="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div
            ref={viewportRef}
            className="relative flex-1 min-h-0 flex items-center justify-center px-2 pb-4 touch-none"
            onClick={(e) => e.stopPropagation()}
            onWheel={onWheel}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {hasMultiple ? (
              <>
                <button
                  type="button"
                  onClick={() => index != null && onIndexChange?.((index - 1 + slides.length) % slides.length)}
                  className="absolute left-2 sm:left-4 z-10 p-2 rounded-full bg-black/50 text-amber-100 border border-amber-900/40 hover:bg-black/70"
                  aria-label="Предыдущее фото"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={() => index != null && onIndexChange?.((index + 1) % slides.length)}
                  className="absolute right-2 sm:right-4 z-10 p-2 rounded-full bg-black/50 text-amber-100 border border-amber-900/40 hover:bg-black/70"
                  aria-label="Следующее фото"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            ) : null}

            <motion.div
              key={slide.src}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="relative w-full h-full max-w-[min(100%,1400px)] max-h-full cursor-grab active:cursor-grabbing"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                transformOrigin: "center center",
              }}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                className="object-contain select-none"
                unoptimized={shouldBypassImageOptimization(slide.src)}
                sizes="100vw"
                draggable={false}
                priority
              />
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
