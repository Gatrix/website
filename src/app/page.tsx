import React from "react";
import { getAdventures } from "@/lib/actions/adventures";
import { getFrontpageCarouselSlides } from "@/lib/actions/home";
import { getSignUpButtonImageUrl } from "@/lib/home-assets";
import AtmosphericBackground from "@/components/AtmosphericBackground";
import FAQSection from "@/components/FAQSection";
import HomeContactsSection from "@/components/home/HomeContactsSection";
import HomePricingSection from "@/components/home/HomePricingSection";
import HomeSpaceSection from "@/components/home/HomeSpaceSection";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const signUpButtonImageUrl = getSignUpButtonImageUrl();
  const [adventures, heroCarouselSlides] = await Promise.all([
    getAdventures(),
    getFrontpageCarouselSlides(),
  ]);

  return (
    <main className="relative min-h-screen text-[#d1c7bc] font-fantasy-sans selection:bg-amber-900/50 overflow-x-hidden">
      <AtmosphericBackground />
      <HomeClient
        initialAdventures={adventures}
        heroCarouselSlides={heroCarouselSlides}
        signUpButtonImageUrl={signUpButtonImageUrl}
      />
      <HomePricingSection />
      <HomeSpaceSection />
      <FAQSection />
      <HomeContactsSection />
      <footer className="py-6 border-t border-amber-900/10 text-center bg-[#080706] px-4">
        <p className="text-amber-900/35 text-[8px] sm:text-[9px] md:text-[10px] tracking-[0.25em] sm:tracking-[0.35em] uppercase">
          &copy; MMXXIV Гильдия ПОЛИГОН &bull; Garage Crafted Experience
        </p>
      </footer>
    </main>
  );
}
