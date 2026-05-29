"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Dice5,
  ExternalLink,
  Globe,
  Hourglass,
  Loader2,
  Phone,
  Shield,
  Sparkles,
  ScrollText,
  Swords,
  Users,
} from "lucide-react";
import type { Adventure } from "@/hooks/useAdventures";
import type { BookingConfigPayload, BookingSelectionState, GameFormatId } from "@/lib/booking-types";
import { getBookingInitialValues } from "@/lib/booking-config-utils";
import { collectActiveWarnings } from "@/lib/booking-rules";
import { BookingPanelFrame } from "@/components/booking/BookingDecor";
import {
  formatRuPhoneAsYouType,
  isCompleteRuPhone,
  normalizeRuPhoneDigits,
  toE164RuPhone,
} from "@/lib/phone-format";

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

function choiceGridClass(count: number): string {
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-1 sm:grid-cols-2";
  if (count <= 4) return "grid-cols-1 sm:grid-cols-2";
  return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
}

function choiceButtonClass(selected: boolean): string {
  return `flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-amber-500/90 ${
    selected
      ? "border-amber-500/60 bg-amber-950/45"
      : "border-amber-800/35 bg-[#0f0d0c]/80 hover:border-amber-600/40"
  }`;
}

type ChoiceOption = { id: string; label: string };

function BookingChoiceGroup({
  label,
  icon,
  options,
  value,
  onChange,
  hint,
  footer,
}: {
  label: string;
  icon: React.ReactNode;
  options: ChoiceOption[];
  value: string | null;
  onChange: (id: string) => void;
  hint?: string | null;
  footer?: React.ReactNode;
}) {
  if (options.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-0.5">
        {icon}
        <p className="text-xs font-bold uppercase tracking-wider text-amber-400/90">{label}</p>
      </div>
      <div
        className={`grid gap-2 ${choiceGridClass(options.length)}`}
        role="radiogroup"
        aria-label={label}
      >
        {options.map((opt) => {
          const selected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.id)}
              className={choiceButtonClass(selected)}
            >
              <span className="font-semibold text-xs leading-snug text-amber-100">{opt.label}</span>
              {selected ? <Check className="w-3.5 h-3.5 ml-auto shrink-0 text-amber-400" aria-hidden /> : null}
            </button>
          );
        })}
      </div>
      {hint ? <p className="text-xs text-amber-200/75 px-0.5 leading-snug">{hint}</p> : null}
      {footer}
    </div>
  );
}

type Props = {
  adventure: Adventure;
  onBack: () => void;
};

export default function AdventureBookingForm({ adventure, onBack }: Props) {
  const [config, setConfig] = useState<BookingConfigPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [gameSystemId, setGameSystemId] = useState<string | null>(null);
  const [difficultyId, setDifficultyId] = useState<string | null>(null);
  const [universeId, setUniverseId] = useState<string | null>(null);
  const [playerCount, setPlayerCount] = useState(5);
  const [durationHours, setDurationHours] = useState(5);
  const [adventureType, setAdventureType] = useState<GameFormatId>("adventure");
  const [playerNote, setPlayerNote] = useState("");
  const [phone, setPhone] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`/api/adventures/${encodeURIComponent(adventure.id)}/booking-config`);
        if (!res.ok) throw new Error(`Не удалось загрузить параметры (${res.status})`);
        const data = (await res.json()) as BookingConfigPayload;
        if (cancelled) return;
        setConfig(data);
        const init = getBookingInitialValues(data);
        setGameSystemId(init.gameSystemId);
        setDifficultyId(init.difficultyId);
        setUniverseId(init.universeId);
        setPlayerCount(init.playerCount);
        setDurationHours(init.durationHours);
        setAdventureType(init.adventureType);
      } catch (err) {
        if (cancelled) return;
        setConfig(null);
        setLoadError(err instanceof Error ? err.message : "Ошибка загрузки параметров");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [adventure, reloadKey]);

  const bounds = config?.bounds ?? {
    minPlayers: 3,
    maxPlayers: 6,
    minDurationHours: 4,
    maxDurationHours: 8,
  };

  const selection: BookingSelectionState = useMemo(
    () => ({
      gameSystemId,
      difficultyId,
      universeId,
      playerCount,
      durationHours,
      adventureType,
    }),
    [gameSystemId, difficultyId, universeId, playerCount, durationHours, adventureType]
  );

  const activeWarnings = useMemo(() => {
    if (!config) return [];
    const ids = collectActiveWarnings(adventure.id, config.warningRules, selection);
    return ids
      .map((id) => config.warnings.find((w) => w.id === id))
      .filter((w): w is { id: number; message: string } => Boolean(w?.message));
  }, [config, adventure.id, selection]);

  const selectedSystem = config?.systems.find((s) => s.id === gameSystemId) ?? null;
  const selectedDifficulty = config?.difficulties.find((d) => d.id === difficultyId) ?? null;
  const selectedUniverse = config?.universes.find((u) => u.id === universeId) ?? null;
  const selectedFormat = config?.formats.find((f) => f.id === adventureType) ?? null;

  const onDurationInput = useCallback(
    (v: number) => {
      setDurationHours(snapHour(v, bounds.minDurationHours, bounds.maxDurationHours));
    },
    [bounds.minDurationHours, bounds.maxDurationHours]
  );

  const durSliderMin = bounds.minDurationHours;
  const durSliderMax = bounds.maxDurationHours;

  const phoneDigits = useMemo(() => normalizeRuPhoneDigits(phone), [phone]);
  const phoneComplete = isCompleteRuPhone(phoneDigits);

  const canSubmit =
    !submitting &&
    phoneComplete &&
    (config?.systems.length === 0 || gameSystemId != null) &&
    (config?.difficulties.length === 0 || difficultyId != null) &&
    (config?.universes.length === 0 || universeId != null) &&
    (config?.formats.length === 0 || config?.formats.some((f) => f.id === adventureType));

  const onPhoneChange = useCallback((raw: string) => {
    setPhone(formatRuPhoneAsYouType(raw).display);
  }, []);

  const handleSubmit = async () => {
    if (!config || !canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/booking-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adventureId: adventure.id,
          gameSystemId,
          difficultyId,
          universeId,
          playerCount,
          durationHours,
          adventureType,
          playerNote: playerNote.trim(),
          phone: toE164RuPhone(phoneDigits),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? `Ошибка отправки (${res.status})`);
      }
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Не удалось отправить заявку");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 text-amber-100/95 min-h-[12rem] items-center justify-center">
        <Loader2 className="w-6 h-6 text-amber-400/80 animate-spin" aria-hidden />
        <p className="text-sm text-amber-400/80">Загрузка параметров бронирования…</p>
      </div>
    );
  }

  if (loadError || !config) {
    return (
      <div className="flex flex-col gap-4 text-amber-100/95 min-h-[12rem] items-center justify-center text-center px-2">
        <AlertTriangle className="w-8 h-8 text-amber-500/90" aria-hidden />
        <p className="text-sm text-amber-200/85">{loadError ?? "Параметры бронирования недоступны"}</p>
        <div className="flex flex-wrap gap-2 justify-center">
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="btn btn-primary text-xs px-4 py-2">
            Повторить
          </button>
          <button type="button" onClick={onBack} className="btn btn-ghost text-xs px-4 py-2">
            ← Назад
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col gap-4 text-amber-100/95 items-center justify-center text-center py-6 px-2">
        <CheckCircle2 className="w-12 h-12 text-emerald-400/90" aria-hidden />
        <div className="space-y-2 max-w-md">
          <p className="text-lg font-bold text-amber-100">Заявка отправлена</p>
          <p className="text-sm text-amber-200/80 leading-relaxed">
            Мы получили ваши параметры для «{adventure.title}». Мастер свяжется с вами, когда появится подходящий
            слот.
          </p>
        </div>
        <button type="button" onClick={onBack} className="btn btn-primary text-sm px-5 py-2.5 mt-2">
          ← К описанию приключения
        </button>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-3 sm:gap-4 text-amber-100/95"
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit();
      }}
    >
      <div className="flex items-center justify-end shrink-0">
        <button type="button" onClick={onBack} className="btn btn-ghost text-xs px-3 py-2 min-h-0">
          ← Назад к описанию
        </button>
      </div>

      <BookingChoiceGroup
        label="Система"
        icon={<Dice5 className="w-5 h-5 text-amber-400/90 shrink-0" aria-hidden />}
        options={config.systems.map((s) => ({ id: s.id, label: s.name }))}
        value={gameSystemId}
        onChange={setGameSystemId}
        hint={selectedSystem?.description || null}
        footer={
          selectedSystem?.rulebook ? (
            <a
              href={selectedSystem.rulebook}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-amber-400/90 hover:text-amber-300 underline-offset-2 hover:underline px-0.5"
            >
              Правила (PDF)
              <ExternalLink className="w-3 h-3" aria-hidden />
            </a>
          ) : null
        }
      />

      <BookingChoiceGroup
        label="Сложность"
        icon={<Shield className="w-5 h-5 text-amber-400/90 shrink-0" aria-hidden />}
        options={config.difficulties.map((d) => ({ id: d.id, label: d.name }))}
        value={difficultyId}
        onChange={setDifficultyId}
        hint={selectedDifficulty?.description || null}
      />

      <BookingChoiceGroup
        label="Вселенная"
        icon={<Globe className="w-5 h-5 text-amber-400/90 shrink-0" aria-hidden />}
        options={config.universes.map((u) => ({ id: u.id, label: u.name }))}
        value={universeId}
        onChange={setUniverseId}
        hint={selectedUniverse ? `Игра пройдёт в сеттинге «${selectedUniverse.name}».` : null}
      />

      {config.formats.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-400/90 px-0.5">Формат игры</p>
          <div
            className={`grid gap-2 ${choiceGridClass(config.formats.length)}`}
            role="radiogroup"
            aria-label="Формат игры"
          >
            {config.formats.map((f) => {
              const sel = adventureType === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  role="radio"
                  aria-checked={sel}
                  onClick={() => setAdventureType(f.id)}
                  className={choiceButtonClass(sel)}
                >
                  {FORMAT_ICONS[f.id]}
                  <span className="font-bold uppercase text-[11px] tracking-wide text-amber-100">{f.title}</span>
                  {sel ? <Check className="w-3.5 h-3.5 ml-auto text-amber-400" aria-hidden /> : null}
                </button>
              );
            })}
          </div>
          {selectedFormat ? (
            <p className="text-xs text-amber-200/75 px-0.5 leading-snug">{selectedFormat.description}</p>
          ) : null}
        </div>
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

      {activeWarnings.length > 0 ? (
        <div className="space-y-2" role="status" aria-live="polite">
          {activeWarnings.map((w) => (
            <div
              key={w.id}
              className="flex gap-2.5 rounded-lg border border-amber-600/35 bg-amber-950/30 px-3 py-2.5 text-xs text-amber-100/90 leading-snug"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden />
              <p>{w.message}</p>
            </div>
          ))}
        </div>
      ) : null}

      <BookingPanelFrame className="p-3 sm:p-4">
        <label htmlFor="booking-phone" className="text-xs font-bold uppercase tracking-wider text-amber-400/90 block mb-2">
          Телефон <span className="text-red-400/90">*</span>
        </label>
        <div className="relative">
          <Phone
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/70 pointer-events-none"
            aria-hidden
          />
          <input
            id="booking-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="+7 (999) 123-45-67"
            className="input-base text-sm w-full pl-9"
            aria-invalid={phone.length > 0 && !phoneComplete}
          />
        </div>
        {phone.length > 0 && !phoneComplete ? (
          <p className="mt-1.5 text-xs text-amber-600/80">Введите номер полностью, 11 цифр</p>
        ) : null}
      </BookingPanelFrame>

      <BookingPanelFrame className="p-3 sm:p-4">
        <label htmlFor="booking-note" className="text-xs font-bold uppercase tracking-wider text-amber-400/90 block mb-2">
          Комментарий
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

      {submitError ? (
        <p className="text-sm text-red-400/90 text-center" role="alert">
          {submitError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className="btn btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-55 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            Отправка…
          </>
        ) : (
          "Отправить заявку"
        )}
      </button>
    </form>
  );
}
