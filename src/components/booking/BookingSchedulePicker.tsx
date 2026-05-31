"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { AvailabilityDay } from "@/lib/booking-schedule";
import {
  GAME_DAY_HOURS,
  GAME_DAY_OPEN_HOUR,
  formatSlotRangeLabel,
  formatTimeLabel,
  gameDayWindow,
  listCandidateStarts,
  monthBounds,
} from "@/lib/booking-schedule";
import { BookingPanelFrame } from "@/components/booking/BookingDecor";

const MONTH_NAMES = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];
const WEEKDAYS = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

type SlotSelection = {
  startsAt: string;
  gameDate: string;
  startTime: string;
};

type Props = {
  durationHours: number;
  selectedStartsAt: string | null;
  onSelect: (slot: SlotSelection | null) => void;
};

function firstDayOffset(year: number, monthIndex: number): number {
  const day = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  return day === 0 ? 6 : day - 1;
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function latestStartLabel(gameDate: string, durationHours: number): string {
  const candidates = listCandidateStarts(gameDate, durationHours);
  const last = candidates[candidates.length - 1];
  return last ? formatTimeLabel(last) : "—";
}

export default function BookingSchedulePicker({
  durationHours,
  selectedStartsAt,
  onSelect,
}: Props) {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [days, setDays] = useState<AvailabilityDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGameDate, setSelectedGameDate] = useState<string | null>(null);

  const year = viewDate.getFullYear();
  const monthIndex = viewDate.getMonth();
  const { from, to } = monthBounds(year, monthIndex);

  const minMonth = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
    [today]
  );
  const maxMonth = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + 3, 1),
    [today]
  );

  const slotsByDate = useMemo(() => {
    const map = new Map<string, AvailabilityDay["slots"]>();
    for (const day of days) {
      map.set(day.date, day.slots);
    }
    return map;
  }, [days]);

  const selectedSlot = useMemo(() => {
    if (!selectedStartsAt) return null;
    for (const day of days) {
      const slot = day.slots.find((s) => s.startsAt === selectedStartsAt);
      if (slot) return slot;
    }
    return null;
  }, [days, selectedStartsAt]);

  const selectedDaySlots = selectedGameDate ? (slotsByDate.get(selectedGameDate) ?? []) : [];

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          from,
          to,
          durationHours: String(durationHours),
        });
        const res = await fetch(`/api/booking-schedule/availability?${params}`);
        const data = (await res.json()) as {
          days?: AvailabilityDay[];
          error?: string;
        };
        if (!res.ok) throw new Error(data.error ?? `Ошибка ${res.status}`);
        if (cancelled) return;
        setDays(data.days ?? []);
      } catch (err) {
        if (cancelled) return;
        setDays([]);
        setError(err instanceof Error ? err.message : "Не удалось загрузить расписание");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [from, to, durationHours]);

  useEffect(() => {
    setSelectedGameDate(null);
  }, [year, monthIndex]);

  useEffect(() => {
    if (selectedSlot) {
      setSelectedGameDate(selectedSlot.gameDate);
    }
  }, [selectedSlot]);

  useEffect(() => {
    if (!selectedStartsAt || loading) return;
    const stillValid = days.some((d) => d.slots.some((s) => s.startsAt === selectedStartsAt));
    if (!stillValid) {
      onSelect(null);
    }
  }, [days, selectedStartsAt, loading, onSelect]);

  const monthCells = useMemo(() => {
    const totalDays = daysInMonth(year, monthIndex);
    const offset = firstDayOffset(year, monthIndex);
    const cells: Array<{ day: number | null; date: string | null }> = [];
    for (let i = 0; i < offset; i += 1) cells.push({ day: null, date: null });
    for (let d = 1; d <= totalDays; d += 1) {
      const date = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ day: d, date });
    }
    return cells;
  }, [year, monthIndex]);

  const canPrev = viewDate > minMonth;
  const canNext = viewDate < maxMonth;

  const durationHint = useMemo(() => {
    const sampleDate = selectedGameDate ?? from;
    const latest = latestStartLabel(sampleDate, durationHours);
    const { end } = gameDayWindow(sampleDate);
    const windowEnd = formatTimeLabel(end);
    return `Игра длится ${durationHours} ч подряд и должна целиком уложиться в ${String(GAME_DAY_OPEN_HOUR).padStart(2, "0")}:00–${windowEnd} (${GAME_DAY_HOURS} ч).`;
  }, [durationHours, selectedGameDate, from]);

  return (
    <BookingPanelFrame className="p-3 sm:p-4 space-y-3">
      <div className="flex items-start gap-2">
        <CalendarDays className="w-5 h-5 text-amber-400/90 shrink-0 mt-0.5" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold uppercase tracking-wider text-amber-400/90">
            Дата и время начала
          </p>
        </div>
        {loading ? <Loader2 className="w-4 h-4 text-amber-400/70 animate-spin shrink-0" aria-hidden /> : null}
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => setViewDate(new Date(year, monthIndex - 1, 1))}
          className="p-1.5 text-amber-400 hover:text-amber-200 disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Предыдущий месяц"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <p className="text-base font-bold text-amber-100 tracking-wide">
          {MONTH_NAMES[monthIndex]} {year}
        </p>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => setViewDate(new Date(year, monthIndex + 1, 1))}
          className="p-1.5 text-amber-400 hover:text-amber-200 disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Следующий месяц"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-xs uppercase tracking-wider text-stone-500 py-1">
            {d}
          </div>
        ))}
        {monthCells.map((cell, idx) => {
          if (cell.day == null || cell.date == null) {
            return <div key={`empty-${idx}`} className="min-h-[2.25rem]" aria-hidden />;
          }

          const slots = slotsByDate.get(cell.date) ?? [];
          const hasSlots = slots.length > 0;
          const isSelected = selectedGameDate === cell.date;

          return (
            <button
              key={cell.date}
              type="button"
              disabled={!hasSlots && !isSelected}
              onClick={() => setSelectedGameDate(cell.date)}
              className={`min-h-[2.5rem] rounded-md border text-base font-semibold transition-colors ${
                isSelected
                  ? "border-amber-500/70 bg-amber-950/50 text-amber-100"
                  : hasSlots
                    ? "border-lime-800/35 bg-lime-950/20 text-lime-200 hover:border-lime-600/45"
                    : "border-stone-800/40 bg-stone-950/20 text-stone-600 cursor-not-allowed"
              }`}
              aria-label={
                hasSlots
                  ? `${cell.day} ${MONTH_NAMES[monthIndex]}, доступно ${slots.length} вариантов`
                  : `${cell.day} ${MONTH_NAMES[monthIndex]}, нет свободного времени`
              }
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      <p className="text-[13px] text-amber-200/65 leading-snug px-0.5">{durationHint}</p>

      {error ? (
        <p className="text-sm text-red-400/90" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && !error && days.every((d) => d.slots.length === 0) ? (
        <p className="text-sm text-amber-200/70 text-center py-1">
          В этом месяце нет свободного времени для игры {durationHours} ч.
        </p>
      ) : null}

      {selectedGameDate ? (
        <div className="space-y-2 pt-1 border-t border-amber-800/25">
          <p className="text-[13px] uppercase tracking-wider text-amber-400/80">
            {selectedGameDate.split("-").reverse().join(".")} — выберите начало
          </p>
          {loading ? (
            <p className="text-sm text-amber-200/60 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" aria-hidden />
              Обновляем доступное время…
            </p>
          ) : selectedDaySlots.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedDaySlots.map((slot) => {
                const selected = selectedStartsAt === slot.startsAt;
                const endLabel = formatSlotRangeLabel(
                  new Date(slot.startsAt),
                  new Date(slot.endsAt)
                );
                return (
                  <button
                    key={slot.startsAt}
                    type="button"
                    onClick={() =>
                      onSelect({
                        startsAt: slot.startsAt,
                        gameDate: slot.gameDate,
                        startTime: slot.startTime,
                      })
                    }
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      selected
                        ? "border-amber-500/65 bg-amber-950/45 text-amber-100"
                        : "border-lime-700/30 bg-lime-950/15 text-lime-200 hover:border-lime-500/45"
                    }`}
                  >
                    <span className="font-bold tabular-nums">{slot.startTime}</span>
                    <span className="block text-xs text-stone-400 mt-0.5">
                      до {endLabel.split("–")[1]}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-amber-200/70 leading-snug">
              На эту дату нет свободного времени для игры {durationHours} ч. Выберите другое время
              начала или измените длительность.
            </p>
          )}
        </div>
      ) : null}

      {selectedSlot ? (
        <p className="text-sm text-emerald-300/90">
          Выбрано:{" "}
          {formatSlotRangeLabel(new Date(selectedSlot.startsAt), new Date(selectedSlot.endsAt))}
        </p>
      ) : null}
    </BookingPanelFrame>
  );
}
