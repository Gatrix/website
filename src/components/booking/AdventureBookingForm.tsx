"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Check, Dice5, ExternalLink, Hourglass, Shield, Sparkles, ScrollText, Swords, Users } from "lucide-react";
import type { Adventure } from "@/hooks/useAdventures";
import type { BookingConfigPayload, GameFormatId } from "@/lib/booking-types";
import { getBookingInitialValues } from "@/lib/booking-config-utils";
import { getMockBookingConfig } from "@/lib/booking-mock";
import { BookingPanelFrame } from "@/components/booking/BookingDecor";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function snapHour(h: number, min: number, max: number) {
  return clamp(Math.round(h), min, max);
}

function playerHint(count: number): string {
  if (count <= 3) return "Уютный стол — больше времени на каждого героя.";
  if (count <= 5) return "Классический размер партии.";
  return "Большая компания — больше идей, дольше ходы.";
}

function durationHint(hours: number): string {
  if (hours <= 4) return "Плотный вечер с ярким финалом.";
  if (hours <= 6) return "Спокойный ритм, место для сцен.";
  return "Длинная сессия для боёв и исследований.";
}

const FORMAT_ICONS: Record<GameFormatId, React.ReactNode> = {
  oneshot: <Sparkles className="w-5 h-5 text-amber-300/90 shrink-0" aria-hidden />,
  adventure: <ScrollText className="w-5 h-5 text-amber-300/90 shrink-0" aria-hidden />,
  campaign: <Swords className="w-5 h-5 text-amber-300/90 shrink-0" aria-hidden />,
};

type Props = {
  adventure: Adventure;
  onBack: () => void;
};

export default function AdventureBookingForm({ adventure, onBack }: Props) {
  const [config, setConfig] = useState<BookingConfigPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const [gameSystemId, setGameSystemId] = useState<string | null>(null);
  const [difficultyId, setDifficultyId] = useState<string | null>(null);
  const [playerCount, setPlayerCount] = useState(5);
  const [durationHours, setDurationHours] = useState(5);
  const [adventureType, setAdventureType] = useState<GameFormatId>("adventure");
  const [playerNote, setPlayerNote] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/adventures/${encodeURIComponent(adventure.id)}/booking-config`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as BookingConfigPayload;
        if (cancelled) return;
        setConfig(data);
        const init = getBookingInitialValues(data);
        setGameSystemId(init.gameSystemId);
        setDifficultyId(init.difficultyId);
        setPlayerCount(init.playerCount);
        setDurationHours(init.durationHours);
        setAdventureType(init.adventureType);
      } catch {
        if (cancelled) return;
        const fallback = getMockBookingConfig(adventure);
        setConfig(fallback);
        const init = getBookingInitialValues(fallback);
        setGameSystemId(init.gameSystemId);
        setDifficultyId(init.difficultyId);
        setPlayerCount(init.playerCount);
        setDurationHours(init.durationHours);
        setAdventureType(init.adventureType);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [adventure]);

  const bounds = config?.bounds ?? {
    minPlayers: 3,
    maxPlayers: 6,
    minDurationHours: 4,
    maxDurationHours: 8,
  };

  const selectedSystem = config?.systems.find((s) => s.id === gameSystemId) ?? null;
  const selectedDifficulty = config?.difficulties.find((d) => d.id === difficultyId) ?? null;
  const selectedFormat = config?.formats.find((f) => f.id === adventureType) ?? null;

  const onDurationInput = useCallback(
    (v: number) => {
      setDurationHours(snapHour(v, bounds.minDurationHours, bounds.maxDurationHours));
    },
    [bounds.minDurationHours, bounds.maxDurationHours]
  );

  const durSliderMin = bounds.minDurationHours;
  const durSliderMax = bounds.maxDurationHours;

  if (loading || !config) {
    return (
      <div className="flex flex-col gap-4 text-amber-100/95 min-h-[12rem] items-center justify-center">
        <p className="text-sm text-amber-400/80">Загрузка параметров бронирования…</p>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-3 sm:gap-4 text-amber-100/95"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="flex items-center justify-end shrink-0">
        <button type="button" onClick={onBack} className="btn btn-ghost text-xs px-3 py-2 min-h-0">
          ← Назад к описанию
        </button>
      </div>

      {config.systems.length > 0 ? (
        <BookingPanelFrame className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:min-w-[9rem] shrink-0">
              <Dice5 className="w-5 h-5 text-amber-400/90" aria-hidden />
              <label htmlFor="booking-system" className="text-xs font-bold uppercase tracking-wider text-amber-400/90">
                Система
              </label>
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <select
                id="booking-system"
                value={gameSystemId ?? ""}
                onChange={(e) => setGameSystemId(e.target.value || null)}
                className="input-base cursor-pointer w-full"
              >
                {config.systems.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {selectedSystem?.description ? (
                <p className="text-xs text-amber-200/75 leading-snug">{selectedSystem.description}</p>
              ) : null}
              {selectedSystem?.rulebook ? (
                <a
                  href={selectedSystem.rulebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-amber-400/90 hover:text-amber-300 underline-offset-2 hover:underline"
                >
                  Правила (PDF)
                  <ExternalLink className="w-3 h-3" aria-hidden />
                </a>
              ) : null}
            </div>
          </div>
        </BookingPanelFrame>
      ) : null}

      {config.difficulties.length > 0 ? (
        <BookingPanelFrame className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:min-w-[9rem] shrink-0">
              <Shield className="w-5 h-5 text-amber-400/90" aria-hidden />
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400/90">Сложность</p>
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <select
                id="booking-difficulty"
                value={difficultyId ?? ""}
                onChange={(e) => setDifficultyId(e.target.value || null)}
                className="input-base cursor-pointer w-full"
              >
                {config.difficulties.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              {selectedDifficulty ? (
                <p className="text-xs text-amber-200/75 leading-snug">{selectedDifficulty.description}</p>
              ) : null}
            </div>
          </div>
        </BookingPanelFrame>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <BookingPanelFrame className="p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-amber-400/90" aria-hidden />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400/90">Игроки</span>
            <span className="ml-auto text-lg font-black tabular-nums">{playerCount}</span>
          </div>
          <input
            type="range"
            min={bounds.minPlayers}
            max={bounds.maxPlayers}
            step={1}
            value={playerCount}
            onChange={(e) => setPlayerCount(Number(e.target.value))}
            className="w-full accent-amber-600 h-2 rounded-full bg-amber-950/80"
          />
          <p className="mt-1.5 text-xs text-amber-200/70">{playerHint(playerCount)}</p>
        </BookingPanelFrame>

        <BookingPanelFrame className="p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <Hourglass className="w-5 h-5 text-amber-400/90" aria-hidden />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400/90">Длительность</span>
            <span className="ml-auto text-lg font-black tabular-nums">{durationHours} ч</span>
          </div>
          <input
            type="range"
            min={durSliderMin}
            max={durSliderMax}
            step={1}
            value={clamp(durationHours, durSliderMin, durSliderMax)}
            onChange={(e) => onDurationInput(Number(e.target.value))}
            className="w-full accent-amber-600 h-2 rounded-full bg-amber-950/80"
          />
          <p className="mt-1.5 text-xs text-amber-200/70">{durationHint(durationHours)}</p>
        </BookingPanelFrame>
      </div>

      {config.formats.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-400/90 px-0.5">Формат игры</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {config.formats.map((f) => {
              const sel = adventureType === f.id;
              const enabled = f.enabled !== false;
              return (
                <button
                  key={f.id}
                  type="button"
                  disabled={!enabled}
                  onClick={() => enabled && setAdventureType(f.id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-amber-500/90 ${
                    !enabled
                      ? "border-amber-900/25 bg-[#0a0908]/60 opacity-40 cursor-not-allowed"
                      : sel
                        ? "border-amber-500/60 bg-amber-950/45"
                        : "border-amber-800/35 bg-[#0f0d0c]/80 hover:border-amber-600/40"
                  }`}
                >
                  {FORMAT_ICONS[f.id]}
                  <span className="font-bold uppercase text-[11px] tracking-wide text-amber-100">{f.title}</span>
                  {sel && enabled ? <Check className="w-3.5 h-3.5 ml-auto text-amber-400" aria-hidden /> : null}
                </button>
              );
            })}
          </div>
          {selectedFormat ? (
            <p className="text-xs text-amber-200/75 px-0.5 leading-snug">{selectedFormat.description}</p>
          ) : null}
        </div>
      ) : null}

      <BookingPanelFrame className="p-3 sm:p-4">
        <label htmlFor="booking-note" className="text-xs font-bold uppercase tracking-wider text-amber-400/90 block mb-2">
          Комментарий <span className="font-normal normal-case text-amber-600/70">(Telegram)</span>
        </label>
        <textarea
          id="booking-note"
          value={playerNote}
          onChange={(e) => setPlayerNote(e.target.value)}
          rows={2}
          maxLength={2000}
          placeholder="@nickname"
          className="input-base resize-none text-sm w-full"
        />
      </BookingPanelFrame>

      <button type="button" disabled className="btn btn-primary w-full opacity-55 cursor-not-allowed" title="Скоро">
        Отправить заявку — скоро
      </button>
    </form>
  );
}
