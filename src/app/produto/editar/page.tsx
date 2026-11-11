"use client";

import { ArrowLeft, Info, Plus, Save, Trash2, Wand2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ListaRegras } from "@/components/regras";
import { PageHeader, Vazio } from "@/components/ui";
import { PRESTADORES } from "@/data/seed";
import { validarCoparticipacao, validarFaixasRN63 } from "@/lib/ans";
import { usePermissoes, useStore } from "@/lib/store";
import {
  FAIXAS_ETARIAS, type Abrangencia, type Acomodacao, type FatorModerador, type FormacaoPreco, type ItemCoparticipacao,
  type Produto, type Segmentacao, type SituacaoANS, type StatusComercial, type TipoContratacao, type TipoPrestador,
} from "@/lib/types";

const OPC = {
  contratacao: ["Individual/Familiar", "Coletivo Empresarial", "Coletivo por Adesão"] as TipoContratacao[],
  segmentacao: [
    "Ambulatorial", "Hospitalar com Obstetrícia", "Hospitalar sem Obstetrícia", "Ambulatorial + Hospitalar com Obstetrícia",
    "Ambulatorial + Hospitalar sem Obstetrícia", "Referência", "Odontológico",
  ] as Segmentacao[],
  abrangencia: ["Nacional", "Grupo de Estados", "Estadual", "Grupo de Municípios", "Municipal"] as Abrangencia[],
  acomodacao: ["Enfermaria (coletiva)", "Apartamento (individual)", "Não se aplica"] as Acomodacao[],
  fator: ["Sem fator moderador", "Coparticipação", "Franquia"] as FatorModerador[],
  formacao: ["Pré-estabelecido", "Pós-estabelecido", "Misto"] as FormacaoPreco[],
  situacao: ["Ativo", "Ativo com comercialização suspensa", "Cancelado"] as SituacaoANS[],
  status: ["Em elaboração", "Em comercialização", "Fora de comercialização"] as StatusComercial[],
};
const FATORES_PADRAO = [1, 1.2, 1.38, 1.55, 1.72, 1.95, 2.5, 3.25, 4.2, 5.9];
const TIPOS: TipoPrestador[] = ["Hospital", "Laboratório", "Imagem", "Clínica"];

const novoProduto = (): Produto => ({
  id: "",
  registroANS: "",
  nome: "",
  descricao: "",
  contratacao: "Individual/Familiar",
  segmentacao: "Ambulatorial + Hospitalar com Obstetrícia",
  abrangencia: "Grupo de Municípios",
  areaAtuacao: [],
  acomodacao: "Enfermaria (coletiva)",
  fatorModerador: "Sem fator moderador",
  formacaoPreco: "Pré-estabelecido",
  situacaoANS: "Ativo",
  statusComercial: "Em elaboração",
  precoComercial: FATORES_PADRAO.map((f) => Math.round(200 * f * 100) / 100),
  precoNTRP: FATORES_PADRAO.map((f) => Math.round(195 * f * 100) / 100),
  coparticipacao: [],
  rede: [],
  cor: "#2e7d32",
  atualizadoEm: new Date().toISOString(),
});

export default function Page() {
  return <Suspense><Editor /></Suspense>;
}

function Editor() {
  const id = useSearchParams().get("id");
  const existente = useStore((s) => s.produtos.find((p) => p.id === id));
  const perm = usePermissoes();
  if (!perm.editarProdutos) return <Vazio texto="Seu perfil não permite cadastrar ou editar produtos." />;
  if (id && !existente) return <Vazio texto="Produto não encontrado." />;
  return <Formulario inicial={existente ? structuredClone(existente) : novoProduto()} novo={!existente} />;
}

function Formulario({ inicial, novo }: { inicial: Produto; novo: boolean }) {
  const [p, setP] = useState<Produto>(inicial);
  const [reajuste, setReajuste] = useState(0);
  const salvar = useStore((s) => s.salvarProduto);
  const moderacao = useStore((s) => s.config.exigirModeracao);
  const router = useRouter();
  const set = <K extends keyof Produto>(k: K, v: Produto[K]) => setP((x) => ({ ...x, [k]: v }));

  const regrasPreco = validarFaixasRN63(p.precoComercial);
  const regrasCopart = validarCoparticipacao(p.coparticipacao);
  const regDigitos = p.registroANS.replace(/\D/g, "");
  const erros = [
    !p.nome.trim() && "Informe o nome comercial do produto.",
    regDigitos.length !== 9 && "O nº de registro ANS do produto deve ter 9 dígitos.",
    !regrasPreco.every((r) => r.ok) && "A tabela de preços não atende à RN 63/2003.",
    p.segmentacao === "Ambulatorial" && p.acomodacao !== "Não se aplica" && "Segmentação ambulatorial não possui padrão de acomodação.",
  ].filter(Boolean) as string[];

  const onSalvar = () => {
    if (erros.length) return;
    const novoId = salvar({ ...p, registroANS: regDigitos });
    alert(moderacao
      ? "Produto salvo! As alterações foram enviadas para moderação do gestor antes de aparecerem no feed."
      : "Produto salvo e alterações publicadas no feed.");
    router.push(`/produto/?id=${novoId}`);
  };

  const setPreco = (lista: "precoComercial" | "precoNTRP", i: number, v: number) =>
    setP((x) => ({ ...x, [lista]: x[lista].map((o, j) => (j === i ? v : o)) }));

  const setCop = (i: number, patch: Partial<ItemCoparticipacao>) =>
    set("coparticipacao", p.coparticipacao.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  return (
    <>
      <Link href={novo ? "/portfolio/" : `/produto/?id=${p.id}`} className="mb-4 flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
        <ArrowLeft size={16} /> Voltar
      </Link>
      <PageHeader
        titulo={novo ? "Novo produto" : `Editar: ${inicial.nome}`}
        subtitulo="Campos alinhados ao registro de produtos na ANS (Lei 9.656/1998)"
        acoes={<button className="btn-primary" onClick={onSalvar} disabled={erros.length > 0}><Save size={16} /> Salvar</button>}
      />

      {erros.length > 0 && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <div className="mb-1 font-semibold">Pendências para salvar:</div>
          <ul className="list-inside list-disc">{erros.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
      )}

      <Secao titulo="Identificação">
        <div className="grid gap-4 md:grid-cols-3">
          <Campo label="Nome comercial" className="md:col-span-2">
            <input className="input" value={p.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex.: Aurora Essencial" />
          </Campo>
          <Campo label="Nº de registro ANS (9 dígitos)">
            <input className="input" value={p.registroANS} maxLength={12} onChange={(e) => set("registroANS", e.target.value)} placeholder="000000000" />
          </Campo>
          <Campo label="Descrição" className="md:col-span-3">
            <textarea className="input min-h-24" value={p.descricao} onChange={(e) => set("descricao", e.target.value)} />
          </Campo>
          <Campo label="Cor do card">
            <input type="color" className="h-10 w-20 cursor-pointer rounded-lg border" value={p.cor} onChange={(e) => set("cor", e.target.value)} />
          </Campo>
        </div>
      </Secao>

      <Secao titulo="Características do produto (ANS)">
        <div className="grid gap-4 md:grid-cols-3">
          <Sel label="Tipo de contratação" valor={p.contratacao} opcoes={OPC.contratacao} onChange={(v) => set("contratacao", v)} />
          <Sel label="Segmentação assistencial" valor={p.segmentacao} opcoes={OPC.segmentacao} onChange={(v) => set("segmentacao", v)} />
          <Sel label="Abrangência geográfica" valor={p.abrangencia} opcoes={OPC.abrangencia} onChange={(v) => set("abrangencia", v)} />
          <Sel label="Padrão de acomodação" valor={p.acomodacao} opcoes={OPC.acomodacao} onChange={(v) => set("acomodacao", v)} />
          <Sel label="Fator moderador" valor={p.fatorModerador} opcoes={OPC.fator} onChange={(v) => set("fatorModerador", v)} />
          <Sel label="Formação de preço" valor={p.formacaoPreco} opcoes={OPC.formacao} onChange={(v) => set("formacaoPreco", v)} />
          <Sel label="Situação na ANS" valor={p.situacaoANS} opcoes={OPC.situacao} onChange={(v) => set("situacaoANS", v)} />
          <Sel label="Status comercial (interno)" valor={p.statusComercial} opcoes={OPC.status} onChange={(v) => set("statusComercial", v)} />
          <Campo label="Área de atuação (separe por vírgula)">
            <input className="input" value={p.areaAtuacao.join(", ")} onChange={(e) => set("areaAtuacao", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
          </Campo>
        </div>
        {p.contratacao === "Coletivo por Adesão" && (
          <Dica>Coletivo por adesão: exige vínculo do beneficiário com pessoa jurídica de caráter profissional, classista ou setorial (RN 557/2022).</Dica>
        )}
        {p.contratacao === "Individual/Familiar" && (
          <Dica>Individual/Familiar: reajuste anual limitado ao percentual divulgado pela ANS.</Dica>
        )}
      </Secao>

      <Secao titulo="Tabela de preços por faixa etária">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <button
            className="btn-outline"
            onClick={() => set("precoComercial", FATORES_PADRAO.map((f) => Math.round(p.precoComercial[0] * f * 100) / 100))}
          >
            <Wand2 size={16} /> Gerar faixas a partir da 1ª (fatores padrão)
          </button>
          <div className="flex items-end gap-2">
            <Campo label="Reajuste %">
              <input type="number" className="input w-24" value={reajuste} onChange={(e) => setReajuste(Number(e.target.value))} />
            </Campo>
            <button
              className="btn-outline"
              onClick={() => set("precoComercial", p.precoComercial.map((v) => Math.round(v * (1 + reajuste / 100) * 100) / 100))}
            >
              Aplicar
            </button>
          </div>
        </div>
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="py-1">Faixa</th><th className="py-1">Preço comercial (R$)</th><th className="py-1">NTRP (R$)</th>
              </tr>
            </thead>
            <tbody>
              {FAIXAS_ETARIAS.map((f, i) => (
                <tr key={f}>
                  <td className="py-1 pr-3 font-medium">{i + 1}ª · {f}</td>
                  <td className="py-1 pr-3"><input type="number" step="0.01" className="input" value={p.precoComercial[i]} onChange={(e) => setPreco("precoComercial", i, Number(e.target.value))} /></td>
                  <td className="py-1"><input type="number" step="0.01" className="input" value={p.precoNTRP[i]} onChange={(e) => setPreco("precoNTRP", i, Number(e.target.value))} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <ListaRegras titulo="Validação RN 63/2003" regras={regrasPreco} />
        </div>
      </Secao>

      {p.fatorModerador !== "Sem fator moderador" && (
        <Secao titulo={`Perfil de ${p.fatorModerador.toLowerCase()}`}>
          <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
            <div className="space-y-2">
              {p.coparticipacao.map((c, i) => (
                <div key={c.id} className="grid grid-cols-12 gap-2">
                  <input className="input col-span-12 sm:col-span-5" value={c.procedimento} onChange={(e) => setCop(i, { procedimento: e.target.value })} />
                  <select className="input col-span-4 sm:col-span-2" value={c.tipo} onChange={(e) => setCop(i, { tipo: e.target.value as ItemCoparticipacao["tipo"] })}>
                    <option>Percentual</option><option>Valor fixo</option>
                  </select>
                  <input type="number" className="input col-span-3 sm:col-span-2" title={c.tipo === "Percentual" ? "%" : "R$"} value={c.valor} onChange={(e) => setCop(i, { valor: Number(e.target.value) })} />
                  <input type="number" className="input col-span-3 sm:col-span-2" placeholder="Teto R$" value={c.limite ?? ""} onChange={(e) => setCop(i, { limite: e.target.value ? Number(e.target.value) : undefined })} />
                  <button className="col-span-2 sm:col-span-1 text-red-500" onClick={() => set("coparticipacao", p.coparticipacao.filter((_, j) => j !== i))} aria-label="Remover"><Trash2 size={18} /></button>
                </div>
              ))}
              <button
                className="btn-outline"
                onClick={() => set("coparticipacao", [...p.coparticipacao, { id: Math.random().toString(36).slice(2), procedimento: "Novo item", tipo: "Valor fixo", valor: 0 }])}
              >
                <Plus size={16} /> Adicionar item
              </button>
            </div>
            <ListaRegras titulo="Validação CONSU 8/1998" regras={regrasCopart} />
          </div>
        </Secao>
      )}

      <Secao titulo={`Rede credenciada (${p.rede.length} prestadores)`}>
        <Dica>
          Exclusão ou substituição de prestador hospitalar exige comunicação/autorização prévia à ANS e aviso aos beneficiários (Lei 9.656/1998, art. 17).
        </Dica>
        <div className="mt-4 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {TIPOS.map((t) => (
            <div key={t}>
              <div className="mb-2 text-sm font-bold text-brand-900">{t}</div>
              <div className="space-y-1">
                {PRESTADORES.filter((x) => x.tipo === t).map((x) => (
                  <label key={x.id} className="flex cursor-pointer items-start gap-2 rounded-lg p-1.5 text-sm hover:bg-gray-50">
                    <input
                      type="checkbox"
                      className="mt-0.5 accent-brand-600"
                      checked={p.rede.includes(x.id)}
                      onChange={(e) => set("rede", e.target.checked ? [...p.rede, x.id] : p.rede.filter((r) => r !== x.id))}
                    />
                    <span>{x.nome}<span className="block text-xs text-gray-400">{x.municipio}/{x.uf}</span></span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Secao>

      <div className="flex justify-end">
        <button className="btn-primary" onClick={onSalvar} disabled={erros.length > 0}><Save size={16} /> Salvar produto</button>
      </div>
    </>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="card mb-5 p-6">
      <h2 className="mb-4 text-lg font-bold text-brand-900">{titulo}</h2>
      {children}
    </section>
  );
}
function Campo({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={className}><label className="label">{label}</label>{children}</div>;
}
function Sel<T extends string>({ label, valor, opcoes, onChange }: { label: string; valor: T; opcoes: T[]; onChange: (v: T) => void }) {
  return (
    <Campo label={label}>
      <select className="input" value={valor} onChange={(e) => onChange(e.target.value as T)}>
        {opcoes.map((o) => <option key={o}>{o}</option>)}
      </select>
    </Campo>
  );
}
function Dica({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 flex gap-2 rounded-lg bg-sky-50 p-3 text-xs text-sky-800">
      <Info size={16} className="shrink-0" /> {children}
    </div>
  );
}
