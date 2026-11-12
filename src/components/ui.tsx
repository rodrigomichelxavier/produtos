"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

export function PageHeader({ titulo, subtitulo, acoes }: { titulo: string; subtitulo?: string; acoes?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-sm text-gray-500">{subtitulo}</p>}
      </div>
      {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
    </div>
  );
}

const tons = {
  verde: "bg-brand-50 text-brand-700 ring-brand-200",
  cinza: "bg-gray-100 text-gray-700 ring-gray-200",
  amarelo: "bg-amber-50 text-amber-800 ring-amber-200",
  vermelho: "bg-red-50 text-red-700 ring-red-200",
  azul: "bg-sky-50 text-sky-700 ring-sky-200",
  roxo: "bg-violet-50 text-violet-700 ring-violet-200",
};
export type Tom = keyof typeof tons;

export function Badge({ children, tom = "cinza", className }: { children: ReactNode; tom?: Tom; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", tons[tom], className)}>
      {children}
    </span>
  );
}

export function Tabs<T extends string>({
  abas,
  ativa,
  onChange,
  contagem,
}: {
  abas: readonly T[];
  ativa: T;
  onChange: (a: T) => void;
  contagem?: Partial<Record<T, number>>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [lados, setLados] = useState({ esq: false, dir: false });

  // mostra setas só quando há abas escondidas naquele lado
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => setLados({ esq: el.scrollLeft > 2, dir: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 });
    medir();
    el.addEventListener("scroll", medir, { passive: true });
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => { el.removeEventListener("scroll", medir); obs.disconnect(); };
  }, []);

  // mantém a aba ativa visível
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [ativa]);

  const rolar = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.6, behavior: "smooth" });

  return (
    <div className="relative">
      <div ref={ref} role="tablist" className="no-scrollbar flex gap-1 overflow-x-auto overflow-y-hidden shadow-[inset_0_-1px_0_var(--color-gray-200)]">
        {abas.map((a) => (
          <button
            key={a}
            role="tab"
            aria-selected={a === ativa}
            onClick={() => onChange(a)}
            className={clsx(
              "shrink-0 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition",
              a === ativa ? "border-brand-600 text-brand-700" : "border-transparent text-gray-500 hover:text-gray-800",
            )}
          >
            {a}
            {contagem?.[a] !== undefined && (
              <span className={clsx("ml-2 rounded-full px-2 py-0.5 text-xs", a === ativa ? "bg-brand-100" : "bg-gray-100")}>
                {contagem[a]}
              </span>
            )}
          </button>
        ))}
      </div>
      {lados.esq && (
        <button onClick={() => rolar(-1)} aria-label="Abas anteriores" className="absolute inset-y-0 left-0 flex w-12 items-center justify-start bg-gradient-to-r from-surface via-surface/90 to-transparent pb-px text-gray-500 hover:text-gray-900">
          <ChevronLeft size={18} />
        </button>
      )}
      {lados.dir && (
        <button onClick={() => rolar(1)} aria-label="Mais abas" className="absolute inset-y-0 right-0 flex w-12 items-center justify-end bg-gradient-to-l from-surface via-surface/90 to-transparent pb-px text-gray-500 hover:text-gray-900">
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}

export function Segmented<T extends string>({ opcoes, valor, onChange }: { opcoes: readonly T[]; valor: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-xl border border-gray-300 bg-surface p-1">
      {opcoes.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={clsx(
            "rounded-lg px-4 py-1.5 text-sm font-semibold transition",
            o === valor ? "bg-accent text-white shadow" : "text-gray-600 hover:bg-gray-100",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function Modal({ aberto, onClose, titulo, children, largura = "max-w-lg" }: {
  aberto: boolean; onClose: () => void; titulo: string; children: ReactNode; largura?: string;
}) {
  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className={clsx("card max-h-[90vh] w-full overflow-y-auto p-6", largura)} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-brand-900">{titulo}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Vazio({ icone, texto }: { icone?: ReactNode; texto: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
      {icone}
      {texto}
    </div>
  );
}

export function Avatar({ nome, foto, tamanho = 36 }: { nome: string; foto?: string; tamanho?: number }) {
  const iniciais = nome.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return foto ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={foto} alt={nome} width={tamanho} height={tamanho} className="shrink-0 rounded-full object-cover" style={{ width: tamanho, height: tamanho }} />
  ) : (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-brand-200 font-bold text-brand-800"
      style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.38 }}
    >
      {iniciais}
    </span>
  );
}

/**
 * Troca de abas sem "pular" a página: guarda a rolagem e mantém a altura da área de conteúdo
 * no momento da troca, evitando que o navegador reposicione a tela quando a nova aba é mais curta.
 */
export function useAbaEstavel<T extends string>(inicial: T) {
  const [aba, setAbaInterna] = useState<T>(inicial);
  const conteudoRef = useRef<HTMLDivElement>(null);
  const rolagem = useRef<number | null>(null);
  const [alturaMin, setAlturaMin] = useState<number | undefined>();

  const setAba = (nova: T) => {
    rolagem.current = window.scrollY;
    setAlturaMin(conteudoRef.current?.offsetHeight);
    setAbaInterna(nova);
  };

  useLayoutEffect(() => {
    if (rolagem.current !== null) {
      window.scrollTo({ top: rolagem.current });
      rolagem.current = null;
    }
  }, [aba]);

  return { aba, setAba, conteudoRef, estiloConteudo: { minHeight: alturaMin } };
}
