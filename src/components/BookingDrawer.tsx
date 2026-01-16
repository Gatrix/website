"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Adventure } from "@/hooks/useAdventures";
import { calculateTotalPrice, getPricePerPlayer, type Tier } from "@/lib/pricing";
import { createBooking, createPayment, type BookingPayload } from "@/lib/bookingApi";

export type BookingSlot = {
  id: string;
  dateLabel: string;
  timeLabel: string;
  timeStart?: string;
  durationMinutes?: number;
  locationLabel?: string;
  status: "available" | "partial" | "booked" | "on-request";
  maxPlayers: number;
  remaining: number;
  minPlayers?: number;
};

type BookingDrawerProps = {
  isOpen: boolean;
  slot: BookingSlot | null;
  adventures: Adventure[];
  initialAdventureId?: string | null;
  initialTier?: Tier;
  onClose: () => void;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("ru-RU").format(value);

export default function BookingDrawer({
  isOpen,
  slot,
  adventures,
  initialAdventureId,
  initialTier = "standard",
  onClose,
}: BookingDrawerProps) {
  const [adventureId, setAdventureId] = useState<string | "auto" | "">("");
  const [tier, setTier] = useState<Tier>(initialTier);
  const [players, setPlayers] = useState(4);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [contactChannel, setContactChannel] = useState<"phone" | "telegram" | "email">("telegram");
  const [comment, setComment] = useState("");
  const [agree, setAgree] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const selectedAdventure = useMemo(
    () => adventures.find((adv) => adv.id === adventureId),
    [adventures, adventureId]
  );

  useEffect(() => {
    if (!isOpen || !slot) return;
    setTier(initialTier);
    setAdventureId(initialAdventureId ?? "");
    setPlayers(Math.min(4, slot.maxPlayers));
    setName("");
    setContact("");
    setEmail("");
    setContactChannel("telegram");
    setComment("");
    setAgree(false);
    setError(null);
    setSuccess(false);
  }, [isOpen, slot, initialTier, initialAdventureId]);

  useEffect(() => {
    if (!isOpen) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => closeButtonRef.current?.focus());
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
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
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const perPlayer = getPricePerPlayer(tier);
  const total = calculateTotalPrice(tier, players);
  const isStorySuggestion = adventureId === "auto";
  const isCommentRequired = isStorySuggestion;
  const minPlayers = slot?.minPlayers ?? 1;
  const contactTargetLabel =
    contactChannel === "email" ? "email" : contactChannel === "phone" ? "телефон" : "Telegram";
  const isFormValid =
    adventureId !== "" &&
    name.trim().length > 0 &&
    (contactChannel === "email" ? email.trim().length > 0 : contact.trim().length > 0) &&
    agree &&
    (!isCommentRequired || comment.trim().length > 0);

  const handlePlayersChange = (next: number) => {
    if (!slot) return;
    const safe = Math.max(minPlayers, Math.min(slot.maxPlayers, next));
    setPlayers(safe);
  };

  const handleSubmit = async () => {
    if (!slot) return;
    setError(null);
    if (!adventureId) return setError("Выберите сюжет.");
    if (!name.trim()) return setError("Укажите имя.");
    if (contactChannel === "email") {
      if (!email.trim()) return setError("Укажите email для подтверждения.");
    } else if (!contact.trim()) {
      return setError("Укажите телефон или Telegram.");
    }
    if (!agree) return setError("Нужно согласиться с политикой.");
    if (isCommentRequired && !comment.trim()) {
      return setError("Опишите пожелания для подбора сюжета.");
    }
    setIsSubmitting(true);
    try {
      const contactValue =
        contactChannel === "email" ? email.trim() : contact.trim();
      const payload: BookingPayload = {
        slotId: slot.id,
        adventureId: adventureId && adventureId !== "auto" ? adventureId : null,
        tier,
        players,
        name: name.trim(),
        contact: contactValue,
        email: email.trim() || undefined,
        comment: comment.trim() || undefined,
        needsStorySuggestion: isStorySuggestion,
      };
      const booking = await createBooking(payload);
      const payment = await createPayment(booking.bookingId);
      setSuccess(true);
      window.location.assign(payment.paymentUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить заявку.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !slot) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={onClose} />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-[440px] bg-[#14110f] border-l border-amber-900/40 shadow-2xl flex flex-col"
      >
        <div className="flex items-start justify-between gap-4 px-5 sm:px-6 py-5 border-b border-amber-900/30">
          <div>
            <h2 id="booking-title" className="text-xl font-bold text-amber-100 uppercase tracking-wide">
              Бронирование
            </h2>
            <p className="text-sm text-amber-300/70 mt-1">
              {slot.dateLabel} · {slot.timeLabel}
            </p>
            <div className="mt-2 text-xs text-amber-400/70 space-y-1">
              {slot.durationMinutes && <div>Длительность: {Math.round(slot.durationMinutes / 60)} ч</div>}
              <div>Свободно мест: {slot.remaining} из {slot.maxPlayers}</div>
              <div>Минимальная бронь: {minPlayers} мест</div>
              {slot.locationLabel && <div>Адрес: {slot.locationLabel}</div>}
            </div>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Закрыть"
            className="w-10 h-10 flex items-center justify-center rounded-full border border-amber-800/40 bg-amber-950/60 text-amber-400 hover:text-amber-200 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110f]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-6">
          {error && (
            <div aria-live="polite" className="border border-red-900/40 bg-red-950/30 text-red-200 text-sm px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          {success && (
            <div aria-live="polite" className="border border-emerald-900/40 bg-emerald-950/30 text-emerald-200 text-sm px-4 py-3 rounded-md">
              Заявка отправлена. Перенаправляем на оплату…
            </div>
          )}

          <div className="space-y-3">
            <label className="text-[11px] uppercase tracking-[0.2em] text-amber-500/80 font-semibold">
              Сюжет
            </label>
            <select
              value={adventureId}
              onChange={(e) => setAdventureId(e.target.value)}
              className="w-full bg-[#0f0d0c] border border-amber-900/40 text-amber-100 px-3 py-2 rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110f]"
            >
              <option value="">Выберите сюжет</option>
              <option value="auto">Подберите мне сюжет</option>
              {adventures.map((adv) => (
                <option key={adv.id} value={adv.id}>
                  {adv.title}
                  {adv.genre ? ` · ${adv.genre}` : ""}
                </option>
              ))}
            </select>
            {selectedAdventure && (
              <div className="text-xs text-amber-400/70">
                {selectedAdventure.genre ?? selectedAdventure.focus}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-[11px] uppercase tracking-[0.2em] text-amber-500/80 font-semibold">
              Тариф
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["standard", "premium"] as Tier[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTier(value)}
                  className={`px-3 py-2 rounded-md border text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110f] ${
                    tier === value
                      ? "bg-amber-700 text-black border-amber-600 shadow-[0_0_12px_rgba(245,158,11,0.35)]"
                      : "bg-[#0f0d0c] border-amber-900/40 text-amber-200/70 hover:border-amber-700/70"
                  }`}
                >
                  {value === "standard" ? "Стандарт" : "Премиум"}
                </button>
              ))}
            </div>
            <div className="text-xs text-amber-400/70">
              {tier === "standard"
                ? "Базовый пакет + помощь с персонажем."
                : "Максимум атмосферы и постановки."}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] uppercase tracking-[0.2em] text-amber-500/80 font-semibold">
              Количество игроков
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handlePlayersChange(players - 1)}
                className="w-9 h-9 rounded-md border border-amber-900/40 text-amber-200 hover:border-amber-700/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110f]"
              >
                –
              </button>
              <div className="min-w-[40px] text-center text-amber-100 text-lg">{players}</div>
              <button
                type="button"
                onClick={() => handlePlayersChange(players + 1)}
                className="w-9 h-9 rounded-md border border-amber-900/40 text-amber-200 hover:border-amber-700/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110f]"
              >
                +
              </button>
              <span className="text-xs text-amber-400/70 ml-2">
                Осталось мест: {slot.remaining}
              </span>
            </div>
            <div className="text-xs text-amber-400/70">
              Минимальная бронь: {minPlayers} мест
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] uppercase tracking-[0.2em] text-amber-500/80 font-semibold">
              Контакты
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Имя"
              className="w-full bg-[#0f0d0c] border border-amber-900/40 text-amber-100 px-3 py-2 rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110f]"
            />
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "telegram", label: "Telegram" },
                { value: "phone", label: "Телефон" },
                { value: "email", label: "Email" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setContactChannel(option.value as typeof contactChannel)}
                  aria-pressed={contactChannel === option.value}
                  className={`px-2 py-2 rounded-md border text-[11px] font-semibold uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110f] ${
                    contactChannel === option.value
                      ? "bg-amber-700 text-black border-amber-600"
                      : "bg-[#0f0d0c] border-amber-900/40 text-amber-200/70 hover:border-amber-700/70"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {contactChannel !== "email" && (
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Телефон или Telegram"
                className="w-full bg-[#0f0d0c] border border-amber-900/40 text-amber-100 px-3 py-2 rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110f]"
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (для подтверждения)"
              className="w-full bg-[#0f0d0c] border border-amber-900/40 text-amber-100 px-3 py-2 rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110f]"
            />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Комментарий, пожелания, опыт"
              rows={3}
              className="w-full bg-[#0f0d0c] border border-amber-900/40 text-amber-100 px-3 py-2 rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110f]"
            />
            <p className="text-xs text-amber-400/70">
              Подтверждение придет на {contactTargetLabel} в течение {`{CONFIRM_TIME}`}.
            </p>
            <label className="flex items-center gap-2 text-xs text-amber-400/70">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="accent-amber-600"
              />
              Соглашаюсь с политикой и офертой
            </label>
          </div>
        </div>

        <div className="border-t border-amber-900/40 px-5 sm:px-6 py-4 space-y-3">
          <div className="text-xs text-amber-300/70 space-y-2">
            <p>Оплата: предоплата {`{DEPOSIT}`} фиксирует слот. Остаток — на месте перед игрой.</p>
            <p>Перенос/отмена: перенос возможен за {`{CANCEL_WINDOW}`} до игры.</p>
            <p>Что включено: ведущий, материалы, реквизит, подготовка сюжета.</p>
          </div>
          <div className="bg-[#0f0d0c]/70 border border-amber-900/30 rounded-md px-4 py-3 text-sm text-amber-200/80">
            <div className="flex justify-between">
              <span>Цена за игрока</span>
              <span>{formatCurrency(perPlayer)} ₽</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Игроков</span>
              <span>{players}</span>
            </div>
            <div className="flex justify-between mt-2 text-amber-200 font-semibold">
              <span>Итого</span>
              <span>{formatCurrency(total)} ₽</span>
            </div>
            <div className="flex justify-between mt-1 text-[11px] text-amber-400/80">
              <span>К оплате сейчас</span>
              <span>{`{DEPOSIT}`}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !isFormValid}
            className="btn btn-primary w-full disabled:opacity-60"
          >
            {isSubmitting ? "Отправляем..." : "Перейти к оплате"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary w-full"
          >
            Отмена
          </button>
        </div>
      </div>
    </>
  );
}
