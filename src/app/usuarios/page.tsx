"use client";

import { Camera, Check, Edit3, Minus, UserPlus } from "lucide-react";
import { useRef, useState } from "react";
import { Avatar, Badge, Modal, PageHeader, type Tom } from "@/components/ui";
import { dataBR } from "@/lib/ans";
import { PERMISSOES, usePermissoes, useStore } from "@/lib/store";
import type { Perfil, Usuario } from "@/lib/types";

const PERFIS: Perfil[] = ["Administrador", "Gestor", "Colaborador", "Consulta"];
const TOM: Record<Perfil, Tom> = { Administrador: "roxo", Gestor: "verde", Colaborador: "azul", Consulta: "cinza" };
const DESCRICAO: Record<Perfil, string> = {
  Administrador: "Acesso total, inclusive configurações e criação de outros administradores.",
  Gestor: "Cadastra produtos, gerencia a rede e as soluções adicionais, modera o feed e inclui novos usuários.",
  Colaborador: "Cadastra e edita produtos e materiais; alterações passam pela moderação.",
  Consulta: "Somente visualização do portfólio, comparativos, materiais e notificações.",
};
const MATRIZ: [keyof (typeof PERMISSOES)["Gestor"], string][] = [
  ["editarProdutos", "Cadastrar/editar produtos"],
  ["enviarMateriais", "Enviar materiais"],
  ["moderar", "Moderar notificações"],
  ["gerenciarRede", "Gestão de Rede (prestadores)"],
  ["gerenciarSolucoes", "Cadastrar soluções adicionais"],
  ["gerenciarUsuarios", "Gerenciar usuários"],
  ["criarAdmin", "Criar administradores"],
  ["configurar", "Configurações do sistema"],
];

export default function UsuariosPage() {
  const usuarios = useStore((s) => s.usuarios);
  const perm = usePermissoes();
  const [editando, setEditando] = useState<Usuario | null>(null);

  const novo = (): Usuario => ({
    id: "", nome: "", email: "", perfil: "Consulta", area: "", ativo: true, senhaDefinida: false, criadoEm: new Date().toISOString(),
  });

  return (
    <>
      <PageHeader
        titulo="Usuários"
        subtitulo={`${usuarios.filter((u) => u.ativo).length} usuários ativos com acesso ao portal`}
        acoes={perm.gerenciarUsuarios && <button className="btn-primary" onClick={() => setEditando(novo())}><UserPlus size={16} /> Incluir usuário</button>}
      />

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-5 py-3">Usuário</th>
              <th className="px-5 py-3">Área</th>
              <th className="px-5 py-3">Perfil</th>
              <th className="px-5 py-3">Situação</th>
              <th className="px-5 py-3">Desde</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className={`border-b border-gray-100 ${!u.ativo ? "opacity-50" : ""}`}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar nome={u.nome} foto={u.foto} />
                    <div>
                      <div className="font-semibold text-gray-900">{u.nome}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-gray-600">{u.area}</td>
                <td className="px-5 py-3"><Badge tom={TOM[u.perfil]}>{u.perfil}</Badge></td>
                <td className="px-5 py-3">
                  {!u.ativo ? <Badge>Inativo</Badge> : u.senhaDefinida ? <Badge tom="verde">Ativo</Badge> : <Badge tom="amarelo">Convite enviado</Badge>}
                </td>
                <td className="px-5 py-3 text-gray-500">{dataBR(u.criadoEm)}</td>
                <td className="px-5 py-3 text-right">
                  {perm.gerenciarUsuarios && (u.perfil !== "Administrador" || perm.criarAdmin) && (
                    <button className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100" onClick={() => setEditando(u)} aria-label="Editar">
                      <Edit3 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 mt-8 font-bold text-brand-900">Perfis de acesso</h2>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-xs uppercase tracking-wide text-gray-500">
              <th className="px-5 py-3 text-left">Permissão</th>
              {PERFIS.map((p) => <th key={p} className="px-5 py-3"><Badge tom={TOM[p]}>{p}</Badge></th>)}
            </tr>
          </thead>
          <tbody>
            {MATRIZ.map(([k, label]) => (
              <tr key={k} className="border-b border-gray-100">
                <td className="px-5 py-2.5 text-gray-700">{label}</td>
                {PERFIS.map((p) => (
                  <td key={p} className="px-5 py-2.5 text-center">
                    {PERMISSOES[p][k] ? <Check size={18} className="inline text-brand-600" /> : <Minus size={18} className="inline text-gray-300" />}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="px-5 py-3 text-xs text-gray-500">Descrição</td>
              {PERFIS.map((p) => <td key={p} className="px-5 py-3 align-top text-xs text-gray-500">{DESCRICAO[p]}</td>)}
            </tr>
          </tbody>
        </table>
      </div>

      {editando && <FormUsuario usuario={editando} onClose={() => setEditando(null)} />}
    </>
  );
}

function FormUsuario({ usuario, onClose }: { usuario: Usuario; onClose: () => void }) {
  const [u, setU] = useState(usuario);
  const fotoRef = useRef<HTMLInputElement>(null);
  const salvar = useStore((s) => s.salvarUsuario);
  const perm = usePermissoes();
  const perfis = PERFIS.filter((p) => p !== "Administrador" || perm.criarAdmin);
  const valido = u.nome.trim() && /\S+@\S+\.\S+/.test(u.email);

  return (
    <Modal aberto onClose={onClose} titulo={usuario.id ? "Editar usuário" : "Incluir usuário"}>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar nome={u.nome || "?"} foto={u.foto} tamanho={64} />
          <div className="flex gap-2">
            <button type="button" className="btn-outline py-1.5 text-xs" onClick={() => fotoRef.current?.click()}>
              <Camera size={14} /> {u.foto ? "Trocar foto" : "Adicionar foto"}
            </button>
            {u.foto && <button type="button" className="btn-outline py-1.5 text-xs" onClick={() => setU({ ...u, foto: undefined })}>Remover</button>}
          </div>
          <input ref={fotoRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && reduzirFoto(e.target.files[0], (foto) => setU((x) => ({ ...x, foto })))} />
        </div>
        <div><label className="label">Nome</label><input className="input" value={u.nome} onChange={(e) => setU({ ...u, nome: e.target.value })} /></div>
        <div><label className="label">E-mail corporativo</label><input className="input" value={u.email} onChange={(e) => setU({ ...u, email: e.target.value })} /></div>
        <div><label className="label">Área</label><input className="input" value={u.area} onChange={(e) => setU({ ...u, area: e.target.value })} /></div>
        <div>
          <label className="label">Perfil</label>
          <select className="input" value={u.perfil} onChange={(e) => setU({ ...u, perfil: e.target.value as Perfil })}>
            {perfis.map((p) => <option key={p}>{p}</option>)}
          </select>
          <p className="mt-1 text-xs text-gray-500">{DESCRICAO[u.perfil]}</p>
        </div>
        {usuario.id && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-brand-600" checked={u.ativo} onChange={(e) => setU({ ...u, ativo: e.target.checked })} />
            Usuário ativo
          </label>
        )}
        {!usuario.id && (
          <p className="rounded-lg bg-sky-50 p-3 text-xs text-sky-800">
            Na versão final, o usuário receberá um convite por e-mail para definir a senha (ou acessará via SSO corporativo).
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button className="btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" disabled={!valido} onClick={() => { salvar(u); onClose(); }}>Salvar</button>
        </div>
      </div>
    </Modal>
  );
}

/** Recorta a foto em quadrado e reduz para 160px (cabe no armazenamento do navegador). */
function reduzirFoto(f: File, cb: (url: string) => void) {
  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas");
    const lado = Math.min(img.width, img.height);
    c.width = c.height = 160;
    c.getContext("2d")!.drawImage(img, (img.width - lado) / 2, (img.height - lado) / 2, lado, lado, 0, 0, 160, 160);
    cb(c.toDataURL("image/jpeg", 0.85));
  };
  img.src = URL.createObjectURL(f);
}
