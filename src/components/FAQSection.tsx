"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqItems = [
  {
    q: "Нужно ли знать правила?",
    a: "Не обязательно. Мы научим основам на месте. Большинство наших игр подходят новичкам — ведущий объяснит всё по ходу.",
  },
  {
    q: "Что брать с собой?",
    a: "Только хорошее настроение. Кубики, листы персонажей и реквизит предоставляем. Можно захватить перекус и напитки.",
  },
  {
    q: "А если я один?",
    a: "Приходи смело! Мы подберём группу по уровню. Многие игроки приходят solo и находят компанию прямо за столом.",
  },
  {
    q: "Как долго длится игра?",
    a: "Обычно 4–6 часов. Ваншоты — одна сессия, приключения и кампании — несколько встреч. Расписание смотри в разделе «Расписание».",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-16 sm:py-24 md:py-32 bg-[#0a0908]">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-5 mb-10 sm:mb-14">
          <div className="h-px flex-1 bg-amber-800/40" />
          <h2 className="font-serif text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-[0.18em] sm:tracking-[0.22em] text-amber-600 px-2 text-center shrink-0">
            FAQ для новичков
          </h2>
          <div className="h-px flex-1 bg-amber-800/40" />
        </div>
        <div className="space-y-2 sm:space-y-2.5">
          {faqItems.map((item, i) => (
            <div
              key={i}
              className="border border-stone-800/80 rounded-sm overflow-hidden bg-[#141210]/95"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4 text-left font-sans text-sm sm:text-[15px] text-stone-100 font-medium hover:bg-[#1a1816] transition-colors"
                aria-expanded={openIndex === i}
              >
                <span className="pr-2">{item.q}</span>
                <ChevronDown
                  className={`w-4 h-4 sm:w-[18px] sm:h-[18px] flex-shrink-0 text-stone-400 transition-transform duration-200 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                  strokeWidth={2}
                />
              </button>
              {openIndex === i && (
                <div className="px-4 sm:px-5 pb-4 pt-0 border-t border-stone-800/60">
                  <p className="font-sans text-sm text-[#a8a098] leading-relaxed pt-3">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
