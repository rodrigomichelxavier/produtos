"use client";

import clsx from "clsx";
import {
  BadgeCheck, Briefcase, Building2, Crown, Gem, Globe2, GraduationCap, HeartPulse, History, Hospital, House, Map as MapIcon,
  ShieldPlus, Sprout, Users, type LucideIcon,
} from "lucide-react";
import { tipoPessoa } from "@/lib/ans";
import { useStore } from "@/lib/store";
import type { IconeProduto, Produto } from "@/lib/types";
import { KeyArt, type Variante } from "./solucao";
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

export const ICONES_PROD: Record<IconeProduto, { icon: LucideIcon; rotulo: string }> = {
  broto: { icon: Sprout, rotulo: "Broto" },
  casa: { icon: House, rotulo: "Casa" },
  familia: { icon: Users, rotulo: "Família" },
  coroa: { icon: Crown, rotulo: "Coroa" },
  hospital: { icon: Hospital, rotulo: "Hospital" },
  maleta: { icon: Briefcase, rotulo: "Maleta" },
  predio: { icon: Building2, rotulo: "Prédio" },
  diamante: { icon: Gem, rotulo: "Diamante" },
  cracha: { icon: BadgeCheck, rotulo: "Crachá" },
  graduacao: { icon: GraduationCap, rotulo: "Graduação" },
  escudo: { icon: ShieldPlus, rotulo: "Escudo" },
  mapa: { icon: MapIcon, rotulo: "Mapa" },
  relogio: { icon: History, rotulo: "Histórico" },
  coracao: { icon: HeartPulse, rotulo: "Coração" },
  globo: { icon: Globe2, rotulo: "Globo" },
};

export const COR_LINHA: Record<Produto["linha"], string> = {
  Econômico: "#34d399",
  Intermediário: "#60a5fa",
  Superior: "#fbbf24",
};

/** Linha superior do título nas capas: "AURORA · SUPERIOR". */
export function Kicker({ produto, className }: { produto: Produto; className?: string }) {
  return (
    <div className={clsx("flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70", className)}>
      Aurora
      <span className="h-1 w-1 rounded-full" style={{ background: COR_LINHA[produto.linha] }} />
      <span style={{ color: COR_LINHA[produto.linha] }}>{produto.linha}</span>
    </div>
  );
}

/** Selo da linha (Econômico, Intermediário, Superior), estilo "classificação". */
const COR_LINHA_CLARO: Record<Produto["linha"], string> = {
  Econômico: "#047857",
  Intermediário: "#1d4ed8",
  Superior: "#b45309",
};

export function LinhaSelo({ produto, fundoClaro, className }: { produto: Produto; fundoClaro?: boolean; className?: string }) {
  const cor = fundoClaro ? COR_LINHA_CLARO[produto.linha] : COR_LINHA[produto.linha];
  return (
    <span
      className={clsx("inline-flex items-center gap-1.5 rounded border px-1.5 py-px text-[11px] font-bold uppercase tracking-wider", fundoClaro && "dark:!border-current", className)}
      style={{ borderColor: cor, color: cor }}
    >
      {produto.linha}
    </span>
  );
}

/** Nome sem a marca ("Aurora"), usado como título nas capas. */
export const nomeCurto = (p: Pick<Produto, "nome">) => p.nome.replace(/^Aurora\s+/i, "");

/**
 * Capa do produto ("key art"), no mesmo motor visual das soluções adicionais.
 * Mostra a foto do marketing quando existir; senão, arte gerada pela cor + ícone da linha.
 */
export function ProdutoCapa({
  produto, altura, variante = "card", titulo, selos = true, className,
}: {
  produto: Produto; altura?: number; variante?: Variante; titulo?: boolean; selos?: boolean; className?: string;
}) {
  const { icon } = ICONES_PROD[produto.icone] ?? ICONES_PROD.coracao;
  const pequeno = altura !== undefined && altura < 90;
  const mostrarTitulo = titulo ?? (!pequeno && variante !== "hero");
  const foraDeVenda = produto.statusComercial === "Fora de comercialização";
  const arte = (
    <KeyArt cor={produto.cor} Icon={icon} imagem={produto.imagem} apagado={foraDeVenda} variante={variante}>
      {selos && !pequeno && variante !== "hero" && (
        <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-brand-500 font-display text-[15px] leading-none text-white shadow">A</span>
          {variante !== "poster" && (
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/90 drop-shadow">
              {tipoPessoa(produto.contratacao) === "PF" ? "Pessoa física" : "Empresas"}
            </span>
          )}
        </div>
      )}
      {selos && !pequeno && variante !== "hero" && produto.redeNacional && (
        <span
          className="absolute right-2.5 top-2.5 rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white shadow"
          style={{ background: NIVEL_COR[produto.redeNacional] }}
        >
          Rede {produto.redeNacional}
        </span>
      )}
      {mostrarTitulo && (
        <div className="absolute inset-x-0 bottom-0 p-3">
          {selos && produto.statusComercial === "Em elaboração" && (
            <span className="mb-1 inline-block rounded-sm bg-white px-1.5 py-px text-[9px] font-extrabold uppercase tracking-wider text-red-600">Em breve</span>
          )}
          {selos && foraDeVenda && (
            <span className="mb-1 inline-block rounded-sm bg-black/70 px-1.5 py-px text-[9px] font-extrabold uppercase tracking-wider text-white">Fora de venda</span>
          )}
          <Kicker produto={produto} />
          <div
            className={clsx(
              "font-display uppercase leading-[0.9] tracking-wide text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]",
              variante === "poster" ? "text-[26px]" : "text-[26px]",
            )}
          >
            {nomeCurto(produto)}
          </div>
        </div>
      )}
    </KeyArt>
  );
  if (altura === undefined) return <div className={clsx("h-full w-full", className)}>{arte}</div>;
  return <div className={clsx("overflow-hidden rounded-lg", className)} style={{ height: altura }}>{arte}</div>;
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

