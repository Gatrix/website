import React from "react";

export default function HomeSpaceSection() {
  return (
    <section className="pt-12 sm:pt-16 md:pt-20 pb-6 sm:pb-8 md:pb-10 bg-[#0a0908] border-y border-red-950/25">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-left">
        <div className="h-px w-full bg-red-950/50 mb-6 sm:mb-8" aria-hidden />
        <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-bold uppercase tracking-[0.06em] sm:tracking-[0.1em] text-[#f5f0e6] leading-tight mb-5 sm:mb-6 md:mb-8">
          Пространство, где время замирает
        </h2>
        <div className="text-body text-base sm:text-lg space-y-5 sm:space-y-6">
          <p>
            Динамичное освещение, аудиальное сопровождение, тактильные декорации и атмосфера приключения
            обеспечат полное погружение.
          </p>
          <p>
            Мы не бежим от реального мира за ширму воображения. Мы создаем новый опыт в воображении, чтобы сделать
            нашу реальную жизнь богаче.
          </p>
        </div>
        <div className="h-px w-full bg-red-950/50 mt-6 sm:mt-8 md:mt-10" aria-hidden />
      </div>
    </section>
  );
}
