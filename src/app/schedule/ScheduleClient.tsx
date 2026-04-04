/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useRef, useState } from "react";
import AtmosphericBackground from "@/components/AtmosphericBackground";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
// TODO: раскомментировать при включении бронирования
// import BookingDrawer, { type BookingSlot } from "@/components/BookingDrawer";
import type { Adventure } from "@/hooks/useAdventures";
import { SITE_PHONE_DISPLAY, SITE_PHONE_TEL } from "@/lib/site-contact";

const DiscordGlyph = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 127.14 96.36" className={className} aria-hidden>
    <path
      d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.06,72.06,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.71,32.65-1.82,56.6.48,80.21h0A105.73,105.73,0,0,0,32.47,96.36,77.7,77.7,0,0,0,39.2,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.73,11.1,105.33,105.33,0,0,0,32.05-16.15h0C130.41,50.8,121.77,27,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5.12-12.67,11.41-12.67S54,46,53.86,53,48.74,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5.12-12.67,11.44-12.67S96.23,46,96.11,53,91,65.69,84.69,65.69Z"
      fill="currentColor"
    />
  </svg>
);
const TelegramGlyph = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path
      d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42l10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701l-.321 4.816c.47 0 .677-.216.941-.469l2.259-2.193l4.702 3.473c.866.478 1.489.231 1.704-.799l3.084-14.538c.316-1.267-.478-1.841-1.309-1.46z"
      fill="currentColor"
    />
  </svg>
);
const VKGlyph = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path
      d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.525-2.049-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.269c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.559 4 8.305c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.383c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 3.996-2.354 3.996-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.049.17.491-.085.744-.576.744z"
      fill="currentColor"
    />
  </svg>
);

// Types for our schedule
type SlotStatus = "available" | "partial" | "booked" | "on-request";

interface ScheduleClientProps {
  initialAdventures: Adventure[];
}

/** Три слота по 4 часа (вместо «день / вечер»). */
const SCHEDULE_SLOTS = [
  { id: "slot_11_15", label: "11:00–15:00" },
  { id: "slot_15_19", label: "15:00–19:00" },
  { id: "slot_19_23", label: "19:00–23:00" },
] as const;

type ScheduleSlotId = (typeof SCHEDULE_SLOTS)[number]["id"];
const MONTH_NAMES = [
  "ЯНВАРЬ", "ФЕВРАЛЬ", "МАРТ", "АПРЕЛЬ", "МАЙ", "ИЮНЬ",
  "ИЮЛЬ", "АВГУСТ", "СЕНТЯБРЬ", "ОКТЯБРЬ", "НОЯБРЬ", "ДЕКАБРЬ"
];
const DAYS_OF_WEEK = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

export default function ScheduleClient({ initialAdventures: _initialAdventures }: ScheduleClientProps) {
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

  /** Сейчас все слоты отображаются как «по запросу» (яркий жёлтый). */
  const getSlotStatus = (_day: number, _slotId: ScheduleSlotId): SlotStatus => "on-request";

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

          <div className="max-w-3xl mx-auto mb-8 rounded-lg border border-yellow-500/35 bg-[#0f0d0c]/90 px-5 py-6 sm:px-8 sm:py-8 shadow-[0_0_40px_rgba(0,0,0,0.45)]">
            <p className="font-sans text-sm sm:text-base font-bold text-stone-100 leading-relaxed tracking-wide">
              В данный момент запись на игры проходит через личные сообщения с ведущим!
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10 font-sans">
              <a
                href="https://vk.com/polygon_rpg"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#fde047] hover:text-yellow-200 transition-colors font-bold text-xs sm:text-sm uppercase tracking-widest drop-shadow-[0_0_12px_rgba(253,224,71,0.45)]"
              >
                <VKGlyph className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                ВКонтакте
              </a>
              <a
                href="https://t.me/polygon_rpg"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#fde047] hover:text-yellow-200 transition-colors font-bold text-xs sm:text-sm uppercase tracking-widest drop-shadow-[0_0_12px_rgba(253,224,71,0.45)]"
              >
                <TelegramGlyph className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                Telegram
              </a>
              <a
                href="https://discord.gg/polygon"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#fde047] hover:text-yellow-200 transition-colors font-bold text-xs sm:text-sm uppercase tracking-widest drop-shadow-[0_0_12px_rgba(253,224,71,0.45)]"
              >
                <DiscordGlyph className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                Discord
              </a>
            </div>
            <div className="mt-6 pt-6 border-t border-yellow-500/25 text-center w-full">
              <p className="font-sans text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-stone-500 mb-2">
                Телефон
              </p>
              <a
                href={`tel:${SITE_PHONE_TEL}`}
                className="inline-block font-serif text-base sm:text-lg font-bold text-[#fde047] hover:text-yellow-200 transition-colors drop-shadow-[0_0_14px_rgba(253,224,71,0.35)]"
              >
                {SITE_PHONE_DISPLAY}
              </a>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[10px] sm:text-xs uppercase tracking-[0.2em] font-sans font-bold text-stone-300">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-lime-400 shadow-[0_0_10px_rgba(163,230,53,0.65)]" />
              Свободно
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.55)]" />
              Занято
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#facc15] shadow-[0_0_12px_rgba(250,204,21,0.75)]" />
              По запросу
            </div>
          </div>
          {selectedDay && (
            <div className="mt-4 text-xs uppercase tracking-[0.2em] text-yellow-300/90">
              Выбран день: {selectedDay} {MONTH_NAMES[month].toLowerCase()}
            </div>
          )}
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
            <div key={`empty-${i}`} className="hidden lg:block aspect-square bg-[#0f0d0c]/30"></div>
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayOfWeekIndex = (firstDay + i) % 7;
            const isToday = today.getDate() === dayNum && today.getMonth() === month && today.getFullYear() === year;
            const isPast = isCalendarDayPast(dayNum);
            const slotStatuses = SCHEDULE_SLOTS.map((s) => {
              const status = getSlotStatus(dayNum, s.id);
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
                className={`relative bg-[#0f0d0c]/80 p-3 sm:p-4 flex flex-col justify-between min-h-[220px] sm:min-h-[260px] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09] transition-all ${
                  isPast
                    ? "opacity-[0.38] grayscale-[0.35] pointer-events-none cursor-default border border-stone-800/30"
                    : "hover:bg-[#1a1614]/95"
                } ${isToday && !isPast ? "bg-yellow-950/15 ring-1 ring-yellow-500/25" : ""} ${
                  selectedDay === dayNum && !isPast ? "ring-2 ring-yellow-400/45" : ""
                }`}
              >
                <div className="flex justify-between items-start font-sans">
                  <span
                    className={`text-3xl font-light ${
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
                    className={`text-[10px] uppercase font-bold tracking-wider ${
                      isPast ? "text-stone-600" : "text-stone-400"
                    }`}
                  >
                    {DAYS_OF_WEEK[dayOfWeekIndex]}
                  </span>
                </div>

                <div className="flex flex-col gap-2 sm:gap-2.5 mt-4 sm:mt-6">
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
    "text-[9px] sm:text-[10px] font-black tracking-[0.12em] sm:tracking-[0.18em] py-1 px-1.5 sm:px-2 transition-all text-left flex items-center gap-2 font-sans rounded-sm relative leading-tight";

  const mute = muted ? " opacity-60 saturate-[0.65]" : "";

  if (status === "booked") {
    return (
      <div
        className={`${baseStyles} bg-red-950/40 text-red-400 border border-red-900/30 cursor-not-allowed${mute}`}
      >
        <div className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]" />
        <span className="line-through decoration-red-900/50">{label} (ЗАНЯТО)</span>
      </div>
    );
  }

  if (status === "on-request") {
    return (
      <div
        className={`${baseStyles} text-[#fde047] border border-yellow-500/25 bg-yellow-950/15 drop-shadow-[0_0_10px_rgba(250,204,21,0.35)]${mute}`}
      >
        <div className="w-2 h-2 shrink-0 bg-[#facc15] rounded-full shadow-[0_0_12px_rgba(250,204,21,0.85)]" />
        <span>
          • {label} <span className="text-[#fef08a]/95">(ПО ЗАПРОСУ)</span>
        </span>
      </div>
    );
  }

  if (status === "partial") {
    return (
      <div
        className={`${baseStyles} bg-yellow-950/20 text-yellow-200 border border-yellow-600/35 drop-shadow-[0_0_8px_rgba(234,179,8,0.35)]${mute}`}
      >
        <div className="w-2 h-2 bg-[#facc15] rounded-full shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
        {label} (ЧАСТИЧНО)
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
