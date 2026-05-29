import AtmosphericBackground from "@/components/AtmosphericBackground";

/** Скелетон страницы приключений (loading.tsx и dynamic import AdventuresClient). */
export default function AdventuresPageSkeleton() {
  return (
    <main
      className="relative min-h-screen text-yellow-100 font-serif px-4 pb-4 sm:px-6 sm:pb-6 md:px-12 md:pb-12 animate-pulse"
      aria-busy="true"
      aria-label="Загрузка приключений"
    >
      <AtmosphericBackground />

      <div className="max-w-7xl mx-auto relative z-10 page-header-offset">
        <div className="h-16 sm:h-20 rounded-sm bg-yellow-900/20 border border-yellow-700/30 mb-3 sm:mb-4" />

        <div className="mb-6 sm:mb-8 md:mb-10 flex flex-col sm:flex-row justify-between items-center gap-3 border-b border-yellow-500/20 pb-4">
          <div className="h-4 w-24 bg-yellow-800/30 rounded order-2 sm:order-1" />
          <div className="h-8 w-56 sm:w-72 bg-yellow-800/40 rounded order-1 sm:order-2" />
          <div className="hidden md:block w-[100px] order-3" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto mb-8">
        <div className="h-12 w-full bg-yellow-950/30 border border-yellow-700/25 rounded-sm" />
      </div>

      <div className="max-w-4xl mx-auto mb-12 sm:mb-16 md:mb-20">
        <div className="flex justify-between mb-8 px-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-yellow-900/35 border border-yellow-700/40" />
              <div className="h-3 w-14 sm:w-20 bg-yellow-800/30 rounded" />
            </div>
          ))}
        </div>

        <div className="h-6 w-40 mx-auto bg-yellow-800/35 rounded mb-6" />

        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-10 sm:h-11 w-24 sm:w-28 bg-yellow-950/30 border border-yellow-700/30 rounded-sm"
            />
          ))}
        </div>

        <div className="flex justify-center gap-4">
          <div className="h-12 w-32 bg-yellow-900/25 border border-yellow-700/30 rounded-sm" />
          <div className="h-12 w-36 bg-yellow-800/30 border border-yellow-600/35 rounded-sm" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <div className="h-px flex-1 bg-yellow-700/25" />
          <div className="h-3 w-40 bg-yellow-800/30 rounded" />
          <div className="h-px flex-1 bg-yellow-700/25" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg overflow-hidden border border-amber-900/25 bg-[#14110f]"
            >
              <div className="aspect-[3/4] bg-amber-950/40" />
              <div className="p-3 space-y-2">
                <div className="h-4 w-3/4 bg-amber-900/30 rounded" />
                <div className="h-3 w-1/2 bg-amber-900/20 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
