"use client";

import { Check, ShieldCheck, X } from "lucide-react";
import { useMemo, useState } from "react";
import { FeedItem } from "@/components/feed";
import { Modal, PageHeader, Tabs, Vazio } from "@/components/ui";
import { usePermissoes, useStore } from "@/lib/store";
import type { TipoAlteracao } from "@/lib/types";

const TIPOS: ("Todos" | TipoAlteracao)[] = ["Todos", "Preço", "Rede", "Status", "Coparticipação", "Material", "Soluções adicionais", "Cadastro", "Novo produto"];

function grupoData(iso: string) {
  const d = new Date(iso);
  const hoje = new Date();
  const dias = Math.floor((new Date(hoje.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86400000);
  if (dias <= 0) return "Hoje";
  if (dias === 1) return "Ontem";
  if (dias < 7) return "Nesta semana";
  if (dias < 31) return "Neste mês";
  return "Anteriores";
}

export default function NotificacoesPage() {
  const perm = usePermissoes();
  const abas = perm.moderar ? (["Feed", "Moderação", "Descartadas"] as const) : (["Feed"] as const);
  const [aba, setAba] = useState<(typeof abas)[number]>("Feed");
  const alteracoes = useStore((s) => s.alteracoes);
  const contagem = {
    Feed: alteracoes.filter((a) => a.status === "Publicada").length,
    Moderação: alteracoes.filter((a) => a.status === "Pendente").length,
    Descartadas: alteracoes.filter((a) => a.status === "Descartada").length,
  };

  return (
    <>
      <PageHeader titulo="Notificações" subtitulo="Central de atualizações do portfólio" />
      <div className="card p-0">
        <div className="px-4 pt-2"><Tabs abas={abas} ativa={aba} onChange={setAba} contagem={contagem} /></div>
        <div className="p-6">
          {aba === "Feed" && <Feed />}
          {aba === "Moderação" && <Moderacao />}
          {aba === "Descartadas" && <Descartadas />}
        </div>
      </div>
    </>
  );
}

function Feed() {
  const alteracoes = useStore((s) => s.alteracoes);
  const produtos = useStore((s) => s.produtos);
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]>("Todos");
  const [produtoId, setProdutoId] = useState("");
  const lista = alteracoes
    .filter((a) => a.status === "Publicada")
    .filter((a) => tipo === "Todos" || a.tipo === tipo)
    .filter((a) => !produtoId || a.produtoId === produtoId)
    .sort((a, b) => b.data.localeCompare(a.data));

  const grupos = useMemo(() => {
    const m = new Map<string, typeof lista>();
    lista.forEach((a) => {
      const g = grupoData(a.data);
      m.set(g, [...(m.get(g) ?? []), a]);
    });
    return [...m.entries()];
  }, [lista]);

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-2">
        {TIPOS.map((t) => (
          <button
            key={t}
            onClick={() => setTipo(t)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${tipo === t ? "bg-accent text-white ring-accent" : "bg-surface text-gray-600 ring-gray-300 hover:bg-gray-50"}`}
          >
            {t}
          </button>
        ))}
        <select className="input ml-auto w-auto py-1 text-xs" value={produtoId} onChange={(e) => setProdutoId(e.target.value)}>
          <option value="">Todos os produtos</option>
          {produtos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
      </div>
      {grupos.length === 0 ? (
        <Vazio texto="Nenhuma atualização publicada com esses filtros." />
      ) : (
        <div className="space-y-6">
          {grupos.map(([g, itens]) => (
            <div key={g}>
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">{g}</div>
              <div className="space-y-3">{itens.map((a) => <FeedItem key={a.id} alteracao={a} />)}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Moderacao() {
  const alteracoes = useStore((s) => s.alteracoes);
  const moderar = useStore((s) => s.moderar);
  const pendentes = alteracoes.filter((a) => a.status === "Pendente");
  const [sel, setSel] = useState<string[]>([]);
  const [descartar, setDescartar] = useState<string[] | null>(null);
  const [motivo, setMotivo] = useState("Erro material");

  if (!pendentes.length)
    return <Vazio icone={<ShieldCheck size={32} className="text-brand-500" />} texto="Nenhuma alteração aguardando moderação." />;

  return (
    <>
      <div className="mb-4 rounded-xl bg-brand-50 p-4 text-sm text-brand-800">
        Escolha quais alterações devem aparecer no feed de notificações. Correções de erro material, por exemplo, podem ser descartadas
        — a alteração continua valendo no cadastro, apenas não é comunicada.
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="mr-auto flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-brand-600"
            checked={sel.length === pendentes.length}
            onChange={(e) => setSel(e.target.checked ? pendentes.map((p) => p.id) : [])}
          />
          Selecionar todas ({sel.length})
        </label>
        <button className="btn-primary" disabled={!sel.length} onClick={() => { moderar(sel, "Publicada"); setSel([]); }}>
          <Check size={16} /> Publicar selecionadas
        </button>
        <button className="btn-outline" disabled={!sel.length} onClick={() => setDescartar(sel)}>
          <X size={16} /> Descartar selecionadas
        </button>
      </div>
      <div className="space-y-3">
        {pendentes.map((a) => (
          <div key={a.id} className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-6 accent-brand-600"
              checked={sel.includes(a.id)}
              onChange={(e) => setSel(e.target.checked ? [...sel, a.id] : sel.filter((x) => x !== a.id))}
            />
            <div className="flex-1">
              <FeedItem
                alteracao={a}
                acoes={
                  <>
                    <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => moderar([a.id], "Publicada")}><Check size={14} /> Publicar</button>
                    <button className="btn-outline px-3 py-1.5 text-xs" onClick={() => setDescartar([a.id])}><X size={14} /> Descartar</button>
                  </>
                }
              />
            </div>
          </div>
        ))}
      </div>

      <Modal aberto={!!descartar} onClose={() => setDescartar(null)} titulo="Descartar do feed">
        <label className="label">Motivo</label>
        <select className="input mb-4" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
          <option>Erro material</option>
          <option>Alteração sem impacto para o usuário</option>
          <option>Duplicidade</option>
          <option>Comunicação será feita por outro canal</option>
        </select>
        <div className="flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setDescartar(null)}>Cancelar</button>
          <button
            className="btn-danger"
            onClick={() => { moderar(descartar!, "Descartada", motivo); setSel([]); setDescartar(null); }}
          >
            Descartar
          </button>
        </div>
      </Modal>
    </>
  );
}

function Descartadas() {
  const alteracoes = useStore((s) => s.alteracoes);
  const moderar = useStore((s) => s.moderar);
  const lista = alteracoes.filter((a) => a.status === "Descartada");
  if (!lista.length) return <Vazio texto="Nenhuma alteração descartada." />;
  return (
    <div className="space-y-3">
      {lista.map((a) => (
        <FeedItem
          key={a.id}
          alteracao={a}
          acoes={<button className="btn-outline px-3 py-1.5 text-xs" onClick={() => moderar([a.id], "Publicada")}>Publicar mesmo assim</button>}
        />
      ))}
    </div>
  );
}
