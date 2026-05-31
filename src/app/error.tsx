"use client";

import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("[app-error]", error);

  return (
    <main className="min-h-screen bg-[#0c0a09] text-amber-100 flex items-center justify-center px-4 pt-24">
      <section className="max-w-xl text-center space-y-5">
        <p className="text-xs uppercase tracking-[0.35em] text-amber-500/80">
          Ошибка
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-[0.14em]">
          Что-то пошло не так
        </h1>
        <p className="text-sm sm:text-base text-amber-200/75 leading-relaxed">
          Мы не смогли загрузить этот раздел. Попробуйте обновить страницу или вернитесь на главную.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button type="button" onClick={reset} className="btn btn-primary px-5 py-2.5">
            Повторить
          </button>
          <Link href="/" className="btn btn-ghost px-5 py-2.5">
            На главную
          </Link>
        </div>
      </section>
    </main>
  );
}
