"use client";

import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ProdutoCapa, StatusBadge } from "@/components/produto";
import { Badge, PageHeader, Segmented, Vazio } from "@/components/ui";
import { brl, siglaSegmentacao, tipoPessoa } from "@/lib/ans";
import { usePermissoes, useStore } from "@/lib/store";
import type { Abrangencia, StatusComercial } from "@/lib/types";

const PESSOA = ["Todos", "PF", "PJ"] as const;
const ABRANGENCIAS: (Abrangencia | "Todas")[] = ["Todas", "Nacional", "Grupo de Estados", "Estadual", "Grupo de Municípios", "Municipal"];
const STATUS: (StatusComercial | "Todos")[] = ["Todos", "Em comercialização", "Em elaboração", "Fora de comercialização"];

export default function PortfolioPage() {
  const produtos = useStore((s) => s.produtos);
  const perm = usePermissoes();
  const [pessoa, setPessoa] = useState<(typeof PESSOA)[number]>("Todos");
  const [busca, setBusca] = useState("");
  const [abr, setAbr] = useState<(typeof ABRANGENCIAS)[number]>("Todas");
  const [status, setStatus] = useState<(typeof STATUS)[number]>("Todos");
  const [copart, setCopart] = useState<"Todos" | "Com" | "Sem">("Todos");

  const lista = useMemo(
    () =>
      produtos.filter((p) => {
        if (pessoa !== "Todos" && tipoPessoa(p.contratacao) !== pessoa) return false;
        if (abr !== "Todas" && p.abrangencia !== abr) return false;
        if (status !== "Todos" && p.statusComercial !== status) return false;
        if (copart === "Com" && p.fatorModerador === "Sem fator moderador") return false;
        if (copart === "Sem" && p.fatorModerador !== "Sem fator moderador") return false;
        const q = busca.trim().toLowerCase();
        return !q || p.nome.toLowerCase().includes(q) || p.registroANS.includes(q.replace(/\D/g, "") || "§");
      }),
    [produtos, pessoa, abr, status, copart, busca],
  );

  return (
    <>
      <PageHeader
        titulo="Portfólio"
        subtitulo={`${lista.length} de ${produtos.length} produtos`}
        acoes={perm.editarProdutos && (
          <Link href="/produto/editar/" className="btn-primary"><Plus size={18} /> Novo produto</Link>
        )}
      />

      <div className="card mb-6 flex flex-wrap items-center gap-3 p-4">
        <Segmented opcoes={PESSOA} valor={pessoa} onChange={setPessoa} />
        <div className="relative min-w-56 flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Buscar por nome ou nº de registro ANS" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <select className="input w-auto" value={abr} onChange={(e) => setAbr(e.target.value as Abrangencia)}>
          {ABRANGENCIAS.map((a) => <option key={a}>{a}</option>)}
        </select>
        <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value as StatusComercial)}>
          {STATUS.map((a) => <option key={a}>{a}</option>)}
        </select>
        <select className="input w-auto" value={copart} onChange={(e) => setCopart(e.target.value as "Com")}>
          <option value="Todos">Coparticipação: todos</option>
          <option value="Com">Com fator moderador</option>
          <option value="Sem">Sem fator moderador</option>
        </select>
      </div>

      {lista.length === 0 ? (
        <Vazio texto="Nenhum produto encontrado com esses filtros." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {lista.map((p) => (
            <Link
              key={p.id}
              href={`/produto/?id=${p.id}`}
              className="card group flex flex-col overflow-hidden p-3 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
            >
              <ProdutoCapa produto={p} />
              <div className="flex flex-1 flex-col p-2 pt-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <Badge tom={tipoPessoa(p.contratacao) === "PF" ? "azul" : "roxo"}>{tipoPessoa(p.contratacao)}</Badge>
                  <StatusBadge produto={p} />
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-brand-700">{p.nome}</h3>
                <p className="mt-1 text-xs text-gray-500">
                  {p.contratacao} · {siglaSegmentacao(p.segmentacao)}
                </p>
                <p className="text-xs text-gray-500">
                  {p.abrangencia} · {p.acomodacao.split(" ")[0]} · {p.fatorModerador === "Sem fator moderador" ? "sem copart." : p.fatorModerador.toLowerCase()}
                </p>
                <div className="mt-auto pt-3 text-sm">
                  <span className="text-gray-500">a partir de </span>
                  <span className="font-bold text-brand-800">{brl(p.precoComercial[0])}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
