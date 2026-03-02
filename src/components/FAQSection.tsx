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
    <section className="py-16 sm:py-24 md:py-32 bg-[#0c0a09] border-y border-amber-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-4 mb-8 sm:mb-12">
          <div className="h-[1px] flex-1 bg-amber-900/30" />
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-amber-800 px-2">
            FAQ для новичков
          </h2>
          <div className="h-[1px] flex-1 bg-amber-900/30" />
        </div>
        <div className="space-y-2">
          {faqItems.map((item, i) => (
            <div
              key={i}
              className="border border-amber-900/30 rounded-lg overflow-hidden bg-[#12100f]/80"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-4 sm:px-6 py-4 text-left text-amber-100 font-semibold hover:bg-amber-900/10 transition-colors"
                aria-expanded={openIndex === i}
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`w-5 h-5 flex-shrink-0 transition-transform ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === i && (
                <div className="px-4 sm:px-6 pb-4 pt-0">
                  <p className="text-[#8c8279] text-sm sm:text-base leading-relaxed">
                    {item.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
