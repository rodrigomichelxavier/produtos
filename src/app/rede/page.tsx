"use client";

import { Edit3, Globe2, Plus, Search, Star, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { NIVEL_COR } from "@/components/produto";
import { Badge, Modal, PageHeader, Tabs, Vazio } from "@/components/ui";
import { MUNICIPIOS_REGIAO } from "@/data/seed";
import { usePermissoes, useStore } from "@/lib/store";
import { coordenadas, espalhar } from "@/lib/geo";
import { TIPOS_PRESTADOR, type InfoRedeNacional, type Prestador, type TipoPrestador, type Unidade } from "@/lib/types";

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
        .filter((p) => cidade === "Todas" || p.unidades.some((u) => u.cidade === cidade))
        .filter((p) => {
          const q = busca.trim().toLowerCase();
          return !q || `${p.nome} ${p.unidades.map((u) => `${u.bairro} ${u.cnes ?? ""} ${u.codigoLocal}`).join(" ")}`.toLowerCase().includes(q);
        })
        .sort((a, b) => a.tipo.localeCompare(b.tipo) || a.nome.localeCompare(b.nome)),
    [prestadores, tipo, cidade, busca],
  );

  const novo = (): Prestador => ({ id: "", nome: "", tipo: "Laboratório", unidades: [novaUnidade()], ativo: true });

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-52 flex-1">
          <span className="filtro-label">Buscar</span>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Nome, bairro, CNES ou código local" value={busca} onChange={(e) => setBusca(e.target.value)} />
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
            {[...new Set(prestadores.flatMap((p) => p.unidades.map((u) => u.cidade)))].sort().map((c) => <option key={c}>{c}</option>)}
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
                <th className="py-2 pr-3">Unidades (código local · bairro · cidade/UF · CNES)</th>
                <th className="py-2 pr-3 text-center">Produtos</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.id} className={`border-b border-gray-100 align-top ${!p.ativo ? "opacity-50" : ""}`}>
                  <td className="py-2 pr-3 font-medium text-gray-900">
                    {p.nome} {p.destaque && <Star size={13} className="inline fill-amber-400 text-amber-400" />}
                    {!p.ativo && <Badge className="ml-2">Inativo</Badge>}
                  </td>
                  <td className="py-2 pr-3 text-gray-600">{p.tipo}</td>
                  <td className="py-2 pr-3 text-gray-600">
                    <ul className="space-y-0.5">
                      {p.unidades.map((u) => (
                        <li key={u.id}>
                          <span className="mr-1.5 rounded bg-gray-100 px-1.5 py-px font-mono text-[11px] font-semibold text-gray-700">{u.codigoLocal}</span>
                          {u.bairro} · {u.cidade}/{u.uf} <span className="text-xs text-gray-400">{u.cnes ? `CNES ${u.cnes}` : ""}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
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

function novaUnidade(cidade = "Campinas"): Unidade {
  const id = `un${Math.random().toString(36).slice(2, 8)}`;
  const [lat, lng] = espalhar(coordenadas(cidade, ""), id);
  return { id, bairro: "", cidade, uf: "SP", cnes: "", codigoLocal: "", lat, lng };
}

function FormPrestador({ prestador, onClose }: { prestador: Prestador; onClose: () => void }) {
  const salvar = useStore((s) => s.salvarPrestador);
  const todos = useStore((s) => s.prestadores);
  const [p, setP] = useState(prestador);
  const codigosLocaisEmUso = new Set(todos.filter((x) => x.id !== prestador.id).flatMap((x) => x.unidades.map((u) => u.codigoLocal)));
  const setU = (i: number, patch: Partial<Unidade>) =>
    setP((x) => ({
      ...x,
      unidades: x.unidades.map((u, j) => {
        if (j !== i) return u;
        const n = { ...u, ...patch };
        // posição aproximada recalculada quando muda cidade/bairro
        if (patch.cidade !== undefined || patch.bairro !== undefined) [n.lat, n.lng] = espalhar(coordenadas(n.cidade, n.bairro), n.id);
        return n;
      }),
    }));
  const valido =
    p.nome.trim() && p.unidades.length > 0 &&
    new Set(p.unidades.map((u) => u.codigoLocal)).size === p.unidades.length &&
    p.unidades.every((u) => !codigosLocaisEmUso.has(u.codigoLocal)) &&
    p.unidades.every((u) => u.codigoLocal.trim() && u.cidade.trim() && u.bairro.trim() && /^[A-Z]{2}$/.test(u.uf) && (!u.cnes || /^\d{7}$/.test(u.cnes)));
  return (
    <Modal aberto onClose={onClose} titulo={prestador.id ? "Editar prestador" : "Novo prestador"} largura="max-w-2xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label">Nome</label><input className="input" value={p.nome} onChange={(e) => setP({ ...p, nome: e.target.value })} /></div>
        <div>
          <label className="label">Tipo</label>
          <select className="input" value={p.tipo} onChange={(e) => setP({ ...p, tipo: e.target.value as TipoPrestador })}>
            {TIPOS_PRESTADOR.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <label className="label !mb-0">Unidades de atendimento ({p.unidades.length})</label>
          <button type="button" className="text-xs font-semibold text-brand-700 hover:underline" onClick={() => setP({ ...p, unidades: [...p.unidades, novaUnidade(p.unidades.at(-1)?.cidade)] })}>
            + Adicionar unidade
          </button>
        </div>
        <datalist id="cidades">{CIDADES.map((c) => <option key={c} value={c} />)}</datalist>
        <div className="space-y-2">
          {p.unidades.map((u, i) => (
            <div key={u.id} className="grid grid-cols-12 items-end gap-2 rounded-lg border border-gray-200 p-2">
              <div className="col-span-6 sm:col-span-2"><span className="filtro-label">Código local</span><input className="input px-2 font-mono uppercase" maxLength={12} placeholder="UNPP0000" value={u.codigoLocal} onChange={(e) => setU(i, { codigoLocal: e.target.value.toUpperCase().replace(/\s/g, "") })} /></div>
              <div className="col-span-6 sm:col-span-3"><span className="filtro-label">Bairro</span><input className="input" value={u.bairro} onChange={(e) => setU(i, { bairro: e.target.value })} /></div>
              <div className="col-span-6 sm:col-span-3"><span className="filtro-label">Cidade</span><input className="input" list="cidades" value={u.cidade} onChange={(e) => setU(i, { cidade: e.target.value })} /></div>
              <div className="col-span-2 sm:col-span-1"><span className="filtro-label">UF</span><input className="input px-2" maxLength={2} value={u.uf} onChange={(e) => setU(i, { uf: e.target.value.toUpperCase() })} /></div>
              <div className="col-span-3 sm:col-span-2"><span className="filtro-label">CNES</span><input className="input px-2" maxLength={7} value={u.cnes ?? ""} onChange={(e) => setU(i, { cnes: e.target.value.replace(/\D/g, "") })} /></div>
              <button
                type="button"
                className="col-span-1 pb-2 text-red-500 disabled:opacity-30"
                disabled={p.unidades.length === 1}
                onClick={() => setP({ ...p, unidades: p.unidades.filter((_, j) => j !== i) })}
                aria-label="Remover unidade"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <p className="mt-1 text-[11px] text-gray-400">Código local obrigatório e único (ex.: UNPP0254). A posição no Mapa de Rede é estimada pelo bairro e cidade.</p>
        {p.unidades.some((u) => codigosLocaisEmUso.has(u.codigoLocal)) && (
          <p className="mt-1 text-xs text-red-600">Código local já usado em outro prestador: {p.unidades.filter((u) => codigosLocaisEmUso.has(u.codigoLocal)).map((u) => u.codigoLocal).join(", ")}</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-6">
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
