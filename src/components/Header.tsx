"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Phone, X } from "lucide-react";
import { scrollToContacts } from "@/lib/scroll-to-contacts";
import {
  SITE_ADDRESS_SHORT,
  SITE_DISCORD_URL,
  SITE_PHONE_DISPLAY,
  SITE_PHONE_TEL,
  SITE_TELEGRAM_BOOKING_URL,
  SITE_VK_URL,
} from "@/lib/site-contact";
// TODO: раскомментировать при включении авторизации
// import { useSession } from "next-auth/react";

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 127.14 96.36" className={className}>
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.06,72.06,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.71,32.65-1.82,56.6.48,80.21h0A105.73,105.73,0,0,0,32.47,96.36,77.7,77.7,0,0,0,39.2,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.73,11.1,105.33,105.33,0,0,0,32.05-16.15h0C130.41,50.8,121.77,27,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5.12-12.67,11.41-12.67S54,46,53.86,53,48.74,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5.12-12.67,11.44-12.67S96.23,46,96.11,53,91,65.69,84.69,65.69Z" fill="currentColor"/>
  </svg>
);

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42l10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701l-.321 4.816c.47 0 .677-.216.941-.469l2.259-2.193l4.702 3.473c.866.478 1.489.231 1.704-.799l3.084-14.538c.316-1.267-.478-1.841-1.309-1.46z" fill="currentColor"/>
  </svg>
);

const VKIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.525-2.049-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.269c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.559 4 8.305c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.383c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 3.996-2.354 3.996-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.049.17.491-.085.744-.576.744z" fill="currentColor"/>
  </svg>
);

export default function Header() {
  const pathname = usePathname();
  // TODO: раскомментировать при включении авторизации
  // const router = useRouter();
  // const { data: session, status } = useSession();
  const isAdventuresPage = pathname === "/adventures";
  // const isSchedulePage = pathname === "/schedule";
  // const isLoginPage = pathname === "/login";
  // const isProfilePage = pathname === "/profile";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // const isAuthenticated = !!session;
  // const loading = status === "loading";

  const agamaLogo = "/logos/agama-logo.webp";
  const polygonLogo = "/logos/polygon-logo.webp";

  const handleContactsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setMobileMenuOpen(false);
    if (pathname !== "/") return;
    e.preventDefault();
    if (scrollToContacts()) {
      window.history.replaceState(null, "", "#contacts");
    }
  };

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-[#0f0d0c]/90 backdrop-blur-sm border-b border-amber-900/20 px-4 sm:px-6 py-2 sm:py-3 relative flex items-center justify-between shadow-2xl min-h-[56px] sm:min-h-[68px]">
        {/* Левая колонка: соцсети + часть ссылок (десктоп) */}
        <div className="flex-1 flex justify-start items-center min-w-0 z-10">
          <div className="hidden md:flex items-center gap-4 lg:gap-6 xl:gap-8 text-[10px] lg:text-xs font-bold tracking-[0.2em] uppercase text-amber-100/70">
            <div className="flex flex-col gap-0.5 shrink-0 min-w-0">
              <a
                href={`tel:${SITE_PHONE_TEL}`}
                className="flex items-center gap-1.5 text-amber-200/90 hover:text-[#fde047] transition-colors tracking-[0.06em] lg:tracking-[0.1em] text-xs lg:text-sm"
                title="Позвонить"
              >
                <Phone className="w-4 h-4 opacity-80 shrink-0" strokeWidth={2.25} aria-hidden />
                <span className="whitespace-nowrap">{SITE_PHONE_DISPLAY}</span>
              </a>
              <span className="pl-[22px] text-[11px] lg:text-xs font-semibold normal-case tracking-normal text-amber-100/45 leading-tight">
                {SITE_ADDRESS_SHORT}
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="flex items-center gap-4 lg:gap-6 shrink-0">
                <a href={SITE_DISCORD_URL} target="_blank" rel="noopener noreferrer" className="text-amber-100/40 hover:text-[#5865F2] transition-all hover:scale-110 shrink-0" title="Discord">
                  <DiscordIcon className="w-5 h-5" />
                </a>
                <a href={SITE_TELEGRAM_BOOKING_URL} target="_blank" rel="noopener noreferrer" className="text-amber-100/40 hover:text-[#24A1DE] transition-all hover:scale-110 shrink-0" title="Telegram">
                  <TelegramIcon className="w-5 h-5" />
                </a>
                <a href={SITE_VK_URL} target="_blank" rel="noopener noreferrer" className="text-amber-100/40 hover:text-[#0077FF] transition-all hover:scale-110 shrink-0" title="ВКонтакте">
                  <VKIcon className="w-5 h-5" />
                </a>
              </div>
              <Link
                href="/#contacts"
                onClick={handleContactsClick}
                className="hover:text-amber-500 transition-colors underline-offset-8 hover:underline shrink-0"
              >
                Контакты
              </Link>
            </div>
          </div>
          {/* Мобильный баланс слева от центрального логотипа */}
          <div className="w-10 shrink-0 md:hidden" aria-hidden />
        </div>

        {/* Логотип по центру экрана */}
        <Link
          href="/"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 sm:gap-3 z-20 pointer-events-auto group"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="relative p-1 sm:p-1.5 transition-all duration-300">
            <div className="absolute inset-0 bg-amber-500/5 blur-xl rounded-full group-hover:bg-amber-500/10 transition-colors" />
            <Image
              src={polygonLogo}
              alt="ПОЛИГОН"
              width={280}
              height={72}
              className="h-8 sm:h-9 md:h-11 w-auto max-w-[140px] sm:max-w-[200px] md:max-w-none object-contain relative z-10 brightness-110 contrast-110 drop-shadow-[0_0_12px_rgba(251,191,36,0.25)] transition-all duration-300 group-hover:brightness-125"
            />
          </div>
          <div className="relative p-1 sm:p-1.5 transition-all duration-300">
            <div className="absolute inset-0 bg-amber-500/5 blur-xl rounded-full group-hover:bg-amber-500/10 transition-colors" />
            <Image
              src={agamaLogo}
              alt="Agama Logo"
              width={75}
              height={75}
              className="h-[44px] sm:h-[52px] md:h-[56px] w-auto object-contain relative z-10 brightness-110 contrast-110 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)] transition-all duration-300 group-hover:brightness-125"
            />
          </div>
        </Link>

        {/* Правая колонка: ссылки + меню */}
        <div className="flex-1 flex justify-end items-center min-w-0 z-10">
          <div className="hidden md:flex gap-6 lg:gap-10 text-[10px] lg:text-xs font-bold tracking-[0.2em] uppercase items-center text-amber-100/70">
            <Link
              href="/adventures"
              className={`shrink-0 transition-all underline-offset-8 rounded-sm px-3 py-2 lg:px-4 lg:py-2.5 text-xs lg:text-sm tracking-[0.18em] lg:tracking-[0.22em] border-2 font-black shadow-[0_0_18px_rgba(251,191,36,0.2)] ${
                isAdventuresPage
                  ? "text-amber-950 bg-amber-400 border-amber-300 underline"
                  : "text-amber-100 border-amber-600/55 bg-amber-950/40 hover:bg-amber-500/20 hover:border-amber-400 hover:text-amber-50 hover:underline"
              }`}
            >
              Приключения
            </Link>
            {/* <Link
              href="/schedule"
              className={`shrink-0 hover:text-amber-500 transition-colors underline-offset-8 ${
                isSchedulePage ? "text-amber-500 underline" : "hover:underline"
              }`}
            >
              Расписание
            </Link> */}
            {/* TODO: раскомментировать при включении авторизации и личных кабинетов */}
            {/* {!loading && (
              isAuthenticated ? (
                <Link
                  href="/profile"
                  className={`ml-2 lg:ml-4 px-4 lg:px-6 py-2 border transition-all font-black rounded-sm ${
                    isProfilePage
                      ? "bg-amber-600 text-black border-amber-600"
                      : "bg-amber-900/20 border-amber-700/50 text-amber-500 hover:bg-amber-600 hover:text-black"
                  }`}
                >
                  ПРОФИЛЬ
                </Link>
              ) : (
                <button 
                  onClick={() => router.push("/login")}
                  className={`ml-2 lg:ml-4 px-4 lg:px-6 py-2 border transition-all font-black rounded-sm ${
                    isLoginPage
                      ? "bg-amber-600 text-black border-amber-600"
                      : "bg-amber-900/20 border-amber-700/50 text-amber-500 hover:bg-amber-600 hover:text-black"
                  }`}
                >
                  ВХОД
                </button>
              )
            )} */}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-amber-600 hover:text-amber-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09]"
            aria-label="Меню"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        id="mobile-menu"
        className={`fixed top-0 left-0 w-full h-full bg-[#0f0d0c]/95 backdrop-blur-md z-40 md:hidden transition-transform duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full pt-20 px-6">
          <div className="py-3 border-b border-amber-900/30">
            <a
              href={`tel:${SITE_PHONE_TEL}`}
              className="flex items-center gap-2 text-amber-200/90 hover:text-[#fde047] font-bold tracking-widest text-sm"
            >
              <Phone className="w-5 h-5 shrink-0" aria-hidden />
              {SITE_PHONE_DISPLAY}
            </a>
            <p className="mt-1.5 pl-7 text-xs font-semibold normal-case tracking-normal text-amber-100/50">
              {SITE_ADDRESS_SHORT}
            </p>
          </div>
          <div className="flex gap-4 py-4 border-b border-amber-900/30">
            <a href={SITE_DISCORD_URL} target="_blank" rel="noopener noreferrer" className="text-amber-100/40 hover:text-[#5865F2] transition-all" title="Discord">
              <DiscordIcon className="w-6 h-6" />
            </a>
            <a href={SITE_TELEGRAM_BOOKING_URL} target="_blank" rel="noopener noreferrer" className="text-amber-100/40 hover:text-[#24A1DE] transition-all" title="Telegram">
              <TelegramIcon className="w-6 h-6" />
            </a>
            <a href={SITE_VK_URL} target="_blank" rel="noopener noreferrer" className="text-amber-100/40 hover:text-[#0077FF] transition-all" title="ВКонтакте">
              <VKIcon className="w-6 h-6" />
            </a>
          </div>
          <Link
            href="/#contacts"
            onClick={handleContactsClick}
            className="py-4 text-lg font-bold tracking-widest uppercase transition-colors border-b border-amber-900/30 text-amber-100/70 hover:text-amber-500"
          >
            Контакты
          </Link>
          <Link
            href="/adventures"
            onClick={() => setMobileMenuOpen(false)}
            className={`py-4 text-xl font-black tracking-widest uppercase transition-colors border-b border-amber-900/30 border-l-4 pl-4 -ml-1 ${
              isAdventuresPage
                ? "text-amber-950 bg-amber-400/90 border-l-amber-300"
                : "text-amber-100/90 border-l-amber-600/50 hover:text-amber-400 hover:border-l-amber-400"
            }`}
          >
            Приключения
          </Link>
          {/* <Link
            href="/schedule"
            onClick={() => setMobileMenuOpen(false)}
            className={`py-4 text-lg font-bold tracking-widest uppercase transition-colors border-b border-amber-900/30 ${
              isSchedulePage ? "text-amber-500" : "text-amber-100/70 hover:text-amber-500"
            }`}
          >
            Расписание
          </Link> */}
          {/* TODO: раскомментировать при включении авторизации и личных кабинетов */}
          {/* {!loading && (
            isAuthenticated ? (
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={`mt-4 px-6 py-3 border-2 transition-all font-black rounded-sm text-base tracking-widest uppercase ${
                  isProfilePage
                    ? "bg-amber-600 text-black border-amber-600"
                    : "bg-amber-900/20 border-amber-700/50 text-amber-500 hover:bg-amber-600 hover:text-black"
                }`}
              >
                ПРОФИЛЬ
              </Link>
            ) : (
              <button 
                onClick={() => {
                  router.push("/login");
                  setMobileMenuOpen(false);
                }}
                className={`mt-4 px-6 py-3 border-2 transition-all font-black rounded-sm text-base tracking-widest uppercase ${
                  isLoginPage
                    ? "bg-amber-600 text-black border-amber-600"
                    : "bg-amber-900/20 border-amber-700/50 text-amber-500 hover:bg-amber-600 hover:text-black"
                }`}
              >
                ВХОД
              </button>
            )
          )} */}
        </div>
      </div>
    </>
  );
}
