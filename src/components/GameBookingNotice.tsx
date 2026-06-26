import {
  SITE_DISCORD_URL,
  SITE_PHONE_DISPLAY,
  SITE_PHONE_TEL,
  SITE_TELEGRAM_BOOKING_URL,
  SITE_VK_URL,
} from "@/lib/site-contact";

const DiscordGlyph = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 127.14 96.36" className={className} aria-hidden>
    <path
      d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.06,72.06,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.71,32.65-1.82,56.6.48,80.21h0A105.73,105.73,0,0,0,32.47,96.36,77.7,77.7,0,0,0,39.2,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.73,11.1,105.33,105.33,0,0,0,32.05-16.15h0C130.41,50.8,121.77,27,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5.12-12.67,11.41-12.67S54,46,53.86,53,48.74,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5.12-12.67,11.44-12.67S96.23,46,96.11,53,91,65.69,84.69,65.69Z"
      fill="currentColor"
    />
  </svg>
);
const TelegramGlyph = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path
      d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42l10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701l-.321 4.816c.47 0 .677-.216.941-.469l2.259-2.193l4.702 3.473c.866.478 1.489.231 1.704-.799l3.084-14.538c.316-1.267-.478-1.841-1.309-1.46z"
      fill="currentColor"
    />
  </svg>
);
const VKGlyph = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path
      d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.525-2.049-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.269c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.559 4 8.305c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.383c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 3.996-2.354 3.996-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.049.17.491-.085.744-.576.744z"
      fill="currentColor"
    />
  </svg>
);

/** Блок контактов для записи на игры через ведущего (соцсети и телефон). */
export default function GameBookingNotice({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`max-w-3xl mx-auto rounded-lg border border-yellow-500/35 bg-[#0f0d0c]/90 shadow-[0_0_40px_rgba(0,0,0,0.45)] ${
        compact
          ? "mb-3 px-3 py-3 sm:px-5 sm:py-4"
          : "mb-8 px-5 py-6 sm:px-8 sm:py-8"
      } ${className}`}
    >
      <p
        className={`text-body font-semibold text-center ${
          compact ? "text-sm sm:text-base leading-relaxed" : "text-base sm:text-lg leading-relaxed"
        }`}
      >
        Записаться можно через личные сообщения с ведущим по предоставленным контактам, либо воспользоваться формой записи при выборе приключения.
      </p>
      <div
        className={`flex items-center justify-between gap-3 sm:gap-4 w-full font-sans ${
          compact ? "mt-3" : "mt-6"
        }`}
      >
        <div
          className={`flex items-center shrink-0 ${
            compact ? "gap-5 sm:gap-6" : "gap-6 sm:gap-8"
          }`}
        >
        <a
          href={SITE_VK_URL}
          target="_blank"
          rel="noopener noreferrer"
          title="ВКонтакте"
          aria-label="ВКонтакте"
          className="text-[#fde047] hover:text-[#0077FF] transition-all hover:scale-110 drop-shadow-[0_0_12px_rgba(253,224,71,0.45)]"
        >
          <VKGlyph className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" />
        </a>
        <a
          href={SITE_TELEGRAM_BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          title="Telegram"
          aria-label="Telegram"
          className="text-[#fde047] hover:text-[#24A1DE] transition-all hover:scale-110 drop-shadow-[0_0_12px_rgba(253,224,71,0.45)]"
        >
          <TelegramGlyph className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" />
        </a>
        <a
          href={SITE_DISCORD_URL}
          target="_blank"
          rel="noopener noreferrer"
          title="Discord"
          aria-label="Discord"
          className="text-[#fde047] hover:text-[#5865F2] transition-all hover:scale-110 drop-shadow-[0_0_12px_rgba(253,224,71,0.45)]"
        >
          <DiscordGlyph className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" />
        </a>
        </div>
        <a
          href={`tel:${SITE_PHONE_TEL}`}
          className="shrink-0 font-serif text-sm sm:text-base lg:text-lg font-bold text-[#fde047] hover:text-yellow-200 transition-colors drop-shadow-[0_0_14px_rgba(253,224,71,0.35)] whitespace-nowrap"
        >
          {SITE_PHONE_DISPLAY}
        </a>
      </div>
    </div>
  );
}
