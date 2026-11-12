"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

/** Fileira com rolagem horizontal e setas (estilo streaming). */
export function Fileira({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const rolar = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: "smooth" });
  return (
    <section className="group/fileira relative">
      <h2 className="flex items-baseline gap-3 px-4 text-lg font-bold text-gray-900 sm:px-6 lg:px-8">
        {titulo}
        {subtitulo && <span className="text-xs font-medium text-gray-400">{subtitulo}</span>}
      </h2>
      <div ref={ref} className="no-scrollbar flex snap-x gap-3 overflow-x-auto scroll-px-4 px-4 py-5 sm:scroll-px-6 sm:px-6 lg:scroll-px-8 lg:px-8">
        {children}
      </div>
      <button
        onClick={() => rolar(-1)}
        aria-label="Anterior"
        className="absolute bottom-5 left-0 top-12 z-20 hidden w-10 items-center justify-center bg-gradient-to-r from-page to-transparent text-gray-700 opacity-0 transition group-hover/fileira:opacity-100 md:flex"
      >
        <ChevronLeft size={30} />
      </button>
      <button
        onClick={() => rolar(1)}
        aria-label="Próximo"
        className="absolute bottom-5 right-0 top-12 z-20 hidden w-10 items-center justify-center bg-gradient-to-l from-page to-transparent text-gray-700 opacity-0 transition group-hover/fileira:opacity-100 md:flex"
      >
        <ChevronRight size={30} />
      </button>
    </section>
  );
}

/** Card 16:9 com capa, que cresce e revela informações no hover. */
export function CardStreaming({
  capa, titulo, info, onClick, largura = "w-64 sm:w-72",
}: { capa: ReactNode; titulo?: ReactNode; info?: ReactNode; onClick: () => void; largura?: string }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "group relative aspect-video shrink-0 snap-start overflow-hidden rounded-md text-left shadow-md ring-1 ring-black/5 transition duration-300 hover:z-10 hover:scale-[1.06] hover:shadow-2xl",
        largura,
      )}
    >
      {capa}
      <div className="absolute inset-x-0 bottom-0 p-3">
        {titulo}
        {info && (
          <div className="grid grid-rows-[0fr] transition-all duration-300 group-hover:grid-rows-[1fr]">
            <div className="overflow-hidden">
              <div className="flex items-center gap-2 pt-1.5 text-[11px] text-white/90">{info}</div>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

/** Item do ranking "Top 10": número gigante vazado + pôster vertical. */
export function ItemTop({ posicao, poster, onClick }: { posicao: number; poster: ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group relative flex shrink-0 snap-start items-end pl-2 text-left">
      <span className="numero-top -mr-5 select-none text-[150px] transition group-hover:-translate-x-1">{posicao}</span>
      <div className="relative z-[1] aspect-[2/3] w-32 overflow-hidden rounded-md shadow-lg ring-1 ring-black/5 transition duration-300 group-hover:scale-105 sm:w-36">
        {poster}
      </div>
    </button>
  );
}

/** Janela de detalhes estilo streaming (capa grande + conteúdo). */
export function JanelaDetalhe({ capa, sobre, onClose, children }: { capa: ReactNode; sobre?: ReactNode; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = overflow; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-0 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <div className="mx-auto max-w-3xl overflow-hidden bg-surface shadow-2xl sm:rounded-xl" onClick={(e) => e.stopPropagation()}>
        <div className="relative aspect-video max-h-[420px] w-full">
          {capa}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
          {sobre}
          <button onClick={onClose} aria-label="Fechar" className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black/80">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
