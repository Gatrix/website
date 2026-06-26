import React from "react";
import {
  SITE_ADDRESS_LINE,
  SITE_DISCORD_URL,
  SITE_PHONE_DISPLAY,
  SITE_PHONE_TEL,
  SITE_TELEGRAM_BOOKING_URL,
  SITE_VK_URL,
  getYandexMapEmbedSrc,
} from "@/lib/site-contact";

export default function HomeContactsSection() {
  return (
    <section
      id="contacts"
      className="scroll-header-offset py-16 sm:py-24 md:py-32 bg-[#0a0908] border-t border-amber-950/80"
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
                  href={SITE_TELEGRAM_BOOKING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-800/90 hover:text-amber-600 transition-colors"
                >
                  Telegram
                </a>
                <a
                  href={SITE_DISCORD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-800/90 hover:text-amber-600 transition-colors"
                >
                  Discord
                </a>
                <a
                  href={SITE_VK_URL}
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
  );
}
