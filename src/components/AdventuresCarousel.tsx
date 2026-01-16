"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion, useMotionValue, animate, PanInfo } from "framer-motion";
import type { Adventure } from "@/hooks/useAdventures";
import AdventureCard from "@/components/AdventureCard";

interface AdventuresCarouselProps {
  adventures: Adventure[];
  onAdventureClick: (adventure: Adventure) => void;
  isPaused?: boolean; // Для паузы когда модалка открыта
}

// Размеры карточки
const CARD_WIDTH = 300;
const CARD_GAP = 24;
const CARD_FULL_WIDTH = CARD_WIDTH + CARD_GAP;

// Скорость автопрокрутки (пикселей в секунду)
const AUTO_SCROLL_SPEED = 60;

export default function AdventuresCarousel({
  adventures,
  onAdventureClick,
  isPaused = false,
}: AdventuresCarouselProps) {
  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartTime = useRef(0);
  const animationControlsRef = useRef<ReturnType<typeof animate> | null>(null);
  const lastUpdateTime = useRef<number>(Date.now());
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  
  const count = adventures.length;
  
  // Для бесконечной прокрутки дублируем массив 3 раза
  // [копия конца] [оригинал] [копия начала]
  const extendedAdventures = count > 0 
    ? [...adventures, ...adventures, ...adventures] 
    : [];
  
  // Начальная позиция - центр (т.е. начало "оригинального" массива)
  const initialOffset = -count * CARD_FULL_WIDTH;
  
  useEffect(() => {
    if (count > 0) {
      x.set(initialOffset);
      lastUpdateTime.current = Date.now();
    }
  }, [count, initialOffset]);

  // Функция для нормализации позиции (бесконечный скролл)
  const normalizePosition = useCallback(() => {
    const currentX = x.get();
    const totalWidth = count * CARD_FULL_WIDTH;
    
    // Границы "оригинального" массива
    const minBound = -2 * totalWidth; // конец третьей копии
    const maxBound = 0; // начало первой копии
    
    if (currentX < minBound + totalWidth) {
      // Прокрутили слишком далеко вправо - перескакиваем к центру
      x.set(currentX + totalWidth);
    } else if (currentX > maxBound - totalWidth) {
      // Прокрутили слишком далеко влево - перескакиваем к центру
      x.set(currentX - totalWidth);
    }
  }, [count, x]);

  // Автоматическая прокрутка
  useEffect(() => {
    if (count === 0) return;

    let animationFrameId: number;
    let isActive = true;

    const autoScroll = () => {
      if (!isActive) return;

      const now = Date.now();
      const deltaTime = (now - lastUpdateTime.current) / 1000; // в секундах
      lastUpdateTime.current = now;

      // Пауза если пользователь зажал карточку, открыта модалка или курсор в зоне карусели
      if (isDragging.current || isPaused || isHovered) {
        animationFrameId = requestAnimationFrame(autoScroll);
        return;
      }

      // Прокручиваем влево (уменьшаем x)
      const currentX = x.get();
      const newX = currentX - AUTO_SCROLL_SPEED * deltaTime;
      x.set(newX);

      // Проверяем границы и нормализуем
      normalizePosition();

      animationFrameId = requestAnimationFrame(autoScroll);
    };

    animationFrameId = requestAnimationFrame(autoScroll);

    return () => {
      isActive = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (animationControlsRef.current) {
        animationControlsRef.current.stop();
      }
    };
  }, [count, x, normalizePosition, isPaused, isHovered]);

  const handleDragStart = () => {
    isDragging.current = true;
    dragStartTime.current = Date.now();
    // Останавливаем автоматическую анимацию
    if (animationControlsRef.current) {
      animationControlsRef.current.stop();
    }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Небольшая задержка для предотвращения клика после драга
    setTimeout(() => {
      isDragging.current = false;
    }, 100);

    const velocity = info.velocity.x;
    const offset = info.offset.x;
    
    // Определяем, на сколько карточек прокрутить
    // Учитываем и смещение, и скорость
    let cardsMoved = Math.round(offset / CARD_FULL_WIDTH);
    
    // Если быстрый свайп, добавляем инерцию
    if (Math.abs(velocity) > 500) {
      cardsMoved += velocity > 0 ? 1 : -1;
    }
    
    // Рассчитываем целевую позицию (привязка к ближайшей карточке)
    const currentX = x.get();
    const currentCard = Math.round(currentX / CARD_FULL_WIDTH);
    const targetX = currentCard * CARD_FULL_WIDTH;
    
    animationControlsRef.current = animate(x, targetX, {
      type: "spring",
      stiffness: 300,
      damping: 30,
      onComplete: () => {
        normalizePosition();
        animationControlsRef.current = null;
      },
    });
  };

  const handleCardClick = (adventure: Adventure) => {
    // Предотвращаем клик если был драг
    if (!isDragging.current) {
      onAdventureClick(adventure);
    }
  };

  if (count === 0) return null;

  return (
    <div 
      ref={containerRef}
      className="relative w-full overflow-hidden py-8 rounded-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Градиенты по краям для красоты */}
      <div className="absolute top-0 left-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-[#0f0d0c] to-transparent z-20 pointer-events-none" />
      <div className="absolute top-0 right-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-[#0f0d0c] to-transparent z-20 pointer-events-none" />
      
      {/* Карусель */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -Infinity, right: Infinity }}
        dragElastic={0.1}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className="flex cursor-grab active:cursor-grabbing"
      >
        {extendedAdventures.map((adventure, index) => {
          return (
          <div 
            key={`${adventure.id}-${index}`}
            className="flex-shrink-0 px-3"
            style={{ width: CARD_WIDTH + CARD_GAP }}
          >
            <AdventureCard
              as={motion.div}
              adventure={adventure}
              onClick={() => handleCardClick(adventure)}
              onMouseEnter={() => setHoveredCardIndex(index)}
              onMouseLeave={() => setHoveredCardIndex(null)}
              imageSizes="300px"
              draggable={false}
            />
          </div>
          );
        })}
      </motion.div>
      
      {/* Подсказка для пользователя */}
      <div className="flex justify-center mt-6">
        <p className="text-[10px] uppercase tracking-[0.3em] text-amber-900/40 font-bold font-sans">
          ← Листай карточки →
        </p>
      </div>
    </div>
  );
}
