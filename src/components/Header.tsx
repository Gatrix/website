"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useSession } from "next-auth/react";

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

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAdventuresPage = pathname === "/adventures";
  const isSchedulePage = pathname === "/schedule";
  const isAboutPage = pathname === "/about";
  const isLoginPage = pathname === "/login";
  const isProfilePage = pathname === "/profile";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isAuthenticated = !!session;
  const loading = status === "loading";

  const towerLogo = "/logos/tower.webp";
  const textLogo = "/logos/text.webp";

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-[#0f0d0c]/90 backdrop-blur-sm border-b border-amber-900/20 px-4 sm:px-6 py-2 sm:py-3 flex justify-between items-center shadow-2xl">
        {/* Левая часть - Башня */}
        <div className="flex-1 flex justify-start items-center gap-3">
          <Link href="/" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
            <div className="relative p-1.5 sm:p-2 group transition-all duration-300">
              <div className="absolute inset-0 bg-amber-500/5 blur-xl rounded-full group-hover:bg-amber-500/10 transition-colors" />
              {towerLogo ? (
                <Image
                  src={towerLogo}
                  alt="Polygon Tower"
                  width={60}
                  height={60}
                  className="h-10 sm:h-12 w-auto object-contain relative z-10 brightness-110 contrast-110 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]"
                />
              ) : (
                <Image
                  src="/logos/logo.png"
                  alt="Polygon Logo"
                  width={160}
                  height={64}
                  className="h-12 sm:h-16 w-auto object-contain relative z-10 grayscale invert brightness-200"
                />
              )}
            </div>
            {/* Текстовый логотип */}
            {textLogo && (
              <div className="hidden sm:flex items-center pointer-events-none">
                <Image 
                  src={textLogo} 
                  alt="Polygon Text" 
                  width={350} 
                  height={80} 
                  className="h-10 md:h-12 lg:h-14 w-auto object-contain brightness-110 contrast-110 drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]" 
                />
              </div>
            )}
          </Link>

          {/* Social Icons (Desktop) - Vertical */}
          <div className="hidden sm:flex flex-col gap-1.5 border-l border-amber-900/30 pl-3">
            <a href="https://discord.gg/polygon" target="_blank" rel="noopener noreferrer" className="text-amber-100/40 hover:text-[#5865F2] transition-all hover:scale-110" title="Discord">
              <DiscordIcon className="w-4 h-4" />
            </a>
            <a href="https://t.me/polygon_rpg" target="_blank" rel="noopener noreferrer" className="text-amber-100/40 hover:text-[#24A1DE] transition-all hover:scale-110" title="Telegram">
              <TelegramIcon className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Правая часть - Навигация */}
        <div className="flex-1 flex justify-end items-center">
          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-6 lg:gap-10 text-[10px] lg:text-xs font-bold tracking-[0.2em] uppercase items-center text-amber-100/70">
            <Link
              href="/"
              className={`hover:text-amber-500 transition-colors underline-offset-8 ${
                pathname === "/" ? "text-amber-500 underline" : "hover:underline"
              }`}
            >
              Главная
            </Link>
            <Link
              href="/adventures"
              className={`hover:text-amber-500 transition-colors underline-offset-8 ${
                isAdventuresPage ? "text-amber-500 underline" : "hover:underline"
              }`}
            >
              Сюжеты
            </Link>
            <Link
              href="/schedule"
              className={`hover:text-amber-500 transition-colors underline-offset-8 ${
                isSchedulePage ? "text-amber-500 underline" : "hover:underline"
              }`}
            >
              Расписание
            </Link>
            <Link
              href="/about"
              className={`hover:text-amber-500 transition-colors underline-offset-8 ${
                isAboutPage ? "text-amber-500 underline" : "hover:underline"
              }`}
            >
              Гильдия
            </Link>
            {!loading && (
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
            )}
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
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`py-4 text-lg font-bold tracking-widest uppercase transition-colors border-b border-amber-900/30 ${
              pathname === "/" ? "text-amber-500" : "text-amber-100/70 hover:text-amber-500"
            }`}
          >
            Главная
          </Link>
          <Link
            href="/adventures"
            onClick={() => setMobileMenuOpen(false)}
            className={`py-4 text-lg font-bold tracking-widest uppercase transition-colors border-b border-amber-900/30 ${
              isAdventuresPage ? "text-amber-500" : "text-amber-100/70 hover:text-amber-500"
            }`}
          >
            Сюжеты
          </Link>
          <Link
            href="/schedule"
            onClick={() => setMobileMenuOpen(false)}
            className={`py-4 text-lg font-bold tracking-widest uppercase transition-colors border-b border-amber-900/30 ${
              isSchedulePage ? "text-amber-500" : "text-amber-100/70 hover:text-amber-500"
            }`}
          >
            Расписание
          </Link>
          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className={`py-4 text-lg font-bold tracking-widest uppercase transition-colors border-b border-amber-900/30 ${
              isAboutPage ? "text-amber-500" : "text-amber-100/70 hover:text-amber-500"
            }`}
          >
            Гильдия
          </Link>
          {!loading && (
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
          )}
        </div>
      </div>
    </>
  );
}
