"use client";

import { Edit3, Globe2, Plus, Search, Star, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { NIVEL_COR } from "@/components/produto";
import { Badge, Modal, PageHeader, Tabs, Vazio } from "@/components/ui";
import { MUNICIPIOS_REGIAO } from "@/data/seed";
import { usePermissoes, useStore } from "@/lib/store";
import { TIPOS_PRESTADOR, type InfoRedeNacional, type Prestador, type TipoPrestador } from "@/lib/types";

const ABAS = ["Prestadores (rede direta)", "Redes nacionais"] as const;
const CIDADES = MUNICIPIOS_REGIAO.map((m) => m.split("/")[0]);

export default function RedePage() {
  const perm = usePermissoes();
  const [aba, setAba] = useState<(typeof ABAS)[number]>(ABAS[0]);
  if (!perm.gerenciarRede)
    return (
      <>
        <PageHeader titulo="Gestão de Rede" />
        <Vazio texto="Disponível apenas para Administradores e Gestores." />
      </>
    );
  return (
    <>
      <PageHeader titulo="Gestão de Rede" subtitulo="Cadastro dos prestadores disponíveis para compor a rede dos produtos" />
      <div className="card p-0">
        <div className="px-4 pt-2"><Tabs abas={ABAS} ativa={aba} onChange={setAba} /></div>
        <div className="p-6">{aba === ABAS[0] ? <Prestadores /> : <RedesNacionais />}</div>
      </div>
    </>
  );
}

function Prestadores() {
  const prestadores = useStore((s) => s.prestadores);
  const produtos = useStore((s) => s.produtos);
  const excluir = useStore((s) => s.excluirPrestador);
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<TipoPrestador | "Todos">("Todos");
  const [cidade, setCidade] = useState("Todas");
  const [editando, setEditando] = useState<Prestador | null>(null);

  const uso = (id: string) => produtos.filter((p) => p.rede.includes(id));
  const lista = useMemo(
    () =>
      prestadores
        .filter((p) => tipo === "Todos" || p.tipo === tipo)
        .filter((p) => cidade === "Todas" || p.cidade === cidade)
        .filter((p) => {
          const q = busca.trim().toLowerCase();
          return !q || `${p.nome} ${p.bairro} ${p.cnes ?? ""}`.toLowerCase().includes(q);
        })
        .sort((a, b) => a.cidade.localeCompare(b.cidade) || a.nome.localeCompare(b.nome)),
    [prestadores, tipo, cidade, busca],
  );

  const novo = (): Prestador => ({ id: "", nome: "", tipo: "Hospital", cidade: "Campinas", uf: "SP", bairro: "", cnes: "", ativo: true });

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-52 flex-1">
          <span className="filtro-label">Buscar</span>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Nome, bairro ou CNES" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
        </div>
        <div>
          <span className="filtro-label">Tipo</span>
          <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value as TipoPrestador)}>
            <option>Todos</option>
            {TIPOS_PRESTADOR.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <span className="filtro-label">Cidade</span>
          <select className="input" value={cidade} onChange={(e) => setCidade(e.target.value)}>
            <option>Todas</option>
            {[...new Set(prestadores.map((p) => p.cidade))].sort().map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <button className="btn-primary" onClick={() => setEditando(novo())}><Plus size={16} /> Novo prestador</button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        {TIPOS_PRESTADOR.map((t) => (
          <Badge key={t}>{t}: {prestadores.filter((p) => p.tipo === t).length}</Badge>
        ))}
      </div>

      {lista.length === 0 ? (
        <Vazio texto="Nenhum prestador encontrado." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="py-2 pr-3">Prestador</th>
                <th className="py-2 pr-3">Tipo</th>
                <th className="py-2 pr-3">Bairro</th>
                <th className="py-2 pr-3">Cidade/UF</th>
                <th className="py-2 pr-3">CNES</th>
                <th className="py-2 pr-3 text-center">Produtos</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.id} className={`border-b border-gray-100 ${!p.ativo ? "opacity-50" : ""}`}>
                  <td className="py-2 pr-3 font-medium text-gray-900">
                    {p.nome} {p.destaque && <Star size={13} className="inline fill-amber-400 text-amber-400" />}
                    {!p.ativo && <Badge className="ml-2">Inativo</Badge>}
                  </td>
                  <td className="py-2 pr-3 text-gray-600">{p.tipo}</td>
                  <td className="py-2 pr-3 text-gray-600">{p.bairro}</td>
                  <td className="py-2 pr-3 text-gray-600">{p.cidade}/{p.uf}</td>
                  <td className="py-2 pr-3 text-gray-500">{p.cnes || "—"}</td>
                  <td className="py-2 pr-3 text-center" title={uso(p.id).map((x) => x.nome).join("\n")}>{uso(p.id).length}</td>
                  <td className="whitespace-nowrap py-2 text-right">
                    <button className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100" onClick={() => setEditando(p)} aria-label="Editar"><Edit3 size={16} /></button>
                    <button
                      className="rounded-lg p-1.5 text-red-500 hover:bg-gray-100"
                      aria-label="Excluir"
                      onClick={() => {
                        const em = uso(p.id);
                        if (em.length)
                          alert(`Não é possível excluir: o prestador faz parte da rede de ${em.length} produto(s):\n\n${em.map((x) => x.nome).join("\n")}\n\nRemova-o desses produtos ou marque-o como inativo.`);
                        else if (confirm(`Excluir ${p.nome}?`)) excluir(p.id);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editando && <FormPrestador prestador={editando} onClose={() => setEditando(null)} />}
    </>
  );
}

function FormPrestador({ prestador, onClose }: { prestador: Prestador; onClose: () => void }) {
  const salvar = useStore((s) => s.salvarPrestador);
  const [p, setP] = useState(prestador);
  const valido = p.nome.trim() && p.cidade.trim() && p.bairro.trim() && /^[A-Z]{2}$/.test(p.uf) && (!p.cnes || /^\d{7}$/.test(p.cnes));
  return (
    <Modal aberto onClose={onClose} titulo={prestador.id ? "Editar prestador" : "Novo prestador"}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label">Nome</label><input className="input" value={p.nome} onChange={(e) => setP({ ...p, nome: e.target.value })} /></div>
        <div>
          <label className="label">Tipo</label>
          <select className="input" value={p.tipo} onChange={(e) => setP({ ...p, tipo: e.target.value as TipoPrestador })}>
            {TIPOS_PRESTADOR.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div><label className="label">CNES (7 dígitos)</label><input className="input" maxLength={7} value={p.cnes ?? ""} onChange={(e) => setP({ ...p, cnes: e.target.value.replace(/\D/g, "") })} /></div>
        <div>
          <label className="label">Cidade</label>
          <input className="input" list="cidades" value={p.cidade} onChange={(e) => setP({ ...p, cidade: e.target.value })} />
          <datalist id="cidades">{CIDADES.map((c) => <option key={c} value={c} />)}</datalist>
        </div>
        <div><label className="label">UF</label><input className="input" maxLength={2} value={p.uf} onChange={(e) => setP({ ...p, uf: e.target.value.toUpperCase() })} /></div>
        <div className="sm:col-span-2"><label className="label">Bairro</label><input className="input" value={p.bairro} onChange={(e) => setP({ ...p, bairro: e.target.value })} /></div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="accent-brand-600" checked={!!p.destaque} onChange={(e) => setP({ ...p, destaque: e.target.checked })} />
          Prestador de referência (destaque)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="accent-brand-600" checked={p.ativo} onChange={(e) => setP({ ...p, ativo: e.target.checked })} />
          Ativo (disponível para novos produtos)
        </label>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button className="btn-outline" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" disabled={!valido} onClick={() => { salvar(p); onClose(); }}>Salvar</button>
      </div>
    </Modal>
  );
}

function RedesNacionais() {
  const redes = useStore((s) => s.redesNacionais);
  const produtos = useStore((s) => s.produtos);
  const salvar = useStore((s) => s.salvarRedesNacionais);
  const [r, setR] = useState<InfoRedeNacional[]>(redes);
  const [ok, setOk] = useState(false);
  return (
    <>
      <p className="mb-4 text-sm text-gray-500">
        Produtos de abrangência <strong>Nacional</strong> utilizam a rede direta da operadora + uma rede nacional referenciada.
        Produtos de <strong>Grupo de Municípios</strong> usam apenas a rede direta.
      </p>
      <div className="grid gap-4 lg:grid-cols-3">
        {r.map((rede, i) => {
          const qtd = produtos.filter((p) => p.redeNacional === rede.nivel).length;
          return (
            <div key={rede.nivel} className="overflow-hidden rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 p-4 font-bold text-white" style={{ background: NIVEL_COR[rede.nivel] }}>
                <Globe2 size={18} /> Rede Nacional {rede.nivel}
                <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-xs">{qtd} produto(s)</span>
              </div>
              <div className="p-4">
                <label className="label">Descrição</label>
                <textarea
                  className="input min-h-28"
                  value={rede.descricao}
                  onChange={(e) => { setOk(false); setR(r.map((x, j) => (j === i ? { ...x, descricao: e.target.value } : x))); }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button className="btn-primary" onClick={() => { salvar(r); setOk(true); }}>Salvar descrições</button>
        {ok && <span className="text-sm text-brand-700">Salvo.</span>}
      </div>
    </>
  );
}
