"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import AdventureModal from "@/components/AdventureModal";
import AtmosphericBackground from "@/components/AtmosphericBackground";
import FAQSection from "@/components/FAQSection";
import type { Adventure } from "@/hooks/useAdventures";
import AdventuresCarousel from "@/components/AdventuresCarousel";
import {
  SITE_ADDRESS_LINE,
  SITE_PHONE_DISPLAY,
  SITE_PHONE_TEL,
  getYandexMapEmbedSrc,
} from "@/lib/site-contact";

interface HomeClientProps {
  initialAdventures: Adventure[];
  tablePhotoUrl: string | null;
}

export default function HomeClient({
  initialAdventures,
  tablePhotoUrl,
}: HomeClientProps) {
  const router = useRouter();
  const [adventures] = useState<Adventure[]>(initialAdventures);
  const [selectedAdventure, setSelectedAdventure] = useState<Adventure | null>(null);
  
  const goToAdventures = () => {
    router.push("/adventures");
  };

  useEffect(() => {
    router.prefetch("/schedule");
    router.prefetch("/adventures");
  }, [router]);

  return (
    <main className="relative min-h-screen text-[#d1c7bc] font-fantasy-sans selection:bg-amber-900/50 overflow-x-hidden">
      <AtmosphericBackground />

      {/* Блок 1: HERO (Винтажный вид) */}
      <section
        id="hero"
        className="pt-16 sm:pt-20 md:pt-24 pb-10 sm:pb-12 md:pb-16 px-4 sm:px-6 max-w-7xl mx-auto"
      >
        <div className="min-w-0 transition-opacity duration-500 ease-in-out">
          <div className="max-w-4xl">
            <div className="inline-block px-2 sm:px-3 py-1.5 border border-amber-900/50 text-amber-600 text-xs sm:text-sm tracking-[0.3em] uppercase mb-3 sm:mb-4">
              Место твоих лучших историй
            </div>
            <h1 className="font-fantasy-serif text-3xl sm:text-4xl md:text-[2.75rem] lg:text-6xl xl:text-7xl font-bold mb-3 sm:mb-4 md:mb-5 leading-[1.05] text-amber-50 shadow-amber-950 text-shadow-sm uppercase tracking-tight break-words max-w-full">
              <span className="hidden md:inline whitespace-nowrap">Испытай свою фантазию</span>
              <span className="md:hidden">Испытай свою фантазию</span>
            </h1>
            <p className="text-base sm:text-lg text-[#c8c0b6] mb-5 sm:mb-6 md:mb-7 leading-relaxed break-words">
              Офлайн-клуб настольных ролевых игр в Красноярске. Играем в D&D, Зов Ктулху и другие системы. Приходи один или с компанией — научим, покажем, дадим кубики.
            </p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4">
              <button
                onClick={() => router.push("/adventures")}
                className="btn btn-primary group text-sm sm:text-base focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09]"
                aria-label="Выбрать приключение"
              >
                <span className="whitespace-nowrap">ВЫБРАТЬ ПРИКЛЮЧЕНИЕ</span>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {tablePhotoUrl ? (
          <div className="mt-7 sm:mt-8 md:mt-10">
            <div className="relative w-full overflow-hidden rounded-lg border border-amber-900/35 bg-[#12100f] shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
              <Image
                src={tablePhotoUrl}
                alt="Игровой стол в клубе"
                width={1600}
                height={900}
                className="w-full h-auto object-cover"
                unoptimized
                priority
                sizes="(max-width: 768px) 92vw, (max-width: 1280px) 90vw, 1200px"
              />
            </div>
          </div>
        ) : null}

        {/* Карточки-сюжеты в стиле "игровых карт" */}
        <div id="adventures" className="mt-16 sm:mt-20 md:mt-28">
          <div className="flex items-center gap-2 sm:gap-4 mb-8 sm:mb-10 md:mb-12">
            <div className="h-[1px] flex-1 bg-amber-900/30"></div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] md:tracking-[0.4em] text-amber-800 px-2">Время Приключений</h2>
            <div className="h-[1px] flex-1 bg-amber-900/30"></div>
          </div>
          
          {/* Карусель карточек со стрелками и drag */}
          {adventures.length > 0 ? (
            <AdventuresCarousel 
              adventures={adventures} 
              onAdventureClick={(adv) => setSelectedAdventure(adv)}
              isPaused={!!selectedAdventure}
            />
          ) : (
            <div className="text-center py-20">
              <p className="text-amber-600 italic tracking-widest font-serif">Приключения не найдены</p>
            </div>
          )}
        </div>

        {/* Сегменты формата игры */}
        <div className="mt-16 sm:mt-20 md:mt-24">
          <div className="flex items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
            <div className="h-[1px] flex-1 bg-amber-900/30"></div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] md:tracking-[0.4em] text-amber-800 px-2">
              Форматы
            </h2>
            <div className="h-[1px] flex-1 bg-amber-900/30"></div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch max-w-6xl mx-auto">
            {/* Аренда клуба */}
            <div className="flex flex-col relative overflow-hidden bg-gradient-to-b from-[#1a1614] to-[#12100f] border border-amber-800/50 p-5 sm:p-6 rounded-lg shadow-[0_0_30px_rgba(120,83,45,0.2)] hover:shadow-[0_0_45px_rgba(180,120,60,0.3)] transition-all hover:border-amber-700/60 group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-600/10 rounded-bl-full" />
              <div className="relative flex-1 min-h-0 flex flex-col">
                {/* Placeholder для иконки/текстуры: <Image src="/icons/tavern.webp" className="..." /> */}
                <div className="relative w-14 h-14 rounded-xl bg-amber-900/40 border border-amber-700/40 mb-4 flex items-center justify-center text-amber-500 text-2xl shadow-inner flex-shrink-0">
                  🏠
                </div>
                <h3 className="relative min-h-[2.6em] text-base sm:text-lg font-bold text-amber-500 uppercase mb-1 tracking-wide">
                  АРЕНДА КЛУБА
                </h3>
                <p className="relative text-xl sm:text-2xl font-black text-amber-500 mb-1">
                  2 000 ₽ за слот <span className="text-amber-400/70 font-black">·</span> 4 часа
                </p>
                <div className="relative text-sm text-[#b8b0a8] leading-relaxed space-y-3">
                  <p className="text-[#c8c0b6]">
                    У вас своя компания и свой мастер? Забирайте стол — а мы позаботимся об остальном.
                  </p>
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
                      Вам также доступны продвинутые формы управления светом, звуком, а также платформа Foundry VTT
                    </li>
                    <li className="flex gap-3">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-600/80 shrink-0" />
                      Физический реквизит в комплекте: наборы дайсов, карты, маркеры, поле для миниатюр
                    </li>
                    <li className="flex gap-3">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-600/80 shrink-0" />
                      Чай, кофе, вода, снеки, холодильник, микроволновка — без ограничений
                    </li>
                    <li className="flex gap-3">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-600/80 shrink-0" />
                      Продление: 400 ₽/час
                    </li>
                  </ul>
                </div>
              </div>
              <a
                href="https://t.me/gatriks"
                target="_blank"
                rel="noopener noreferrer"
                className="relative mt-4 flex-shrink-0 w-full px-4 py-2.5 bg-amber-700/80 text-black font-bold uppercase text-xs tracking-wider hover:bg-amber-600 transition-all rounded border border-amber-600/50 text-center"
                aria-label="Забронировать стол в Telegram"
              >
                → ЗАБРОНИРОВАТЬ СТОЛ
              </a>
            </div>

            {/* Игра с клубным мастером */}
            <div className="flex flex-col relative overflow-hidden bg-gradient-to-br from-amber-950/60 via-[#1a1614] to-[#0f0d0c] border-2 border-amber-700/60 p-5 sm:p-6 rounded-xl shadow-[0_0_40px_rgba(180,120,60,0.25),inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_0_60px_rgba(245,158,11,0.35)] transition-all hover:border-amber-600/70 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.08),transparent_50%)]" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/15 rounded-bl-[100px]" />
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-amber-600/10 rounded-tr-[80px]" />
              <div className="relative z-10 flex-1 min-h-0 flex flex-col">
                {/* Placeholder для иконки/текстуры: <Image src="/icons/royal.webp" className="relative z-10 ..." /> */}
                <div className="relative z-10 w-14 h-14 rounded-xl bg-gradient-to-br from-amber-700/50 to-amber-900/50 border-2 border-amber-600/50 mb-4 flex items-center justify-center text-amber-300 text-2xl shadow-lg flex-shrink-0">
                  👑
                </div>
                <h3 className="relative z-10 min-h-[2.6em] text-base sm:text-lg font-bold text-amber-300 uppercase mb-1 tracking-widest drop-shadow-sm">
                  ИГРА С КЛУБНЫМ МАСТЕРОМ
                </h3>
                <p className="relative z-10 text-xl sm:text-2xl font-black text-amber-400 mb-1">
                  1 600 ₽ с человека <span className="text-amber-300/70 font-black">·</span> 4 часа
                </p>
                <div className="relative z-10 text-sm text-[#c8c0b6] leading-relaxed space-y-3">
                  <p>
                    Хотите попробовать настольные ролевые игры, но не знаете с чего начать? Или соскучились по хорошей сессии, а своего мастера нет?
                  </p>
                  <p>
                    Наш мастер проведёт вас через приключение — от создания персонажа до финальной битвы. Ничего заранее знать не нужно: правила объясним за столом (есть упрощенная одностраничная система), персонажей поможем собрать.
                  </p>
                  <ul className="space-y-2 pt-1">
                    <li className="flex gap-3">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-500/80 shrink-0" />
                      Группы от 4 до 6 игроков
                    </li>
                    <li className="flex gap-3">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-500/80 shrink-0" />
                      Можно прийти одному — подсадим к компании, либо своей командой
                    </li>
                    <li className="flex gap-3">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-500/80 shrink-0" />
                      Готовые приключения на 1 вечер или кампании на несколько встреч
                    </li>
                    <li className="flex gap-3">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-500/80 shrink-0" />
                      Продление: 400 ₽/час
                    </li>
                  </ul>
                </div>
              </div>
              <button
                onClick={() => goToAdventures()}
                className="relative z-10 mt-4 flex-shrink-0 w-full px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 text-black font-black uppercase text-xs tracking-widest hover:from-amber-500 hover:to-amber-600 transition-all rounded-lg shadow-[0_4px_14px_rgba(245,158,11,0.4)]"
                aria-label="Перейти к приключениям"
              >
                → ВЫБРАТЬ ПРИКЛЮЧЕНИЕ
              </button>
            </div>

            {/* Знакомство с НРИ */}
            <div className="flex flex-col relative overflow-hidden bg-gradient-to-b from-[#141312] to-[#0f0d0c] border border-amber-800/45 p-5 sm:p-6 rounded-lg shadow-[0_0_30px_rgba(120,83,45,0.16)] hover:shadow-[0_0_45px_rgba(180,120,60,0.26)] transition-all hover:border-amber-700/60 group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-600/10 rounded-bl-full" />
              <div className="relative flex-1 min-h-0 flex flex-col">
                <div className="relative w-14 h-14 rounded-xl bg-amber-900/35 border border-amber-700/35 mb-4 flex items-center justify-center text-amber-400 text-2xl shadow-inner flex-shrink-0">
                  🎲
                </div>
                <h3 className="relative min-h-[2.6em] text-base sm:text-lg font-bold text-amber-400 uppercase mb-1 tracking-wide">
                  ЗНАКОМСТВО С НРИ
                </h3>
                <p className="relative text-xl sm:text-2xl font-black text-amber-400 mb-1">
                  500 ₽ с человека <span className="text-amber-300/70 font-black">·</span> 2–3 часа
                </p>
                <div className="relative text-sm text-[#c8c0b6] leading-relaxed space-y-3 mt-2">
                  <p className="text-[#c8c0b6]">
                    Никогда не играли, но интересно? Это ваш формат.
                  </p>
                  <p>
                    Короткая ознакомительная сессия специально для новичков: мы покажем, как это устроено, дадим готовых персонажей и проведём через небольшое приключение. Без обязательств и без подготовки — просто приходите.
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
                href="https://t.me/gatriks"
                target="_blank"
                rel="noopener noreferrer"
                className="relative mt-4 flex-shrink-0 w-full px-4 py-2.5 bg-amber-700/80 text-black font-bold uppercase text-xs tracking-wider hover:bg-amber-600 transition-all rounded border border-amber-600/50 text-center"
                aria-label="Записаться на знакомство в Telegram"
              >
                → ЗАПИСАТЬСЯ НА ЗНАКОМСТВО
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Пространство — текстовый блок как на макете */}
      <section className="py-16 sm:py-20 md:py-28 bg-[#0a0908] border-y border-red-950/25">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-left">
          <div className="h-px w-full bg-red-950/50 mb-8 sm:mb-10" aria-hidden />
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-bold uppercase tracking-[0.06em] sm:tracking-[0.1em] text-[#f5f0e6] leading-tight mb-6 sm:mb-8 md:mb-10">
            Пространство, где время замирает
          </h2>
          <div className="font-sans text-[#c4bcb2] text-base sm:text-lg leading-relaxed space-y-5 sm:space-y-6">
            <p>
              Динамичное освещение, аудиальное сопровождение, тактильные декорации и атмосфера приключения
              обеспечат полное погружение.
            </p>
            <p>
              Мы не бежим от реального мира за ширму воображения. Мы создаем новый опыт в воображении, чтобы сделать
              нашу реальную жизнь богаче.
            </p>
          </div>
          <div className="h-px w-full bg-red-950/50 mt-10 sm:mt-12 md:mt-14" aria-hidden />
        </div>
      </section>

      <FAQSection />

      <section
        id="contacts"
        className="py-16 sm:py-24 md:py-32 bg-[#0a0908] border-t border-amber-950/80"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 sm:gap-6 mb-12 sm:mb-16 md:mb-20">
            <div className="h-px flex-1 bg-amber-800/45" />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold uppercase tracking-[0.22em] sm:tracking-[0.3em] text-amber-800/90 font-serif px-2 text-center shrink-0">
              Контакты
            </h2>
            <div className="h-px flex-1 bg-amber-800/45" />
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-20 items-start">
            <div className="space-y-10 sm:space-y-12 text-left">
              <div>
                <h3 className="font-sans text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-amber-600/85 mb-3">
                  Адрес
                </h3>
                <p className="font-serif text-base sm:text-lg md:text-xl text-[#fde047] leading-relaxed drop-shadow-[0_0_20px_rgba(253,224,71,0.12)]">
                  {SITE_ADDRESS_LINE}
                </p>
              </div>

              <div>
                <h3 className="font-sans text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-amber-600/85 mb-3">
                  Телефон
                </h3>
                <a
                  href={`tel:${SITE_PHONE_TEL}`}
                  className="font-serif text-base sm:text-lg md:text-xl text-[#fde047] hover:text-yellow-200 transition-colors drop-shadow-[0_0_20px_rgba(253,224,71,0.12)]"
                >
                  {SITE_PHONE_DISPLAY}
                </a>
              </div>

              <div>
                <h3 className="font-sans text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-amber-600/85 mb-4">
                  Ссылки
                </h3>
                <div className="flex flex-wrap gap-x-8 gap-y-3 font-sans text-sm sm:text-base font-semibold">
                  <a
                    href="https://t.me/gatriks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-800/90 hover:text-amber-600 transition-colors"
                  >
                    Telegram
                  </a>
                  <a
                    href="https://t.me/gatriks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-800/90 hover:text-amber-600 transition-colors"
                  >
                    Discord
                  </a>
                  <a
                    href="https://t.me/gatriks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-800/90 hover:text-amber-600 transition-colors"
                  >
                    ВКонтакте
                  </a>
                </div>
              </div>
            </div>

            <div className="w-full min-h-[320px] sm:min-h-[380px] lg:min-h-[420px] rounded-lg overflow-hidden border border-amber-900/35 bg-[#12100f] shadow-[0_0_40px_rgba(0,0,0,0.35)]">
              <iframe
                src={getYandexMapEmbedSrc()}
                title="Клуб НРИ ПОЛИГОН на карте"
                className="w-full h-full min-h-[320px] sm:min-h-[380px] lg:min-h-[420px]"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      <footer className="py-6 border-t border-amber-900/10 text-center bg-[#080706] px-4">
        <p className="text-amber-900/35 text-[8px] sm:text-[9px] md:text-[10px] tracking-[0.25em] sm:tracking-[0.35em] uppercase">
          &copy; MMXXIV Гильдия ПОЛИГОН &bull; Garage Crafted Experience
        </p>
      </footer>

      {/* Модальное окно приключения */}
      <AdventureModal
        adventure={selectedAdventure}
        isOpen={!!selectedAdventure}
        onClose={() => setSelectedAdventure(null)}
        onPrevious={() => {
          if (!selectedAdventure || adventures.length === 0) return;
          const currentIndex = adventures.findIndex(a => a.id === selectedAdventure.id);
          const previousIndex = currentIndex > 0 ? currentIndex - 1 : adventures.length - 1;
          setSelectedAdventure(adventures[previousIndex]);
        }}
        onNext={() => {
          if (!selectedAdventure || adventures.length === 0) return;
          const currentIndex = adventures.findIndex(a => a.id === selectedAdventure.id);
          const nextIndex = currentIndex < adventures.length - 1 ? currentIndex + 1 : 0;
          setSelectedAdventure(adventures[nextIndex]);
        }}
        hasPrevious={adventures.length > 1}
        hasNext={adventures.length > 1}
      />
    </main>
  );
}
