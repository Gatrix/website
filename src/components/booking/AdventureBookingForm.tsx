"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Dice5,
  ExternalLink,
  Hourglass,
  Loader2,
  Phone,
  Shield,
  Users,
} from "lucide-react";
import type { Adventure } from "@/lib/db";
import type { BookingConfigPayload, BookingSelectionState, GameFormatId } from "@/lib/booking-types";
import { getBookingInitialValues } from "@/lib/booking-config-utils";
import { collectActiveWarnings } from "@/lib/booking-rules";
import { BookingPanelFrame } from "@/components/booking/BookingDecor";
import BookingSchedulePicker from "@/components/booking/BookingSchedulePicker";
import {
  formatRuPhoneAsYouType,
  isCompleteRuPhone,
  normalizeRuPhoneDigits,
  toE164RuPhone,
} from "@/lib/phone-format";
import { PRICE_PER_HOUR_PER_PERSON_RUB } from "@/lib/pricing";

function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `booking_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
}

const PLAYER_COUNT_OPTIONS = [4, 5, 6] as const;
const DURATION_HOUR_OPTIONS = [4, 5, 6] as const;

function formatRub(amount: number): string {
  return new Intl.NumberFormat("ru-RU").format(amount);
}

function snapToAllowed(value: number, allowed: readonly number[]): number {
  return allowed.reduce((best, n) => (Math.abs(n - value) < Math.abs(best - value) ? n : best));
}

function playerHint(count: number): string {
  if (count <= 3) return "Уютный стол — больше времени на каждого героя.";
  if (count <= 5) return "Классический размер партии.";
  return "Большая компания — больше идей, дольше ходы.";
}

function durationHint(hours: number): string {
  if (hours <= 4) return "Плотный вечер с ярким финалом.";
  if (hours <= 5) return "Спокойный ритм, место для сцен.";
  return "Длинная сессия для боёв и исследований.";
}

function choiceGridClass(count: number, compact = false): string {
  if (compact) return "grid-cols-3";
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-2";
  return "grid-cols-2 sm:grid-cols-3";
}

function choiceButtonClass(selected: boolean): string {
  return `relative flex min-w-0 items-center justify-center gap-1 rounded-lg border px-2 py-2.5 sm:px-3 sm:py-3 md:px-4 md:py-3.5 text-center transition-colors focus-visible:ring-2 focus-visible:ring-amber-500/90 ${
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
  intro,
  footer,
  gridClassName,
  compactValues = false,
}: {
  label: string;
  icon: React.ReactNode;
  options: ChoiceOption[];
  value: string | null;
  onChange: (id: string) => void;
  hint?: string | null;
  intro?: React.ReactNode;
  footer?: React.ReactNode;
  gridClassName?: string;
  compactValues?: boolean;
}) {
  if (options.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-0.5">
        {icon}
        <p className="text-sm sm:text-base font-bold uppercase tracking-wide sm:tracking-wider text-amber-400/90">
          {label}
        </p>
      </div>
      <div
        className={`grid gap-2 ${gridClassName ?? choiceGridClass(options.length)}`}
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
              <span
                className={
                  compactValues
                    ? "font-semibold text-base sm:text-lg md:text-xl tabular-nums text-amber-100"
                    : "font-semibold text-xs sm:text-sm md:text-base uppercase leading-tight sm:leading-snug text-amber-100 break-words"
                }
              >
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
      {intro}
      {hint ? <p className="text-sm sm:text-base text-amber-200/75 px-0.5 leading-snug">{hint}</p> : null}
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
  const [playerCount, setPlayerCount] = useState(5);
  const [durationHours, setDurationHours] = useState(5);
  const [selectedStartsAt, setSelectedStartsAt] = useState<string | null>(null);
  const [adventureType, setAdventureType] = useState<GameFormatId>("adventure");
  const [playerNote, setPlayerNote] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [idempotencyKey] = useState(createIdempotencyKey);

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
        setPlayerCount(snapToAllowed(init.playerCount, PLAYER_COUNT_OPTIONS));
        setDurationHours(snapToAllowed(init.durationHours, DURATION_HOUR_OPTIONS));
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

  const universeId = config?.universe?.id ?? null;

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
  const selectedFormat = config?.formats.find((f) => f.id === adventureType) ?? null;

  const handleScheduleSelect = useCallback(
    (slot: { startsAt: string; gameDate: string; startTime: string } | null) => {
      setSelectedStartsAt(slot?.startsAt ?? null);
    },
    []
  );

  const phoneDigits = useMemo(() => normalizeRuPhoneDigits(phone), [phone]);
  const phoneComplete = isCompleteRuPhone(phoneDigits);
  const pricePerPersonRub = durationHours * PRICE_PER_HOUR_PER_PERSON_RUB;

  const canSubmit =
    !submitting &&
    phoneComplete &&
    selectedStartsAt != null &&
    (config?.systems.length === 0 || gameSystemId != null) &&
    (config?.difficulties.length === 0 || difficultyId != null) &&
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
          playerCount,
          durationHours,
          adventureType,
          startsAt: selectedStartsAt,
          playerNote: playerNote.trim(),
          phone: toE164RuPhone(phoneDigits),
          idempotencyKey,
          company,
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
        <p className="text-base text-amber-400/80">Загрузка параметров бронирования…</p>
      </div>
    );
  }

  if (loadError || !config) {
    return (
      <div className="flex flex-col gap-4 text-amber-100/95 min-h-[12rem] items-center justify-center text-center px-2">
        <AlertTriangle className="w-8 h-8 text-amber-500/90" aria-hidden />
        <p className="text-base text-amber-200/85">{loadError ?? "Параметры бронирования недоступны"}</p>
        <div className="flex flex-wrap gap-2 justify-center">
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="btn btn-primary text-sm px-4 py-2">
            Повторить
          </button>
          <button type="button" onClick={onBack} className="btn btn-ghost text-sm px-4 py-2">
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
          <p className="text-base text-amber-200/80 leading-relaxed">
            Мы получили ваши параметры для «{adventure.title}». Мастер свяжется с вами для подтверждения
            записи.
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
      className="flex min-h-0 flex-1 flex-col text-amber-100/95"
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit();
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-y-contain sm:gap-4 pb-4">
      <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="booking-company">Компания</label>
        <input
          id="booking-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      <BookingChoiceGroup
        label="Система"
        icon={<Dice5 className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400/90 shrink-0" aria-hidden />}
        options={config.systems.map((s) => ({ id: s.id, label: s.name }))}
        value={gameSystemId}
        onChange={setGameSystemId}
        intro={
          <p className="text-sm sm:text-base text-amber-200/65 px-0.5 leading-relaxed">
            Рекомендуется выбирать{" "}
            <span className="text-amber-200/85 font-medium">авторскую систему правил</span>. В ином
            случае предполагается, что игроки уже знакомы с правилами выбранной системы.
          </p>
        }
        hint={selectedSystem?.description || null}
        footer={
          selectedSystem?.rulebook ? (
            <a
              href={selectedSystem.rulebook}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm sm:text-base text-amber-400/90 hover:text-amber-300 underline-offset-2 hover:underline px-0.5"
            >
              Правила (PDF)
              <ExternalLink className="w-4 h-4" aria-hidden />
            </a>
          ) : null
        }
      />

      <BookingChoiceGroup
        label="Сложность"
        icon={<Shield className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400/90 shrink-0" aria-hidden />}
        options={config.difficulties.map((d) => ({ id: d.id, label: d.name }))}
        value={difficultyId}
        onChange={setDifficultyId}
        hint={selectedDifficulty?.description || null}
      />

      {config.formats.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm sm:text-base font-bold uppercase tracking-wide sm:tracking-wider text-amber-400/90 px-0.5">
            Формат игры
          </p>
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
                  <span className="font-bold uppercase text-xs sm:text-sm md:text-base tracking-wide text-amber-100 break-words leading-tight sm:leading-snug">
                    {f.title}
                  </span>
                </button>
              );
            })}
          </div>
          {selectedFormat ? (
            <p className="text-sm sm:text-base text-amber-200/75 px-0.5 leading-snug">{selectedFormat.description}</p>
          ) : null}
        </div>
      ) : null}

      <BookingChoiceGroup
        label="Количество игроков"
        icon={<Users className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400/90 shrink-0" aria-hidden />}
        options={PLAYER_COUNT_OPTIONS.map((n) => ({ id: String(n), label: String(n) }))}
        value={String(playerCount)}
        onChange={(id) => setPlayerCount(Number(id))}
        hint={playerHint(playerCount)}
        gridClassName="grid-cols-3"
        compactValues
      />

      <BookingChoiceGroup
        label="Желаемая длительность (часы)"
        icon={<Hourglass className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400/90 shrink-0" aria-hidden />}
        options={DURATION_HOUR_OPTIONS.map((n) => ({ id: String(n), label: String(n) }))}
        value={String(durationHours)}
        onChange={(id) => setDurationHours(Number(id))}
        hint={durationHint(durationHours)}
        gridClassName="grid-cols-3"
        compactValues
      />

      <BookingSchedulePicker
        durationHours={durationHours}
        selectedStartsAt={selectedStartsAt}
        onSelect={handleScheduleSelect}
      />

      {activeWarnings.length > 0 ? (
        <div className="space-y-2" role="status" aria-live="polite">
          {activeWarnings.map((w) => (
            <div
              key={w.id}
              className="flex gap-2.5 rounded-lg border border-amber-600/35 bg-amber-950/30 px-3 py-2.5 text-sm sm:text-base text-amber-100/90 leading-snug"
            >
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" aria-hidden />
              <p>{w.message}</p>
            </div>
          ))}
        </div>
      ) : null}

      <BookingPanelFrame className="p-3 sm:p-4">
        <label htmlFor="booking-phone" className="text-sm sm:text-base font-bold uppercase tracking-wide sm:tracking-wider text-amber-400/90 block mb-2">
          Телефон <span className="text-red-400/90">*</span>
        </label>
        <div className="relative">
          <Phone
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500/70 pointer-events-none"
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
            className="input-base !text-base sm:!text-lg w-full pl-10 py-2.5 sm:py-3"
            aria-invalid={phone.length > 0 && !phoneComplete}
          />
        </div>
        {phone.length > 0 && !phoneComplete ? (
          <p className="mt-1.5 text-sm text-amber-600/80">Введите номер полностью, 11 цифр</p>
        ) : null}
      </BookingPanelFrame>

      <BookingPanelFrame className="p-3 sm:p-4">
        <label htmlFor="booking-note" className="text-sm sm:text-base font-bold uppercase tracking-wide sm:tracking-wider text-amber-400/90 block mb-2">
          Комментарий
        </label>
        <textarea
          id="booking-note"
          value={playerNote}
          onChange={(e) => setPlayerNote(e.target.value)}
          rows={2}
          maxLength={2000}
          placeholder="Вопросы, пожелания, дополнительные контакты"
          className="input-base resize-none !text-base sm:!text-lg w-full py-2.5 sm:py-3"
        />
      </BookingPanelFrame>

      {submitError ? (
        <p className="text-base text-red-400/90 text-center" role="alert">
          {submitError}
        </p>
      ) : null}
      </div>

      <div className="z-10 shrink-0 border-t border-amber-900/30 bg-[#14110f] pt-3 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 sm:items-stretch">
          <div
            className="flex min-w-0 flex-col justify-center rounded-lg border border-amber-500/45 bg-gradient-to-b from-amber-950/60 to-[#0f0d0c]/90 px-3 py-2 sm:flex-1 sm:text-center shadow-[inset_0_1px_0_rgba(251,191,36,0.1)]"
            aria-live="polite"
          >
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-amber-400/90">
              Стоимость за человека
            </p>
            <p className="mt-0.5 text-xl sm:text-2xl font-extrabold text-amber-50 tabular-nums leading-tight">
              {formatRub(pricePerPersonRub)} ₽
            </p>
            <p className="mt-0.5 text-xs text-amber-200/65">
              {durationHours} ч × {formatRub(PRICE_PER_HOUR_PER_PERSON_RUB)} ₽ за час
            </p>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full sm:min-w-[9.5rem] sm:flex-1 inline-flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base font-bold uppercase tracking-wide transition-all duration-200 enabled:border-amber-200 enabled:bg-gradient-to-b enabled:from-amber-300 enabled:via-amber-400 enabled:to-amber-600 enabled:text-[#1a1008] enabled:shadow-[0_0_28px_rgba(251,191,36,0.55),inset_0_1px_0_rgba(255,255,255,0.45)] hover:enabled:from-amber-200 hover:enabled:via-amber-300 hover:enabled:to-amber-500 hover:enabled:shadow-[0_0_40px_rgba(251,191,36,0.7)] hover:enabled:scale-[1.01] active:enabled:scale-[0.99] disabled:cursor-not-allowed disabled:border-amber-800/60 disabled:bg-[#1a1510] disabled:text-amber-500/70 disabled:shadow-none"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 shrink-0 animate-spin" aria-hidden />
                Отправка…
              </>
            ) : (
              "Отправить заявку"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
