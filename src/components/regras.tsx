"use client";

import clsx from "clsx";
import { CheckCircle2, XCircle } from "lucide-react";
import type { Regra } from "@/lib/ans";

export function ListaRegras({ regras, titulo }: { regras: Regra[]; titulo: string }) {
  const ok = regras.every((r) => r.ok);
  return (
    <div className={clsx("rounded-xl border p-4", ok ? "border-brand-200 bg-brand-50/50" : "border-red-200 bg-red-50/60")}>
      <div className={clsx("mb-2 text-sm font-bold", ok ? "text-brand-800" : "text-red-700")}>
        {titulo}: {ok ? "em conformidade" : "atenção"}
      </div>
      <ul className="space-y-2">
        {regras.map((r) => (
          <li key={r.titulo} className="flex gap-2 text-sm">
            {r.ok ? <CheckCircle2 size={18} className="shrink-0 text-brand-600" /> : <XCircle size={18} className="shrink-0 text-red-600" />}
            <div>
              <div className="font-medium text-gray-800">{r.titulo}</div>
              <div className="text-xs text-gray-500">{r.detalhe} <span className="italic">({r.base})</span></div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
