"use client";

import { ArrowLeft, ClipboardPaste, Copy, ImagePlus, Info, Plus, Save, Trash2, Wand2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, Suspense, useRef, useState } from "react";
import { ICONES_PROD, NIVEL_COR, ProdutoCapa } from "@/components/produto";
import { ListaRegras } from "@/components/regras";
import { PageHeader, Vazio } from "@/components/ui";
import { MUNICIPIOS_REGIAO } from "@/data/seed";
import { brl, codigosDoProduto, desvioNTRP, situacaoMargem, validarFaixasRN63, variacaoFaixas } from "@/lib/ans";
import { locaisPrestador, usePermissoes, useStore } from "@/lib/store";
import {
  FAIXAS_ETARIAS, ICONES_PRODUTO, LINHAS, MAX_CODIGOS, MIN_CODIGOS, REGEX_CODIGO, TIPOS_PRESTADOR, type Linha, type Abrangencia, type Acomodacao, type FatorModerador, type FormacaoPreco,
  type ItemCoparticipacao, type NotaTecnica, type PerfilVenda, type Produto, type RedeNacional, type Segmentacao, type SituacaoANS, type StatusComercial,
  type TipoContratacao,
} from "@/lib/types";

const OPC = {
  contratacao: ["Individual/Familiar", "Coletivo Empresarial", "Coletivo por Adesão"] as TipoContratacao[],
  segmentacao: ["Ambulatorial + Hospitalar com Obstetrícia", "Hospitalar", "Referência"] as Segmentacao[],
  abrangencia: ["Grupo de Municípios", "Nacional"] as Abrangencia[],
  redeNacional: ["Básica", "Especial", "Master"] as RedeNacional[],
  acomodacao: ["Enfermaria (coletiva)", "Apartamento (individual)"] as Acomodacao[],
  fator: ["Sem fator moderador", "Coparticipação", "Franquia"] as FatorModerador[],
  formacao: ["Pré-estabelecido", "Pós-estabelecido", "Misto"] as FormacaoPreco[],
  situacao: ["Ativo", "Ativo com comercialização suspensa", "Cancelado"] as SituacaoANS[],
  status: ["Em elaboração", "Em comercialização", "Fora de comercialização"] as StatusComercial[],
};
const VAZIO = () => Array<number>(10).fill(0);
const r2 = (v: number) => Math.round(v * 100) / 100;

function ntPadrao(): NotaTecnica {
  // nota em branco: T, margens e variações vêm da atuária
  return { numero: "", dataBase: "", atuario: "", t: VAZIO(), inferior: VAZIO(), superior: VAZIO() };
}

const uidLocal = () => Math.random().toString(36).slice(2, 9);
function novoPerfil(nome: string, base?: PerfilVenda): PerfilVenda {
  return {
    id: `pf${uidLocal()}`,
    nome,
    codigos: [],
    coparticipacao: base ? base.coparticipacao.map((c) => ({ ...c, id: uidLocal() })) : [],
    limiteGlobal: base?.limiteGlobal ? { ...base.limiteGlobal } : undefined,
    precoComercial: base ? [...base.precoComercial] : VAZIO(),
    notaTecnica: base
      ? { ...base.notaTecnica, t: [...base.notaTecnica.t], inferior: [...base.notaTecnica.inferior], superior: [...base.notaTecnica.superior] }
      : ntPadrao(),
  };
}

const novoProduto = (): Produto => ({
  id: "",
  registroANS: "",
  nome: "",
  descricao: "",
  linha: "Intermediário",
  contratacao: "Individual/Familiar",
  segmentacao: "Ambulatorial + Hospitalar com Obstetrícia",
  abrangencia: "Grupo de Municípios",
  areaAtuacao: [...MUNICIPIOS_REGIAO],
  acomodacao: "Enfermaria (coletiva)",
  fatorModerador: "Sem fator moderador",
  formacaoPreco: "Pré-estabelecido",
  situacaoANS: "Ativo",
  statusComercial: "Em elaboração",
  perfis: [novoPerfil("Sem coparticipação")],
  rede: [],
  solucoes: [],
  cor: "#2e7d32",
  icone: "familia",
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
  const [soArea, setSoArea] = useState(true);
  const fotoRef = useRef<HTMLInputElement>(null);
  const prestadores = useStore((s) => s.prestadores);
  const todosProdutos = useStore((s) => s.produtos);
  const codigosEmOutros = new Map(
    todosProdutos.filter((x) => x.id !== inicial.id).flatMap((x) => codigosDoProduto(x).map((c) => [c, x.nome] as const)),
  );
  const [perfilAtivoId, setPerfilAtivoId] = useState(inicial.perfis[0]?.id ?? "");
  const solucoes = useStore((s) => s.solucoes);
  const salvar = useStore((s) => s.salvarProduto);
  const moderacao = useStore((s) => s.config.exigirModeracao);
  const router = useRouter();
  const set = <K extends keyof Produto>(k: K, v: Produto[K]) => setP((x) => ({ ...x, [k]: v }));

  const perfil = p.perfis.find((x) => x.id === perfilAtivoId) ?? p.perfis[0];
  const comCopart = p.fatorModerador !== "Sem fator moderador";
  const setPerfil = (patch: Partial<PerfilVenda>) =>
    setP((x) => ({ ...x, perfis: x.perfis.map((pf) => (pf.id === perfil.id ? { ...pf, ...patch } : pf)) }));
  /** Pendências de um perfil (para o indicador na aba e a lista de erros). */
  const problemasPerfil = (pf: PerfilVenda): string[] => {
    const outros = new Set(p.perfis.filter((x) => x.id !== pf.id).flatMap((x) => x.codigos));
    return [
      !pf.nome.trim() && "nome do perfil",
      (pf.codigos.length < MIN_CODIGOS || pf.codigos.length > MAX_CODIGOS) && `${MIN_CODIGOS} a ${MAX_CODIGOS} códigos (hoje ${pf.codigos.length})`,
      pf.codigos.some((c) => outros.has(c)) && "código repetido em outro perfil",
      !validarFaixasRN63(pf.precoComercial).every((r) => r.ok) && "tabela fora da RN 63/2003",
      pf.notaTecnica.t.some((v) => !v) && "T da nota técnica incompleto",
      situacaoMargem(pf).some((m) => m === "abaixo" || m === "acima") && "preço comercial fora da margem da nota técnica",
    ].filter(Boolean) as string[];
  };
  const regrasPreco = validarFaixasRN63(perfil.precoComercial);
  const variacoes = variacaoFaixas(perfil.precoComercial);
  const desvios = desvioNTRP(perfil);
  const margens = situacaoMargem(perfil);
  const ntCompleta = perfil.notaTecnica.t.every((v) => v > 0);
  const regDigitos = p.registroANS.replace(/\D/g, "");
  const erros = [
    !p.nome.trim() && "Informe o nome comercial do produto.",
    ...p.perfis.map((pf) => {
      const pr = problemasPerfil(pf);
      return pr.length > 0 && `Perfil "${pf.nome || "sem nome"}": ${pr.join(", ")}.`;
    }),
    new Set(p.perfis.map((pf) => pf.nome.trim().toLowerCase())).size !== p.perfis.length && "Os perfis de coparticipação precisam ter nomes diferentes.",
    regDigitos.length !== 9 && "O nº de registro ANS do produto deve ter 9 dígitos.",
    p.abrangencia === "Nacional" && p.contratacao === "Individual/Familiar" && "Planos Pessoa Física não podem ter abrangência nacional (regra de negócio).",
    p.abrangencia === "Nacional" && !p.redeNacional && "Produto nacional precisa da rede nacional referenciada (Básica, Especial ou Master).",
    p.abrangencia === "Grupo de Municípios" && p.areaAtuacao.length === 0 && "Selecione ao menos um município da área de atuação.",
    p.abrangencia === "Grupo de Municípios" && p.rede.length === 0 && "Produto de grupo de municípios precisa ter os prestadores da rede direta especificados.",
  ].filter(Boolean) as string[];

  const onSalvar = () => {
    if (erros.length) return;
    const novoId = salvar({ ...p, registroANS: regDigitos });
    alert(moderacao
      ? "Produto salvo! As alterações foram enviadas para moderação do gestor antes de aparecerem no feed."
      : "Produto salvo e alterações publicadas no feed.");
    router.push(`/produto/?id=${novoId}`);
  };

  const setPreco = (lista: "precoComercial", i: number, v: number) =>
    setPerfil({ [lista]: perfil[lista].map((o, j) => (j === i ? v : o)) });

  const setCop = (i: number, patch: Partial<ItemCoparticipacao>) =>
    setPerfil({ coparticipacao: perfil.coparticipacao.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  const adicionarPerfil = () => {
    const pct = Math.max(30, ...p.perfis.map((pf) => Math.max(0, ...pf.coparticipacao.filter((c) => c.tipo === "Percentual").map((c) => c.valor)))) + 20;
    const alvo = Math.min(pct, 90);
    const base = novoPerfil(`Coparticipação ${alvo}%`, perfil);
    // o novo perfil já nasce com o percentual do nome; valores fixos e preços ficam para ajuste
    const novo = { ...base, coparticipacao: base.coparticipacao.map((c) => (c.tipo === "Percentual" ? { ...c, valor: alvo } : c)) };
    setP((x) => ({ ...x, perfis: [...x.perfis, novo] }));
    setPerfilAtivoId(novo.id);
  };
  const removerPerfil = () => {
    if (p.perfis.length < 2 || !confirm(`Remover o perfil "${perfil.nome}"?`)) return;
    const resto = p.perfis.filter((x) => x.id !== perfil.id);
    setP((x) => ({ ...x, perfis: resto }));
    setPerfilAtivoId(resto[0].id);
  };

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
          <Campo label="Linha do produto">
            <div className="flex gap-1">
              {LINHAS.map((l: Linha) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => set("linha", l)}
                  className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold ring-1 transition ${p.linha === l ? "bg-accent text-white ring-accent" : "text-gray-600 ring-gray-300 hover:bg-gray-50"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </Campo>
          <Campo label="Nº de registro ANS (9 dígitos)">
            <input className="input" value={p.registroANS} maxLength={12} onChange={(e) => set("registroANS", e.target.value)} placeholder="000000000" />
          </Campo>
          <Campo label="Descrição" className="md:col-span-3">
            <textarea className="input min-h-24" value={p.descricao} onChange={(e) => set("descricao", e.target.value)} />
          </Campo>

        </div>
      </Secao>

      <Secao titulo="Capa do produto">
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <div>
            <div className="aspect-video overflow-hidden rounded-md shadow-lg ring-1 ring-black/10">
              <ProdutoCapa produto={{ ...p, nome: p.nome || "Aurora Novo Produto" }} />
            </div>
            <div className="mt-2 flex gap-2">
              <button type="button" className="btn-outline flex-1 py-1.5 text-xs" onClick={() => fotoRef.current?.click()}>
                <ImagePlus size={14} /> {p.imagem ? "Trocar imagem" : "Enviar imagem do marketing"}
              </button>
              {p.imagem && <button type="button" className="btn-outline py-1.5 text-xs" onClick={() => set("imagem", undefined)}>Usar arte</button>}
            </div>
            <input ref={fotoRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && reduzirImagem(e.target.files[0], (url) => set("imagem", url))} />
            <p className="mt-1 text-[11px] text-gray-400">Formato 16:9 (ajustado para 1280×720). Deixe espaço livre à esquerda para o nome.</p>
          </div>
          <div className="space-y-4">
            {!p.imagem && (
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <Campo label="Ícone da arte provisória">
                  <div className="grid grid-cols-8 gap-1">
                    {ICONES_PRODUTO.map((k) => {
                      const { icon: I, rotulo } = ICONES_PROD[k];
                      return (
                        <button
                          key={k}
                          type="button"
                          title={rotulo}
                          onClick={() => set("icone", k)}
                          className={`flex aspect-square items-center justify-center rounded-md ring-1 transition ${p.icone === k ? "bg-accent text-white ring-accent" : "text-gray-500 ring-gray-200 hover:bg-gray-50"}`}
                        >
                          <I size={16} />
                        </button>
                      );
                    })}
                  </div>
                </Campo>
                <Campo label="Cor da linha">
                  <input type="color" className="h-10 w-20 cursor-pointer rounded-lg border border-gray-300" value={p.cor} onChange={(e) => set("cor", e.target.value)} />
                </Campo>
              </div>
            )}
            <Campo label="Sugestão de imagem para o marketing (briefing)">
              <textarea
                className="input min-h-24"
                value={p.conceitoImagem ?? ""}
                onChange={(e) => set("conceitoImagem", e.target.value)}
                placeholder="Ex.: Família na varanda, luz natural da manhã, fundo desfocado em verde suave; espaço livre à esquerda para o título."
              />
            </Campo>
          </div>
        </div>
      </Secao>

      <Secao titulo="Características do produto (ANS)">
        <div className="grid gap-4 md:grid-cols-3">
          <Sel
            label="Tipo de contratação"
            valor={p.contratacao}
            opcoes={OPC.contratacao}
            onChange={(v) =>
              setP((x) =>
                v === "Individual/Familiar" && x.abrangencia === "Nacional"
                  ? { ...x, contratacao: v, abrangencia: "Grupo de Municípios", redeNacional: undefined, areaAtuacao: [...MUNICIPIOS_REGIAO] }
                  : { ...x, contratacao: v },
              )
            }
          />
          <Sel label="Segmentação assistencial" valor={p.segmentacao} opcoes={OPC.segmentacao} onChange={(v) => set("segmentacao", v)} />
          <Sel
            label="Abrangência geográfica"
            valor={p.abrangencia}
            opcoes={p.contratacao === "Individual/Familiar" ? ["Grupo de Municípios"] : OPC.abrangencia}
            onChange={(v) =>
              setP((x) => ({
                ...x,
                abrangencia: v,
                areaAtuacao: v === "Nacional" ? ["Todo o território nacional"] : [...MUNICIPIOS_REGIAO],
                redeNacional: v === "Nacional" ? x.redeNacional ?? "Básica" : undefined,
              }))
            }
          />
          <Sel label="Padrão de acomodação" valor={p.acomodacao} opcoes={OPC.acomodacao} onChange={(v) => set("acomodacao", v)} />
          <Sel
            label="Fator moderador"
            valor={p.fatorModerador}
            opcoes={OPC.fator}
            onChange={(v) =>
              setP((x) =>
                v === "Sem fator moderador"
                  ? { ...x, fatorModerador: v, perfis: [{ ...perfil, nome: "Sem coparticipação", coparticipacao: [], limiteGlobal: undefined }] }
                  : { ...x, fatorModerador: v, perfis: x.perfis.map((pf) => (pf.nome === "Sem coparticipação" ? { ...pf, nome: "Coparticipação 30%" } : pf)) },
              )
            }
          />
          <Sel label="Formação de preço" valor={p.formacaoPreco} opcoes={OPC.formacao} onChange={(v) => set("formacaoPreco", v)} />
          <Sel label="Situação na ANS" valor={p.situacaoANS} opcoes={OPC.situacao} onChange={(v) => set("situacaoANS", v)} />
          <Sel label="Status comercial (interno)" valor={p.statusComercial} opcoes={OPC.status} onChange={(v) => set("statusComercial", v)} />
        </div>
        <div className="mt-4 rounded-xl border border-gray-200 p-4">
          {p.abrangencia === "Nacional" ? (
            <>
              <label className="label">Rede nacional referenciada</label>
              <div className="flex flex-wrap gap-2">
                {OPC.redeNacional.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => set("redeNacional", n)}
                    className="rounded-lg px-4 py-2 text-sm font-bold text-white transition"
                    style={{ background: NIVEL_COR[n], opacity: p.redeNacional === n ? 1 : 0.35 }}
                  >
                    + Rede Nacional {n}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Produto nacional = rede direta da operadora (selecionada abaixo) + rede nacional referenciada do nível escolhido.
                Área de atuação: todo o território nacional.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <label className="label">Área de atuação ({p.areaAtuacao.length} de {MUNICIPIOS_REGIAO.length} municípios)</label>
                <button type="button" className="text-xs font-semibold text-brand-700 hover:underline" onClick={() => set("areaAtuacao", [...MUNICIPIOS_REGIAO])}>
                  Selecionar todos
                </button>
              </div>
              <div className="mt-1 grid gap-1 sm:grid-cols-2 lg:grid-cols-4">
                {MUNICIPIOS_REGIAO.map((m) => (
                  <label key={m} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="accent-brand-600"
                      checked={p.areaAtuacao.includes(m)}
                      onChange={(e) => set("areaAtuacao", e.target.checked ? [...p.areaAtuacao, m] : p.areaAtuacao.filter((x) => x !== m))}
                    />
                    {m}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">Grupo de municípios: atendimento pela rede direta da operadora — especifique os prestadores abaixo.</p>
            </>
          )}
        </div>
        {p.contratacao === "Coletivo por Adesão" && (
          <Dica>Coletivo por adesão: exige vínculo do beneficiário com pessoa jurídica de caráter profissional, classista ou setorial (RN 557/2022).</Dica>
        )}
        {p.contratacao === "Individual/Familiar" && (
          <Dica>Individual/Familiar: reajuste anual limitado ao percentual divulgado pela ANS. Por regra de negócio, planos PF são apenas de Grupo de Municípios.</Dica>
        )}
      </Secao>

      <Secao titulo={comCopart ? "Perfis de coparticipação, preços e códigos" : "Preços e códigos"}>
        {comCopart && (
          <div className="mb-5 flex flex-wrap items-center gap-2 border-b border-gray-200 pb-4">
            {p.perfis.map((pf) => {
              const pend = problemasPerfil(pf).length > 0;
              return (
                <button
                  key={pf.id}
                  type="button"
                  onClick={() => setPerfilAtivoId(pf.id)}
                  className={`relative rounded-xl px-3.5 py-2 text-left text-sm transition ring-1 ${pf.id === perfil.id ? "bg-accent text-white ring-accent" : "text-gray-700 ring-gray-300 hover:bg-gray-50"}`}
                >
                  <span className="block font-semibold">{pf.nome || "Sem nome"}</span>
                  <span className={`block text-xs ${pf.id === perfil.id ? "text-white/80" : "text-gray-400"}`}>
                    1ª faixa {brl(pf.precoComercial[0])} · {pf.codigos.length} códigos
                  </span>
                  {pend && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-surface" title="Há pendências neste perfil" />}
                </button>
              );
            })}
            <button type="button" onClick={adicionarPerfil} className="rounded-xl border border-dashed border-gray-300 px-3.5 py-2 text-sm font-semibold text-gray-500 transition hover:border-brand-400 hover:text-brand-700">
              <Plus size={14} className="mr-1 inline" /> Adicionar perfil de coparticipação
            </button>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          {comCopart ? (
            <Campo label="Nome do perfil">
              <input className="input" value={perfil.nome} onChange={(e) => setPerfil({ nome: e.target.value })} placeholder="Ex.: Coparticipação 30%" />
            </Campo>
          ) : <div />}
          {comCopart && p.perfis.length > 1 && (
            <div className="flex items-end">
              <button type="button" onClick={removerPerfil} className="btn-outline text-red-600"><Trash2 size={15} /> Remover perfil</button>
            </div>
          )}
          <Campo label={`Códigos usados no sistema${comCopart && p.perfis.length > 1 ? " neste perfil" : ""} (${perfil.codigos.length} de ${MIN_CODIGOS} a ${MAX_CODIGOS})`} className="md:col-span-2">
            <CodigosInput
              key={perfil.id}
              codigos={perfil.codigos}
              onChange={(c) => setPerfil({ codigos: c })}
              emUso={new Map([...codigosEmOutros, ...p.perfis.filter((x) => x.id !== perfil.id).flatMap((x) => x.codigos.map((c) => [c, `o perfil ${x.nome}`] as const))])}
            />
          </Campo>
        </div>

        {comCopart && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-bold text-brand-900">Coparticipação{p.perfis.length > 1 ? ` · ${perfil.nome}` : ""}</h3>
            <div className="hidden grid-cols-12 gap-2 sm:grid">
              <span className="filtro-label col-span-5">Classificação</span>
              <span className="filtro-label col-span-2">Tipo</span>
              <span className="filtro-label col-span-2">Valor (% ou R$)</span>
              <span className="filtro-label col-span-2">Limite da classificação (R$)</span>
            </div>
            <div className="space-y-2">
              {perfil.coparticipacao.map((c, i) => (
                <div key={c.id} className="grid grid-cols-12 gap-2">
                  <input className="input col-span-12 sm:col-span-5" value={c.procedimento} onChange={(e) => setCop(i, { procedimento: e.target.value })} />
                  <select className="input col-span-4 sm:col-span-2" value={c.tipo} onChange={(e) => setCop(i, { tipo: e.target.value as ItemCoparticipacao["tipo"] })}>
                    <option>Percentual</option><option>Valor fixo</option>
                  </select>
                  <input type="number" className="input col-span-3 sm:col-span-2" title={c.tipo === "Percentual" ? "%" : "R$"} value={c.valor} onChange={(e) => setCop(i, { valor: Number(e.target.value) })} />
                  <input type="number" className="input col-span-3 sm:col-span-2" placeholder="Sem limite" value={c.limite ?? ""} onChange={(e) => setCop(i, { limite: e.target.value ? Number(e.target.value) : undefined })} />
                  <button className="col-span-2 text-red-500 sm:col-span-1" onClick={() => setPerfil({ coparticipacao: perfil.coparticipacao.filter((_, j) => j !== i) })} aria-label="Remover"><Trash2 size={18} /></button>
                </div>
              ))}
              <button
                className="btn-outline"
                onClick={() => setPerfil({ coparticipacao: [...perfil.coparticipacao, { id: uidLocal(), procedimento: "Nova classificação", tipo: "Valor fixo", valor: 0 }] })}
              >
                <Plus size={16} /> Adicionar classificação
              </button>
            </div>
            <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-brand-900">
                <input
                  type="checkbox"
                  className="accent-brand-600"
                  checked={!!perfil.limiteGlobal}
                  onChange={(e) => setPerfil({ limiteGlobal: e.target.checked ? { valor: 600, periodo: "Mensal" } : undefined })}
                />
                Aplicar limite global (soma de todas as classificações)
              </label>
              {perfil.limiteGlobal && (
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <Campo label="Limite global (R$)">
                    <input type="number" className="input w-40" value={perfil.limiteGlobal.valor} onChange={(e) => setPerfil({ limiteGlobal: { ...perfil.limiteGlobal!, valor: Number(e.target.value) } })} />
                  </Campo>
                  <Campo label="Período">
                    <select className="input w-36" value={perfil.limiteGlobal.periodo} onChange={(e) => setPerfil({ limiteGlobal: { ...perfil.limiteGlobal!, periodo: e.target.value as "Mensal" | "Anual" } })}>
                      <option>Mensal</option><option>Anual</option>
                    </select>
                  </Campo>
                  <p className="pb-2 text-xs text-gray-500">
                    Soma dos limites das classificações: {brl(perfil.coparticipacao.reduce((t, c) => t + (c.limite ?? 0), 0))}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <NotaTecnicaEditor
          key={`nt-${perfil.id}`}
          nota={perfil.notaTecnica}
          onChange={(notaTecnica) => setPerfil({ notaTecnica })}
          titulo={`Nota técnica (NTRP)${comCopart && p.perfis.length > 1 ? ` · ${perfil.nome}` : ""}`}
        />

        <div className="mt-6">
          <h3 className="mb-2 text-sm font-bold text-brand-900">Preço comercial por faixa etária{comCopart && p.perfis.length > 1 ? ` · ${perfil.nome}` : ""}</h3>
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <button className="btn-outline" onClick={() => setPerfil({ precoComercial: [...perfil.notaTecnica.t] })}>
              <Copy size={16} /> Usar o T da nota técnica
            </button>
            <button
              className="btn-outline"
              disabled={!ntCompleta || !perfil.precoComercial[0]}
              title={!ntCompleta ? "Preencha o T das 10 faixas na nota técnica" : !perfil.precoComercial[0] ? "Informe o preço da 1ª faixa" : "Aplica as variações entre faixas da nota técnica sobre o preço da 1ª faixa"}
              onClick={() => {
                const t = perfil.notaTecnica.t;
                setPerfil({ precoComercial: t.map((v) => r2((perfil.precoComercial[0] * v) / t[0])) });
              }}
            >
              <Wand2 size={16} /> Gerar a partir da 1ª (variações da NTRP)
            </button>
            <div className="flex items-end gap-2">
              <Campo label="Reajuste %">
                <input type="number" className="input w-24" value={reajuste} onChange={(e) => setReajuste(Number(e.target.value))} />
              </Campo>
              <button
                className="btn-outline"
                onClick={() => setPerfil({ precoComercial: perfil.precoComercial.map((v) => Math.round(v * (1 + reajuste / 100) * 100) / 100) })}
              >
                Aplicar
              </button>
            </div>
          </div>
          <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="py-1">Faixa</th>
                  <th className="py-1">Preço comercial (R$)</th>
                  <th className="py-1 pr-3 text-right">Variação entre faixas</th>
                  <th className="py-1 pr-3 text-right">Desvio vs T</th>
                  <th className="py-1 pl-2 text-right">Margem NTRP</th>
                </tr>
              </thead>
              <tbody>
                {FAIXAS_ETARIAS.map((f, i) => {
                  const v = variacoes[i];
                  const m = margens[i];
                  return (
                    <tr key={f}>
                      <td className="py-1 pr-3 font-medium">{i + 1}ª · {f}</td>
                      <td className="py-1 pr-3">
                        <input
                          type="number"
                          step="0.01"
                          className={`input ${m === "abaixo" || m === "acima" ? "!border-red-400 !ring-red-100" : ""}`}
                          value={perfil.precoComercial[i]}
                          onChange={(e) => setPreco("precoComercial", i, Number(e.target.value))}
                        />
                      </td>
                      <td className="py-1 pr-3 text-right text-xs text-gray-600">
                        {v === null ? "—" : `${v >= 0 ? "+" : ""}${(v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`}
                      </td>
                      <td className="py-1 pr-3 text-right text-xs text-gray-500">
                        {perfil.notaTecnica.t[i] ? `${desvios[i] >= 0 ? "+" : ""}${(desvios[i] * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` : "—"}
                      </td>
                      <td className="py-1 text-right text-xs">
                        {m === "ok" && <span className="font-semibold text-brand-700">dentro</span>}
                        {m === "abaixo" && <span className="font-semibold text-red-600">abaixo</span>}
                        {m === "acima" && <span className="font-semibold text-red-600">acima</span>}
                        {m === "sem" && <span className="text-gray-400">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <ListaRegras titulo="Validação RN 63/2003" regras={regrasPreco} />
          </div>
        </div>
      </Secao>

      <Secao titulo={`Rede direta (${p.rede.length} prestadores)`}>
        {p.abrangencia === "Nacional" && p.redeNacional && (
          <div className="mb-4 rounded-lg px-4 py-2 text-sm font-bold text-white" style={{ background: NIVEL_COR[p.redeNacional] }}>
            Além da rede direta abaixo, o produto conta com a Rede Nacional {p.redeNacional}.
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" className="accent-brand-600" checked={soArea} onChange={(e) => setSoArea(e.target.checked)} />
            Mostrar só prestadores dos municípios da área de atuação
          </label>
          <span className="text-xs text-gray-400">Cadastro de prestadores em Gestão de Rede.</span>
        </div>
        <Dica>
          Exclusão ou substituição de prestador hospitalar exige comunicação/autorização prévia à ANS e aviso aos beneficiários (Lei 9.656/1998, art. 17).
        </Dica>
        <div className="mt-4 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {TIPOS_PRESTADOR.map((t) => {
            const lista = prestadores.filter((x) => x.tipo === t && (x.ativo || p.rede.includes(x.id)) && (!soArea || p.abrangencia === "Nacional" || x.unidades.some((u) => p.areaAtuacao.includes(`${u.cidade}/${u.uf}`))));
            return (
              <div key={t}>
                <div className="mb-2 text-sm font-bold text-brand-900">{t} ({lista.filter((x) => p.rede.includes(x.id)).length}/{lista.length})</div>
                <div className="space-y-1">
                  {lista.map((x) => (
                    <label key={x.id} className="flex cursor-pointer items-start gap-2 rounded-lg p-1.5 text-sm hover:bg-gray-50">
                      <input
                        type="checkbox"
                        className="mt-0.5 accent-brand-600"
                        checked={p.rede.includes(x.id)}
                        onChange={(e) => set("rede", e.target.checked ? [...p.rede, x.id] : p.rede.filter((r) => r !== x.id))}
                      />
                      <span>{x.nome}<span className="block text-xs text-gray-400">{locaisPrestador(x)}{!x.ativo && " · inativo"}</span></span>
                    </label>
                  ))}
                  {!lista.length && <span className="text-xs text-gray-400">Nenhum prestador.</span>}
                </div>
              </div>
            );
          })}
        </div>
      </Secao>

      <Secao titulo="Soluções adicionais permitidas">
        <p className="mb-3 text-sm text-gray-500">Marque quais soluções adicionais podem ser vendidas junto com este produto.</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {solucoes.map((sol) => (
            <label key={sol.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-3 hover:border-brand-300">
              <input
                type="checkbox"
                className="accent-brand-600"
                checked={p.solucoes.includes(sol.id)}
                onChange={(e) => set("solucoes", e.target.checked ? [...p.solucoes, sol.id] : p.solucoes.filter((x) => x !== sol.id))}
              />
              <span className="h-8 w-1.5 rounded-full" style={{ background: sol.cor }} />
              <span className="text-sm">
                <span className="font-semibold">{sol.nome}</span>
                <span className="block text-xs text-gray-500">{sol.categoria}{!sol.ativa && " · inativa"}</span>
              </span>
            </label>
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

function reduzirImagem(f: File, cb: (url: string) => void) {
  const img = new Image();
  img.onload = () => {
    const w = 1280, h = 720;
    const esc = Math.max(w / img.width, h / img.height);
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    c.getContext("2d")!.drawImage(img, (w - img.width * esc) / 2, (h - img.height * esc) / 2, img.width * esc, img.height * esc);
    cb(c.toDataURL("image/jpeg", 0.82));
  };
  img.src = URL.createObjectURL(f);
}

/** Campo de códigos (4 letras + 2 números), adicionados com Enter, vírgula ou espaço. */
function CodigosInput({ codigos, onChange, emUso }: { codigos: string[]; onChange: (c: string[]) => void; emUso: Map<string, string> }) {
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const adicionar = (bruto: string) => {
    const novos = bruto.toUpperCase().split(/[\s,;]+/).filter(Boolean);
    if (!novos.length) return;
    let lista = [...codigos];
    for (const c of novos) {
      if (!REGEX_CODIGO.test(c)) return setErro(`"${c}" inválido: use 4 letras + 2 números (ex.: PLUS01).`);
      if (lista.includes(c)) return setErro(`${c} já está na lista.`);
      if (emUso.has(c)) return setErro(`${c} já é usado em ${emUso.get(c)}.`);
      if (lista.length >= MAX_CODIGOS) return setErro(`Máximo de ${MAX_CODIGOS} códigos por produto.`);
      lista = [...lista, c];
    }
    onChange(lista);
    setTexto("");
    setErro("");
  };
  return (
    <div>
      <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg border border-gray-300 bg-surface px-2 py-1.5 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
        {codigos.map((c) => (
          <span key={c} className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 font-mono text-sm font-semibold tracking-wider text-gray-800">
            {c}
            <button type="button" onClick={() => onChange(codigos.filter((x) => x !== c))} className="text-gray-400 hover:text-red-500" aria-label={`Remover ${c}`}>×</button>
          </span>
        ))}
        {codigos.length < MAX_CODIGOS && (
          <input
            value={texto}
            maxLength={60}
            onChange={(e) => { setTexto(e.target.value.toUpperCase()); setErro(""); }}
            onKeyDown={(e) => {
              if (["Enter", ",", " ", "Tab"].includes(e.key) && texto.trim()) { e.preventDefault(); adicionar(texto); }
              if (e.key === "Backspace" && !texto && codigos.length) onChange(codigos.slice(0, -1));
            }}
            onBlur={() => texto.trim() && adicionar(texto)}
            onPaste={(e) => { e.preventDefault(); adicionar(e.clipboardData.getData("text")); }}
            placeholder={codigos.length ? "" : "Ex.: PLUS01 — Enter para adicionar"}
            className="min-w-32 flex-1 bg-transparent px-1 font-mono text-sm uppercase tracking-wider outline-none placeholder:normal-case placeholder:tracking-normal"
          />
        )}
      </div>
      <p className={`mt-1 text-xs ${erro ? "text-red-600" : "text-gray-400"}`}>
        {erro || "4 letras + 2 números. Enter, vírgula ou espaço para adicionar; cole vários de uma vez."}
      </p>
    </div>
  );
}

/** Cadastro da Nota Técnica (NTRP): T, margem inferior e superior por faixa — aceita colar do Excel. */
function NotaTecnicaEditor({ nota, onChange, titulo }: { nota: NotaTecnica; onChange: (n: NotaTecnica) => void; titulo: string }) {
  const [inf, setInf] = useState(8);
  const [sup, setSup] = useState(12);
  const [aviso, setAviso] = useState("");
  const setCel = (col: "t" | "inferior" | "superior", i: number, v: number) => onChange({ ...nota, [col]: nota[col].map((o, j) => (j === i ? v : o)) });
  const regrasT = nota.t.every((v) => v > 0) ? validarFaixasRN63(nota.t) : null;

  /**
   * Edita a variação da faixa i: recalcula o T dessa faixa a partir da anterior e desloca as faixas seguintes
   * na mesma proporção (preservando as variações delas). As margens acompanham o T proporcionalmente.
   */
  const aplicarVariacao = (i: number, pctVar: number) => {
    const novoTi = r2(nota.t[i - 1] * (1 + pctVar / 100));
    const fator = nota.t[i] ? novoTi / nota.t[i] : 1;
    const ajusta = (arr: number[], escalar: boolean) =>
      arr.map((v, j) => (j < i ? v : j === i && !escalar ? novoTi : r2(v * fator)));
    if (!nota.t[i]) {
      onChange({ ...nota, t: nota.t.map((v, j) => (j === i ? novoTi : v)) });
      return;
    }
    onChange({ ...nota, t: ajusta(nota.t, false), inferior: ajusta(nota.inferior, true), superior: ajusta(nota.superior, true) });
  };

  /** Cola um bloco do Excel (linhas = faixas; colunas = T, margem inferior, margem superior) a partir da célula clicada. */
  const colar = (e: React.ClipboardEvent<HTMLInputElement>, linha: number, colIni: number) => {
    const texto = e.clipboardData.getData("text");
    if (!/[\t\n]/.test(texto.trim())) return; // valor único: colagem normal
    e.preventDefault();
    const cols: ("t" | "inferior" | "superior")[] = ["t", "inferior", "superior"];
    const novo = { ...nota, t: [...nota.t], inferior: [...nota.inferior], superior: [...nota.superior] };
    const num = (x: string) => Number(x.replace(/[R$\s.]/g, "").replace(",", "."));
    const linhas = texto.trim().split(/\r?\n/);
    linhas.forEach((ln, di) => {
      ln.split("\t").forEach((cel, dj) => {
        const i = linha + di, c = cols[colIni + dj];
        if (i < 10 && c && cel.trim() && !Number.isNaN(num(cel))) novo[c][i] = num(cel);
      });
    });
    onChange(novo);
    setAviso(`${Math.min(linhas.length, 10 - linha)} faixa(s) coladas da planilha.`);
    window.setTimeout(() => setAviso(""), 3000);
  };

  return (
    <div className="mt-6 rounded-xl border border-gray-200 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-brand-900">{titulo}</h3>
        <span className="flex items-center gap-1 text-[11px] text-gray-400"><ClipboardPaste size={13} /> Cole as colunas T, margem inferior e margem superior direto do Excel</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Campo label="Nº / protocolo da NTRP"><input className="input" value={nota.numero} onChange={(e) => onChange({ ...nota, numero: e.target.value })} placeholder="Ex.: NT-0011-01" /></Campo>
        <Campo label="Data-base"><input type="month" className="input" value={nota.dataBase} onChange={(e) => onChange({ ...nota, dataBase: e.target.value })} /></Campo>
        <Campo label="Atuário responsável"><input className="input" value={nota.atuario} onChange={(e) => onChange({ ...nota, atuario: e.target.value })} placeholder="Nome · MIBA" /></Campo>
      </div>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
            <th className="py-1">Faixa</th>
            <th className="py-1">T · preço sugerido (R$)</th>
            <th className="py-1">Variação entre faixas (%)</th>
            <th className="py-1">Margem inferior (R$)</th>
            <th className="py-1">Margem superior (R$)</th>
          </tr>
        </thead>
        <tbody>
          {FAIXAS_ETARIAS.map((f, i) => (
            <tr key={f}>
              <td className="py-1 pr-3 font-medium">{i + 1}ª · {f}</td>
              {(["t", "inferior", "superior"] as const).map((col, c) => (
                <Fragment key={col}>
                  <td className="py-1 pr-3">
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={nota[col][i] || ""}
                      onChange={(e) => setCel(col, i, Number(e.target.value))}
                      onPaste={(e) => colar(e, i, c)}
                    />
                  </td>
                  {col === "t" && (
                    <td className="py-1 pr-3">
                      {i === 0 ? (
                        <span className="block px-3 text-gray-400">—</span>
                      ) : (
                        <CelulaVariacao
                          valor={nota.t[i - 1] && nota.t[i] ? (nota.t[i] / nota.t[i - 1] - 1) * 100 : null}
                          desabilitado={!nota.t[i - 1]}
                          onCommit={(v) => aplicarVariacao(i, v)}
                        />
                      )}
                    </td>
                  )}
                </Fragment>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {regrasT && (
        <div className={`mt-3 rounded-lg px-3 py-2 text-xs ${regrasT.every((r) => r.ok) ? "bg-brand-50 text-brand-800" : "bg-red-50 text-red-700"}`}>
          <strong>Variações da nota técnica · RN 63/2003:</strong>{" "}
          {regrasT.map((r) => `${r.ok ? "✓" : "✗"} ${r.titulo}`).join("  ·  ")}
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span>Sem as margens da atuária? Calcular a partir do T:</span>
        <span>−</span><input type="number" className="input w-16 px-2 py-1 text-xs" value={inf} onChange={(e) => setInf(Number(e.target.value))} /><span>%</span>
        <span>/ +</span><input type="number" className="input w-16 px-2 py-1 text-xs" value={sup} onChange={(e) => setSup(Number(e.target.value))} /><span>%</span>
        <button
          type="button"
          className="font-semibold text-brand-700 hover:underline"
          onClick={() => onChange({ ...nota, inferior: nota.t.map((v) => Math.round(v * (100 - inf)) / 100), superior: nota.t.map((v) => Math.round(v * (100 + sup)) / 100) })}
        >
          Calcular margens
        </button>
        {aviso && <span className="ml-auto font-semibold text-brand-700">{aviso}</span>}
      </div>
    </div>
  );
}

/** Campo de variação % com edição livre; aplica ao sair do campo ou com Enter. */
function CelulaVariacao({ valor, desabilitado, onCommit }: { valor: number | null; desabilitado?: boolean; onCommit: (v: number) => void }) {
  const fmt = (v: number | null) => (v === null ? "" : (Math.round(v * 100) / 100).toString());
  const [texto, setTexto] = useState(fmt(valor));
  const [focado, setFocado] = useState(false);
  const exibido = focado ? texto : fmt(valor);
  const confirmar = () => {
    setFocado(false);
    const n = Number(texto.replace(",", "."));
    if (texto.trim() !== "" && !Number.isNaN(n) && fmt(valor) !== texto) onCommit(n);
  };
  return (
    <div className="relative">
      <input
        className="input pr-7 text-right"
        inputMode="decimal"
        disabled={desabilitado}
        value={exibido}
        placeholder="—"
        onFocus={() => { setTexto(fmt(valor)); setFocado(true); }}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={confirmar}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      />
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
    </div>
  );
}
