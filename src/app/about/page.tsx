"use client";

import React from "react";
import AtmosphericBackground from "@/components/AtmosphericBackground";
import Image from "next/image";

export default function AboutPage() {
  return (
    <main className="relative min-h-screen text-[#d1c7bc] font-serif selection:bg-amber-900/50 pt-24 pb-12">
      <AtmosphericBackground />

      {/* О Гильдии */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold mb-8 text-amber-50 uppercase tracking-tight">
              О Гильдии <span className="text-amber-800">ПОЛИГОН</span>
            </h1>
            <p className="text-xl text-[#8c8279] mb-8 italic leading-relaxed">
              «Полигон» — это не просто гильдия. Это уютный штаб, где за деревянными столами оживают легенды, а кубики решают судьбы героев.
            </p>
            <div className="space-y-6 text-[#d1c7bc] text-lg">
              <p>
                Мы начали свой путь в небольшом гараже, объединенные любовью к настольным ролевым играм. Сегодня — это пространство, созданное игроками для игроков.
              </p>
              <p>
                Каждый элемент нашего интерьера — от кастомных столов до освещения — был продуман так, чтобы максимально погрузить вас в атмосферу приключения.
              </p>
            </div>
          </div>
          <div className="relative aspect-square bg-[#1a1614] border border-amber-900/30 overflow-hidden shadow-2xl p-4">
             <div className="w-full h-full border border-amber-900/20 flex items-center justify-center text-amber-900/30 text-center uppercase tracking-widest p-8">
                [Фотография нашего пространства]
             </div>
          </div>
        </div>
      </section>

      {/* Мастера Подземелий */}
      <section id="masters" className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto text-center border-t border-amber-900/10">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-12 sm:mb-16 md:mb-24 uppercase tracking-[0.2em] sm:tracking-[0.3em] md:tracking-[0.4em] text-amber-900">Мастера Подземелий</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-12 md:gap-16">
          {[
            { name: "Александр", role: "Мастер Дайсов", quote: "Я не веду игру, я помогаю вам создать легенду, о которой вы будете рассказывать внукам." },
            { name: "Елена", role: "Архитектор Миров", quote: "В моих мирах даже самый маленький выбор имеет последствия, которые могут изменить всё." },
            { name: "Михаил", role: "Хранитель Свитков", quote: "Детали решают всё. Я создаю атмосферу, в которой вы почувствуете вкус победы и горечь поражения." }
          ].map((master, i) => (
            <div key={i} className="group cursor-pointer">
              <div className="relative w-48 sm:w-56 md:w-64 h-60 sm:h-72 md:h-80 mx-auto mb-4 sm:mb-6 md:mb-8 bg-[#1a1614] border border-amber-900/30 p-2 sm:p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-500">
                <div className="w-full h-full bg-[#0f0d0c] grayscale group-hover:grayscale-0 transition-all duration-700 border border-amber-900/10"></div>
                <div className="absolute inset-0 border-4 sm:border-6 md:border-8 border-transparent group-hover:border-amber-900/10 transition-all"></div>
              </div>
              <h4 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-amber-100/80 uppercase">{master.name}</h4>
              <p className="text-amber-700 text-xs mb-2 uppercase tracking-widest font-bold">{master.role}</p>
              <p className="text-[#635a52] italic text-xs sm:text-sm px-4 sm:px-6 md:px-8 font-serif leading-relaxed">
                &ldquo;{master.quote}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="py-8 sm:py-12 md:py-16 border-t border-amber-900/10 text-center bg-[#0a0908] px-4 mt-24">
        <div className="mb-4 sm:mb-6 md:mb-8 opacity-20 hover:opacity-100 transition-opacity">
          <Image src="/logo.png" alt="Logo" width={100} height={40} className="mx-auto grayscale invert w-16 sm:w-20 md:w-24 h-auto" />
        </div>
        <p className="text-amber-900/40 text-[8px] sm:text-[9px] md:text-[10px] tracking-[0.3em] sm:tracking-[0.4em] md:tracking-[0.5em] uppercase">
          &copy; MMXXIV Гильдия ПОЛИГОН &bull; Garage Crafted Experience
        </p>
      </footer>
    </main>
  );
}
