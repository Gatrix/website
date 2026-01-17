export default function AtmosphericBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-[#0f0d0c]">
      {/* Плотный шум/зернистость через CSS градиент вместо внешней картинки */}
      <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC42NSIgbnVtT2N0YXZlcz0iMyIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNuKSIvPjwvc3ZnPg==')]"></div>
      <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-orange-900/20 blur-[150px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] bg-amber-900/20 blur-[130px] rounded-full" />
    </div>
  );
}
