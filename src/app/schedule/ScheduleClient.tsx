"use client";

import React, { useEffect, useRef, useState } from "react";
import AtmosphericBackground from "@/components/AtmosphericBackground";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
// TODO: раскомментировать при включении бронирования
// import BookingDrawer, { type BookingSlot } from "@/components/BookingDrawer";

// Types for our schedule
type SlotStatus = "available" | "booked";

/** Три слота по 4 часа (вместо «день / вечер»). */
const SCHEDULE_SLOTS = [
  { id: "slot_11_15", label: "11:00–15:00" },
  { id: "slot_15_19", label: "15:00–19:00" },
  { id: "slot_19_23", label: "19:00–23:00" },
] as const;
const MONTH_NAMES = [
  "ЯНВАРЬ", "ФЕВРАЛЬ", "МАРТ", "АПРЕЛЬ", "МАЙ", "ИЮНЬ",
  "ИЮЛЬ", "АВГУСТ", "СЕНТЯБРЬ", "ОКТЯБРЬ", "НОЯБРЬ", "ДЕКАБРЬ"
];
const DAYS_OF_WEEK = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

export default function ScheduleClient() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const searchParams = useSearchParams();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const dayRefs = useRef<Array<HTMLDivElement | null>>([]);
  const showOnlyAvailable = searchParams.get("availability") === "available";
  
  // Calculate relative months for navigation (limit to 3 months from now)
  const today = new Date();
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 3, 1);
  const minDate = new Date(today.getFullYear(), today.getMonth(), 1);

  const nextMonth = () => {
    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    if (next <= maxDate) setCurrentDate(next);
  };

  const prevMonth = () => {
    const prev = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    if (prev >= minDate) setCurrentDate(prev);
  };

  // Calendar generation logic
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Adjust for Monday start
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const isFullyBookedDay = (dayNum: number) => {
    // Явно отмеченные занятые даты (все слоты заняты)
    return year === 2026 && month === 3 && [23, 25, 26, 29].includes(dayNum);
  };

  /** По умолчанию все даты свободны, кроме явно занятых. */
  const getSlotStatus = (dayNum: number): SlotStatus =>
    isFullyBookedDay(dayNum) ? "booked" : "available";

  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isCalendarDayPast = (dayNum: number) =>
    new Date(year, month, dayNum).getTime() < startOfToday.getTime();

  useEffect(() => {
    const wantsCalendar = window.location.hash === "#calendar" || searchParams.get("view") === "calendar";
    if (!wantsCalendar) return;
    const calendar = document.getElementById("calendar");
    if (calendar) {
      calendar.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [searchParams]);

  const handleDayKeyDown = (event: React.KeyboardEvent, day: number) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelectedDay(day);
      return;
    }
    const moveBy = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : event.key === "ArrowDown" ? 7 : event.key === "ArrowUp" ? -7 : 0;
    if (moveBy === 0) return;
    event.preventDefault();
    const step = moveBy > 0 ? 1 : -1;
    let nextDay = day + moveBy;
    const guard = daysInMonth + 2;
    let hops = 0;
    while (nextDay >= 1 && nextDay <= daysInMonth && isCalendarDayPast(nextDay) && hops < guard) {
      nextDay += step;
      hops += 1;
    }
    if (nextDay < 1 || nextDay > daysInMonth || isCalendarDayPast(nextDay)) return;
    dayRefs.current[nextDay]?.focus();
    setSelectedDay(nextDay);
  };

  return (
    <main className="relative min-h-screen text-stone-200 font-serif selection:bg-yellow-500/25 pt-24 sm:pt-28 pb-12 px-4">
      <AtmosphericBackground />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <header className="text-center mb-10 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 text-stone-50 uppercase tracking-[0.2em] sm:tracking-[0.28em] drop-shadow-[0_0_24px_rgba(255,255,255,0.08)]">
            СВОБОДНЫЕ ДАТЫ
          </h1>

          {/* Перенесено на страницу «Приключения»: компонент GameBookingNotice
          <div className="max-w-3xl mx-auto mb-8 rounded-lg ...">...</div>
          */}
          {showOnlyAvailable && (
            <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-yellow-400/80">
              Показаны доступные слоты
            </div>
          )}
        </header>

        {/* Month Navigation */}
        <div className="flex items-center justify-center gap-6 sm:gap-10 mb-10 py-5 border-y border-yellow-900/25">
          <button 
            onClick={prevMonth}
            disabled={currentDate <= minDate}
            className={`p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09] ${currentDate <= minDate ? 'opacity-0 pointer-events-none' : 'text-yellow-400 hover:text-yellow-200'}`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-stone-50 tracking-[0.25em] sm:tracking-[0.3em] min-w-[200px] sm:min-w-[240px] text-center uppercase drop-shadow-[0_0_18px_rgba(255,255,255,0.06)]">
            {MONTH_NAMES[month]} {year}
          </h2>
          
          <button 
            onClick={nextMonth}
            disabled={currentDate >= maxDate}
            className={`p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09] ${currentDate >= maxDate ? 'opacity-0 pointer-events-none' : 'text-yellow-400 hover:text-yellow-200'}`}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div id="calendar" role="grid" aria-label="Календарь свободных дат" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-px bg-yellow-900/15 border border-yellow-800/20">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="hidden lg:block bg-[#0f0d0c]/30 min-h-[44px] sm:min-h-[52px]"
              aria-hidden
            />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayOfWeekIndex = (firstDay + i) % 7;
            const isToday = today.getDate() === dayNum && today.getMonth() === month && today.getFullYear() === year;
            const isPast = isCalendarDayPast(dayNum);
            const slotStatuses = SCHEDULE_SLOTS.map((s) => {
              const status = getSlotStatus(dayNum);
              return {
                id: s.id,
                label: s.label,
                status,
                hide: showOnlyAvailable && status === "booked",
              };
            });
            const hasVisibleSlots = slotStatuses.some((s) => !s.hide);

            return (
              <div
                key={dayNum}
                ref={(el) => {
                  dayRefs.current[dayNum] = el;
                }}
                role="gridcell"
                tabIndex={isPast ? -1 : 0}
                aria-selected={selectedDay === dayNum}
                aria-disabled={isPast}
                aria-label={
                  isPast
                    ? `День ${dayNum} ${MONTH_NAMES[month].toLowerCase()}, прошедшая дата`
                    : `День ${dayNum} ${MONTH_NAMES[month].toLowerCase()}`
                }
                onClick={() => {
                  if (!isPast) setSelectedDay(dayNum);
                }}
                onKeyDown={(event) => {
                  if (isPast) return;
                  handleDayKeyDown(event, dayNum);
                }}
                className={`relative bg-[#0f0d0c]/80 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09] transition-all ${
                  isPast
                    ? "px-2 py-1 sm:px-2.5 sm:py-1.5 flex flex-col justify-center min-h-[44px] sm:min-h-[52px] opacity-[0.38] grayscale-[0.35] pointer-events-none cursor-default border border-stone-800/30"
                    : "p-2 sm:p-3 flex flex-col justify-between min-h-[150px] sm:min-h-[180px] hover:bg-[#1a1614]/95"
                } ${isToday && !isPast ? "bg-yellow-950/15 ring-1 ring-yellow-500/25" : ""} ${
                  selectedDay === dayNum && !isPast ? "ring-2 ring-yellow-400/45" : ""
                }`}
              >
                <div
                  className={`font-sans ${
                    isPast ? "w-full flex justify-between items-center" : "flex justify-between items-start"
                  }`}
                >
                  <span
                    className={`${isPast ? "text-xl sm:text-2xl leading-none" : "text-2xl sm:text-3xl"} font-light ${
                      isPast
                        ? "text-stone-500"
                        : isToday
                          ? "text-[#facc15] font-bold drop-shadow-[0_0_12px_rgba(250,204,21,0.4)]"
                          : "text-stone-100"
                    }`}
                  >
                    {dayNum}
                  </span>
                  <span
                    className={`${isPast ? "text-xl sm:text-2xl leading-none" : "text-2xl sm:text-3xl"} uppercase font-light tracking-wider ${
                      isPast ? "text-stone-600" : "text-stone-400"
                    }`}
                  >
                    {DAYS_OF_WEEK[dayOfWeekIndex]}
                  </span>
                </div>

                {!isPast && (
                  <div className="flex flex-col gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                    {slotStatuses.map(
                      (s) =>
                        !s.hide && (
                          <SlotButton key={s.id} label={s.label} status={s.status} muted={isPast} />
                        )
                    )}
                    {!hasVisibleSlots && (
                      <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
                        Нет доступных слотов
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* TODO: раскомментировать при включении бронирования
      <BookingDrawer
        isOpen={isBookingOpen}
        slot={selectedSlot}
        adventures={adventures}
        initialAdventureId={selectedAdventureId}
        initialTier={initialTier}
        onClose={handleCloseBooking}
      />
      */}
    </main>
  );
}

function SlotButton({
  label,
  status,
  muted = false,
}: {
  label: string;
  status: SlotStatus;
  muted?: boolean;
}) {
  const baseStyles =
    "text-[8px] sm:text-[9px] font-black tracking-[0.12em] sm:tracking-[0.18em] py-0.5 px-1.5 sm:px-2 transition-all text-left flex items-center gap-2 font-sans rounded-sm relative leading-tight";

  const mute = muted ? " opacity-60 saturate-[0.65]" : "";

  if (status === "booked") {
    return (
      <div
        className={`${baseStyles} bg-red-950/40 text-red-400 border border-red-900/30 cursor-not-allowed${mute}`}
      >
        <div className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]" />
        <span className="line-through decoration-red-900/50">{label}</span>
      </div>
    );
  }

  return (
    <div
      className={`${baseStyles} bg-lime-950/25 text-lime-300 border border-lime-700/25 drop-shadow-[0_0_8px_rgba(163,230,53,0.25)]${mute}`}
    >
      <div className="w-2 h-2 bg-lime-400 rounded-full shadow-[0_0_8px_rgba(163,230,53,0.45)]" />
      {label}
    </div>
  );
}
