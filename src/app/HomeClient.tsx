"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdventureModal from "@/components/AdventureModal";
import type { Adventure } from "@/lib/db";
import AdventuresCarousel from "@/components/AdventuresCarousel";
import HeroFrontpageCarousel from "@/components/HeroFrontpageCarousel";
import { scrollToContacts } from "@/lib/scroll-to-contacts";
import { scrollToFormats } from "@/lib/scroll-to-formats";

export type HeroCarouselSlide = { src: string; alt: string };

interface HomeClientProps {
  initialAdventures: Adventure[];
  heroCarouselSlides: HeroCarouselSlide[];
  signUpButtonImageUrl: string | null;
}

export default function HomeClient({
  initialAdventures,
  heroCarouselSlides,
  signUpButtonImageUrl,
}: HomeClientProps) {
  const router = useRouter();
  const [adventures] = useState<Adventure[]>(initialAdventures);
  const [selectedAdventure, setSelectedAdventure] = useState<Adventure | null>(null);

  useEffect(() => {
    router.prefetch("/adventures");
  }, [router]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash !== "#contacts" && hash !== "#formats") return;
    const frame = requestAnimationFrame(() => {
      if (hash === "#contacts") scrollToContacts("auto");
      else if (hash === "#formats") scrollToFormats("auto");
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      <section
        id="hero"
        className="page-header-offset pb-10 sm:pb-12 md:pb-16 px-4 sm:px-6 max-w-7xl mx-auto"
      >
        <div className="mx-auto w-[85%] max-w-full">
          <div className="min-w-0 transition-opacity duration-500 ease-in-out text-center">
            <h1 className="font-fantasy-serif text-3xl sm:text-4xl md:text-[2.75rem] lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-5 leading-[1.05] text-amber-100 drop-shadow-[0_0_20px_rgba(253,224,71,0.35)] uppercase tracking-tight break-words max-w-full">
              <span className="hidden md:inline whitespace-nowrap">Испытай свою фантазию</span>
              <span className="md:hidden">Испытай свою фантазию</span>
            </h1>
            {signUpButtonImageUrl ? (
              <Link
                href="/adventures"
                className="group block w-full md:w-1/2 mx-auto mb-5 sm:mb-6 md:mb-7 bg-transparent border-0 p-0 cursor-pointer rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/90 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0a0d]"
                aria-label="Записаться на игру — перейти на страницу приключений"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={signUpButtonImageUrl}
                  alt="Записаться на игру"
                  className="block w-full h-auto transition-[filter] duration-300 group-hover:brightness-[1.28] group-hover:contrast-110 group-hover:saturate-110 group-active:brightness-[1.35]"
                  decoding="async"
                  fetchPriority="high"
                />
              </Link>
            ) : (
              <Link
                href="/adventures"
                className="group relative w-full md:w-1/2 mx-auto mb-5 sm:mb-6 md:mb-7 rounded-xl sm:rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/90 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0a0d] transition-transform duration-300 active:scale-[0.99] block"
                aria-label="Записаться на игру — перейти на страницу приключений"
              >
                <span className="relative flex w-full items-center justify-center overflow-hidden rounded-xl sm:rounded-2xl border-2 border-amber-500/55 bg-gradient-to-b from-amber-500 via-amber-600 to-amber-800 px-5 py-4 sm:py-5 md:py-6 shadow-[0_0_40px_rgba(245,158,11,0.35)] transition-all duration-300 group-hover:border-amber-400/80 group-hover:shadow-[0_0_55px_rgba(245,158,11,0.5)]">
                  <span
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.22),transparent_55%)]"
                    aria-hidden
                  />
                  <span className="relative font-fantasy-sans text-lg sm:text-xl md:text-2xl font-black uppercase tracking-[0.12em] sm:tracking-[0.18em] text-[#1a1208] drop-shadow-[0_1px_0_rgba(255,255,255,0.35)]">
                    ЗАПИСАТЬСЯ НА ИГРУ!
                  </span>
                </span>
              </Link>
            )}
            <p className="text-body text-base sm:text-lg mb-5 sm:mb-6 md:mb-7 break-words text-amber-100/85">
              Офлайн-клуб настольных ролевых игр в Красноярске. Играем в D&D, Зов Ктулху и другие системы. Приходи один или с компанией — научим, покажем, дадим кубики. А еще у нас есть маскот - бородатая агама Феникс. Впрочем, все зовут его Феня, недорос пока до крутых прозвищ!
            </p>
          </div>

          <HeroFrontpageCarousel slides={heroCarouselSlides} />
        </div>

        <div id="adventures" className="mt-16 sm:mt-20 md:mt-28 scroll-header-offset">
          <div className="flex items-center gap-2 sm:gap-4 mb-8 sm:mb-10 md:mb-12">
            <div className="h-[1px] flex-1 bg-amber-900/30" />
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] md:tracking-[0.4em] text-amber-800 px-2">
              Время Приключений
            </h2>
            <div className="h-[1px] flex-1 bg-amber-900/30" />
          </div>

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
      </section>

      <AdventureModal
        adventure={selectedAdventure}
        isOpen={!!selectedAdventure}
        onClose={() => setSelectedAdventure(null)}
        onPrevious={() => {
          if (!selectedAdventure || adventures.length === 0) return;
          const currentIndex = adventures.findIndex((a) => a.id === selectedAdventure.id);
          const previousIndex = currentIndex > 0 ? currentIndex - 1 : adventures.length - 1;
          setSelectedAdventure(adventures[previousIndex]);
        }}
        onNext={() => {
          if (!selectedAdventure || adventures.length === 0) return;
          const currentIndex = adventures.findIndex((a) => a.id === selectedAdventure.id);
          const nextIndex = currentIndex < adventures.length - 1 ? currentIndex + 1 : 0;
          setSelectedAdventure(adventures[nextIndex]);
        }}
        hasPrevious={adventures.length > 1}
        hasNext={adventures.length > 1}
      />
    </>
  );
}
