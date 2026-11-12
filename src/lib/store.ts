"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  ALTERACOES, CONFIG_INICIAL, MATERIAIS, PRESTADORES, PRODUTOS, REDES_NACIONAIS, SOLUCOES, USUARIOS,
} from "@/data/seed";
import { brl } from "./ans";
import type {
  Alteracao, Configuracoes, InfoRedeNacional, ItemCoparticipacao, Material, Perfil, Prestador, Produto,
  SolucaoAdicional, TipoAlteracao, Usuario,
} from "./types";

/** localStorage que avisa (uma vez) quando o espaço do navegador acaba, em vez de falhar em silêncio. */
let avisouCota = false;
const armazenamentoSeguro = {
  getItem: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  removeItem: (k: string) => { try { localStorage.removeItem(k); } catch {} },
  setItem: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      if (!avisouCota) {
        avisouCota = true;
        alert("O espaço de armazenamento deste navegador acabou (provavelmente por imagens grandes). A última alteração pode não ter sido salva. Remova algumas imagens de capa ou use 'Restaurar dados da demonstração'.");
      }
    }
  },
};

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();

type Permissoes = {
  editarProdutos: boolean;
  moderar: boolean;
  gerenciarRede: boolean;
  gerenciarSolucoes: boolean;
  gerenciarUsuarios: boolean;
  criarAdmin: boolean;
  configurar: boolean;
  enviarMateriais: boolean;
};

/** Matriz de permissões por perfil. */
export const PERMISSOES: Record<Perfil, Permissoes> = {
  Administrador: { editarProdutos: true, moderar: true, gerenciarRede: true, gerenciarSolucoes: true, gerenciarUsuarios: true, criarAdmin: true, configurar: true, enviarMateriais: true },
  Gestor: { editarProdutos: true, moderar: true, gerenciarRede: true, gerenciarSolucoes: true, gerenciarUsuarios: true, criarAdmin: false, configurar: false, enviarMateriais: true },
  Colaborador: { editarProdutos: true, moderar: false, gerenciarRede: false, gerenciarSolucoes: false, gerenciarUsuarios: false, criarAdmin: false, configurar: false, enviarMateriais: true },
  Consulta: { editarProdutos: false, moderar: false, gerenciarRede: false, gerenciarSolucoes: false, gerenciarUsuarios: false, criarAdmin: false, configurar: false, enviarMateriais: false },
};

/** "Bairro · Cidade/UF" das unidades (resumido quando há várias). */
export function locaisPrestador(p: Prestador): string {
  const cidades = [...new Set(p.unidades.map((u) => `${u.cidade}/${u.uf}`))];
  if (p.unidades.length === 1) return `${p.unidades[0].bairro} · ${cidades[0]}`;
  return `${p.unidades.length} unidades · ${cidades.join(", ")}`;
}

export const nomePrestador = (p?: Prestador) =>
  p ? `${p.nome} (${[...new Set(p.unidades.map((u) => `${u.cidade}/${u.uf}`))].join(", ")})` : "Prestador removido";

type Evento = { tipo: TipoAlteracao; titulo: string; detalhes: string[] };

/** Compara duas versões do produto e gera os eventos do feed de notificações. */
function diffProduto(antes: Produto, depois: Produto, prestadores: Prestador[], solucoes: SolucaoAdicional[]): Evento[] {
  const out: Evento[] = [];

  const precoDet: string[] = [];
  depois.precoComercial.forEach((v, i) => {
    if (v !== antes.precoComercial[i]) precoDet.push(`Faixa ${i + 1}: ${brl(antes.precoComercial[i])} → ${brl(v)}`);
  });
  depois.precoNTRP.forEach((v, i) => {
    if (v !== antes.precoNTRP[i]) precoDet.push(`NTRP faixa ${i + 1}: ${brl(antes.precoNTRP[i])} → ${brl(v)}`);
  });
  if (precoDet.length) out.push({ tipo: "Preço", titulo: "Alteração de preço", detalhes: precoDet });

  const nome = (id: string) => nomePrestador(prestadores.find((x) => x.id === id));
  const inc = depois.rede.filter((r) => !antes.rede.includes(r));
  const exc = antes.rede.filter((r) => !depois.rede.includes(r));
  const redeDet = [...inc.map((r) => `Incluído: ${nome(r)}`), ...exc.map((r) => `Excluído: ${nome(r)}`)];
  if (antes.redeNacional !== depois.redeNacional)
    redeDet.unshift(`Rede nacional: ${antes.redeNacional ?? "—"} → ${depois.redeNacional ?? "—"}`);
  if (redeDet.length) out.push({ tipo: "Rede", titulo: "Alteração na rede credenciada", detalhes: redeDet });

  const statusDet: string[] = [];
  if (antes.statusComercial !== depois.statusComercial)
    statusDet.push(`Status comercial: ${antes.statusComercial} → ${depois.statusComercial}`);
  if (antes.situacaoANS !== depois.situacaoANS) statusDet.push(`Situação ANS: ${antes.situacaoANS} → ${depois.situacaoANS}`);
  if (statusDet.length) out.push({ tipo: "Status", titulo: "Mudança de status", detalhes: statusDet });

  const fmt = (x: ItemCoparticipacao) => (x.tipo === "Percentual" ? `${x.valor}%` : brl(x.valor));
  const copDet: string[] = [];
  if (antes.fatorModerador !== depois.fatorModerador) copDet.push(`Fator moderador: ${antes.fatorModerador} → ${depois.fatorModerador}`);
  depois.coparticipacao.forEach((c) => {
    const old = antes.coparticipacao.find((o) => o.procedimento === c.procedimento);
    if (!old) copDet.push(`Incluído: ${c.procedimento} (${fmt(c)})`);
    else if (old.valor !== c.valor || old.tipo !== c.tipo) copDet.push(`${c.procedimento}: ${fmt(old)} → ${fmt(c)}`);
    else if (old.limite !== c.limite) copDet.push(`Limite ${c.procedimento}: ${brl(old.limite ?? 0)} → ${brl(c.limite ?? 0)}`);
  });
  antes.coparticipacao
    .filter((o) => !depois.coparticipacao.some((c) => c.procedimento === o.procedimento))
    .forEach((o) => copDet.push(`Excluído: ${o.procedimento}`));
  if (JSON.stringify(antes.limiteGlobal) !== JSON.stringify(depois.limiteGlobal)) {
    const lg = (l?: Produto["limiteGlobal"]) => (l ? `${brl(l.valor)} (${l.periodo.toLowerCase()})` : "sem limite");
    copDet.push(`Limite global: ${lg(antes.limiteGlobal)} → ${lg(depois.limiteGlobal)}`);
  }
  if (copDet.length) out.push({ tipo: "Coparticipação", titulo: "Alteração no perfil de coparticipação", detalhes: copDet });

  const nomeSol = (id: string) => solucoes.find((s) => s.id === id)?.nome ?? id;
  const solDet = [
    ...depois.solucoes.filter((s) => !antes.solucoes.includes(s)).map((s) => `Permitido: ${nomeSol(s)}`),
    ...antes.solucoes.filter((s) => !depois.solucoes.includes(s)).map((s) => `Removido: ${nomeSol(s)}`),
  ];
  if (solDet.length) out.push({ tipo: "Soluções adicionais", titulo: "Alteração nas soluções adicionais", detalhes: solDet });

  const campos: [keyof Produto, string][] = [
    ["nome", "Nome"],
    ["linha", "Linha"],
    ["descricao", "Descrição"],
    ["registroANS", "Registro ANS"],
    ["contratacao", "Tipo de contratação"],
    ["segmentacao", "Segmentação assistencial"],
    ["abrangencia", "Abrangência geográfica"],
    ["acomodacao", "Acomodação"],
    ["formacaoPreco", "Formação de preço"],
  ];
  const cad = campos
    .filter(([k]) => JSON.stringify(antes[k]) !== JSON.stringify(depois[k]))
    .map(([k, label]) => (k === "descricao" ? `${label} atualizada` : `${label}: ${String(antes[k])} → ${String(depois[k])}`));
  if (JSON.stringify(antes.areaAtuacao) !== JSON.stringify(depois.areaAtuacao)) cad.push("Área de atuação atualizada");
  const codInc = depois.codigos.filter((c) => !antes.codigos.includes(c));
  const codExc = antes.codigos.filter((c) => !depois.codigos.includes(c));
  if (codInc.length) cad.push(`Códigos incluídos: ${codInc.join(", ")}`);
  if (codExc.length) cad.push(`Códigos removidos: ${codExc.join(", ")}`);
  if (cad.length) out.push({ tipo: "Cadastro", titulo: "Atualização cadastral", detalhes: cad });

  return out;
}

interface State {
  produtos: Produto[];
  prestadores: Prestador[];
  redesNacionais: InfoRedeNacional[];
  solucoes: SolucaoAdicional[];
  usuarios: Usuario[];
  materiais: Material[];
  alteracoes: Alteracao[];
  config: Configuracoes;
  usuarioAtualId: string;

  setUsuarioAtual: (id: string) => void;
  salvarProduto: (p: Produto) => string;
  excluirProduto: (id: string) => void;
  moderar: (ids: string[], status: "Publicada" | "Descartada", motivo?: string) => void;
  salvarPrestador: (p: Prestador) => void;
  excluirPrestador: (id: string) => void;
  salvarRedesNacionais: (r: InfoRedeNacional[]) => void;
  salvarSolucao: (s: SolucaoAdicional, produtoIds: string[]) => void;
  excluirSolucao: (id: string) => void;
  salvarUsuario: (u: Usuario) => void;
  adicionarMaterial: (m: Omit<Material, "id" | "versao" | "atualizadoEm">) => void;
  removerMaterial: (id: string) => void;
  salvarConfig: (c: Configuracoes) => void;
  resetar: () => void;
}

const inicial = () => ({
  produtos: PRODUTOS,
  prestadores: PRESTADORES,
  redesNacionais: REDES_NACIONAIS,
  solucoes: SOLUCOES,
  usuarios: USUARIOS,
  materiais: MATERIAIS,
  alteracoes: ALTERACOES,
  config: CONFIG_INICIAL,
  usuarioAtualId: "u2",
});

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const statusInicial = () => (get().config.exigirModeracao ? "Pendente" : "Publicada") as Alteracao["status"];

      /** Grava uma nova versão do produto e registra os eventos no feed. */
      const gravar = (p: Produto): string => {
        const { produtos, usuarioAtualId, prestadores, solucoes } = get();
        const existente = produtos.find((x) => x.id === p.id);
        const atualizado: Produto = { ...p, atualizadoEm: now() };
        if (atualizado.abrangencia !== "Nacional") delete atualizado.redeNacional;
        let eventos: Evento[];
        if (!existente) {
          atualizado.id = p.id || `p${uid()}`;
          eventos = [{
            tipo: "Novo produto",
            titulo: `Produto cadastrado: ${atualizado.nome}`,
            detalhes: [`${atualizado.contratacao} · ${atualizado.segmentacao} · ${atualizado.abrangencia}${atualizado.redeNacional ? ` + Rede Nacional ${atualizado.redeNacional}` : ""}`],
          }];
          set({ produtos: [atualizado, ...produtos] });
        } else {
          eventos = diffProduto(existente, atualizado, prestadores, solucoes);
          set({ produtos: produtos.map((x) => (x.id === p.id ? atualizado : x)) });
        }
        const novos = eventos.map((e) => ({
          id: uid(), produtoId: atualizado.id, ...e, autorId: usuarioAtualId, data: now(), status: statusInicial(),
        }));
        set((s) => ({ alteracoes: [...novos, ...s.alteracoes] }));
        return atualizado.id;
      };

      return {
        ...inicial(),

        setUsuarioAtual: (id) => set({ usuarioAtualId: id }),

        salvarProduto: gravar,

        excluirProduto: (id) =>
          set((s) => ({
            produtos: s.produtos.filter((p) => p.id !== id),
            materiais: s.materiais.filter((m) => m.produtoId !== id),
            alteracoes: s.alteracoes.filter((a) => a.produtoId !== id),
          })),

        moderar: (ids, status, motivo) =>
          set((s) => ({
            alteracoes: s.alteracoes.map((a) =>
              ids.includes(a.id) ? { ...a, status, motivo, moderadorId: s.usuarioAtualId } : a,
            ),
          })),

        salvarPrestador: (p) =>
          set((s) => ({
            prestadores: s.prestadores.some((x) => x.id === p.id)
              ? s.prestadores.map((x) => (x.id === p.id ? p : x))
              : [...s.prestadores, { ...p, id: p.id || `pr${uid()}` }],
          })),

        excluirPrestador: (id) => set((s) => ({ prestadores: s.prestadores.filter((p) => p.id !== id) })),

        salvarRedesNacionais: (r) => set({ redesNacionais: r }),

        salvarSolucao: (sol, produtoIds) => {
          const s = get();
          const nova = { ...sol, id: sol.id || `s${uid()}` };
          set({
            solucoes: s.solucoes.some((x) => x.id === nova.id)
              ? s.solucoes.map((x) => (x.id === nova.id ? nova : x))
              : [...s.solucoes, nova],
          });
          // Atualiza a permissão nos produtos afetados (gera eventos no feed).
          get().produtos.forEach((p) => {
            const tem = p.solucoes.includes(nova.id);
            const deve = produtoIds.includes(p.id);
            if (tem !== deve)
              gravar({ ...p, solucoes: deve ? [...p.solucoes, nova.id] : p.solucoes.filter((x) => x !== nova.id) });
          });
        },

        excluirSolucao: (id) =>
          set((s) => ({
            solucoes: s.solucoes.filter((x) => x.id !== id),
            produtos: s.produtos.map((p) => ({ ...p, solucoes: p.solucoes.filter((x) => x !== id) })),
          })),

        salvarUsuario: (u) =>
          set((s) => ({
            usuarios: s.usuarios.some((x) => x.id === u.id)
              ? s.usuarios.map((x) => (x.id === u.id ? u : x))
              : [...s.usuarios, { ...u, id: u.id || `u${uid()}`, criadoEm: now() }],
          })),

        adicionarMaterial: (m) => {
          const { materiais, usuarioAtualId } = get();
          const anterior = materiais.find(
            (x) => x.produtoId === m.produtoId && x.categoria === m.categoria && x.titulo === m.titulo,
          );
          const novo: Material = { ...m, id: uid(), versao: anterior ? anterior.versao + 1 : 1, atualizadoEm: now() };
          set({
            materiais: [novo, ...materiais.filter((x) => x !== anterior)],
            alteracoes: [
              {
                id: uid(), produtoId: m.produtoId, tipo: "Material",
                titulo: anterior ? "Material de comunicação atualizado" : "Novo material de comunicação",
                detalhes: [`${m.categoria}: ${m.titulo} (v${novo.versao}, ${m.formato})`],
                autorId: usuarioAtualId, data: now(), status: statusInicial(),
              },
              ...get().alteracoes,
            ],
          });
        },

        removerMaterial: (id) => set((s) => ({ materiais: s.materiais.filter((m) => m.id !== id) })),

        salvarConfig: (c) => set({ config: c }),

        resetar: () => set(inicial()),
      };
    },
    {
      name: "portal-produtos-demo",
      storage: createJSONStorage(() => armazenamentoSeguro),
      version: 8,
      // Dados de versões anteriores do protótipo são descartados.
      // Dados fictícios são renovados, mas usuários (fotos, nomes, perfis) e a configuração são preservados.
      migrate: (antigo) => {
        const a = (antigo ?? {}) as Partial<State>;
        return {
          ...inicial(),
          ...(a.usuarios?.length ? { usuarios: a.usuarios } : {}),
          ...(a.usuarioAtualId ? { usuarioAtualId: a.usuarioAtualId } : {}),
          ...(a.config ? { config: a.config } : {}),
        } as unknown as State;
      },
    },
  ),
);

export function useUsuarioAtual() {
  return useStore((s) => s.usuarios.find((u) => u.id === s.usuarioAtualId) ?? s.usuarios[0]);
}

export function usePermissoes() {
  const u = useUsuarioAtual();
  return PERMISSOES[u.perfil];
}
