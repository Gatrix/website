import type { Metadata } from "next";
import { Suspense } from "react";
import { Cormorant_Garamond, Geist_Mono, Manrope } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { getPolygonLogoUrl } from "@/lib/home-assets";
import YandexMetrika from "@/components/YandexMetrika";
// TODO: раскомментировать при включении авторизации
// import SessionProvider from "@/components/SessionProvider";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Главная: атмосферные шрифты с кириллицей (подключаем как переменные, не включаем глобально по умолчанию)
const fantasySerif = Cormorant_Garamond({
  variable: "--font-fantasy-serif",
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600", "700"],
});

const fantasySans = Manrope({
  variable: "--font-fantasy-sans",
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Полигон 20",
  description: "Место твоих лучших историй",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const polygonLogoUrl = getPolygonLogoUrl();

  return (
    <html lang="ru">
      <body
        className={`${geistMono.variable} ${fantasySerif.variable} ${fantasySans.variable} antialiased`}
      >
        {/* TODO: обернуть в SessionProvider при включении авторизации */}
        <Header polygonLogoUrl={polygonLogoUrl} />
        {children}
        <Suspense fallback={null}>
          <YandexMetrika />
        </Suspense>
      </body>
    </html>
  );
}
