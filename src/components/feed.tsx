"use client";

import clsx from "clsx";
import { Building, DollarSign, FileText, Percent, PlusCircle, Puzzle, RefreshCw, ToggleRight } from "lucide-react";
import Link from "next/link";
import { dataBR } from "@/lib/ans";
import { useStore } from "@/lib/store";
import type { Alteracao, TipoAlteracao } from "@/lib/types";
import { Badge } from "./ui";

export const ICONE_TIPO: Record<TipoAlteracao, { icon: typeof Building; cor: string }> = {
  Preço: { icon: DollarSign, cor: "bg-emerald-100 text-emerald-700" },
  Rede: { icon: Building, cor: "bg-sky-100 text-sky-700" },
  Status: { icon: ToggleRight, cor: "bg-amber-100 text-amber-700" },
  Coparticipação: { icon: Percent, cor: "bg-violet-100 text-violet-700" },
  Material: { icon: FileText, cor: "bg-pink-100 text-pink-700" },
  Cadastro: { icon: RefreshCw, cor: "bg-gray-100 text-gray-700" },
  "Soluções adicionais": { icon: Puzzle, cor: "bg-sky-100 text-sky-700" },
  "Novo produto": { icon: PlusCircle, cor: "bg-brand-100 text-brand-700" },
};

export function FeedItem({ alteracao, acoes }: { alteracao: Alteracao; acoes?: React.ReactNode }) {
  const produto = useStore((s) => s.produtos.find((p) => p.id === alteracao.produtoId));
  const autor = useStore((s) => s.usuarios.find((u) => u.id === alteracao.autorId));
  const { icon: Icon, cor } = ICONE_TIPO[alteracao.tipo];
  return (
    <div className="flex gap-4 rounded-xl border border-gray-100 bg-surface p-4 transition hover:border-brand-200">
      <div className={clsx("h-fit rounded-xl p-2.5", cor)}><Icon size={20} /></div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-gray-900">{alteracao.titulo}</span>
          <Badge>{alteracao.tipo}</Badge>
        </div>
        <div className="mt-0.5 text-sm">
          {produto ? (
            <Link href={`/produto/?id=${produto.id}`} className="font-medium text-brand-700 hover:underline">{produto.nome}</Link>
          ) : (
            <span className="text-gray-400">Produto removido</span>
          )}
        </div>
        <ul className="mt-2 space-y-0.5 text-sm text-gray-600">
          {alteracao.detalhes.slice(0, 6).map((d, i) => <li key={i}>• {d}</li>)}
          {alteracao.detalhes.length > 6 && <li className="text-gray-400">+ {alteracao.detalhes.length - 6} item(ns)</li>}
        </ul>
        <div className="mt-2 text-xs text-gray-400">
          {dataBR(alteracao.data, true)} · por {autor?.nome ?? "—"}
          {alteracao.motivo && <> · motivo: {alteracao.motivo}</>}
        </div>
      </div>
      {acoes && <div className="flex shrink-0 flex-col gap-2">{acoes}</div>}
    </div>
  );
}
