"use client";

import clsx from "clsx";
import { Globe2, Search, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { NIVEL_COR } from "@/components/produto";
import { TIPO_META } from "@/components/rede-meta";
import { useEscuro } from "@/components/ThemeToggle";
import { useStore } from "@/lib/store";
import { TIPOS_PRESTADOR, type TipoPrestador } from "@/lib/types";
import type { Ponto } from "@/components/MapaRede";

// Leaflet usa window: o mapa só é carregado no navegador.
const MapaRede = dynamic(() => import("@/components/MapaRede"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-gray-400">Carregando mapa…</div>,
});

export default function MapaPage() {
  const prestadores = useStore((s) => s.prestadores);
  const produtos = useStore((s) => s.produtos);
  const redesNacionais = useStore((s) => s.redesNacionais);
  const escuro = useEscuro();
  const [produtoId, setProdutoId] = useState("");
  const [tipos, setTipos] = useState<TipoPrestador[]>([...TIPOS_PRESTADOR]);
  const [cidade, setCidade] = useState("");
  const [busca, setBusca] = useState("");
  const [soDestaques, setSoDestaques] = useState(false);

  const produto = produtos.find((p) => p.id === produtoId);
  const base = useMemo(
    () => prestadores.filter((p) => p.ativo || produto?.rede.includes(p.id)).filter((p) => !produto || produto.rede.includes(p.id)),
    [prestadores, produto],
  );
  const pontosBase: Ponto[] = useMemo(() => base.flatMap((p) => p.unidades.map((u) => ({ u, p }))), [base]);
  const cidades = [...new Set(pontosBase.map((x) => x.u.cidade))].sort();

  const pontos = pontosBase.filter(({ u, p }) => {
    if (!tipos.includes(p.tipo)) return false;
    if (cidade && u.cidade !== cidade) return false;
    if (soDestaques && !p.destaque) return false;
    const q = busca.trim().toLowerCase();
    return !q || `${p.nome} ${u.bairro}`.toLowerCase().includes(q);
  });
  const contagem = (t: TipoPrestador) => pontosBase.filter((x) => x.p.tipo === t && (!cidade || x.u.cidade === cidade)).length;
  const alternarTipo = (t: TipoPrestador) =>
    setTipos((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]));
  const nPrestadores = new Set(pontos.map((x) => x.p.id)).size;

  return (
    <div className="relative isolate -mx-4 -mt-4 h-[calc(100dvh-5.5rem)] sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8 lg:h-[calc(100dvh-1.75rem)]">
      <MapaRede pontos={pontos} produtos={produtos} escuro={escuro} />

      {/* Filtros flutuantes */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] p-3 sm:p-4">
        <div className="pointer-events-auto mx-auto flex max-w-5xl flex-col gap-3 rounded-2xl border border-gray-200/70 bg-surface/90 p-3 shadow-xl backdrop-blur-md">
          <div className="flex flex-wrap items-end gap-2">
            <div className="mr-1">
              <div className="text-lg font-bold leading-tight text-gray-900">Mapa de Rede</div>
              <div className="text-[11px] text-gray-500">13 municípios · rede direta</div>
            </div>
            <div className="min-w-48 flex-1">
              <span className="filtro-label">Produto</span>
              <select className="input py-1.5" value={produtoId} onChange={(e) => { setProdutoId(e.target.value); setCidade(""); }}>
                <option value="">Toda a rede cadastrada</option>
                {produtos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div className="w-44">
              <span className="filtro-label">Cidade</span>
              <select className="input py-1.5" value={cidade} onChange={(e) => setCidade(e.target.value)}>
                <option value="">Todas</option>
                {cidades.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="w-48">
              <span className="filtro-label">Buscar</span>
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="input py-1.5 pl-8" placeholder="Prestador ou bairro" value={busca} onChange={(e) => setBusca(e.target.value)} />
                {busca && (
                  <button onClick={() => setBusca("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700" aria-label="Limpar busca"><X size={14} /></button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {TIPOS_PRESTADOR.map((t) => {
              const { icon: Icon, cor, plural } = TIPO_META[t];
              const ativo = tipos.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => alternarTipo(t)}
                  onDoubleClick={() => setTipos([t])}
                  title="Clique para mostrar/ocultar · duplo clique para ver só este tipo"
                  className={clsx(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition",
                    ativo ? "border-transparent text-white shadow-sm" : "border-gray-300 bg-surface text-gray-400 hover:text-gray-600",
                  )}
                  style={ativo ? { background: cor } : undefined}
                >
                  <Icon size={13} /> {plural}
                  <span className={clsx("rounded-full px-1.5 text-[10px]", ativo ? "bg-white/25" : "bg-gray-100")}>{contagem(t)}</span>
                </button>
              );
            })}
            <button
              onClick={() => setSoDestaques((x) => !x)}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition",
                soDestaques ? "border-amber-400 bg-amber-50 text-amber-800" : "border-gray-300 text-gray-500 hover:text-gray-700",
              )}
            >
              <span className="h-2.5 w-2.5 rounded-full ring-2 ring-amber-400" /> Referência
            </button>
            <span className="ml-auto text-xs text-gray-500">
              <strong className="text-gray-800">{pontos.length}</strong> unidades · {nPrestadores} prestadores
            </span>
          </div>

          {produto?.redeNacional && (
            <div className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs text-white" style={{ background: NIVEL_COR[produto.redeNacional] }}>
              <Globe2 size={15} className="mt-px shrink-0" />
              <span>
                <strong>+ Rede Nacional {produto.redeNacional}</strong> — além da rede direta exibida no mapa.{" "}
                <span className="text-white/85">{redesNacionais.find((r) => r.nivel === produto.redeNacional)?.descricao}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {pontos.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-[400] flex items-center justify-center">
          <div className="rounded-xl bg-surface/90 px-4 py-3 text-sm text-gray-600 shadow-lg backdrop-blur">Nenhum prestador com esses filtros.</div>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-6 left-4 z-[500] text-[10px] text-gray-500">
        Localização aproximada · dados fictícios
      </div>
    </div>
  );
}
