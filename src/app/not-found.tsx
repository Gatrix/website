import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#0c0a09] text-amber-100 flex items-center justify-center px-4 pt-24">
      <section className="max-w-xl text-center space-y-5">
        <p className="text-xs uppercase tracking-[0.35em] text-amber-500/80">
          404
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-[0.14em]">
          Страница не найдена
        </h1>
        <p className="text-sm sm:text-base text-amber-200/75 leading-relaxed">
          Возможно, ссылка устарела или раздел был перенесён.
        </p>
        <Link href="/" className="btn btn-primary inline-flex px-5 py-2.5">
          Вернуться на главную
        </Link>
      </section>
    </main>
  );
}
