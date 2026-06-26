import React from "react";
import Link from "next/link";
import { SITE_VK_URL } from "@/lib/site-contact";

export default function HomePricingSection() {
  return (
    <div id="formats" className="mt-16 sm:mt-20 md:mt-24 scroll-header-offset max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
        <div className="h-[1px] flex-1 bg-amber-900/30" />
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] md:tracking-[0.4em] text-amber-800 px-2">
          Прайс
        </h2>
        <div className="h-[1px] flex-1 bg-amber-900/30" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch max-w-6xl mx-auto">
        <div className="flex flex-col relative overflow-hidden bg-gradient-to-br from-amber-950/60 via-[#1a1614] to-[#0f0d0c] border-2 border-amber-700/60 p-5 sm:p-6 rounded-xl shadow-[0_0_40px_rgba(180,120,60,0.25),inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_0_60px_rgba(245,158,11,0.35)] transition-all hover:border-amber-600/70 hover:scale-[1.02]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.08),transparent_50%)]" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/15 rounded-bl-[100px]" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-amber-600/10 rounded-tr-[80px]" />
          <div className="relative z-10 flex-1 min-h-0 flex flex-col">
            <h3 className="relative z-10 min-h-[2.6em] text-xl sm:text-2xl font-bold text-amber-300 uppercase mb-1.5 tracking-widest drop-shadow-sm leading-tight">
              ИГРА С МАСТЕРОМ
            </h3>
            <p className="relative z-10 text-sm sm:text-base font-semibold text-amber-400 mb-1">
              300 ₽/ час за человека
            </p>
            <div className="relative z-10 text-body text-sm space-y-3">
              <p>
                Хотите попробовать настольные ролевые игры, но не знаете с чего начать? Или соскучились по
                хорошей сессии, а своего мастера нет?
              </p>
              <p>
                Наш мастер проведёт вас через приключение — от создания персонажа до финальной битвы. Ничего
                заранее знать не нужно: правила объясним за столом.
              </p>
              <ul className="space-y-2 pt-1">
                <li className="flex gap-3">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-500/80 shrink-0" />
                  Группы по 4-6 игроков
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-500/80 shrink-0" />
                  Можно прийти одному — подсадим к компании, либо своей командой
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-500/80 shrink-0" />
                  Готовые приключения на 1 вечер или кампании на несколько встреч
                </li>
              </ul>
            </div>
          </div>
          <Link
            href="/adventures"
            className="relative z-10 mt-4 flex-shrink-0 w-full px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 text-black font-black uppercase text-xs tracking-widest hover:from-amber-500 hover:to-amber-600 transition-all rounded-lg shadow-[0_4px_14px_rgba(245,158,11,0.4)] text-center"
            aria-label="Перейти к приключениям"
          >
            → ВЫБРАТЬ ПРИКЛЮЧЕНИЕ
          </Link>
        </div>

        <div className="flex flex-col relative overflow-hidden bg-gradient-to-b from-[#141312] to-[#0f0d0c] border border-amber-800/45 p-5 sm:p-6 rounded-lg shadow-[0_0_30px_rgba(120,83,45,0.16)] hover:shadow-[0_0_45px_rgba(180,120,60,0.26)] transition-all hover:border-amber-700/60 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-600/10 rounded-bl-full" />
          <div className="relative flex-1 min-h-0 flex flex-col">
            <h3 className="relative min-h-[2.6em] text-xl sm:text-2xl font-bold text-amber-400 uppercase mb-1.5 tracking-wide leading-tight">
              ЗНАКОМСТВО С НРИ
            </h3>
            <p className="relative text-sm sm:text-base font-semibold text-amber-400 mb-1">400 ₽/2 часа за человека</p>
            <div className="relative text-body text-sm space-y-3 mt-2">
              <p>Никогда не играли, но интересно? Это ваш формат.</p>
              <p>
                Короткая ознакомительная сессия специально для новичков: мы покажем, как это устроено, дадим
                готовых персонажей и проведём через небольшое приключение. Без обязательств и без подготовки —
                просто приходите.
              </p>
              <ul className="space-y-2 pt-1">
                <li className="flex gap-3">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-600/80 shrink-0" />
                  Группы новичков по 4–6 человек
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-600/80 shrink-0" />
                  Всё объясним с нуля
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-600/80 shrink-0" />
                  По четвергам в 19:00
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-600/80 shrink-0" />
                  После сессии — скидка 25% на первую «большую» игру
                </li>
              </ul>
            </div>
          </div>
          <a
            href={SITE_VK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="relative mt-4 flex-shrink-0 w-full px-4 py-2.5 bg-amber-700/80 text-black font-bold uppercase text-xs tracking-wider hover:bg-amber-600 transition-all rounded border border-amber-600/50 text-center"
            aria-label="Записаться на знакомство во ВКонтакте"
          >
            → ЗАПИСАТЬСЯ НА ЗНАКОМСТВО
          </a>
        </div>

        <div className="flex flex-col relative overflow-hidden bg-gradient-to-b from-[#1a1614] to-[#12100f] border border-amber-800/50 p-5 sm:p-6 rounded-lg shadow-[0_0_30px_rgba(120,83,45,0.2)] hover:shadow-[0_0_45px_rgba(180,120,60,0.3)] transition-all hover:border-amber-700/60 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-600/10 rounded-bl-full" />
          <div className="relative flex-1 min-h-0 flex flex-col">
            <h3 className="relative min-h-[2.6em] text-xl sm:text-2xl font-bold text-amber-500 uppercase mb-1.5 tracking-wide leading-tight">
              АРЕНДА КЛУБА
            </h3>
            <p className="relative text-sm sm:text-base font-semibold text-amber-500 mb-1">600 ₽/ час за всё помещение</p>
            <div className="relative text-body text-sm space-y-3">
              <p>У вас своя компания и свой мастер? Забирайте стол — а мы позаботимся об остальном.</p>
              <ul className="space-y-2">
                <li className="flex gap-3">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-600/80 shrink-0" />
                  Отдельный стол до 8 человек в тематическом зале
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-600/80 shrink-0" />
                  Цифровая библиотека рулбуков D&amp;D 5e, Pathfinder, Call of Cthulhu и других систем
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-600/80 shrink-0" />
                  Вам также доступны продвинутые формы управления светом и звуком, а также платформа Foundry VTT
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-600/80 shrink-0" />
                  Физический реквизит в комплекте: наборы дайсов, карты, маркеры, поле для миниатюр
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-600/80 shrink-0" />
                  Чай, кофе, вода, снеки, холодильник, микроволновка — без ограничений
                </li>
              </ul>
            </div>
          </div>
          <a
            href={SITE_VK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="relative mt-4 flex-shrink-0 w-full px-4 py-2.5 bg-amber-700/80 text-black font-bold uppercase text-xs tracking-wider hover:bg-amber-600 transition-all rounded border border-amber-600/50 text-center"
            aria-label="Забронировать стол во ВКонтакте"
          >
            → ЗАБРОНИРОВАТЬ СТОЛ
          </a>
        </div>
      </div>
    </div>
  );
}
