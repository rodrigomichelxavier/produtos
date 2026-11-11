"use client";

import { Construction, RotateCcw, Save } from "lucide-react";
import { useState } from "react";
import { PageHeader, Vazio } from "@/components/ui";
import { NORMATIVOS } from "@/lib/ans";
import { usePermissoes, useStore } from "@/lib/store";

export default function ConfiguracoesPage() {
  const perm = usePermissoes();
  const config = useStore((s) => s.config);
  const salvar = useStore((s) => s.salvarConfig);
  const resetar = useStore((s) => s.resetar);
  const [c, setC] = useState(config);
  const [ok, setOk] = useState(false);

  if (!perm.configurar)
    return (
      <>
        <PageHeader titulo="Configurações" />
        <Vazio texto="Somente administradores acessam as configurações. Use o seletor 'Simular perfil' para entrar como Administrador." />
      </>
    );

  return (
    <>
      <PageHeader titulo="Configurações" subtitulo="Parâmetros do sistema" />
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <Construction size={20} /> Seção em construção — os itens abaixo são uma primeira proposta para discussão.
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card space-y-4 p-6">
          <h2 className="font-bold text-brand-900">Operadora</h2>
          <div><label className="label">Razão social / nome fantasia</label><input className="input" value={c.operadora} onChange={(e) => setC({ ...c, operadora: e.target.value })} /></div>
          <div><label className="label">Registro da operadora na ANS (6 dígitos)</label><input className="input" maxLength={6} value={c.registroOperadora} onChange={(e) => setC({ ...c, registroOperadora: e.target.value.replace(/\D/g, "") })} /></div>
        </div>

        <div className="card space-y-4 p-6">
          <h2 className="font-bold text-brand-900">Regras do portal</h2>
          <div>
            <label className="label">Tolerância de desvio do preço comercial vs NTRP (%)</label>
            <input type="number" className="input w-32" value={c.toleranciaNTRP} onChange={(e) => setC({ ...c, toleranciaNTRP: Number(e.target.value) })} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-brand-600" checked={c.exigirModeracao} onChange={(e) => setC({ ...c, exigirModeracao: e.target.checked })} />
            Exigir moderação do gestor antes de publicar alterações no feed
          </label>
        </div>

        <div className="card p-6 lg:col-span-2">
          <h2 className="mb-3 font-bold text-brand-900">Base normativa considerada no protótipo</h2>
          <ul className="grid gap-2 text-sm md:grid-cols-2">
            {NORMATIVOS.map((n) => (
              <li key={n.sigla} className="rounded-lg bg-gray-50 p-3">
                <div className="font-semibold text-brand-800">{n.sigla}</div>
                <div className="text-xs text-gray-600">{n.tema}</div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-gray-500">Referências para fins de demonstração; a validação regulatória final deve ser feita pelas áreas técnica e jurídica.</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button className="btn-primary" onClick={() => { salvar(c); setOk(true); }}><Save size={16} /> Salvar configurações</button>
        <button
          className="btn-outline"
          onClick={() => {
            if (confirm("Restaurar todos os dados fictícios originais? As alterações feitas nesta demo serão perdidas.")) {
              resetar();
              location.reload();
            }
          }}
        >
          <RotateCcw size={16} /> Restaurar dados da demonstração
        </button>
        {ok && <span className="text-sm text-brand-700">Configurações salvas.</span>}
      </div>
    </>
  );
}
