import React from "react";

type TextBoardPageProps = {
  children?: React.ReactNode;
};

/** Полноэкранная страница с крупным текстом. Не связана с навигацией клуба. */
export default function TextBoardPage({ children }: TextBoardPageProps) {
  return (
    <main className="min-h-dvh flex items-center justify-center px-6 py-16 sm:px-10 bg-[#0b0a0d]">
      <div
        className="max-w-5xl w-full text-center font-[family-name:var(--font-fantasy-serif)] text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium leading-[1.25] tracking-wide text-[#f2eee7]"
      >
        {children}
      </div>
    </main>
  );
}
