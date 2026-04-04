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
import PhotoCarousel from "@/components/PhotoCarousel";
import {
  SITE_ADDRESS_LINE,
  SITE_PHONE_DISPLAY,
  SITE_PHONE_TEL,
  getYandexMapEmbedSrc,
} from "@/lib/site-contact";

interface HomeClientProps {
  initialAdventures: Adventure[];
  frontpagePhotos: string[];
  heroPosterUrl: string | null;
}

export default function HomeClient({
  initialAdventures,
  frontpagePhotos,
  heroPosterUrl,
}: HomeClientProps) {
  const router = useRouter();
  const [adventures] = useState<Adventure[]>(initialAdventures);
  const [selectedAdventure, setSelectedAdventure] = useState<Adventure | null>(null);
  
  const pushToSchedule = () => {
    router.push("/schedule#calendar");
  };

  useEffect(() => {
    router.prefetch("/schedule");
    router.prefetch("/adventures");
  }, [router]);

  return (
    <main className="relative min-h-screen text-[#d1c7bc] font-serif selection:bg-amber-900/50 overflow-x-hidden">
      <AtmosphericBackground />

      {/* Блок 1: HERO (Винтажный вид) */}
      <section id="hero" className="pt-20 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 xl:gap-16 items-center">
          <div
            className="min-w-0 transition-opacity duration-500 ease-in-out lg:max-w-xl xl:max-w-2xl"
          >
            <div className="inline-block px-2 sm:px-3 py-1.5 border border-amber-900/50 text-amber-600 text-xs sm:text-sm tracking-[0.3em] uppercase mb-3 sm:mb-4">
              Место твоих лучших историй
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 md:mb-8 leading-[1.1] text-amber-50 shadow-amber-950 text-shadow-sm uppercase tracking-tight break-words max-w-full">
              Испытай свою <br /> фантазию
            </h1>
            <p className="text-base sm:text-lg text-[#8c8279] mb-6 sm:mb-8 md:mb-10 max-w-md leading-relaxed break-words">
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
            <ul className="mt-6 space-y-2 text-sm sm:text-base text-amber-200/80">
              <li className="flex items-start gap-3">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-600" />
                Живые сессии с ведущим: сюжет, актёрка, напряжение.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-600" />
                Подбор по уровню: от новичков до опытных партий.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-600" />
                Безопасная атмосфера: границы проговариваются до игры.
              </li>
            </ul>
          </div>

          {/* Постер справа (~половина ряда по ширине, выше блока текста — см. макет) */}
          <div className="relative min-w-0 flex justify-center lg:justify-end lg:items-center">
            {heroPosterUrl ? (
              <Image
                src={heroPosterUrl}
                alt="Гильдия настольных ролевых игр — постер клуба"
                width={650}
                height={928}
                className="h-auto w-auto max-w-full object-contain rounded-md border border-amber-900/40 shadow-[0_24px_60px_rgba(0,0,0,0.5)] max-h-[min(72vh,540px)] sm:max-h-[min(78vh,620px)] lg:max-h-[min(92vh,900px)] xl:max-h-[min(92vh,960px)]"
                unoptimized
                priority
                sizes="(max-width: 1024px) 92vw, (max-width: 1280px) 45vw, 640px"
              />
            ) : frontpagePhotos.length > 0 ? (
              <div className="w-full max-w-lg mx-auto lg:max-w-none">
                <PhotoCarousel photos={frontpagePhotos} />
              </div>
            ) : null}
          </div>
        </div>

        {/* Карточки-сюжеты в стиле "игровых карт" */}
        <div id="adventures" className="mt-20 sm:mt-28 md:mt-40">
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
              Форматы игры
            </h2>
            <div className="h-[1px] flex-1 bg-amber-900/30"></div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 items-stretch max-w-5xl mx-auto">
            {/* Посиделки в таверне */}
            <div className="flex flex-col relative overflow-hidden bg-gradient-to-b from-[#1a1614] to-[#12100f] border border-amber-800/50 p-5 sm:p-6 rounded-lg shadow-[0_0_30px_rgba(120,83,45,0.2)] hover:shadow-[0_0_45px_rgba(180,120,60,0.3)] transition-all hover:border-amber-700/60 group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-600/10 rounded-bl-full" />
              <div className="relative flex-1 min-h-0 flex flex-col">
                {/* Placeholder для иконки/текстуры: <Image src="/icons/tavern.webp" className="..." /> */}
                <div className="relative w-14 h-14 rounded-xl bg-amber-900/40 border border-amber-700/40 mb-4 flex items-center justify-center text-amber-500 text-2xl shadow-inner flex-shrink-0">
                  🍺
                </div>
                <h3 className="relative min-h-[2.6em] text-base sm:text-lg font-bold text-amber-500 uppercase mb-1 tracking-wide">Посиделки в таверне</h3>
              <p className="relative text-xl sm:text-2xl font-black text-amber-500 mb-1">300 ₽ / час за человека</p>
              <p className="relative text-[0.9rem] text-amber-400/90 mb-4">за 4 часа — 1 200 ₽ с человека</p>
                <div className="relative text-sm text-[#b8b0a8] leading-relaxed space-y-3">
                  <p>
                    Выбирайте приключение, время и приходите со своей компанией играть!
                  </p>
                  <p>
                    Не хватает народу? Напишите — поищем вместе.
                  </p>
                </div>
              </div>
              <button
                onClick={() => pushToSchedule()}
                className="relative mt-4 flex-shrink-0 w-full px-4 py-2.5 bg-amber-700/80 text-black font-bold uppercase text-xs tracking-wider hover:bg-amber-600 transition-all rounded border border-amber-600/50"
                aria-label="Смотреть расписание"
              >
                Расписание
              </button>
            </div>

            {/* Королевский приём */}
            <div className="flex flex-col relative overflow-hidden bg-gradient-to-br from-amber-950/60 via-[#1a1614] to-[#0f0d0c] border-2 border-amber-700/60 p-5 sm:p-6 rounded-xl shadow-[0_0_40px_rgba(180,120,60,0.25),inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_0_60px_rgba(245,158,11,0.35)] transition-all hover:border-amber-600/70 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.08),transparent_50%)]" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/15 rounded-bl-[100px]" />
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-amber-600/10 rounded-tr-[80px]" />
              <div className="relative z-10 flex-1 min-h-0 flex flex-col">
                {/* Placeholder для иконки/текстуры: <Image src="/icons/royal.webp" className="relative z-10 ..." /> */}
                <div className="relative z-10 w-14 h-14 rounded-xl bg-gradient-to-br from-amber-700/50 to-amber-900/50 border-2 border-amber-600/50 mb-4 flex items-center justify-center text-amber-300 text-2xl shadow-lg flex-shrink-0">
                  👑
                </div>
                <h3 className="relative z-10 min-h-[2.6em] text-base sm:text-lg font-bold text-amber-300 uppercase mb-1 tracking-widest drop-shadow-sm">Королевский приём</h3>
              <p className="relative z-10 text-xl sm:text-2xl font-black text-amber-400 mb-1">500 ₽ / час за человека</p>
              <p className="relative z-10 text-[0.9rem] text-amber-300/80 mb-4">за 4 часа — 2 000 ₽ с человека</p>
                <div className="relative z-10 text-sm text-[#c8c0b6] leading-relaxed space-y-3">
                  <p>
                    Когда-нибудь пробовали сливовый пенчекряк на зуб? Хотите узнать, чем пахнет желатиновый куб?
                  </p>
                  <p>
                    Окунитесь в мир ароматов и вкуса — и все пять чувств запомнят эту игру.
                  </p>
                </div>
              </div>
              <button
                onClick={() => pushToSchedule()}
                className="relative z-10 mt-4 flex-shrink-0 w-full px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 text-black font-black uppercase text-xs tracking-widest hover:from-amber-500 hover:to-amber-600 transition-all rounded-lg shadow-[0_4px_14px_rgba(245,158,11,0.4)]"
                aria-label="Смотреть расписание"
              >
                Расписание
              </button>
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
                    href="https://t.me/polygon_rpg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-800/90 hover:text-amber-600 transition-colors"
                  >
                    Telegram
                  </a>
                  <a
                    href="https://discord.gg/polygon"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-800/90 hover:text-amber-600 transition-colors"
                  >
                    Discord
                  </a>
                  <a
                    href="https://vk.com/polygon_rpg"
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
