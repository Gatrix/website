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

interface HomeClientProps {
  initialAdventures: Adventure[];
  frontpagePhotos: string[];
}

export default function HomeClient({ initialAdventures, frontpagePhotos }: HomeClientProps) {
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
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 md:gap-16 lg:gap-x-12 xl:gap-x-16 items-start">
          <div
            className="min-w-0 transition-opacity duration-500 ease-in-out"
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

          {/* Карусель фотографий */}
          <div className="relative min-w-0">
            <PhotoCarousel photos={frontpagePhotos} />
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
          <div className="grid gap-6 sm:grid-cols-3 items-stretch">
            {/* 1. Городская площадь — базовая карточка */}
            <div className="flex flex-col bg-[#12100f]/95 border border-amber-900/40 p-5 sm:p-6 rounded-lg transition-all hover:border-amber-800/50">
              <div className="flex-1 min-h-0 flex flex-col">
                {/* Placeholder для иконки: замените на <Image src="/icons/city-square.webp" ... /> или свою картинку */}
                <div className="w-14 h-14 rounded-xl bg-amber-900/30 border border-amber-800/30 mb-4 flex items-center justify-center text-amber-600/70 text-2xl flex-shrink-0">
                  🏛
                </div>
                <h3 className="min-h-[2.6em] text-base sm:text-lg font-bold text-amber-600 uppercase mb-1 tracking-wide">Городская площадь</h3>
              <p className="text-xl sm:text-2xl font-black text-amber-600 mb-1">300 ₽ / час за человека</p>
              <p className="text-[0.9rem] text-amber-500/90 mb-4">за 6 часов — 1 800 ₽ с человека</p>
                <p className="text-sm text-[#8c8279] leading-relaxed">
                  Игры, выбираемые клубом на конкретный день недели. Записываются все желающие. За свободным столом — один таймлайн и вселенная. Классичная НРИ: зачистка подземелья или выполнение квеста.
                </p>
              </div>
              <button
                onClick={() => pushToSchedule()}
                className="mt-4 flex-shrink-0 w-full px-4 py-2.5 border border-amber-700/50 text-amber-600 font-semibold uppercase text-xs tracking-wider hover:bg-amber-900/40 transition-all rounded"
                aria-label="Смотреть расписание"
              >
                Расписание
              </button>
            </div>

            {/* 2. Посиделки в таверне — красивенькая карточка */}
            <div className="flex flex-col relative overflow-hidden bg-gradient-to-b from-[#1a1614] to-[#12100f] border border-amber-800/50 p-5 sm:p-6 rounded-lg shadow-[0_0_30px_rgba(120,83,45,0.2)] hover:shadow-[0_0_45px_rgba(180,120,60,0.3)] transition-all hover:border-amber-700/60 group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-600/10 rounded-bl-full" />
              <div className="relative flex-1 min-h-0 flex flex-col">
                {/* Placeholder для иконки/текстуры: <Image src="/icons/tavern.webp" className="..." /> */}
                <div className="relative w-14 h-14 rounded-xl bg-amber-900/40 border border-amber-700/40 mb-4 flex items-center justify-center text-amber-500 text-2xl shadow-inner flex-shrink-0">
                  🍺
                </div>
                <h3 className="relative min-h-[2.6em] text-base sm:text-lg font-bold text-amber-500 uppercase mb-1 tracking-wide">Посиделки в таверне</h3>
              <p className="relative text-xl sm:text-2xl font-black text-amber-500 mb-1">500 ₽ / час за человека</p>
              <p className="relative text-[0.9rem] text-amber-400/90 mb-4">за 6 часов — 3 000 ₽ с человека</p>
                <p className="relative text-sm text-[#b8b0a8] leading-relaxed">
                  Стандартный вариант. Игроки сами выбирают приключение и дату. Часто это уже знакомые группы. Ваш стол, ваш сюжет, ваша компания.
                </p>
              </div>
              <button
                onClick={() => pushToSchedule()}
                className="relative mt-4 flex-shrink-0 w-full px-4 py-2.5 bg-amber-700/80 text-black font-bold uppercase text-xs tracking-wider hover:bg-amber-600 transition-all rounded border border-amber-600/50"
                aria-label="Смотреть расписание"
              >
                Расписание
              </button>
            </div>

            {/* 3. Королевский приём — суперкрасивая карточка */}
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
              <p className="relative z-10 text-xl sm:text-2xl font-black text-amber-400 mb-1">700 ₽ / час за человека</p>
              <p className="relative z-10 text-[0.9rem] text-amber-300/80 mb-4">за 6 часов — 4 200 ₽ с человека</p>
                <p className="relative z-10 text-sm text-[#c8c0b6] leading-relaxed">
                  Всё из стандарта плюс работа с запахами и тематическое питание с учётом сюжета игры и предпочтений игроков.
                </p>
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

      {/* Блок 2: Особенности (Гаражный уют) */}
      <section className="py-16 sm:py-24 md:py-32 bg-[#0c0a09] border-y border-amber-950 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-8 sm:gap-12 md:gap-20 items-center">
          <div className="order-2 md:order-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-amber-900/5 -rotate-3 border border-amber-900/20"></div>
            <div className="relative aspect-video bg-[#1a1614] border-4 sm:border-6 md:border-8 border-[#26211e] shadow-2xl flex items-center justify-center italic text-amber-900/20 text-xs sm:text-sm md:text-base px-4">
              [Атмосферное видео из гильдии]
            </div>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 md:mb-8 text-amber-100 uppercase leading-tight">
              Пространство, <br /> где время замирает
            </h2>
            <div className="space-y-4 sm:space-y-6 text-[#8c8279] text-base sm:text-lg leading-relaxed">
              <p>
                Мы сами строили это место. Каждый стол пахнет деревом, а каждый светильник настроен так, чтобы вы забыли о внешнем мире.
              </p>
              <ul className="space-y-3 sm:space-y-4">
                <li className="flex gap-3 sm:gap-4 items-center">
                  <div className="w-2 h-2 bg-amber-700 rounded-full flex-shrink-0"></div>
                  <span>Кастомные столы для больших компаний</span>
                </li>
                <li className="flex gap-3 sm:gap-4 items-center">
                  <div className="w-2 h-2 bg-amber-700 rounded-full flex-shrink-0"></div>
                  <span>Звуковая система 360° для погружения</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Мастера гильдии */}
      <section className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 sm:gap-4 mb-8 sm:mb-12">
          <div className="h-[1px] flex-1 bg-amber-900/30" />
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-amber-800 px-2">
            Мастера гильдии
          </h2>
          <div className="h-[1px] flex-1 bg-amber-900/30" />
        </div>
        <p className="text-center text-[#8c8279] mb-10 max-w-2xl mx-auto">
          Игроки выбирают людей. Знакомьтесь с нашими ведущими и их любимыми системами.
        </p>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center p-6 rounded-lg border border-amber-900/30 bg-[#12100f]/50 hover:border-amber-800/40 transition-colors"
            >
              <div className="w-24 h-24 rounded-full bg-amber-900/30 border-2 border-amber-800/40 mb-4 flex items-center justify-center text-amber-700/50 text-2xl font-bold">
                ?
              </div>
              <h3 className="text-lg font-bold text-amber-100 uppercase mb-2">Мастер {i}</h3>
              <p className="text-sm text-amber-600/80">D&D 5e, Зов Ктулху и др.</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <FAQSection />

      {/* Контакты и карта */}
      <section id="contacts" className="py-16 sm:py-24 md:py-32 bg-[#0c0a09] border-y border-amber-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-4 mb-8 sm:mb-12">
            <div className="h-[1px] flex-1 bg-amber-900/30" />
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-amber-800 px-2">
              Контакты
            </h2>
            <div className="h-[1px] flex-1 bg-amber-900/30" />
          </div>
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="space-y-6">
              <div>
                <h3 className="text-amber-400/90 text-xs uppercase tracking-widest mb-2">Адрес</h3>
                <p className="text-amber-100 text-lg">Красноярск, ул. Примерная, д. 1</p>
                <p className="text-[#8c8279] text-sm mt-1">Фото входа — скоро</p>
              </div>
              <div>
                <h3 className="text-amber-400/90 text-xs uppercase tracking-widest mb-2">Ссылки</h3>
                <div className="flex gap-4">
                  <a
                    href="https://t.me/polygon_rpg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 hover:text-amber-500 transition-colors"
                  >
                    Telegram
                  </a>
                  <a
                    href="https://vk.com/polygon_rpg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 hover:text-amber-500 transition-colors"
                  >
                    ВКонтакте
                  </a>
                </div>
              </div>
            </div>
            <div className="aspect-video bg-[#1a1614] border border-amber-900/30 rounded-lg overflow-hidden flex items-center justify-center">
              <p className="text-amber-900/40 text-sm italic">Яндекс.Карта — укажите координаты</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-8 sm:py-12 md:py-16 border-t border-amber-900/10 text-center bg-[#0a0908] px-4">
        <div className="mb-4 sm:mb-6 md:mb-8 opacity-20 hover:opacity-100 transition-opacity">
          <Image src="/globe.svg" alt="Logo" width={100} height={40} className="mx-auto grayscale invert w-16 sm:w-20 md:w-24 h-auto" />
        </div>
        <p className="text-amber-900/40 text-[8px] sm:text-[9px] md:text-[10px] tracking-[0.3em] sm:tracking-[0.4em] md:tracking-[0.5em] uppercase">
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
