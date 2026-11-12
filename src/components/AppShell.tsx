"use client";

import clsx from "clsx";
import {
  Bell, Box, FolderOpen, MapPinned, GitCompare, Home, LayoutGrid, Menu, Network, Puzzle, Settings, Users, X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { PERMISSOES, useStore, useUsuarioAtual } from "@/lib/store";
import { ThemeIconButton, ThemeSwitch } from "./ThemeToggle";
import { Avatar } from "./ui";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/portfolio/", label: "Portfólio", icon: LayoutGrid },
  { href: "/solucoes/", label: "Soluções adicionais", icon: Puzzle },
  { href: "/comparativos/", label: "Comparativos", icon: GitCompare },
  { href: "/mapa/", label: "Mapa de Rede", icon: MapPinned },
  { href: "/materiais/", label: "Materiais", icon: FolderOpen },
  { href: "/notificacoes/", label: "Notificações", icon: Bell },
  { href: "/rede/", label: "Gestão de Rede", icon: Network, restrito: "gerenciarRede" as const },
  { href: "/usuarios/", label: "Usuários", icon: Users },
  { href: "/configuracoes/", label: "Configurações", icon: Settings },
];

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
  const pendentes = alteracoes.filter((a) => a.status === "Pendente").length;
  const recentes = alteracoes.filter(
    (a) => a.status === "Publicada" && Date.now() - new Date(a.data).getTime() < 7 * 86400000,
  ).length;

  useEffect(() => setMenuAberto(false), [pathname]);

  const [recolhido, setRecolhido] = useState(() => {
    try { return localStorage.getItem("menu") === "recolhido"; } catch { return false; }
  });
  const alternarMenu = () => {
    // No celular o logo não recolhe (o menu é uma gaveta).
    if (window.matchMedia("(max-width: 1023px)").matches) return;
    setRecolhido((x) => {
      try { localStorage.setItem("menu", x ? "expandido" : "recolhido"); } catch {}
      return !x;
    });
  };

  const ativo = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href) || (href === "/portfolio/" && pathname.startsWith("/produto"));

  // No desktop o menu pode ser recolhido clicando no logo (preferência salva no navegador).
  // Os ícones mantêm a mesma posição; só a largura anima e os textos esmaecem.
  const r = recolhido;
  const texto = clsx("whitespace-nowrap transition-opacity duration-200", r ? "lg:pointer-events-none lg:opacity-0" : "opacity-100 delay-100");
  const badge = podeModerar ? pendentes : recentes;
  const EASE = "duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]";

  return (
    <div className="flex min-h-screen">
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col overflow-y-auto overflow-x-hidden bg-sidebar text-white transition-[transform,width] will-change-[width] lg:translate-x-0",
          EASE,
          menuAberto ? "translate-x-0" : "-translate-x-full",
          r && "lg:w-[76px]",
        )}
      >
        <div className="flex items-center gap-3 py-6 pl-[17px] pr-4">
          <button
            onClick={alternarMenu}
            aria-label={r ? "Expandir menu" : "Recolher menu"}
            title={r ? "Expandir menu" : "Recolher menu"}
            className="group/logo shrink-0 rounded-xl bg-white/15 p-2 transition hover:bg-white/25"
          >
            <Box size={26} className="transition-transform duration-300 group-hover/logo:scale-90" />
          </button>
          <div className={clsx("min-w-0", texto)}>
            <div className="text-base font-bold leading-tight">Portal de Produtos</div>
            <div className="text-xs text-white/60">Aurora Saúde · protótipo</div>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setMenuAberto(false)} aria-label="Fechar menu"><X /></button>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.filter((n) => !n.restrito || perm[n.restrito]).map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              title={r ? label : undefined}
              className={clsx(
                "relative flex items-center gap-3 overflow-hidden rounded-xl px-[17px] py-2.5 text-sm font-medium transition-colors",
                ativo(href) ? "bg-surface text-brand-800 shadow" : "text-white/90 hover:bg-white/10",
              )}
            >
              <Icon size={18} className="shrink-0" />
              <span className={texto}>{label}</span>
              {label === "Notificações" && badge > 0 && (
                <>
                  <span
                    className={clsx(
                      "ml-auto rounded-full px-2 py-0.5 text-xs font-bold",
                      podeModerar ? "bg-amber-400 text-amber-950" : "bg-brand-400 text-white",
                      texto,
                    )}
                    title={podeModerar ? "Alterações aguardando moderação" : "Novidades nos últimos 7 dias"}
                  >
                    {badge}
                  </span>
                  <span
                    className={clsx(
                      "absolute left-[30px] top-2 hidden h-2 w-2 rounded-full transition-opacity duration-200 lg:block",
                      podeModerar ? "bg-amber-400" : "bg-brand-400",
                      r ? "opacity-100 delay-150" : "opacity-0",
                    )}
                  />
                </>
              )}
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/10 px-3 py-4">
          <div className="mb-3 flex items-center gap-3 pl-1">
            <ThemeSwitch />
            <span className={clsx("text-[10px] font-semibold uppercase tracking-wider text-white/60", texto)}>Aparência</span>
          </div>
          <div className={clsx("grid transition-[grid-template-rows,opacity]", EASE, r ? "lg:grid-rows-[0fr] lg:opacity-0" : "grid-rows-[1fr]")}>
            <div className="min-h-0 overflow-hidden px-1">
              <label className="mb-1 block whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-white/60">
                Simular perfil (demo)
              </label>
              <select
                value={usuario.id}
                onChange={(e) => setUsuarioAtual(e.target.value)}
                tabIndex={r ? -1 : 0}
                className="seletor-escuro mb-3 w-full rounded-lg bg-white/10 px-2 py-1.5 text-xs text-white outline-none"
              >
                {usuarios.filter((u) => u.ativo).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome} — {u.perfil}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Link
            href="/perfil/"
            title={r ? `${usuario.nome} — ${usuario.perfil}` : undefined}
            className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/10"
          >
            <Avatar nome={usuario.nome} foto={usuario.foto} />
            <div className={clsx("min-w-0", texto)}>
              <div className="truncate text-sm font-semibold">{usuario.nome}</div>
              <div className="truncate text-xs text-white/60">{usuario.email}</div>
            </div>
          </Link>
        </div>
      </aside>

      {menuAberto && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMenuAberto(false)} />}

      <div className={clsx("flex min-w-0 flex-1 flex-col transition-[padding]", EASE, r ? "lg:pl-[76px]" : "lg:pl-64")}>
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-gray-200 bg-surface/90 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setMenuAberto(true)} aria-label="Abrir menu"><Menu /></button>
          <span className="font-bold text-brand-800">Portal de Produtos</span>
          <span className="ml-auto"><ThemeIconButton /></span>
        </header>
        <div className="bg-amber-50 px-6 py-1.5 text-center text-xs text-amber-800 dark:bg-amber-100">
          Protótipo para apresentação · todos os dados são fictícios · alterações ficam salvas apenas neste navegador
        </div>
        <main className="mx-auto w-full max-w-[1600px] flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
