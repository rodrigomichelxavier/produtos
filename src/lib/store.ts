"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ALTERACOES, CONFIG_INICIAL, MATERIAIS, PRESTADORES, PRODUTOS, USUARIOS } from "@/data/seed";
import { brl } from "./ans";
import type {
  Alteracao,
  Configuracoes,
  Material,
  Perfil,
  Produto,
  TipoAlteracao,
  Usuario,
} from "./types";

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();

/** Matriz de permissões por perfil. */
export const PERMISSOES: Record<Perfil, {
  editarProdutos: boolean;
  moderar: boolean;
  gerenciarUsuarios: boolean;
  criarAdmin: boolean;
  configurar: boolean;
  enviarMateriais: boolean;
}> = {
  Administrador: { editarProdutos: true, moderar: true, gerenciarUsuarios: true, criarAdmin: true, configurar: true, enviarMateriais: true },
  Gestor: { editarProdutos: true, moderar: true, gerenciarUsuarios: true, criarAdmin: false, configurar: false, enviarMateriais: true },
  Colaborador: { editarProdutos: true, moderar: false, gerenciarUsuarios: false, criarAdmin: false, configurar: false, enviarMateriais: true },
  Consulta: { editarProdutos: false, moderar: false, gerenciarUsuarios: false, criarAdmin: false, configurar: false, enviarMateriais: false },
};

/** Compara duas versões do produto e gera os eventos do feed de notificações. */
function diffProduto(antes: Produto, depois: Produto): { tipo: TipoAlteracao; titulo: string; detalhes: string[] }[] {
  const out: { tipo: TipoAlteracao; titulo: string; detalhes: string[] }[] = [];

  const precoDet: string[] = [];
  depois.precoComercial.forEach((v, i) => {
    if (v !== antes.precoComercial[i]) precoDet.push(`Faixa ${i + 1}: ${brl(antes.precoComercial[i])} → ${brl(v)}`);
  });
  depois.precoNTRP.forEach((v, i) => {
    if (v !== antes.precoNTRP[i]) precoDet.push(`NTRP faixa ${i + 1}: ${brl(antes.precoNTRP[i])} → ${brl(v)}`);
  });
  if (precoDet.length) out.push({ tipo: "Preço", titulo: "Alteração de preço", detalhes: precoDet });

  const nome = (id: string) => {
    const p = PRESTADORES.find((x) => x.id === id);
    return p ? `${p.nome} (${p.municipio}/${p.uf})` : id;
  };
  const inc = depois.rede.filter((r) => !antes.rede.includes(r));
  const exc = antes.rede.filter((r) => !depois.rede.includes(r));
  if (inc.length || exc.length)
    out.push({
      tipo: "Rede",
      titulo: "Alteração na rede credenciada",
      detalhes: [...inc.map((r) => `Incluído: ${nome(r)}`), ...exc.map((r) => `Excluído: ${nome(r)}`)],
    });

  const statusDet: string[] = [];
  if (antes.statusComercial !== depois.statusComercial)
    statusDet.push(`Status comercial: ${antes.statusComercial} → ${depois.statusComercial}`);
  if (antes.situacaoANS !== depois.situacaoANS)
    statusDet.push(`Situação ANS: ${antes.situacaoANS} → ${depois.situacaoANS}`);
  if (statusDet.length) out.push({ tipo: "Status", titulo: "Mudança de status", detalhes: statusDet });

  if (
    antes.fatorModerador !== depois.fatorModerador ||
    JSON.stringify(antes.coparticipacao) !== JSON.stringify(depois.coparticipacao)
  ) {
    const det: string[] = [];
    if (antes.fatorModerador !== depois.fatorModerador)
      det.push(`Fator moderador: ${antes.fatorModerador} → ${depois.fatorModerador}`);
    depois.coparticipacao.forEach((c) => {
      const old = antes.coparticipacao.find((o) => o.procedimento === c.procedimento);
      const fmt = (x: typeof c) => (x.tipo === "Percentual" ? `${x.valor}%` : brl(x.valor));
      if (!old) det.push(`Incluído: ${c.procedimento} (${fmt(c)})`);
      else if (old.valor !== c.valor || old.tipo !== c.tipo || old.limite !== c.limite)
        det.push(`${c.procedimento}: ${fmt(old)} → ${fmt(c)}`);
    });
    antes.coparticipacao
      .filter((o) => !depois.coparticipacao.some((c) => c.procedimento === o.procedimento))
      .forEach((o) => det.push(`Excluído: ${o.procedimento}`));
    out.push({ tipo: "Coparticipação", titulo: "Alteração no perfil de coparticipação", detalhes: det.length ? det : ["Ajustes no perfil"] });
  }

  const campos: [keyof Produto, string][] = [
    ["nome", "Nome"],
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
  if (cad.length) out.push({ tipo: "Cadastro", titulo: "Atualização cadastral", detalhes: cad });

  return out;
}

interface State {
  produtos: Produto[];
  usuarios: Usuario[];
  materiais: Material[];
  alteracoes: Alteracao[];
  config: Configuracoes;
  usuarioAtualId: string;

  setUsuarioAtual: (id: string) => void;
  salvarProduto: (p: Produto) => string;
  excluirProduto: (id: string) => void;
  moderar: (ids: string[], status: "Publicada" | "Descartada", motivo?: string) => void;
  salvarUsuario: (u: Usuario) => void;
  adicionarMaterial: (m: Omit<Material, "id" | "versao" | "atualizadoEm">) => void;
  removerMaterial: (id: string) => void;
  salvarConfig: (c: Configuracoes) => void;
  resetar: () => void;
}

const inicial = () => ({
  produtos: PRODUTOS,
  usuarios: USUARIOS,
  materiais: MATERIAIS,
  alteracoes: ALTERACOES,
  config: CONFIG_INICIAL,
  usuarioAtualId: "u2",
});

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...inicial(),

      setUsuarioAtual: (id) => set({ usuarioAtualId: id }),

      salvarProduto: (p) => {
        const { produtos, usuarioAtualId, config } = get();
        const statusInicial = config.exigirModeracao ? "Pendente" : "Publicada";
        const existente = produtos.find((x) => x.id === p.id);
        const atualizado = { ...p, atualizadoEm: now() };
        let novos: Alteracao[] = [];
        if (!existente) {
          atualizado.id = p.id || `p${uid()}`;
          novos = [{
            id: uid(), produtoId: atualizado.id, tipo: "Novo produto",
            titulo: `Produto cadastrado: ${atualizado.nome}`,
            detalhes: [`${atualizado.contratacao} · ${atualizado.segmentacao} · ${atualizado.abrangencia}`],
            autorId: usuarioAtualId, data: now(), status: statusInicial,
          }];
          set({ produtos: [atualizado, ...produtos] });
        } else {
          novos = diffProduto(existente, atualizado).map((d) => ({
            id: uid(), produtoId: p.id, ...d, autorId: usuarioAtualId, data: now(), status: statusInicial,
          }));
          set({ produtos: produtos.map((x) => (x.id === p.id ? atualizado : x)) });
        }
        set((s) => ({ alteracoes: [...novos, ...s.alteracoes] }));
        return atualizado.id;
      },

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

      salvarUsuario: (u) =>
        set((s) => ({
          usuarios: s.usuarios.some((x) => x.id === u.id)
            ? s.usuarios.map((x) => (x.id === u.id ? u : x))
            : [...s.usuarios, { ...u, id: u.id || `u${uid()}`, criadoEm: now() }],
        })),

      adicionarMaterial: (m) => {
        const { materiais, usuarioAtualId, config } = get();
        const anterior = materiais.find(
          (x) => x.produtoId === m.produtoId && x.categoria === m.categoria && x.titulo === m.titulo,
        );
        const novo: Material = {
          ...m,
          id: uid(),
          versao: anterior ? anterior.versao + 1 : 1,
          atualizadoEm: now(),
        };
        set({
          materiais: [novo, ...materiais.filter((x) => x !== anterior)],
          alteracoes: [
            {
              id: uid(), produtoId: m.produtoId, tipo: "Material",
              titulo: anterior ? "Material de comunicação atualizado" : "Novo material de comunicação",
              detalhes: [`${m.categoria}: ${m.titulo} (v${novo.versao}, ${m.formato})`],
              autorId: usuarioAtualId, data: now(),
              status: config.exigirModeracao ? "Pendente" : "Publicada",
            },
            ...get().alteracoes,
          ],
        });
      },

      removerMaterial: (id) => set((s) => ({ materiais: s.materiais.filter((m) => m.id !== id) })),

      salvarConfig: (c) => set({ config: c }),

      resetar: () => set(inicial()),
    }),
    { name: "portal-produtos-demo", version: 1 },
  ),
);

export function useUsuarioAtual() {
  return useStore((s) => s.usuarios.find((u) => u.id === s.usuarioAtualId) ?? s.usuarios[0]);
}

export function usePermissoes() {
  const u = useUsuarioAtual();
  return PERMISSOES[u.perfil];
}
