"use client";

import clsx from "clsx";
import {
  Apple, BadgePercent, Baby, Brain, Dumbbell, Flower2, House, Luggage, PawPrint, Pill, Plane, ShieldCheck, Smile,
  Stethoscope, Video, type LucideIcon,
} from "lucide-react";
import type { IconeSolucao, SolucaoAdicional } from "@/lib/types";

export const ICONES: Record<IconeSolucao, { icon: LucideIcon; rotulo: string }> = {
  aviao: { icon: Plane, rotulo: "Avião" },
  academia: { icon: Dumbbell, rotulo: "Academia" },
  desconto: { icon: BadgePercent, rotulo: "Desconto" },
  viagem: { icon: Luggage, rotulo: "Viagem" },
  pet: { icon: PawPrint, rotulo: "Pet" },
  flor: { icon: Flower2, rotulo: "Flor" },
  telemedicina: { icon: Video, rotulo: "Telemedicina" },
  sorriso: { icon: Smile, rotulo: "Sorriso" },
  gestante: { icon: Baby, rotulo: "Bebê" },
  checkup: { icon: Stethoscope, rotulo: "Estetoscópio" },
  farmacia: { icon: Pill, rotulo: "Farmácia" },
  vida: { icon: ShieldCheck, rotulo: "Proteção" },
  casa: { icon: House, rotulo: "Casa" },
  mente: { icon: Brain, rotulo: "Mente" },
  nutricao: { icon: Apple, rotulo: "Nutrição" },
};

/** Mistura uma cor hex com preto (t<0) ou branco (t>0). */
export function tom(hex: string, t: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    Math.round(t < 0 ? v * (1 + t) : v + (255 - v) * t),
  );
  return `rgb(${c.join(",")})`;
}

const GRAO =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E\")";

type Variante = "card" | "poster" | "hero";

/**
 * Arte de capa da solução. Usa a imagem enviada quando existir;
 * caso contrário gera uma "key art" a partir da cor e do ícone.
 */
export function CapaSolucao({
  solucao, variante = "card", titulo = true, className,
}: { solucao: SolucaoAdicional; variante?: Variante; titulo?: boolean; className?: string }) {
  const { icon: Icon } = ICONES[solucao.icone] ?? ICONES.vida;
  const c = solucao.cor;
  return (
    <div className={clsx("relative h-full w-full overflow-hidden", !solucao.ativa && "grayscale", className)} style={{ background: tom(c, -0.55) }}>
      {solucao.imagem ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={solucao.imagem} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <>
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(120% 90% at 78% 30%, ${tom(c, 0.35)} 0%, ${c} 32%, ${tom(c, -0.45)} 70%, ${tom(c, -0.75)} 100%)`,
            }}
          />
          {/* círculos de luz */}
          <div className="absolute rounded-full" style={{ width: "70%", aspectRatio: "1", right: "-18%", top: "-30%", background: `radial-gradient(circle, ${tom(c, 0.55)}55, transparent 65%)` }} />
          <div className="absolute rounded-full border border-white/10" style={{ width: "55%", aspectRatio: "1", right: "-6%", top: "-8%" }} />
          <div className="absolute rounded-full border border-white/5" style={{ width: "80%", aspectRatio: "1", right: "-19%", top: "-22%" }} />
          {/* ícone fantasma ao fundo */}
          <Icon
            className="absolute text-white"
            strokeWidth={0.6}
            style={
              variante === "poster"
                ? { width: "150%", height: "150%", left: "-55%", top: "-10%", opacity: 0.07 }
                : { width: "75%", height: "150%", left: "-22%", top: "-30%", opacity: 0.07 }
            }
          />
          {/* ícone principal */}
          <Icon
            className="absolute text-white drop-shadow-[0_10px_25px_rgba(0,0,0,0.45)]"
            strokeWidth={variante === "hero" ? 1.1 : 1.4}
            style={
              variante === "poster"
                ? { width: "62%", height: "62%", left: "19%", top: "12%", transform: "rotate(-8deg)" }
                : variante === "hero"
                  ? { width: "38%", height: "70%", right: "6%", top: "12%", transform: "rotate(-8deg)" }
                  : { width: "42%", height: "78%", right: "5%", top: "8%", transform: "rotate(-8deg)" }
            }
          />
          <div className="absolute inset-0 mix-blend-overlay" style={{ backgroundImage: GRAO, opacity: 0.35 }} />
        </>
      )}
      {/* vinheta para legibilidade do título */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
      {titulo && variante !== "hero" && (
        <div className="absolute inset-x-0 bottom-0 p-3">
          <div
            className={clsx(
              "font-display uppercase leading-[0.9] tracking-wide text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]",
              variante === "poster" ? "text-[28px]" : "text-[26px]",
            )}
          >
            {solucao.nome}
          </div>
        </div>
      )}
      {!solucao.ativa && (
        <span className="absolute right-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          Inativa
        </span>
      )}
    </div>
  );
}
