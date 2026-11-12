"use client";

import clsx from "clsx";
import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

// O tema vive na classe "dark" do <html>; todos os botões observam a mesma fonte.
const assinar = (cb: () => void) => {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
};
const lerEscuro = () => document.documentElement.classList.contains("dark");

/** true quando o modo escuro está ativo. */
export function useEscuro() {
  return useSyncExternalStore(assinar, lerEscuro, () => false);
}

function useTema() {
  const escuro = useSyncExternalStore(assinar, lerEscuro, () => false);
  const alternar = () => {
    const novo = !escuro;
    const html = document.documentElement;
    // Transição suave de cores só durante a troca de tema
    html.classList.add("tema-transicao");
    html.classList.toggle("dark", novo);
    window.setTimeout(() => html.classList.remove("tema-transicao"), 350);
    try { localStorage.setItem("tema", novo ? "escuro" : "claro"); } catch {}
  };
  return { escuro, alternar };
}

/** Interruptor compacto claro/escuro (para fundos escuros, como o menu lateral). */
export function ThemeSwitch({ className }: { className?: string }) {
  const { escuro, alternar } = useTema();
  const rotulo = escuro ? "Ativar modo claro" : "Ativar modo escuro";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={escuro}
      aria-label={rotulo}
      title={rotulo}
      onClick={alternar}
      className={clsx(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-white/10 ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
        className,
      )}
    >
      <Sun size={11} className={clsx("absolute left-1.5 transition-opacity", escuro ? "opacity-40" : "opacity-0")} />
      <Moon size={11} className={clsx("absolute right-1.5 transition-opacity", escuro ? "opacity-0" : "opacity-40")} />
      <span
        className={clsx(
          "relative z-10 inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white text-sidebar shadow-sm transition-transform duration-300 ease-out",
          escuro ? "translate-x-[23px]" : "translate-x-[3px]",
        )}
      >
        {escuro ? <Moon size={11} strokeWidth={2.5} /> : <Sun size={11} strokeWidth={2.5} />}
      </span>
    </button>
  );
}

/** Botão só com ícone (para a barra superior no celular). */
export function ThemeIconButton() {
  const { escuro, alternar } = useTema();
  const rotulo = escuro ? "Ativar modo claro" : "Ativar modo escuro";
  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={rotulo}
      title={rotulo}
      className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
    >
      {escuro ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
