"use client";

import clsx from "clsx";
import {
  Bell, Box, FolderOpen, GitCompare, Home, LayoutGrid, Menu, Moon, Network, Puzzle, Settings, Sun, Users, X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { PERMISSOES, useStore, useUsuarioAtual } from "@/lib/store";
import { Avatar } from "./ui";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/portfolio/", label: "Portfólio", icon: LayoutGrid },
  { href: "/solucoes/", label: "Soluções adicionais", icon: Puzzle },
  { href: "/comparativos/", label: "Comparativos", icon: GitCompare },
  { href: "/materiais/", label: "Materiais", icon: FolderOpen },
  { href: "/notificacoes/", label: "Notificações", icon: Bell },
  { href: "/rede/", label: "Gestão de Rede", icon: Network, restrito: "gerenciarRede" as const },
  { href: "/usuarios/", label: "Usuários", icon: Users },
  { href: "/configuracoes/", label: "Configurações", icon: Settings },
];

function useTema() {
  const [escuro, setEscuro] = useState(() => document.documentElement.classList.contains("dark"));
  const alternar = () => {
    const novo = !escuro;
    document.documentElement.classList.toggle("dark", novo);
    try { localStorage.setItem("tema", novo ? "escuro" : "claro"); } catch {}
    setEscuro(novo);
  };
  return { escuro, alternar };
}

export default function AppShell({ children }: { children: ReactNode }) {
  // Os dados ficam no localStorage: renderiza só no cliente para evitar divergência de hidratação.
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  if (!montado)
    return <div className="flex h-screen items-center justify-center text-brand-700">Carregando portal…</div>;
  return <Shell>{children}</Shell>;
}

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const usuario = useUsuarioAtual();
  const usuarios = useStore((s) => s.usuarios);
  const setUsuarioAtual = useStore((s) => s.setUsuarioAtual);
  const alteracoes = useStore((s) => s.alteracoes);
  const [menuAberto, setMenuAberto] = useState(false);
  const perm = PERMISSOES[usuario.perfil];
  const podeModerar = perm.moderar;
  const { escuro, alternar } = useTema();
  const pendentes = alteracoes.filter((a) => a.status === "Pendente").length;
  const recentes = alteracoes.filter(
    (a) => a.status === "Publicada" && Date.now() - new Date(a.data).getTime() < 7 * 86400000,
  ).length;

  useEffect(() => setMenuAberto(false), [pathname]);

  const ativo = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href) || (href === "/portfolio/" && pathname.startsWith("/produto"));

  return (
    <div className="flex min-h-screen">
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col overflow-y-auto bg-sidebar text-white transition-transform lg:translate-x-0",
          menuAberto ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="rounded-xl bg-white/15 p-2"><Box size={26} /></div>
          <div>
            <div className="text-base font-bold leading-tight">Portal de Produtos</div>
            <div className="text-xs text-white/60">Aurora Saúde · protótipo</div>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setMenuAberto(false)} aria-label="Fechar menu"><X /></button>
        </div>
        <div className="px-6 pb-4">
          <button
            onClick={alternar}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 hover:bg-white/15"
          >
            {escuro ? <Sun size={14} /> : <Moon size={14} />} {escuro ? "Modo claro" : "Modo escuro"}
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.filter((n) => !n.restrito || perm[n.restrito]).map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition",
                ativo(href) ? "bg-surface text-brand-800 shadow" : "text-white/90 hover:bg-white/10",
              )}
            >
              <Icon size={18} />
              {label}
              {label === "Notificações" && (podeModerar ? pendentes : recentes) > 0 && (
                <span
                  className={clsx(
                    "ml-auto rounded-full px-2 py-0.5 text-xs font-bold",
                    podeModerar ? "bg-amber-400 text-amber-950" : "bg-brand-400 text-white",
                  )}
                  title={podeModerar ? "Alterações aguardando moderação" : "Novidades nos últimos 7 dias"}
                >
                  {podeModerar ? pendentes : recentes}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/60">
            Simular perfil (demo)
          </label>
          <select
            value={usuario.id}
            onChange={(e) => setUsuarioAtual(e.target.value)}
            className="mb-3 w-full rounded-lg bg-white/10 px-2 py-1.5 text-xs text-white outline-none"
          >
            {usuarios.filter((u) => u.ativo).map((u) => (
              <option key={u.id} value={u.id} className="text-gray-900">
                {u.nome} — {u.perfil}
              </option>
            ))}
          </select>
          <Link href="/perfil/" className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/10">
            <Avatar nome={usuario.nome} foto={usuario.foto} />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{usuario.nome}</div>
              <div className="truncate text-xs text-white/60">{usuario.email}</div>
            </div>
          </Link>
        </div>
      </aside>

      {menuAberto && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMenuAberto(false)} />}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-gray-200 bg-surface/90 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setMenuAberto(true)} aria-label="Abrir menu"><Menu /></button>
          <span className="font-bold text-brand-800">Portal de Produtos</span>
        </header>
        <div className="bg-amber-50 px-6 py-1.5 text-center text-xs text-amber-800 dark:bg-amber-100">
          Protótipo para apresentação · todos os dados são fictícios · alterações ficam salvas apenas neste navegador
        </div>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
