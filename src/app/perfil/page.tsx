"use client";

import { Camera, Save } from "lucide-react";
import { useRef, useState } from "react";
import { Avatar, Badge, PageHeader } from "@/components/ui";
import { useStore, useUsuarioAtual } from "@/lib/store";

export default function PerfilPage() {
  const atual = useUsuarioAtual();
  const salvar = useStore((s) => s.salvarUsuario);
  const [u, setU] = useState(atual);
  const [senha, setSenha] = useState({ atual: "", nova: "", confirma: "" });
  const [msg, setMsg] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  if (u.id !== atual.id) setU(atual); // trocou de perfil na demo

  const trocarFoto = (f?: File) => {
    if (!f) return;
    const img = new Image();
    img.onload = () => {
      // reduz a foto para 160px para caber no armazenamento do navegador
      const c = document.createElement("canvas");
      const s = Math.min(img.width, img.height);
      c.width = c.height = 160;
      c.getContext("2d")!.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 160, 160);
      setU((x) => ({ ...x, foto: c.toDataURL("image/jpeg", 0.85) }));
    };
    img.src = URL.createObjectURL(f);
  };

  const senhaOk = senha.nova.length >= 8 && senha.nova === senha.confirma && senha.atual;

  return (
    <>
      <PageHeader titulo="Meu perfil" subtitulo="Atualize sua foto, dados e senha" />
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="card flex flex-col items-center p-6 text-center">
          <div className="relative">
            <Avatar nome={u.nome} foto={u.foto} tamanho={120} />
            <button
              className="absolute bottom-0 right-0 rounded-full bg-brand-600 p-2 text-white shadow hover:bg-brand-700"
              onClick={() => ref.current?.click()}
              aria-label="Trocar foto"
            >
              <Camera size={18} />
            </button>
            <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => trocarFoto(e.target.files?.[0])} />
          </div>
          <div className="mt-4 text-lg font-bold">{u.nome}</div>
          <div className="text-sm text-gray-500">{u.email}</div>
          <Badge tom="verde" className="mt-2">{u.perfil}</Badge>
        </div>

        <div className="space-y-6">
          <div className="card space-y-4 p-6">
            <h2 className="font-bold text-brand-900">Dados pessoais</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div><label className="label">Nome</label><input className="input" value={u.nome} onChange={(e) => setU({ ...u, nome: e.target.value })} /></div>
              <div><label className="label">E-mail</label><input className="input" value={u.email} disabled /></div>
              <div><label className="label">Área</label><input className="input" value={u.area} onChange={(e) => setU({ ...u, area: e.target.value })} /></div>
              <div><label className="label">Perfil de acesso</label><input className="input" value={u.perfil} disabled /></div>
            </div>
            <button className="btn-primary" onClick={() => { salvar(u); setMsg("Dados salvos."); }}><Save size={16} /> Salvar dados</button>
          </div>

          <div className="card space-y-4 p-6">
            <h2 className="font-bold text-brand-900">Alterar senha</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div><label className="label">Senha atual</label><input type="password" className="input" value={senha.atual} onChange={(e) => setSenha({ ...senha, atual: e.target.value })} /></div>
              <div><label className="label">Nova senha</label><input type="password" className="input" value={senha.nova} onChange={(e) => setSenha({ ...senha, nova: e.target.value })} /></div>
              <div><label className="label">Confirmar</label><input type="password" className="input" value={senha.confirma} onChange={(e) => setSenha({ ...senha, confirma: e.target.value })} /></div>
            </div>
            <p className="text-xs text-gray-500">Mínimo de 8 caracteres. (Na demo nenhuma senha é armazenada.)</p>
            <button
              className="btn-primary"
              disabled={!senhaOk}
              onClick={() => { setSenha({ atual: "", nova: "", confirma: "" }); setMsg("Senha alterada (simulação)."); }}
            >
              Alterar senha
            </button>
          </div>
          {msg && <div className="rounded-lg bg-brand-50 p-3 text-sm text-brand-800">{msg}</div>}
        </div>
      </div>
    </>
  );
}
