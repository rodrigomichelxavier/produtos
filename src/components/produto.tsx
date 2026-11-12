"use client";

import { Globe2, HeartPulse } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Produto } from "@/lib/types";
import { Badge, type Tom } from "./ui";

export function tomStatus(s: Produto["statusComercial"]): Tom {
  return s === "Em comercialização" ? "verde" : s === "Em elaboração" ? "azul" : "cinza";
}
export function tomSituacao(s: Produto["situacaoANS"]): Tom {
  return s === "Ativo" ? "verde" : s === "Cancelado" ? "vermelho" : "amarelo";
}

export function StatusBadge({ produto }: { produto: Produto }) {
  return <Badge tom={tomStatus(produto.statusComercial)}>{produto.statusComercial}</Badge>;
}

/** "Imagem" do produto: placeholder visual gerado a partir da cor do produto. */
export function ProdutoCapa({ produto, altura = 120 }: { produto: Produto; altura?: number }) {
  const Icon = HeartPulse;
  return (
    <div
      className="relative flex items-center justify-center overflow-hidden rounded-xl text-white"
      style={{ height: altura, background: `linear-gradient(135deg, ${produto.cor}, ${produto.cor}cc 60%, #a5d6a7)` }}
    >
      <Icon size={altura * 0.38} strokeWidth={1.5} className="opacity-90" />
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 -left-4 h-20 w-20 rounded-full bg-white/10" />
    </div>
  );
}

export const NIVEL_COR: Record<NonNullable<Produto["redeNacional"]>, string> = {
  Básica: "linear-gradient(90deg,#0369a1,#0ea5e9)",
  Especial: "linear-gradient(90deg,#6d28d9,#8b5cf6)",
  Master: "linear-gradient(90deg,#b45309,#f59e0b)",
};

/** Destaque "+ Rede Nacional X" para produtos de abrangência nacional. */
export function RedeNacionalBadge({ produto, grande = false }: { produto: Produto; grande?: boolean }) {
  if (produto.abrangencia !== "Nacional" || !produto.redeNacional) return null;
  return (
    <span
      style={{ background: NIVEL_COR[produto.redeNacional] }}
      className={`inline-flex items-center gap-1 rounded-lg font-bold text-white shadow-sm ${grande ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[11px]"}`}
    >
      <Globe2 size={grande ? 14 : 12} /> + Rede Nacional {produto.redeNacional}
    </span>
  );
}

export function AvisoRedeNacional({ produto }: { produto: Produto }) {
  const info = useStore((s) => s.redesNacionais.find((r) => r.nivel === produto.redeNacional));
  if (produto.abrangencia !== "Nacional" || !produto.redeNacional) return null;
  return (
    <div className="mb-5 flex items-start gap-3 rounded-xl p-4 text-white" style={{ background: NIVEL_COR[produto.redeNacional] }}>
      <Globe2 size={22} className="shrink-0" />
      <div>
        <div className="font-bold">Rede direta + Rede Nacional {produto.redeNacional}</div>
        <div className="text-sm text-white/90">{info?.descricao}</div>
      </div>
    </div>
  );
}

