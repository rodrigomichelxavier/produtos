"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight, Edit3, ImagePlus, Info, Plus, Search, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ProdutoCapa } from "@/components/produto";
import { CapaSolucao, ICONES, tom } from "@/components/solucao";
import { Modal } from "@/components/ui";
import { brl } from "@/lib/ans";
import { usePermissoes, useStore } from "@/lib/store";
import { ICONES_SOLUCAO, type Produto, type SolucaoAdicional } from "@/lib/types";

const CATEGORIAS: SolucaoAdicional["categoria"][] = ["Assistência", "Bem-estar", "Benefícios", "Seguros"];
const preco = (s: SolucaoAdicional) => (s.precoMensal ? `${brl(s.precoMensal)}/mês` : "Sem custo adicional");

export default function SolucoesPage() {
  const solucoes = useStore((s) => s.solucoes);
  const produtos = useStore((s) => s.produtos);
  const perm = usePermissoes();
  const [aberta, setAberta] = useState<string | null>(null);
  const [editando, setEditando] = useState<SolucaoAdicional | null>(null);
  const [produtoId, setProdutoId] = useState("");
  const [busca, setBusca] = useState("");

  const qtd = (s: SolucaoAdicional) => produtos.filter((p) => p.solucoes.includes(s.id)).length;
  const produtoFiltro = produtos.find((p) => p.id === produtoId);
  const visiveis = solucoes
    .filter((s) => !produtoFiltro || produtoFiltro.solucoes.includes(s.id))
    .filter((s) => !busca.trim() || `${s.nome} ${s.fornecedor} ${s.categoria}`.toLowerCase().includes(busca.trim().toLowerCase()));
  const ativas = visiveis.filter((s) => s.ativa);
  const ranking = [...ativas].sort((a, b) => qtd(b) - qtd(a)).slice(0, 10);
  const destaques = ranking.slice(0, 5);
  const solAberta = solucoes.find((s) => s.id === aberta);

  const novo = (): SolucaoAdicional => ({
    id: "", nome: "", icone: "vida", categoria: "Assistência", fornecedor: "", descricao: "", precoMensal: 0,
    cobranca: "Por beneficiário", ativa: true, cor: "#0369a1",
  });

  return (
    <div className="-mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8">
      {destaques.length > 0 ? (
        <Hero destaques={destaques} qtd={qtd} total={produtos.length} onDetalhes={setAberta} />
      ) : (
        <div className="h-24" />
      )}

      {/* Barra de ferramentas sobreposta ao fim do hero */}
      <div className="relative z-10 -mt-6 flex flex-wrap items-center gap-2 px-4 sm:px-6 lg:px-8">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input w-56 rounded-full pl-9 shadow-sm" placeholder="Buscar solução" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <select className="input w-auto rounded-full shadow-sm" value={produtoId} onChange={(e) => setProdutoId(e.target.value)}>
          <option value="">Todas as soluções</option>
          {produtos.map((p) => <option key={p.id} value={p.id}>Disponíveis no {p.nome}</option>)}
        </select>
        {perm.gerenciarSolucoes && (
          <button className="btn-primary ml-auto rounded-full shadow-sm" onClick={() => setEditando(novo())}>
            <Plus size={16} /> Nova solução
          </button>
        )}
      </div>

      <div className="space-y-2 pb-10 pt-4">
        {visiveis.length === 0 && (
          <p className="px-4 py-16 text-center text-gray-500 sm:px-6 lg:px-8">Nenhuma solução encontrada.</p>
        )}
        {ranking.length >= 3 && !busca && (
          <Fileira titulo={produtoFiltro ? `Top no ${produtoFiltro.nome}` : "Top soluções no portfólio"}>
            {ranking.map((s, i) => (
              <button key={s.id} onClick={() => setAberta(s.id)} className="group relative flex shrink-0 snap-start items-end pl-2 text-left">
                <span className="numero-top -mr-5 select-none text-[150px] transition group-hover:-translate-x-1">{i + 1}</span>
                <div className="relative z-[1] aspect-[2/3] w-32 overflow-hidden rounded-md shadow-lg ring-1 ring-black/5 transition duration-300 group-hover:scale-105 sm:w-36">
                  <CapaSolucao solucao={s} variante="poster" />
                </div>
              </button>
            ))}
          </Fileira>
        )}
        {CATEGORIAS.map((c) => {
          const lista = ativas.filter((s) => s.categoria === c);
          if (!lista.length) return null;
          return (
            <Fileira key={c} titulo={c}>
              {lista.map((s) => <CardSolucao key={s.id} s={s} qtd={qtd(s)} total={produtos.length} onClick={() => setAberta(s.id)} />)}
            </Fileira>
          );
        })}
        {visiveis.some((s) => !s.ativa) && (
          <Fileira titulo="Fora de venda">
            {visiveis.filter((s) => !s.ativa).map((s) => (
              <CardSolucao key={s.id} s={s} qtd={qtd(s)} total={produtos.length} onClick={() => setAberta(s.id)} />
            ))}
          </Fileira>
        )}
      </div>

      {solAberta && (
        <Detalhe
          s={solAberta}
          onClose={() => setAberta(null)}
          onEditar={perm.gerenciarSolucoes ? () => { setEditando(solAberta); setAberta(null); } : undefined}
        />
      )}
      {editando && <FormSolucao solucao={editando} onClose={() => setEditando(null)} />}
    </div>
  );
}

/* ---------------------------------- Hero ---------------------------------- */

function Hero({ destaques, qtd, total, onDetalhes }: {
  destaques: SolucaoAdicional[]; qtd: (s: SolucaoAdicional) => number; total: number; onDetalhes: (id: string) => void;
}) {
  const [i, setI] = useState(0);
  const [pausado, setPausado] = useState(false);
  const atual = destaques[i % destaques.length];

  useEffect(() => {
    if (pausado || destaques.length < 2) return;
    const t = window.setTimeout(() => setI((x) => (x + 1) % destaques.length), 7000);
    return () => window.clearTimeout(t);
  }, [i, pausado, destaques.length]);

  return (
    <section
      className="relative h-[440px] overflow-hidden bg-black sm:h-[480px]"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      {destaques.map((s, j) => (
        <div key={s.id} className={clsx("absolute inset-0 transition-opacity duration-1000", j === i % destaques.length ? "opacity-100" : "opacity-0")}>
          <CapaSolucao solucao={s} variante="hero" titulo={false} className={clsx("transition-transform duration-[8000ms] ease-out", j === i % destaques.length && "scale-105")} />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-page to-transparent" />

      <div key={atual.id} className="relative flex h-full max-w-2xl flex-col justify-center px-6 pb-10 text-white sm:px-10 lg:px-12">
        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/80">
          <span className="h-4 w-1 rounded-full" style={{ background: tom(atual.cor, 0.3) }} />
          Solução adicional · {atual.categoria}
        </div>
        <h1 className="font-display text-6xl uppercase leading-[0.85] tracking-wide drop-shadow-lg sm:text-7xl lg:text-8xl">{atual.nome}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="font-semibold text-emerald-300">Em {qtd(atual)} de {total} produtos</span>
          <span className="text-white/40">•</span>
          <span className="text-white/90">{preco(atual)}</span>
          {atual.precoMensal > 0 && <span className="rounded border border-white/40 px-1.5 text-[11px] text-white/80">{atual.cobranca}</span>}
        </div>
        <p className="mt-3 line-clamp-3 max-w-xl text-sm text-white/85 sm:text-base">{atual.descricao}</p>
        <div className="mt-6 flex gap-3">
          <button onClick={() => onDetalhes(atual.id)} className="inline-flex items-center gap-2 rounded-md bg-white px-5 py-2.5 text-sm font-bold text-black transition hover:bg-white/80">
            <Info size={18} /> Mais informações
          </button>
        </div>
      </div>

      {destaques.length > 1 && (
        <div className="absolute bottom-10 right-6 flex gap-1.5 sm:right-10">
          {destaques.map((s, j) => (
            <button
              key={s.id}
              onClick={() => setI(j)}
              aria-label={`Destaque ${j + 1}: ${s.nome}`}
              className={clsx("h-1 rounded-full transition-all", j === i % destaques.length ? "w-8 bg-white" : "w-4 bg-white/40 hover:bg-white/70")}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* -------------------------------- Fileiras -------------------------------- */

function Fileira({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const rolar = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: "smooth" });
  return (
    <section className="group/fileira relative">
      <h2 className="px-4 text-lg font-bold text-gray-900 sm:px-6 lg:px-8">{titulo}</h2>
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

function CardSolucao({ s, qtd, total, onClick }: { s: SolucaoAdicional; qtd: number; total: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative aspect-video w-64 shrink-0 snap-start overflow-hidden rounded-md text-left shadow-md ring-1 ring-black/5 transition duration-300 hover:z-10 hover:scale-[1.06] hover:shadow-2xl sm:w-72"
    >
      <CapaSolucao solucao={s} titulo={false} />
      {/* título + informações que surgem no hover */}
      <div className="absolute inset-x-0 bottom-0 p-3 transition-transform duration-300 group-hover:-translate-y-0">
        <div className="font-display text-[26px] uppercase leading-[0.9] tracking-wide text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
          {s.nome}
        </div>
        <div className="grid grid-rows-[0fr] transition-all duration-300 group-hover:grid-rows-[1fr]">
          <div className="overflow-hidden">
            <div className="flex items-center gap-2 pt-1.5 text-[11px] text-white/90">
              <span className="font-semibold text-emerald-300">{qtd}/{total} produtos</span>
              <span className="rounded border border-white/40 px-1 text-[10px]">{s.categoria}</span>
              <span className="ml-auto font-semibold">{preco(s)}</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

/* --------------------------------- Detalhe -------------------------------- */

function Detalhe({ s, onClose, onEditar }: { s: SolucaoAdicional; onClose: () => void; onEditar?: () => void }) {
  const produtos = useStore((st) => st.produtos);
  const excluir = useStore((st) => st.excluirSolucao);
  const perm = usePermissoes();
  const permitidos = produtos.filter((p) => p.solucoes.includes(s.id));
  const outros = produtos.filter((p) => !p.solucoes.includes(s.id));

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-0 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <div className="mx-auto max-w-3xl overflow-hidden bg-surface shadow-2xl sm:rounded-xl" onClick={(e) => e.stopPropagation()}>
        <div className="relative aspect-video max-h-[420px] w-full">
          <CapaSolucao solucao={s} variante="hero" titulo={false} />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
          <button onClick={onClose} aria-label="Fechar" className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white hover:bg-black/80">
            <X size={20} />
          </button>
          <div className="absolute bottom-0 left-0 p-6 sm:p-8">
            <h2 className="font-display text-5xl uppercase leading-[0.85] tracking-wide text-white drop-shadow-lg sm:text-6xl">{s.nome}</h2>
            <div className="mt-4 flex gap-2">
              {onEditar && (
                <button onClick={onEditar} className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-bold text-black hover:bg-white/80">
                  <Edit3 size={16} /> Editar
                </button>
              )}
              {perm.gerenciarSolucoes && (
                <button
                  onClick={() => { if (confirm(`Excluir "${s.nome}"? Ela será removida de ${permitidos.length} produto(s).`)) { excluir(s.id); onClose(); } }}
                  aria-label="Excluir"
                  className="rounded-full border-2 border-white/60 bg-black/30 p-2 text-white hover:border-white"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 px-6 pb-8 pt-2 sm:grid-cols-[1.6fr_1fr] sm:px-8">
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="font-semibold text-emerald-600">Em {permitidos.length} de {produtos.length} produtos</span>
              <span className="rounded border border-gray-300 px-1.5 text-xs text-gray-600">{s.categoria}</span>
              {!s.ativa && <span className="rounded bg-gray-200 px-1.5 text-xs font-semibold text-gray-700">Fora de venda</span>}
            </div>
            <p className="mt-3 text-gray-700">{s.descricao}</p>
          </div>
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-500">Fornecedor: </span><span className="text-gray-800">{s.fornecedor}</span></p>
            <p><span className="text-gray-500">Preço: </span><span className="font-semibold text-gray-800">{preco(s)}</span></p>
            <p><span className="text-gray-500">Cobrança: </span><span className="text-gray-800">{s.cobranca}</span></p>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-6 sm:px-8">
          <h3 className="mb-3 text-lg font-bold text-gray-900">Disponível nos produtos</h3>
          {permitidos.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {permitidos.map((p) => <MiniProduto key={p.id} p={p} />)}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Nenhum produto permite esta solução ainda.</p>
          )}
          {outros.length > 0 && (
            <>
              <h3 className="mb-2 mt-6 text-sm font-semibold text-gray-500">Não disponível em</h3>
              <div className="flex flex-wrap gap-1.5">
                {outros.map((p) => (
                  <Link key={p.id} href={`/produto/?id=${p.id}`} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500 hover:text-gray-800">{p.nome}</Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniProduto({ p }: { p: Produto }) {
  return (
    <Link href={`/produto/?id=${p.id}`} className="group overflow-hidden rounded-md bg-gray-50 ring-1 ring-gray-200 transition hover:ring-brand-400">
      <ProdutoCapa produto={p} altura={56} />
      <div className="p-2 text-xs font-semibold text-gray-800 group-hover:text-brand-700">{p.nome}</div>
    </Link>
  );
}

/* -------------------------------- Formulário ------------------------------- */

function reduzirImagem(f: File, cb: (url: string) => void) {
  const img = new Image();
  img.onload = () => {
    const w = 1280, h = 720;
    const esc = Math.max(w / img.width, h / img.height);
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    c.getContext("2d")!.drawImage(img, (w - img.width * esc) / 2, (h - img.height * esc) / 2, img.width * esc, img.height * esc);
    cb(c.toDataURL("image/jpeg", 0.82));
  };
  img.src = URL.createObjectURL(f);
}

function FormSolucao({ solucao, onClose }: { solucao: SolucaoAdicional; onClose: () => void }) {
  const produtos = useStore((st) => st.produtos);
  const salvar = useStore((st) => st.salvarSolucao);
  const [s, setS] = useState(solucao);
  const [permitidos, setPermitidos] = useState(produtos.filter((p) => p.solucoes.includes(solucao.id)).map((p) => p.id));
  const arquivo = useRef<HTMLInputElement>(null);
  const valido = s.nome.trim() && s.fornecedor.trim();
  const previa = useMemo(() => ({ ...s, nome: s.nome || "Nome da solução" }), [s]);

  return (
    <Modal aberto onClose={onClose} titulo={solucao.id ? "Editar solução adicional" : "Nova solução adicional"} largura="max-w-3xl">
      <div className="grid gap-5 md:grid-cols-[1fr_260px]">
        <div className="grid content-start gap-4 sm:grid-cols-2">
          <div><label className="label">Nome</label><input className="input" value={s.nome} onChange={(e) => setS({ ...s, nome: e.target.value })} placeholder="Ex.: Cobertura Aeromédica" /></div>
          <div><label className="label">Fornecedor / parceiro</label><input className="input" value={s.fornecedor} onChange={(e) => setS({ ...s, fornecedor: e.target.value })} /></div>
          <div>
            <label className="label">Categoria</label>
            <select className="input" value={s.categoria} onChange={(e) => setS({ ...s, categoria: e.target.value as SolucaoAdicional["categoria"] })}>
              {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Cobrança</label>
            <select className="input" value={s.cobranca} onChange={(e) => setS({ ...s, cobranca: e.target.value as SolucaoAdicional["cobranca"] })}>
              <option>Por beneficiário</option><option>Por contrato</option>
            </select>
          </div>
          <div><label className="label">Preço mensal (R$)</label><input type="number" step="0.01" className="input" value={s.precoMensal} onChange={(e) => setS({ ...s, precoMensal: Number(e.target.value) })} /></div>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input type="checkbox" className="accent-brand-600" checked={s.ativa} onChange={(e) => setS({ ...s, ativa: e.target.checked })} />
            Ativa para venda
          </label>
          <div className="sm:col-span-2"><label className="label">Descrição</label><textarea className="input min-h-20" value={s.descricao} onChange={(e) => setS({ ...s, descricao: e.target.value })} /></div>
        </div>

        {/* Capa */}
        <div>
          <label className="label">Capa</label>
          <div className="aspect-video overflow-hidden rounded-md shadow ring-1 ring-black/10">
            <CapaSolucao solucao={previa} />
          </div>
          <div className="mt-2 flex gap-2">
            <button type="button" className="btn-outline flex-1 px-2 py-1.5 text-xs" onClick={() => arquivo.current?.click()}>
              <ImagePlus size={14} /> {s.imagem ? "Trocar foto" : "Enviar foto"}
            </button>
            {s.imagem && (
              <button type="button" className="btn-outline px-2 py-1.5 text-xs" onClick={() => setS({ ...s, imagem: undefined })}>Usar arte</button>
            )}
          </div>
          <input ref={arquivo} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && reduzirImagem(e.target.files[0], (url) => setS({ ...s, imagem: url }))} />
          {!s.imagem && (
            <>
              <label className="label mt-3">Ícone da arte</label>
              <div className="grid grid-cols-5 gap-1">
                {ICONES_SOLUCAO.map((k) => {
                  const { icon: I, rotulo } = ICONES[k];
                  return (
                    <button
                      key={k}
                      type="button"
                      title={rotulo}
                      onClick={() => setS({ ...s, icone: k })}
                      className={clsx("flex aspect-square items-center justify-center rounded-md ring-1 transition", s.icone === k ? "bg-accent text-white ring-accent" : "text-gray-500 ring-gray-200 hover:bg-gray-50")}
                    >
                      <I size={16} />
                    </button>
                  );
                })}
              </div>
              <label className="label mt-3">Cor</label>
              <input type="color" className="h-9 w-full cursor-pointer rounded-md border border-gray-300" value={s.cor} onChange={(e) => setS({ ...s, cor: e.target.value })} />
            </>
          )}
          <p className="mt-2 text-[11px] text-gray-400">Fotos são ajustadas para 16:9 (1280×720).</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <label className="label">Produtos que permitem esta solução ({permitidos.length})</label>
          <div className="flex gap-3 text-xs font-semibold text-brand-700">
            <button onClick={() => setPermitidos(produtos.map((p) => p.id))}>Todos</button>
            <button onClick={() => setPermitidos([])}>Nenhum</button>
          </div>
        </div>
        <div className="grid max-h-48 gap-1 overflow-y-auto rounded-xl border border-gray-200 p-3 sm:grid-cols-2">
          {produtos.map((p) => (
            <label key={p.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-brand-600"
                checked={permitidos.includes(p.id)}
                onChange={(e) => setPermitidos(e.target.checked ? [...permitidos, p.id] : permitidos.filter((x) => x !== p.id))}
              />
              {p.nome}
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-400">As mudanças de permissão geram notificações no feed de cada produto afetado.</p>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button className="btn-outline" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" disabled={!valido} onClick={() => { salvar(s, permitidos); onClose(); }}>Salvar</button>
      </div>
    </Modal>
  );
}
