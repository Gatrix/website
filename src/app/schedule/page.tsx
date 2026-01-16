"use client";

import React, { useEffect, useMemo, useRef, useState, Suspense } from "react";
import AtmosphericBackground from "@/components/AtmosphericBackground";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAdventures } from "@/hooks/useAdventures";
import BookingDrawer, { type BookingSlot } from "@/components/BookingDrawer";

// Types for our schedule
type SlotStatus = "available" | "partial" | "booked" | "on-request";

function ScheduleContent() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { adventures } = useAdventures();
  const selectedAdventureId = searchParams.get("adventureId");
  const initialTier = searchParams.get("tier") === "premium" ? "premium" : "standard";
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [slotNotice, setSlotNotice] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const dayRefs = useRef<Array<HTMLDivElement | null>>([]);
  const showOnlyAvailable = searchParams.get("availability") === "available";
  const selectedAdventure = useMemo(
    () => adventures.find((adv) => adv.id === selectedAdventureId),
    [adventures, selectedAdventureId]
  );
  
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

  const monthNames = [
    "ЯНВАРЬ", "ФЕВРАЛЬ", "МАРТ", "АПРЕЛЬ", "МАЙ", "ИЮНЬ",
    "ИЮЛЬ", "АВГУСТ", "СЕНТЯБРЬ", "ОКТЯБРЬ", "НОЯБРЬ", "ДЕКАБРЬ"
  ];

  const daysOfWeek = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];
  const slotDefinitions = {
    daytime: { label: "ДЕНЬ", timeRange: "12:00–16:00", timeStart: "12:00", durationMinutes: 240 },
    evening: { label: "ВЕЧЕР", timeRange: "19:00–23:00", timeStart: "19:00", durationMinutes: 300 },
  } as const;

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

  // Mock data for special dates (open tables or booked slots)
  // In a real app, this would come from a database
  const getSlotStatus = (day: number, time: "daytime" | "evening"): SlotStatus => {
    // Example: mixed statuses for UX demo
    if (day === 10 && time === "evening") return "on-request";
    if (day === 15 && time === "daytime") return "booked";
    if (day === 20 && time === "evening") return "partial";
    // For now, everything else is available
    return "available";
  };

  const handleSlotClick = (day: number, time: "daytime" | "evening") => {
    const status = getSlotStatus(day, time);
    if (status === "booked") {
      setSlotNotice("Этот слот уже занят.");
      return;
    }
    const slotMeta = slotDefinitions[time];
    const label = `${slotMeta.label} (${slotMeta.timeRange})`;
    const slotId = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}-${time}`;
    const slot: BookingSlot = {
      id: slotId,
      dateLabel: `${day} ${monthNames[month].toLowerCase()}`,
      timeLabel: label,
      timeStart: slotMeta.timeStart,
      durationMinutes: slotMeta.durationMinutes,
      locationLabel: "{АДРЕС}",
      status,
      maxPlayers: 6,
      remaining: status === "partial" ? 2 : 6,
      minPlayers: 2,
    };
    setSlotNotice(null);
    setSelectedSlot(slot);
    setIsBookingOpen(true);
    updateUrlParams({ slotId });
    setSelectedDay(day);
  };

  useEffect(() => {
    const wantsCalendar = window.location.hash === "#calendar" || searchParams.get("view") === "calendar";
    if (!wantsCalendar) return;
    const calendar = document.getElementById("calendar");
    if (calendar) {
      calendar.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [searchParams]);

  useEffect(() => {
    const slotId = searchParams.get("slotId");
    if (!slotId) {
      setIsBookingOpen(false);
      setSelectedSlot(null);
      return;
    }
    const match = slotId.match(/^(\d{4})-(\d{2})-(\d{2})-(daytime|evening)$/);
    if (!match) return;
    const [, yearStr, monthStr, dayStr, time] = match;
    const slotYear = Number(yearStr);
    const slotMonth = Number(monthStr) - 1;
    const slotDay = Number(dayStr);
    const status = getSlotStatus(slotDay, time as "daytime" | "evening");
    const slotMeta = slotDefinitions[time as "daytime" | "evening"];
    const label = `${slotMeta.label} (${slotMeta.timeRange})`;
    setCurrentDate(new Date(slotYear, slotMonth, 1));
    setSelectedSlot({
      id: slotId,
      dateLabel: `${slotDay} ${monthNames[slotMonth].toLowerCase()}`,
      timeLabel: label,
      timeStart: slotMeta.timeStart,
      durationMinutes: slotMeta.durationMinutes,
      locationLabel: "{АДРЕС}",
      status,
      maxPlayers: 6,
      remaining: status === "partial" ? 2 : 6,
      minPlayers: 2,
    });
    if (status === "booked") {
      setSlotNotice("Этот слот уже занят.");
      setIsBookingOpen(false);
    } else {
      setSlotNotice(null);
      setIsBookingOpen(true);
    }
  }, [searchParams, monthNames]);

  const updateUrlParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) params.delete(key);
      else params.set(key, value);
    });
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}#calendar`);
  };

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
    setSelectedSlot(null);
    updateUrlParams({ slotId: null });
  };

  const handleDayKeyDown = (event: React.KeyboardEvent, day: number) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelectedDay(day);
      return;
    }
    const moveBy = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : event.key === "ArrowDown" ? 7 : event.key === "ArrowUp" ? -7 : 0;
    if (moveBy === 0) return;
    event.preventDefault();
    const nextDay = day + moveBy;
    if (nextDay < 1 || nextDay > daysInMonth) return;
    dayRefs.current[nextDay]?.focus();
    setSelectedDay(nextDay);
  };

  return (
    <main className="relative min-h-screen text-[#d1c7bc] font-serif selection:bg-amber-900/50 pt-32 sm:pt-40 pb-12 px-4">
      <AtmosphericBackground />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-amber-50 uppercase tracking-widest">
            СВОБОДНЫЕ ДАТЫ
          </h1>
          {selectedAdventureId && (
            <div className="mb-6 text-amber-300/80 text-xs sm:text-sm uppercase tracking-[0.2em]">
              Вы выбрали: {selectedAdventure?.title ?? `#${selectedAdventureId}`}
            </div>
          )}
          {slotNotice && (
            <div aria-live="polite" className="mb-6 text-amber-200/80 text-xs sm:text-sm border border-amber-900/40 bg-amber-950/30 px-4 py-2 rounded-md">
              {slotNotice}
            </div>
          )}
          
          <button className="btn btn-secondary text-sm uppercase mb-8">
            ЗАПИСАТЬСЯ
          </button>
          
          <div className="space-y-2 text-[#8c8279] text-xs uppercase tracking-[0.2em] font-sans font-bold">
            <p>НАЧАЛО ДНЕВНЫХ ИГР 12:00, НАЧАЛО ВЕЧЕРНИХ ИГР 19:00</p>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs uppercase tracking-[0.2em] text-amber-300/80">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
              Свободно
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]"></span>
              Частично
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
              Занято
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>
              По запросу
            </div>
          </div>
          {selectedDay && (
            <div className="mt-4 text-xs uppercase tracking-[0.2em] text-amber-400/80">
              Выбран день: {selectedDay} {monthNames[month].toLowerCase()}
            </div>
          )}
          {showOnlyAvailable && (
            <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-amber-400/70">
              Показаны доступные слоты
            </div>
          )}
        </header>

        {/* Month Navigation */}
        <div className="flex items-center justify-center gap-8 mb-12 py-6 border-y border-amber-900/20">
          <button 
            onClick={prevMonth}
            disabled={currentDate <= minDate}
            className={`p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09] ${currentDate <= minDate ? 'opacity-0 pointer-events-none' : 'text-amber-600 hover:text-amber-400'}`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <h2 className="text-xl md:text-2xl font-bold text-amber-100 tracking-[0.3em] min-w-[240px] text-center uppercase">
            {monthNames[month]} {year}
          </h2>
          
          <button 
            onClick={nextMonth}
            disabled={currentDate >= maxDate}
            className={`p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09] ${currentDate >= maxDate ? 'opacity-0 pointer-events-none' : 'text-amber-600 hover:text-amber-400'}`}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div id="calendar" role="grid" aria-label="Календарь свободных дат" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-px bg-amber-900/10 border border-amber-900/10">
          {/* Days */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="hidden lg:block aspect-square bg-[#0f0d0c]/30"></div>
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayOfWeekIndex = (firstDay + i) % 7;
            const isToday = today.getDate() === dayNum && today.getMonth() === month && today.getFullYear() === year;
            const daytimeStatus = getSlotStatus(dayNum, "daytime");
            const eveningStatus = getSlotStatus(dayNum, "evening");
            const hideDaytime = showOnlyAvailable && (daytimeStatus === "booked" || daytimeStatus === "on-request");
            const hideEvening = showOnlyAvailable && (eveningStatus === "booked" || eveningStatus === "on-request");
            const hasVisibleSlots = !(hideDaytime && hideEvening);

            return (
              <div
                key={dayNum}
                ref={(el) => {
                  dayRefs.current[dayNum] = el;
                }}
                role="gridcell"
                tabIndex={0}
                aria-selected={selectedDay === dayNum}
                aria-label={`День ${dayNum} ${monthNames[month].toLowerCase()}`}
                onClick={() => setSelectedDay(dayNum)}
                onKeyDown={(event) => handleDayKeyDown(event, dayNum)}
                className={`relative bg-[#0f0d0c]/80 p-4 flex flex-col justify-between transition-all hover:bg-[#1a1614] min-h-[160px] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09] ${isToday ? 'bg-amber-950/10' : ''} ${selectedDay === dayNum ? 'ring-2 ring-amber-500/50' : ''}`}
              >
                <div className="flex justify-between items-start font-sans">
                  <span className={`text-3xl font-light ${isToday ? 'text-amber-500 font-bold' : 'text-amber-50/80'}`}>{dayNum}</span>
                  <span className="text-[10px] uppercase text-amber-500/80 font-bold tracking-wider">
                    {daysOfWeek[dayOfWeekIndex]}
                  </span>
                </div>

                <div className="flex flex-col gap-3 mt-8">
                  {!hideDaytime && (
                    <SlotButton 
                      label="ДЕНЬ" 
                      status={daytimeStatus} 
                      onClick={() => handleSlotClick(dayNum, "daytime")}
                    />
                  )}
                  {!hideEvening && (
                    <SlotButton 
                      label="ВЕЧЕР" 
                      status={eveningStatus} 
                      onClick={() => handleSlotClick(dayNum, "evening")}
                    />
                  )}
                  {!hasVisibleSlots && (
                    <div className="text-[10px] uppercase tracking-[0.2em] text-amber-500/50">
                      Нет доступных слотов
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <BookingDrawer
        isOpen={isBookingOpen}
        slot={selectedSlot}
        adventures={adventures}
        initialAdventureId={selectedAdventureId}
        initialTier={initialTier}
        onClose={handleCloseBooking}
      />
    </main>
  );
}

export default function SchedulePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0c0a09] flex items-center justify-center">
        <div className="text-amber-100 uppercase tracking-widest animate-pulse">
          Загрузка календаря...
        </div>
      </div>
    }>
      <ScheduleContent />
    </Suspense>
  );
}

function SlotButton({
  label,
  status,
  onClick,
}: {
  label: string;
  status: SlotStatus;
  onClick: () => void;
}) {
  const baseStyles = "text-[11px] font-black tracking-[0.2em] py-1 px-2 transition-all text-left flex items-center gap-2.5 font-sans rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09] relative";

  if (status === "booked") {
    return (
      <div className={`${baseStyles} bg-red-950/40 text-red-400 border border-red-900/30 cursor-not-allowed`}>
        <div className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]"></div>
        <span className="line-through decoration-red-900/50">{label} (ЗАНЯТО)</span>
      </div>
    );
  }

  if (status === "on-request") {
    return (
      <button 
        onClick={onClick}
        className={`${baseStyles} text-amber-400 hover:text-amber-200 drop-shadow-sm`}
      >
        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]"></div>
        {label} (ПО ЗАПРОСУ)
      </button>
    );
  }

  if (status === "partial") {
    return (
      <button 
        onClick={onClick}
        className={`${baseStyles} bg-amber-950/20 text-amber-300 border border-amber-800/40 hover:bg-amber-900/30 hover:text-amber-200 transition-all drop-shadow-sm`}
      >
        <div className="w-2 h-2 bg-yellow-500 rounded-full shadow-[0_0_8px_rgba(234,179,8,0.5)]"></div>
        {label} (ЧАСТИЧНО)
      </button>
    );
  }

  return (
    <button 
      onClick={onClick}
      className={`${baseStyles} bg-green-950/20 text-green-400 border border-green-900/20 hover:bg-green-900/30 hover:text-green-300 transition-all drop-shadow-sm group/slot`}
    >
      <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)] group-hover/slot:bg-green-400 transition-colors"></div>
      {label}
    </button>
  );
}
