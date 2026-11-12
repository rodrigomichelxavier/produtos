"use client";

import { Edit3, Plus, Puzzle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge, Modal, PageHeader, Vazio } from "@/components/ui";
import { brl } from "@/lib/ans";
import { usePermissoes, useStore } from "@/lib/store";
import type { SolucaoAdicional } from "@/lib/types";

const CATEGORIAS: SolucaoAdicional["categoria"][] = ["Assistência", "Bem-estar", "Benefícios", "Seguros"];

export default function SolucoesPage() {
  const solucoes = useStore((s) => s.solucoes);
  const produtos = useStore((s) => s.produtos);
  const excluir = useStore((s) => s.excluirSolucao);
  const perm = usePermissoes();
  const [editando, setEditando] = useState<SolucaoAdicional | null>(null);
  const [filtro, setFiltro] = useState<string>("Todas");

  const lista = solucoes.filter((s) => filtro === "Todas" || s.categoria === filtro);
  const novo = (): SolucaoAdicional => ({
    id: "", nome: "", categoria: "Assistência", fornecedor: "", descricao: "", precoMensal: 0, cobranca: "Por beneficiário", ativa: true, cor: "#0284c7",
  });

  return (
    <>
      <PageHeader
        titulo="Soluções adicionais"
        subtitulo="Serviços que podem ser vendidos junto com os planos — cada produto define quais permite"
        acoes={perm.gerenciarSolucoes && <button className="btn-primary" onClick={() => setEditando(novo())}><Plus size={16} /> Nova solução</button>}
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {["Todas", ...CATEGORIAS].map((c) => (
          <button
            key={c}
            onClick={() => setFiltro(c)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${filtro === c ? "bg-accent text-white ring-accent" : "bg-surface text-gray-600 ring-gray-300 hover:bg-gray-50"}`}
          >
            {c}
          </button>
        ))}
      </div>

      {lista.length === 0 ? (
        <Vazio icone={<Puzzle size={28} />} texto="Nenhuma solução adicional cadastrada." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {lista.map((s) => {
            const permitidos = produtos.filter((p) => p.solucoes.includes(s.id));
            return (
              <div key={s.id} className={`card flex flex-col overflow-hidden ${!s.ativa ? "opacity-60" : ""}`}>
                <div className="h-2" style={{ background: s.cor }} />
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{s.nome}</h3>
                      <div className="text-xs text-gray-500">{s.fornecedor}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge>{s.categoria}</Badge>
                      {!s.ativa && <Badge tom="amarelo">Inativa</Badge>}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-600">{s.descricao}</p>
                  <div className="mt-3 text-sm">
                    <span className="font-bold text-brand-800">{s.precoMensal ? brl(s.precoMensal) : "Sem custo adicional"}</span>
                    {s.precoMensal > 0 && <span className="text-gray-500"> / mês · {s.cobranca.toLowerCase()}</span>}
                  </div>
                  <div className="mt-4 border-t border-gray-100 pt-3">
                    <div className="filtro-label">Permitida em {permitidos.length} de {produtos.length} produtos</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {permitidos.slice(0, 6).map((p) => (
                        <Link key={p.id} href={`/produto/?id=${p.id}`} className="rounded-md bg-brand-50 px-2 py-0.5 text-xs text-brand-800 hover:underline">{p.nome.replace("Aurora ", "")}</Link>
                      ))}
                      {permitidos.length > 6 && <span className="text-xs text-gray-400">+{permitidos.length - 6}</span>}
                      {!permitidos.length && <span className="text-xs text-gray-400">Nenhum produto</span>}
                    </div>
                  </div>
                  {perm.gerenciarSolucoes && (
                    <div className="mt-4 flex justify-end gap-1">
                      <button className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100" onClick={() => setEditando(s)} aria-label="Editar"><Edit3 size={16} /></button>
                      <button
                        className="rounded-lg p-1.5 text-red-500 hover:bg-gray-100"
                        aria-label="Excluir"
                        onClick={() => confirm(`Excluir "${s.nome}"? Ela será removida de ${permitidos.length} produto(s).`) && excluir(s.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editando && <FormSolucao solucao={editando} onClose={() => setEditando(null)} />}
    </>
  );
}

function FormSolucao({ solucao, onClose }: { solucao: SolucaoAdicional; onClose: () => void }) {
  const produtos = useStore((s) => s.produtos);
  const salvar = useStore((s) => s.salvarSolucao);
  const [s, setS] = useState(solucao);
  const [permitidos, setPermitidos] = useState(produtos.filter((p) => p.solucoes.includes(solucao.id)).map((p) => p.id));
  const valido = s.nome.trim() && s.fornecedor.trim();

  return (
    <Modal aberto onClose={onClose} titulo={solucao.id ? "Editar solução adicional" : "Nova solução adicional"} largura="max-w-2xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label">Nome</label><input className="input" value={s.nome} onChange={(e) => setS({ ...s, nome: e.target.value })} placeholder="Ex.: Cobertura Aeromédica" /></div>
        <div><label className="label">Fornecedor / parceiro</label><input className="input" value={s.fornecedor} onChange={(e) => setS({ ...s, fornecedor: e.target.value })} /></div>
        <div>
          <label className="label">Categoria</label>
          <select className="input" value={s.categoria} onChange={(e) => setS({ ...s, categoria: e.target.value as SolucaoAdicional["categoria"] })}>
            {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-end gap-3">
          <div className="flex-1"><label className="label">Preço mensal (R$)</label><input type="number" step="0.01" className="input" value={s.precoMensal} onChange={(e) => setS({ ...s, precoMensal: Number(e.target.value) })} /></div>
          <div><label className="label">Cor</label><input type="color" className="h-10 w-14 cursor-pointer rounded-lg border border-gray-300" value={s.cor} onChange={(e) => setS({ ...s, cor: e.target.value })} /></div>
        </div>
        <div>
          <label className="label">Cobrança</label>
          <select className="input" value={s.cobranca} onChange={(e) => setS({ ...s, cobranca: e.target.value as SolucaoAdicional["cobranca"] })}>
            <option>Por beneficiário</option><option>Por contrato</option>
          </select>
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input type="checkbox" className="accent-brand-600" checked={s.ativa} onChange={(e) => setS({ ...s, ativa: e.target.checked })} />
          Solução ativa para venda
        </label>
        <div className="sm:col-span-2"><label className="label">Descrição</label><textarea className="input min-h-20" value={s.descricao} onChange={(e) => setS({ ...s, descricao: e.target.value })} /></div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <label className="label">Produtos que permitem esta solução ({permitidos.length})</label>
          <div className="flex gap-3 text-xs font-semibold text-brand-700">
            <button onClick={() => setPermitidos(produtos.map((p) => p.id))}>Todos</button>
            <button onClick={() => setPermitidos([])}>Nenhum</button>
          </div>
        </div>
        <div className="grid max-h-56 gap-1 overflow-y-auto rounded-xl border border-gray-200 p-3 sm:grid-cols-2">
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
