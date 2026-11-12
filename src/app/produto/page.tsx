"use client";

import { ArrowLeft, Download, Edit3, FileText, GitCompare, MapPin, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { FeedItem } from "@/components/feed";
import { AvisoRedeNacional, nomeCurto, ProdutoCapa, RedeNacionalBadge, StatusBadge, tomSituacao } from "@/components/produto";
import { ListaRegras } from "@/components/regras";
import { CapaSolucao } from "@/components/solucao";
import { Badge, Tabs, Vazio } from "@/components/ui";
import { brl, dataBR, desvioNTRP, formatarRegistro, pct, siglaSegmentacao, tipoPessoa, validarFaixasRN63 } from "@/lib/ans";
import { usePermissoes, useStore } from "@/lib/store";
import { FAIXAS_ETARIAS, type Produto, type TipoPrestador } from "@/lib/types";

const ABAS = [
  "Preço", "Perfil de Coparticipação", "Hospitais", "Pronto atendimento", "Laboratórios", "Imagem", "Clínicas", "Soluções adicionais", "Mais…",
] as const;
type Aba = (typeof ABAS)[number];
const ABA_TIPO: Partial<Record<Aba, TipoPrestador>> = {
  Hospitais: "Hospital", "Pronto atendimento": "Pronto atendimento", Laboratórios: "Laboratório", Imagem: "Imagem", Clínicas: "Clínica",
};

export default function Page() {
  return <Suspense><ProdutoDetalhe /></Suspense>;
}

function ProdutoDetalhe() {
  const id = useSearchParams().get("id");
  const produto = useStore((s) => s.produtos.find((p) => p.id === id));
  const prestadores = useStore((s) => s.prestadores);
  const [aba, setAba] = useState<Aba>("Preço");
  const perm = usePermissoes();
  const excluir = useStore((s) => s.excluirProduto);
  const router = useRouter();

  if (!produto) return <Vazio texto="Produto não encontrado." />;

  const rede = prestadores.filter((p) => produto.rede.includes(p.id));
  const contagem = Object.fromEntries(
    Object.entries(ABA_TIPO).map(([a, t]) => [a, rede.filter((r) => r.tipo === t).length]),
  ) as Partial<Record<Aba, number>>;
  contagem["Soluções adicionais"] = produto.solucoes.length;

  return (
    <>
      <section className="relative -mx-4 -mt-4 h-[460px] overflow-hidden bg-black sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8">
        <div className="absolute inset-0"><ProdutoCapa produto={produto} variante="hero" titulo={false} /></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-page to-transparent" />

        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-5 sm:px-6 lg:px-8">
          <Link href="/portfolio/" className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur hover:bg-black/60">
            <ArrowLeft size={16} /> Portfólio
          </Link>
          <div className="flex gap-2">
            <Link href={`/comparativos/?a=${produto.id}`} title="Comparar" className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/60 bg-black/30 text-white hover:border-white"><GitCompare size={16} /></Link>
            <Link href={`/materiais/?produto=${produto.id}`} title="Materiais" className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/60 bg-black/30 text-white hover:border-white"><FileText size={16} /></Link>
            {perm.moderar && (
              <button
                title="Excluir"
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/60 bg-black/30 text-white hover:border-red-400 hover:text-red-300"
                onClick={() => {
                  if (confirm(`Excluir "${produto.nome}" do portal? (somente na demo)`)) {
                    excluir(produto.id);
                    router.push("/portfolio/");
                  }
                }}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="relative flex h-full max-w-3xl flex-col justify-end px-4 pb-14 text-white sm:px-6 lg:px-8">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
            Registro ANS nº {formatarRegistro(produto.registroANS)}
          </div>
          <div className="mt-1 text-sm font-semibold uppercase tracking-[0.4em] text-white/70">Aurora</div>
          <h1 className="font-display text-6xl uppercase leading-[0.85] tracking-wide drop-shadow-lg sm:text-7xl">{nomeCurto(produto)}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusBadge produto={produto} />
            <Badge tom={tomSituacao(produto.situacaoANS)}>ANS: {produto.situacaoANS}</Badge>
            <RedeNacionalBadge produto={produto} grande />
          </div>
          <p className="mt-3 line-clamp-2 max-w-2xl text-sm text-white/85 sm:text-base">{produto.descricao}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/85">
            <span>{tipoPessoa(produto.contratacao)} · {produto.contratacao}</span>
            <span className="text-white/40">•</span>
            <span>{produto.abrangencia}</span>
            <span className="text-white/40">•</span>
            <span>{siglaSegmentacao(produto.segmentacao)}</span>
            <span className="text-white/40">•</span>
            <span>{produto.acomodacao}</span>
            <span className="text-white/40">•</span>
            <span>{produto.fatorModerador}</span>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            {perm.editarProdutos && (
              <Link href={`/produto/editar/?id=${produto.id}`} className="inline-flex items-center gap-2 rounded-md bg-white px-5 py-2.5 text-sm font-bold text-black hover:bg-white/80">
                <Edit3 size={16} /> Editar produto
              </Link>
            )}
            <span className="text-sm text-white/80">a partir de <strong className="text-lg text-white">{brl(produto.precoComercial[0])}</strong>/mês</span>
          </div>
        </div>
      </section>

      <div className="card relative z-10 -mt-6 p-0">
        <div className="px-4 pt-2"><Tabs abas={ABAS} ativa={aba} onChange={setAba} contagem={contagem} /></div>
        <div className="p-6">
          {aba === "Preço" && <AbaPreco produto={produto} />}
          {aba === "Perfil de Coparticipação" && <AbaCopart produto={produto} />}
          {ABA_TIPO[aba] && <AbaRede produto={produto} tipo={ABA_TIPO[aba]!} />}
          {aba === "Soluções adicionais" && <AbaSolucoes produto={produto} />}
          {aba === "Mais…" && <AbaMais produto={produto} />}
        </div>
      </div>
    </>
  );
}

function AbaPreco({ produto }: { produto: Produto }) {
  const tolerancia = useStore((s) => s.config.toleranciaNTRP) / 100;
  const desvios = desvioNTRP(produto);
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="py-2">Faixa etária</th>
              <th className="py-2 text-right">Preço comercial</th>
              <th className="py-2 text-right">Nota Técnica (NTRP)</th>
              <th className="py-2 text-right">Desvio</th>
              <th className="py-2 text-right">Var. vs faixa anterior</th>
            </tr>
          </thead>
          <tbody>
            {FAIXAS_ETARIAS.map((f, i) => {
              const fora = Math.abs(desvios[i]) > tolerancia;
              return (
                <tr key={f} className="border-b border-gray-100">
                  <td className="py-2 font-medium">{i + 1}ª · {f}</td>
                  <td className="py-2 text-right font-semibold text-brand-800">{brl(produto.precoComercial[i])}</td>
                  <td className="py-2 text-right text-gray-600">{brl(produto.precoNTRP[i])}</td>
                  <td className={`py-2 text-right ${fora ? "font-semibold text-red-600" : "text-gray-500"}`}>{pct(desvios[i])}</td>
                  <td className="py-2 text-right text-gray-500">
                    {i === 0 ? "—" : pct(produto.precoComercial[i] / produto.precoComercial[i - 1] - 1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-gray-500">
          Valores mensais por beneficiário. Formação de preço: {produto.formacaoPreco}. Desvio destacado em vermelho quando acima da
          tolerância interna de {(tolerancia * 100).toFixed(0)}% em relação à NTRP (parâmetro em Configurações).
        </p>
      </div>
      <ListaRegras titulo="Faixas etárias (RN 63/2003)" regras={validarFaixasRN63(produto.precoComercial)} />
    </div>
  );
}

function AbaCopart({ produto }: { produto: Produto }) {
  if (produto.fatorModerador === "Sem fator moderador" || produto.coparticipacao.length === 0)
    return <Vazio texto="Este produto não possui coparticipação ou franquia." />;
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="py-2">Classificação</th>
              <th className="py-2">Tipo</th>
              <th className="py-2 text-right">Valor</th>
              <th className="py-2 text-right">Limite da classificação</th>
            </tr>
          </thead>
          <tbody>
            {produto.coparticipacao.map((c) => (
              <tr key={c.id} className="border-b border-gray-100">
                <td className="py-2 font-medium">{c.procedimento}</td>
                <td className="py-2 text-gray-600">{c.tipo}</td>
                <td className="py-2 text-right font-semibold text-brand-800">{c.tipo === "Percentual" ? `${c.valor}%` : brl(c.valor)}</td>
                <td className="py-2 text-right text-gray-600">{c.limite ? brl(c.limite) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-brand-700">Limite global</div>
        {produto.limiteGlobal ? (
          <>
            <div className="mt-1 text-2xl font-bold text-brand-900">{brl(produto.limiteGlobal.valor)}</div>
            <div className="text-sm text-brand-700">por beneficiário · {produto.limiteGlobal.periodo.toLowerCase()}</div>
            <p className="mt-3 text-xs text-gray-500">
              Teto geral contabilizando todas as classificações. Atingido o limite global, não há cobrança de coparticipação no período,
              mesmo que o limite de alguma classificação ainda não tenha sido alcançado.
            </p>
          </>
        ) : (
          <div className="mt-1 text-sm text-gray-500">Sem limite global definido.</div>
        )}
      </div>
    </div>
  );
}

function AbaRede({ produto, tipo }: { produto: Produto; tipo: TipoPrestador }) {
  const prestadores = useStore((s) => s.prestadores);
  const lista = prestadores.filter((p) => p.tipo === tipo && produto.rede.includes(p.id));
  return (
    <>
      <AvisoRedeNacional produto={produto} />
      {produto.abrangencia === "Nacional" && (
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Rede direta</div>
      )}
      {!lista.length ? (
        <Vazio texto={`Nenhum prestador do tipo ${tipo.toLowerCase()} na rede direta deste produto.`} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((p) => (
            <div key={p.id} className="flex items-start gap-3 rounded-xl border border-gray-200 p-4">
              <MapPin size={18} className="mt-0.5 shrink-0 text-brand-600" />
              <div>
                <div className="flex items-center gap-1 font-semibold text-gray-900">
                  {p.nome} {p.destaque && <Star size={14} className="fill-amber-400 text-amber-400" />}
                </div>
                <div className="text-xs text-gray-500">{p.bairro} · {p.cidade}/{p.uf}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function AbaSolucoes({ produto }: { produto: Produto }) {
  const solucoes = useStore((s) => s.solucoes);
  const permitidas = solucoes.filter((s) => produto.solucoes.includes(s.id));
  if (!permitidas.length) return <Vazio texto="Este produto não permite a venda de soluções adicionais." />;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {permitidas.map((s) => (
        <Link key={s.id} href="/solucoes/" className="group">
          <div className="aspect-video overflow-hidden rounded-md shadow ring-1 ring-black/5 transition group-hover:scale-[1.03]">
            <CapaSolucao solucao={s} />
          </div>
          <div className="mt-1.5 text-xs text-gray-500">{s.categoria} · {s.precoMensal ? `${brl(s.precoMensal)}/mês` : "sem custo adicional"}</div>
        </Link>
      ))}
    </div>
  );
}

function AbaMais({ produto }: { produto: Produto }) {
  const todasAlteracoes = useStore((s) => s.alteracoes);
  const todosMateriais = useStore((s) => s.materiais);
  const alteracoes = todasAlteracoes.filter((a) => a.produtoId === produto.id && a.status === "Publicada");
  const materiais = todosMateriais.filter((m) => m.produtoId === produto.id);
  const dados: [string, string][] = [
    ["Nº de registro na ANS", formatarRegistro(produto.registroANS)],
    ["Situação na ANS", produto.situacaoANS],
    ["Tipo de contratação", produto.contratacao],
    ["Segmentação assistencial", produto.segmentacao],
    ["Abrangência geográfica", produto.abrangencia + (produto.redeNacional ? ` + Rede Nacional ${produto.redeNacional}` : "")],
    ["Padrão de acomodação", produto.acomodacao],
    ["Fator moderador", produto.fatorModerador],
    ["Formação de preço", produto.formacaoPreco],
    ["Cobertura mínima", "Rol de Procedimentos e Eventos em Saúde (RN 465/2021 e atualizações)"],
    ["Última atualização", dataBR(produto.atualizadoEm, true)],
  ];
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h3 className="mb-3 font-bold text-brand-900">Dados regulatórios</h3>
        <dl className="divide-y divide-gray-100 text-sm">
          {dados.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2">
              <dt className="text-gray-500">{k}</dt>
              <dd className="text-right font-medium text-gray-800">{v}</dd>
            </div>
          ))}
        </dl>
        <h3 className="mb-2 mt-6 font-bold text-brand-900">Área de atuação</h3>
        <div className="flex flex-wrap gap-2">
          {produto.areaAtuacao.map((a) => <Badge key={a} tom="verde">{a}</Badge>)}
        </div>
        <h3 className="mb-2 mt-6 font-bold text-brand-900">Materiais ({materiais.length})</h3>
        <ul className="space-y-1 text-sm">
          {materiais.slice(0, 6).map((m) => (
            <li key={m.id} className="flex items-center gap-2 text-gray-700"><Download size={14} /> {m.titulo} <span className="text-xs text-gray-400">({m.categoria})</span></li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-3 font-bold text-brand-900">Histórico de alterações publicadas</h3>
        <div className="space-y-3">
          {alteracoes.length ? alteracoes.map((a) => <FeedItem key={a.id} alteracao={a} />) : <Vazio texto="Sem alterações publicadas." />}
        </div>
      </div>
    </div>
  );
}
