"use client";

import clsx from "clsx";
import { Check, ChevronDown, Edit3, GitCompare, Info, Play, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Kicker, LinhaSelo, nomeCurto, NIVEL_COR, ProdutoCapa } from "@/components/produto";
import { CapaSolucao, tom } from "@/components/solucao";
import { CardStreaming, Fileira, ItemTop, JanelaDetalhe } from "@/components/streaming";
import { brl, siglaSegmentacao, tipoPessoa } from "@/lib/ans";
import { usePermissoes, useStore } from "@/lib/store";
import { FAIXAS_ETARIAS, TIPOS_PRESTADOR, type Produto, type SolucaoAdicional } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* "Gêneros": características para filtrar o portfólio                 */
/* ------------------------------------------------------------------ */

type Caracteristica = { id: string; grupo: string; rotulo: string; teste: (p: Produto) => boolean };

function montarCaracteristicas(solucoes: SolucaoAdicional[]): Caracteristica[] {
  const c = (grupo: string, rotulo: string, teste: (p: Produto) => boolean): Caracteristica => ({ id: `${grupo}:${rotulo}`, grupo, rotulo, teste });
  return [
    c("Linha", "Econômico", (p) => p.linha === "Econômico"),
    c("Linha", "Intermediário", (p) => p.linha === "Intermediário"),
    c("Linha", "Superior", (p) => p.linha === "Superior"),
    c("Abrangência", "Região de Campinas", (p) => p.abrangencia === "Grupo de Municípios"),
    c("Abrangência", "Nacional", (p) => p.abrangencia === "Nacional"),
    c("Rede nacional", "Rede Básica", (p) => p.redeNacional === "Básica"),
    c("Rede nacional", "Rede Especial", (p) => p.redeNacional === "Especial"),
    c("Rede nacional", "Rede Master", (p) => p.redeNacional === "Master"),
    c("Contratação", "Individual/Familiar", (p) => p.contratacao === "Individual/Familiar"),
    c("Contratação", "Coletivo Empresarial", (p) => p.contratacao === "Coletivo Empresarial"),
    c("Contratação", "Coletivo por Adesão", (p) => p.contratacao === "Coletivo por Adesão"),
    c("Segmentação", "Amb + Hosp com Obstetrícia", (p) => p.segmentacao === "Ambulatorial + Hospitalar com Obstetrícia"),
    c("Segmentação", "Hospitalar", (p) => p.segmentacao === "Hospitalar"),
    c("Segmentação", "Referência", (p) => p.segmentacao === "Referência"),
    c("Acomodação", "Enfermaria", (p) => p.acomodacao === "Enfermaria (coletiva)"),
    c("Acomodação", "Apartamento", (p) => p.acomodacao === "Apartamento (individual)"),
    c("Coparticipação", "Com coparticipação", (p) => p.fatorModerador !== "Sem fator moderador"),
    c("Coparticipação", "Sem coparticipação", (p) => p.fatorModerador === "Sem fator moderador"),
    c("Status", "Em comercialização", (p) => p.statusComercial === "Em comercialização"),
    c("Status", "Em breve", (p) => p.statusComercial === "Em elaboração"),
    c("Status", "Fora de venda", (p) => p.statusComercial === "Fora de comercialização"),
    ...solucoes.filter((s) => s.ativa).map((s) => c("Soluções adicionais", s.nome, (p) => p.solucoes.includes(s.id))),
  ];
}

/** Mesmo grupo = OU; grupos diferentes = E. */
function aplicar(lista: Produto[], sel: Caracteristica[]) {
  const grupos = new Map<string, Caracteristica[]>();
  sel.forEach((c) => grupos.set(c.grupo, [...(grupos.get(c.grupo) ?? []), c]));
  return lista.filter((p) => [...grupos.values()].every((cs) => cs.some((c) => c.teste(p))));
}

const PESSOAS = [
  { id: "Todos", rotulo: "Todos" },
  { id: "PF", rotulo: "Pessoa Física" },
  { id: "PJ", rotulo: "Pessoa Jurídica" },
] as const;
type Pessoa = (typeof PESSOAS)[number]["id"];

const ORDEM_REDE = { Básica: 1, Especial: 2, Master: 3 } as const;
const resumo = (p: Produto) =>
  [p.abrangencia === "Nacional" ? "Nacional" : "Regional", p.acomodacao.startsWith("Apart") ? "Apartamento" : "Enfermaria", p.fatorModerador === "Sem fator moderador" ? "Sem copart." : "Copart."];

/* ------------------------------------------------------------------ */

export default function PortfolioPage() {
  const produtos = useStore((s) => s.produtos);
  const solucoes = useStore((s) => s.solucoes);
  const perm = usePermissoes();
  const [pessoa, setPessoa] = useState<Pessoa>("Todos");
  const [selIds, setSelIds] = useState<string[]>([]);
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState<string | null>(null);

  const caracteristicas = useMemo(() => montarCaracteristicas(solucoes), [solucoes]);
  const sel = caracteristicas.filter((c) => selIds.includes(c.id));
  const doPublico = produtos.filter((p) => pessoa === "Todos" || tipoPessoa(p.contratacao) === pessoa);
  const filtrando = sel.length > 0 || busca.trim().length > 0;
  const resultado = aplicar(doPublico, sel).filter((p) => {
    const q = busca.trim().toLowerCase();
    return !q || p.nome.toLowerCase().includes(q) || p.registroANS.includes(q.replace(/\D/g, "") || "§");
  });

  const vendaveis = doPublico.filter((p) => p.statusComercial === "Em comercialização");
  const destaques = [...vendaveis]
    .sort((a, b) => (ORDEM_REDE[b.redeNacional ?? "Básica"] * (b.redeNacional ? 1 : 0) - ORDEM_REDE[a.redeNacional ?? "Básica"] * (a.redeNacional ? 1 : 0)) || b.rede.length - a.rede.length)
    .slice(0, 5);
  const heroLista = filtrando ? resultado.slice(0, 5) : destaques;
  const produtoAberto = produtos.find((p) => p.id === aberto);
  const alternar = (id: string) => setSelIds((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));

  const fileiras: { titulo: string; subtitulo?: string; lista: Produto[] }[] = [
    { titulo: "Em comercialização", lista: vendaveis },
    { titulo: "Linha Superior", subtitulo: "rede mais ampla e mais conforto", lista: vendaveis.filter((p) => p.linha === "Superior") },
    { titulo: "Linha Intermediária", lista: vendaveis.filter((p) => p.linha === "Intermediário") },
    { titulo: "Linha Econômica", subtitulo: "melhor custo-benefício", lista: vendaveis.filter((p) => p.linha === "Econômico") },
    { titulo: "Cobertura nacional", subtitulo: "rede direta + rede nacional", lista: vendaveis.filter((p) => p.abrangencia === "Nacional") },
    { titulo: "Na Região de Campinas", subtitulo: "13 municípios · rede direta", lista: vendaveis.filter((p) => p.abrangencia === "Grupo de Municípios") },
    { titulo: "Mensalidade menor", subtitulo: "com coparticipação", lista: vendaveis.filter((p) => p.fatorModerador !== "Sem fator moderador") },
    { titulo: "Sem coparticipação", lista: vendaveis.filter((p) => p.fatorModerador === "Sem fator moderador") },
    { titulo: "Conforto em apartamento", lista: vendaveis.filter((p) => p.acomodacao === "Apartamento (individual)") },
    { titulo: "Para empresas", lista: vendaveis.filter((p) => p.contratacao === "Coletivo Empresarial") },
    { titulo: "Coletivos por adesão", lista: vendaveis.filter((p) => p.contratacao === "Coletivo por Adesão") },
    { titulo: "Em breve", subtitulo: "em elaboração", lista: doPublico.filter((p) => p.statusComercial === "Em elaboração") },
    { titulo: "Fora de venda", lista: doPublico.filter((p) => p.statusComercial === "Fora de comercialização") },
  ];
  const top = [...vendaveis].sort((a, b) => b.rede.length - a.rede.length).slice(0, 10);

  return (
    <div className="-mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8">
      <section className="relative">
        {/* Navegação sobre o banner, como "Filmes | Séries | Gêneros" */}
        <div className="relative z-20 bg-black px-4 pb-4 pt-5 sm:px-6 md:absolute md:inset-x-0 md:top-0 md:bg-transparent md:bg-gradient-to-b md:from-black/70 md:to-transparent md:pb-10 lg:px-8">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <h1 className="text-2xl font-bold text-white drop-shadow sm:text-3xl">Portfólio</h1>
            <div className="flex items-center gap-1">
              {PESSOAS.map((op) => (
                <button
                  key={op.id}
                  onClick={() => setPessoa(op.id)}
                  className={clsx(
                    "rounded-full px-3.5 py-1 text-sm font-semibold transition",
                    pessoa === op.id ? "bg-white text-black" : "text-white/85 ring-1 ring-inset ring-white/40 hover:bg-white/10",
                  )}
                >
                  {op.rotulo}
                </button>
              ))}
            </div>
            <MenuCaracteristicas caracteristicas={caracteristicas} sel={selIds} alternar={alternar} limpar={() => setSelIds([])} />
            <div className="ml-auto flex items-center gap-2">
              <BuscaExpansivel valor={busca} onChange={setBusca} />
              {perm.editarProdutos && (
                <Link href="/produto/editar/" className="inline-flex items-center gap-1.5 rounded-md bg-white/15 px-3 py-1.5 text-sm font-semibold text-white ring-1 ring-inset ring-white/30 backdrop-blur hover:bg-white/25">
                  <Plus size={16} /> Novo produto
                </Link>
              )}
            </div>
          </div>
        </div>
        {heroLista.length > 0 ? (
          <Hero lista={heroLista} onMais={setAberto} />
        ) : (
          <div className="h-[220px] bg-gradient-to-b from-black to-page" />
        )}
      </section>

      {filtrando ? (
        <div className="px-4 pb-10 sm:px-6 lg:px-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-lg font-bold text-gray-900">
              {resultado.length} {resultado.length === 1 ? "produto" : "produtos"}
            </span>
            {sel.map((c) => (
              <button key={c.id} onClick={() => alternar(c.id)} className="inline-flex items-center gap-1 rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white hover:bg-gray-700 dark:bg-gray-200 dark:text-gray-900">
                {c.rotulo} <X size={12} />
              </button>
            ))}
            {busca && (
              <button onClick={() => setBusca("")} className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                “{busca}” <X size={12} />
              </button>
            )}
            <button onClick={() => { setSelIds([]); setBusca(""); }} className="text-xs font-semibold text-gray-500 underline-offset-2 hover:underline">Limpar tudo</button>
          </div>
          {resultado.length === 0 ? (
            <p className="py-16 text-center text-gray-500">Nenhum produto com essas características.</p>
          ) : (
            <div className="grid grid-cols-1 gap-x-3 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {resultado.map((p) => <CardProduto key={p.id} p={p} onClick={() => setAberto(p.id)} largura="w-full" />)}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1 pb-10">
          {fileiras.slice(0, 1).map((f) => f.lista.length > 0 && (
            <Fileira key={f.titulo} titulo={f.titulo} subtitulo={f.subtitulo}>
              {f.lista.map((p) => <CardProduto key={p.id} p={p} onClick={() => setAberto(p.id)} />)}
            </Fileira>
          ))}
          {top.length >= 3 && (
            <Fileira titulo={`Top ${top.length} · maior rede credenciada`}>
              {top.map((p, i) => (
                <ItemTop key={p.id} posicao={i + 1} onClick={() => setAberto(p.id)} poster={<ProdutoCapa produto={p} variante="poster" />} />
              ))}
            </Fileira>
          )}
          {fileiras.slice(1).map((f) => f.lista.length > 0 && (
            <Fileira key={f.titulo} titulo={f.titulo} subtitulo={f.subtitulo}>
              {f.lista.map((p) => <CardProduto key={p.id} p={p} onClick={() => setAberto(p.id)} />)}
            </Fileira>
          ))}
        </div>
      )}

      {produtoAberto && <Espiada p={produtoAberto} onClose={() => setAberto(null)} onAbrir={setAberto} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Hero({ lista, onMais }: { lista: Produto[]; onMais: (id: string) => void }) {
  const [i, setI] = useState(0);
  const [pausado, setPausado] = useState(false);
  const idx = i % lista.length;
  const atual = lista[idx];

  useEffect(() => {
    if (pausado || lista.length < 2) return;
    const t = window.setTimeout(() => setI((x) => (x + 1) % lista.length), 7000);
    return () => window.clearTimeout(t);
  }, [i, pausado, lista.length]);

  return (
    <div className="relative min-h-[500px] overflow-hidden bg-black sm:min-h-[560px]" onMouseEnter={() => setPausado(true)} onMouseLeave={() => setPausado(false)}>
      {lista.map((p, j) => (
        <div key={p.id} className={clsx("absolute inset-0 transition-opacity duration-1000", j === idx ? "opacity-100" : "opacity-0")}>
          <ProdutoCapa produto={p} variante="hero" titulo={false} className={clsx("transition-transform duration-[8000ms] ease-out", j === idx && "scale-105")} />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-page to-transparent" />

      <div key={atual.id} className="relative flex min-h-[500px] max-w-2xl flex-col justify-end px-6 pb-20 pt-10 text-white sm:min-h-[560px] sm:px-10 md:pt-36 lg:px-12">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-brand-500 font-display text-lg leading-none text-white">A</span>
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-white/80">
            Plano de saúde · {tipoPessoa(atual.contratacao) === "PF" ? "Pessoa física" : "Empresas"}
          </span>
        </div>
        <Kicker produto={atual} className="text-sm" />
        <h2 className="font-display text-6xl uppercase leading-[0.85] tracking-wide drop-shadow-lg sm:text-7xl xl:text-8xl">{nomeCurto(atual)}</h2>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <span className="font-semibold text-emerald-300">{atual.statusComercial}</span>
          <LinhaSelo produto={atual} />
          <span>{atual.contratacao}</span>
          <span className="text-white/40">•</span>
          <span>{siglaSegmentacao(atual.segmentacao)}</span>
          {atual.redeNacional && (
            <span className="rounded px-1.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider" style={{ background: NIVEL_COR[atual.redeNacional] }}>
              + Rede Nacional {atual.redeNacional}
            </span>
          )}
          <span className="rounded border border-white/40 px-1.5 text-[11px] text-white/85">{atual.acomodacao.split(" ")[0]}</span>
        </div>
        <p className="mt-3 line-clamp-2 max-w-xl text-sm text-white/85 sm:text-base">{atual.descricao}</p>
        <div className="mt-2 text-sm text-white/80">
          a partir de <span className="text-lg font-bold text-white">{brl(atual.precoComercial[0])}</span>/mês
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={`/produto/?id=${atual.id}`} className="inline-flex items-center gap-2 rounded-md bg-white px-5 py-2.5 text-sm font-bold text-black transition hover:bg-white/80">
            <Play size={18} className="fill-black" /> Ver produto
          </Link>
          <button onClick={() => onMais(atual.id)} className="inline-flex items-center gap-2 rounded-md bg-white/25 px-5 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/35">
            <Info size={18} /> Mais informações
          </button>
        </div>
      </div>

      {lista.length > 1 && (
        <div className="absolute bottom-20 right-6 flex gap-1.5 sm:right-10">
          {lista.map((p, j) => (
            <button
              key={p.id}
              onClick={() => setI(j)}
              aria-label={`Destaque ${j + 1}: ${p.nome}`}
              className={clsx("h-1 rounded-full transition-all", j === idx ? "w-8 bg-white" : "w-4 bg-white/40 hover:bg-white/70")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MenuCaracteristicas({ caracteristicas, sel, alternar, limpar }: {
  caracteristicas: Caracteristica[]; sel: string[]; alternar: (id: string) => void; limpar: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setAberto(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fora);
    window.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", fora); window.removeEventListener("keydown", esc); };
  }, [aberto]);
  const grupos = [...new Set(caracteristicas.map((c) => c.grupo))];

  return (
    <div ref={ref}>
      <button
        onClick={() => setAberto((x) => !x)}
        className={clsx(
          "inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm font-semibold text-white transition",
          aberto ? "border-white bg-black/80" : "border-white/70 bg-black/40 hover:bg-black/60",
        )}
      >
        <SlidersHorizontal size={14} /> Características
        {sel.length > 0 && <span className="rounded-full bg-white px-1.5 text-[11px] font-bold text-black">{sel.length}</span>}
        <ChevronDown size={14} className={clsx("transition", aberto && "rotate-180")} />
      </button>
      {aberto && (
        <div className="absolute inset-x-4 top-full z-30 md:top-[4.25rem] max-h-[70vh] overflow-y-auto rounded-md border border-white/10 bg-black/95 p-5 text-white shadow-2xl backdrop-blur sm:inset-x-6 lg:inset-x-8">
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4 xl:grid-cols-7">
            {grupos.map((g) => (
              <div key={g} className={clsx(g === "Soluções adicionais" && "col-span-2 sm:col-span-4 xl:col-span-7")}>
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">{g}</div>
                <div className={clsx(g === "Soluções adicionais" ? "grid grid-cols-2 gap-x-6 sm:grid-cols-4 xl:grid-cols-7" : "space-y-0.5")}>
                  {caracteristicas.filter((c) => c.grupo === g).map((c) => {
                    const ativo = sel.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => alternar(c.id)}
                        className={clsx("flex w-full items-center gap-2 py-0.5 text-left text-sm transition hover:text-white hover:underline", ativo ? "font-semibold text-white" : "text-white/70")}
                      >
                        <span className={clsx("flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border", ativo ? "border-white bg-white text-black" : "border-white/40")}>
                          {ativo && <Check size={10} strokeWidth={4} />}
                        </span>
                        {c.rotulo}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-white/50">
            <span>Opções do mesmo grupo somam; grupos diferentes se combinam.</span>
            {sel.length > 0 && <button onClick={limpar} className="font-semibold text-white hover:underline">Limpar</button>}
          </div>
        </div>
      )}
    </div>
  );
}

function BuscaExpansivel({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  const [aberta, setAberta] = useState(!!valor);
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className={clsx("flex items-center rounded-md transition-all", aberta ? "w-56 bg-black/70 ring-1 ring-white/60" : "w-9")}>
      <button
        onClick={() => { setAberta(true); setTimeout(() => ref.current?.focus(), 50); }}
        aria-label="Buscar produto"
        className="flex h-9 w-9 shrink-0 items-center justify-center text-white"
      >
        <Search size={18} />
      </button>
      {aberta && (
        <input
          ref={ref}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => !valor && setAberta(false)}
          placeholder="Nome ou registro ANS"
          className="w-full bg-transparent pr-2 text-sm text-white placeholder:text-white/50 focus:outline-none"
        />
      )}
    </div>
  );
}

function CardProduto({ p, onClick, largura }: { p: Produto; onClick: () => void; largura?: string }) {
  return (
    <CardStreaming
      onClick={onClick}
      largura={largura}
      capa={<ProdutoCapa produto={p} titulo={false} />}
      titulo={
        <>
          {p.statusComercial === "Em elaboração" && (
            <span className="mb-1 inline-block rounded-sm bg-white px-1.5 py-px text-[9px] font-extrabold uppercase tracking-wider text-red-600">Em breve</span>
          )}
          {p.statusComercial === "Fora de comercialização" && (
            <span className="mb-1 inline-block rounded-sm bg-black/70 px-1.5 py-px text-[9px] font-extrabold uppercase tracking-wider text-white">Fora de venda</span>
          )}
          <Kicker produto={p} />
          <div className="font-display text-[26px] uppercase leading-[0.9] tracking-wide text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">{nomeCurto(p)}</div>
        </>
      }
      info={
        <>
          <span className="font-semibold text-emerald-300">{brl(p.precoComercial[0])}</span>
          <span className="truncate text-white/80">{resumo(p).join(" · ")}</span>
        </>
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/* Espiada: janela de detalhes do produto                              */
/* ------------------------------------------------------------------ */

function Espiada({ p, onClose, onAbrir }: { p: Produto; onClose: () => void; onAbrir: (id: string) => void }) {
  const produtos = useStore((s) => s.produtos);
  const solucoes = useStore((s) => s.solucoes);
  const prestadores = useStore((s) => s.prestadores);
  const perm = usePermissoes();
  const permitidas = solucoes.filter((s) => p.solucoes.includes(s.id) && s.ativa);
  const semelhantes = produtos
    .filter((x) => x.id !== p.id && tipoPessoa(x.contratacao) === tipoPessoa(p.contratacao) && x.statusComercial !== "Fora de comercialização")
    .sort((a, b) => Number(b.linha === p.linha) - Number(a.linha === p.linha) || Math.abs(a.precoComercial[0] - p.precoComercial[0]) - Math.abs(b.precoComercial[0] - p.precoComercial[0]))
    .slice(0, 3);
  const max = Math.max(...p.precoComercial);
  const rede = prestadores.filter((x) => p.rede.includes(x.id));

  return (
    <JanelaDetalhe
      onClose={onClose}
      capa={<ProdutoCapa produto={p} variante="hero" titulo={false} />}
      sobre={
        <div className="absolute bottom-0 left-0 p-6 sm:p-8">
          <Kicker produto={p} className="text-xs" />
          <h2 className="font-display text-5xl uppercase leading-[0.85] tracking-wide text-white drop-shadow-lg sm:text-6xl">{nomeCurto(p)}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/produto/?id=${p.id}`} className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-bold text-black hover:bg-white/80">
              <Play size={16} className="fill-black" /> Ver ficha completa
            </Link>
            <Link href={`/comparativos/?a=${p.id}`} title="Comparar" className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/60 bg-black/30 text-white hover:border-white">
              <GitCompare size={16} />
            </Link>
            {perm.editarProdutos && (
              <Link href={`/produto/editar/?id=${p.id}`} title="Editar" className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/60 bg-black/30 text-white hover:border-white">
                <Edit3 size={16} />
              </Link>
            )}
          </div>
        </div>
      }
    >
      <div className="grid gap-6 px-6 pb-6 pt-2 sm:grid-cols-[1.6fr_1fr] sm:px-8">
        <div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
            <span className={clsx("font-semibold", p.statusComercial === "Em comercialização" ? "text-emerald-600" : "text-gray-500")}>{p.statusComercial}</span>
            <LinhaSelo produto={p} fundoClaro />
            <span className="rounded border border-gray-300 px-1.5 text-xs text-gray-600">{tipoPessoa(p.contratacao)}</span>
            <span className="text-gray-600">{siglaSegmentacao(p.segmentacao)}</span>
            {p.redeNacional && (
              <span className="rounded px-1.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-white" style={{ background: NIVEL_COR[p.redeNacional] }}>
                + Rede Nacional {p.redeNacional}
              </span>
            )}
          </div>
          <p className="mt-3 text-gray-700">{p.descricao}</p>
        </div>
        <div className="space-y-1.5 text-sm">
          <p><span className="text-gray-500">Contratação: </span><span className="text-gray-800">{p.contratacao}</span></p>
          <p><span className="text-gray-500">Abrangência: </span><span className="text-gray-800">{p.abrangencia}</span></p>
          <p><span className="text-gray-500">Acomodação: </span><span className="text-gray-800">{p.acomodacao}</span></p>
          <p><span className="text-gray-500">Coparticipação: </span><span className="text-gray-800">{p.fatorModerador}</span></p>
        </div>
      </div>

      <div className="grid gap-6 border-t border-gray-200 px-6 py-6 sm:grid-cols-2 sm:px-8">
        <div>
          <h3 className="mb-3 font-bold text-gray-900">Preço por faixa etária</h3>
          <div className="flex h-24 items-end gap-1">
            {p.precoComercial.map((v, i) => (
              <div key={i} title={`${FAIXAS_ETARIAS[i]}: ${brl(v)}`} className="flex-1 rounded-t-sm transition hover:opacity-80" style={{ height: `${(v / max) * 100}%`, background: `linear-gradient(to top, ${tom(p.cor, -0.2)}, ${tom(p.cor, 0.35)})` }} />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-gray-500">
            <span>0–18 · <strong className="text-gray-800">{brl(p.precoComercial[0])}</strong></span>
            <span>59+ · <strong className="text-gray-800">{brl(p.precoComercial[9])}</strong></span>
          </div>
        </div>
        <div>
          <h3 className="mb-3 font-bold text-gray-900">Rede direta</h3>
          <div className="grid grid-cols-5 gap-2 text-center">
            {TIPOS_PRESTADOR.map((t) => (
              <div key={t} className="rounded-md bg-gray-50 px-1 py-2 ring-1 ring-gray-200">
                <div className="text-xl font-bold text-gray-900">{rede.filter((r) => r.tipo === t).length}</div>
                <div className="text-[10px] leading-tight text-gray-500">{t === "Pronto atendimento" ? "PA" : t}</div>
              </div>
            ))}
          </div>
          {p.redeNacional && <p className="mt-2 text-xs text-gray-500">+ todos os prestadores da Rede Nacional {p.redeNacional}.</p>}
        </div>
      </div>

      {permitidas.length > 0 && (
        <div className="border-t border-gray-200 px-6 py-6 sm:px-8">
          <h3 className="mb-3 font-bold text-gray-900">Combina com · soluções adicionais</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {permitidas.map((s) => (
              <Link key={s.id} href="/solucoes/" className="aspect-video overflow-hidden rounded-md shadow ring-1 ring-black/5 transition hover:scale-[1.03]">
                <CapaSolucao solucao={s} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {semelhantes.length > 0 && (
        <div className="border-t border-gray-200 px-6 py-6 sm:px-8">
          <h3 className="mb-3 font-bold text-gray-900">Produtos semelhantes</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {semelhantes.map((x) => (
              <button key={x.id} onClick={() => onAbrir(x.id)} className="overflow-hidden rounded-md bg-gray-50 text-left ring-1 ring-gray-200 transition hover:ring-gray-400">
                <div className="aspect-video"><ProdutoCapa produto={x} /></div>
                <div className="p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-600">{brl(x.precoComercial[0])}</span>
                    <span className="text-gray-500">{x.abrangencia === "Nacional" ? "Nacional" : "Regional"}</span>
                  </div>
                  <p className="mt-1 line-clamp-3 text-xs text-gray-500">{x.descricao}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

    </JanelaDetalhe>
  );
}
