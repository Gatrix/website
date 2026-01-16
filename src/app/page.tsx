"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import AdventureModal from "@/components/AdventureModal";
import AtmosphericBackground from "@/components/AtmosphericBackground";
import { useAdventures, type Adventure } from "@/hooks/useAdventures";
import AdventuresCarousel from "@/components/AdventuresCarousel";

export default function Home() {
  const router = useRouter();
  const { adventures, loading } = useAdventures();
  const [selectedAdventure, setSelectedAdventure] = useState<Adventure | null>(null);
  const pushToSchedule = (tier?: "standard" | "premium") => {
    const params = new URLSearchParams();
    params.set("view", "calendar");
    if (tier) params.set("tier", tier);
    router.push(`/schedule?${params.toString()}#calendar`);
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
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center">
          <div
            className="transition-opacity duration-500 ease-in-out"
          >
            <div className="inline-block px-2 sm:px-3 py-1 border border-amber-900/50 text-amber-700 text-[9px] sm:text-[10px] tracking-[0.3em] uppercase mb-3 sm:mb-4">
              Испытай свою фантазию
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 md:mb-8 leading-[1.1] text-amber-50 shadow-amber-950 text-shadow-sm uppercase tracking-tight">
              Место твоих <br /> лучших историй
            </h1>
            <p className="text-base sm:text-lg text-[#8c8279] mb-6 sm:mb-8 md:mb-10 max-w-md leading-relaxed">
              НРИ‑сессии в {`{ГОРОД}`}: тёмное фэнтези, партии {`{РАЗМЕР_ГРУППЫ}`} игроков,
              длительность {`{ДЛИТЕЛЬНОСТЬ}`}.
            </p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4">
              <button
                onClick={() => pushToSchedule()}
                className="btn btn-primary group text-sm sm:text-base focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09]"
                aria-label="Записаться на дату"
              >
                <span className="whitespace-nowrap">ЗАПИСАТЬСЯ НА ДАТУ</span>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-2 transition-transform" />
              </button>
              <button
                onClick={() => router.push("/adventures")}
                className="btn btn-secondary group text-sm sm:text-base focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09]"
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
            <p className="mt-4 text-xs text-amber-400/70">
              Оплата после подтверждения слота. Перенос — по правилам клуба, уточним перед записью.
            </p>
          </div>

          {/* Галерея как "старые фото на стене" */}
          <div className="relative group overflow-hidden">
            <div className="absolute -inset-4 bg-amber-900/5 border border-amber-900/20 -rotate-2 group-hover:rotate-0 transition-transform"></div>
            <div className="relative grid grid-cols-2 gap-4">
              <div className="aspect-[4/5] bg-[#1a1614] border border-amber-900/30 overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 shadow-2xl p-2 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]">
                <div className="w-full h-full border border-amber-900/20 flex items-center justify-center text-amber-900/30 text-[10px] uppercase tracking-widest p-4 text-center">
                  Фото зала
                </div>
              </div>
              <div className="grid gap-4">
                <div className="bg-[#1a1614] border border-amber-900/30 aspect-square grayscale hover:grayscale-0 transition-all duration-700 p-2 shadow-xl">
                  <div className="w-full h-full border border-amber-900/20"></div>
                </div>
                <div className="bg-[#1a1614] border border-amber-900/30 aspect-square grayscale hover:grayscale-0 transition-all duration-700 p-2 shadow-xl">
                  <div className="w-full h-full border border-amber-900/20"></div>
                </div>
              </div>
            </div>
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
          {loading ? (
            <div className="text-center py-20">
              <p className="text-amber-600 italic tracking-widest font-serif">Загрузка приключений...</p>
            </div>
          ) : adventures.length > 0 ? (
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

        {/* Тарифы */}
        <div className="mt-16 sm:mt-20 md:mt-24">
          <div className="flex items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
            <div className="h-[1px] flex-1 bg-amber-900/30"></div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] md:tracking-[0.4em] text-amber-800 px-2">
              Тарифы
            </h2>
            <div className="h-[1px] flex-1 bg-amber-900/30"></div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-[#12100f]/90 border border-amber-900/30 p-6 sm:p-8 shadow-[0_0_25px_rgba(120,83,45,0.15)] hover:shadow-[0_0_35px_rgba(180,120,60,0.25)] transition-shadow">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h3 className="text-2xl sm:text-3xl font-bold text-amber-100 uppercase">Стандарт</h3>
                <span className="text-amber-600 text-sm sm:text-base font-black">от … ₽/чел</span>
              </div>
              <p className="text-xs uppercase tracking-[0.25em] text-amber-700/70 mb-4">Подходит новичкам</p>
              <ul className="space-y-3 text-[#8c8279] text-sm sm:text-base">
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-amber-700/80 flex-shrink-0"></span>
                  Игра 4–6 часов
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-amber-700/80 flex-shrink-0"></span>
                  Ведущий мастер
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-amber-700/80 flex-shrink-0"></span>
                  Помощь с персонажем
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-amber-700/80 flex-shrink-0"></span>
                  Реквизит и атмосфера
                </li>
              </ul>
              <button
                onClick={() => pushToSchedule("standard")}
                className="mt-6 w-full px-6 py-3 border-2 border-amber-700/50 text-amber-600 font-black uppercase text-xs sm:text-sm tracking-[0.2em] hover:bg-amber-700 hover:text-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09]"
                aria-label="Выбрать тариф Стандарт"
              >
                Выбрать Стандарт
              </button>
            </div>
            <div className="bg-[#12100f]/90 border border-amber-900/30 p-6 sm:p-8 shadow-[0_0_25px_rgba(120,83,45,0.15)] hover:shadow-[0_0_35px_rgba(180,120,60,0.25)] transition-shadow">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h3 className="text-2xl sm:text-3xl font-bold text-amber-100 uppercase">Премиум</h3>
                <span className="text-amber-600 text-sm sm:text-base font-black">от … ₽/чел</span>
              </div>
              <p className="text-xs uppercase tracking-[0.25em] text-amber-700/70 mb-4">Максимум атмосферы</p>
              <ul className="space-y-3 text-[#8c8279] text-sm sm:text-base">
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-amber-700/80 flex-shrink-0"></span>
                  Всё из “Стандарта”
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-amber-700/80 flex-shrink-0"></span>
                  Ужин и напитки
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-amber-700/80 flex-shrink-0"></span>
                  Усиленная постановка (свет/звук)
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-amber-700/80 flex-shrink-0"></span>
                  Памятные награды
                </li>
              </ul>
              <button
                onClick={() => pushToSchedule("premium")}
                className="mt-6 w-full px-6 py-3 bg-amber-700 text-black font-black uppercase text-xs sm:text-sm tracking-[0.2em] hover:bg-amber-600 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09]"
                aria-label="Выбрать тариф Премиум"
              >
                Выбрать Премиум
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

      <footer className="py-8 sm:py-12 md:py-16 border-t border-amber-900/10 text-center bg-[#0a0908] px-4">
        <div className="mb-4 sm:mb-6 md:mb-8 opacity-20 hover:opacity-100 transition-opacity">
          <Image src="/logos/logo.png" alt="Logo" width={100} height={40} className="mx-auto grayscale invert w-16 sm:w-20 md:w-24 h-auto" />
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