"use client";

import { HeartPulse, Smile } from "lucide-react";
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
  const Icon = produto.segmentacao === "Odontológico" ? Smile : HeartPulse;
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
