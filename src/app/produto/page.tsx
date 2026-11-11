"use client";

import { ArrowLeft, Download, Edit3, FileText, GitCompare, MapPin, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { FeedItem } from "@/components/feed";
import { ProdutoCapa, StatusBadge, tomSituacao } from "@/components/produto";
import { ListaRegras } from "@/components/regras";
import { Badge, Tabs, Vazio } from "@/components/ui";
import { PRESTADORES } from "@/data/seed";
import {
  brl, dataBR, desvioNTRP, formatarRegistro, pct, siglaSegmentacao, tipoPessoa, validarCoparticipacao, validarFaixasRN63,
} from "@/lib/ans";
import { usePermissoes, useStore } from "@/lib/store";
import { FAIXAS_ETARIAS, type Produto, type TipoPrestador } from "@/lib/types";

const ABAS = ["Preço", "Perfil de Coparticipação", "Hospitais", "Laboratórios", "Imagem", "Clínicas", "Mais…"] as const;
type Aba = (typeof ABAS)[number];
const ABA_TIPO: Partial<Record<Aba, TipoPrestador>> = {
  Hospitais: "Hospital", Laboratórios: "Laboratório", Imagem: "Imagem", Clínicas: "Clínica",
};

export default function Page() {
  return <Suspense><ProdutoDetalhe /></Suspense>;
}

function ProdutoDetalhe() {
  const id = useSearchParams().get("id");
  const produto = useStore((s) => s.produtos.find((p) => p.id === id));
  const [aba, setAba] = useState<Aba>("Preço");
  const perm = usePermissoes();
  const excluir = useStore((s) => s.excluirProduto);
  const router = useRouter();

  if (!produto) return <Vazio texto="Produto não encontrado." />;

  const rede = PRESTADORES.filter((p) => produto.rede.includes(p.id));
  const contagem = Object.fromEntries(
    Object.entries(ABA_TIPO).map(([a, t]) => [a, rede.filter((r) => r.tipo === t).length]),
  ) as Partial<Record<Aba, number>>;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/portfolio/" className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
          <ArrowLeft size={16} /> Portfólio
        </Link>
        <div className="flex flex-wrap gap-2">
          <Link href={`/comparativos/?a=${produto.id}`} className="btn-outline"><GitCompare size={16} /> Comparar</Link>
          <Link href={`/materiais/?produto=${produto.id}`} className="btn-outline"><FileText size={16} /> Materiais</Link>
          {perm.editarProdutos && (
            <Link href={`/produto/editar/?id=${produto.id}`} className="btn-primary"><Edit3 size={16} /> Editar</Link>
          )}
          {perm.moderar && (
            <button
              className="btn-outline text-red-600"
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

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="card p-3">
          <ProdutoCapa produto={produto} altura={200} />
        </div>
        <div className="card flex flex-col p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Registro ANS nº {formatarRegistro(produto.registroANS)}
              </div>
              <h1 className="text-2xl font-bold text-brand-900">{produto.nome}</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge produto={produto} />
              <Badge tom={tomSituacao(produto.situacaoANS)}>ANS: {produto.situacaoANS}</Badge>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">{produto.descricao}</p>
          <div className="mt-auto flex flex-wrap gap-2 pt-5">
            <Chip>{tipoPessoa(produto.contratacao)} · {produto.contratacao}</Chip>
            <Chip>{produto.abrangencia}</Chip>
            <Chip>{siglaSegmentacao(produto.segmentacao)}</Chip>
            <Chip>{produto.acomodacao}</Chip>
            <Chip>{produto.fatorModerador}</Chip>
            <Chip>1ª faixa – {brl(produto.precoComercial[0])}</Chip>
          </div>
        </div>
      </div>

      <div className="card mt-5 p-0">
        <div className="px-4 pt-2"><Tabs abas={ABAS} ativa={aba} onChange={setAba} contagem={contagem} /></div>
        <div className="p-6">
          {aba === "Preço" && <AbaPreco produto={produto} />}
          {aba === "Perfil de Coparticipação" && <AbaCopart produto={produto} />}
          {ABA_TIPO[aba] && <AbaRede produto={produto} tipo={ABA_TIPO[aba]!} />}
          {aba === "Mais…" && <AbaMais produto={produto} />}
        </div>
      </div>
    </>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-lg border border-brand-300 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">{children}</span>;
}

function AbaPreco({ produto }: { produto: Produto }) {
  const tolerancia = useStore((s) => s.config.toleranciaNTRP) / 100;
  const desvios = desvioNTRP(produto);
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500">
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
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500">
            <th className="py-2">Procedimento / evento</th>
            <th className="py-2">Tipo</th>
            <th className="py-2 text-right">Valor</th>
            <th className="py-2 text-right">Limite por evento</th>
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
      <ListaRegras titulo="Mecanismos de regulação (CONSU 8/1998)" regras={validarCoparticipacao(produto.coparticipacao)} />
    </div>
  );
}

function AbaRede({ produto, tipo }: { produto: Produto; tipo: TipoPrestador }) {
  const lista = PRESTADORES.filter((p) => p.tipo === tipo && produto.rede.includes(p.id));
  if (!lista.length) return <Vazio texto={`Nenhum prestador do tipo ${tipo.toLowerCase()} na rede deste produto.`} />;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {lista.map((p) => (
        <div key={p.id} className="flex items-start gap-3 rounded-xl border border-gray-200 p-4">
          <MapPin size={18} className="mt-0.5 shrink-0 text-brand-600" />
          <div>
            <div className="flex items-center gap-1 font-semibold text-gray-900">
              {p.nome} {p.destaque && <Star size={14} className="fill-amber-400 text-amber-400" />}
            </div>
            <div className="text-xs text-gray-500">{p.municipio}/{p.uf}</div>
          </div>
        </div>
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
    ["Abrangência geográfica", produto.abrangencia],
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
          {materiais.slice(0, 5).map((m) => (
            <li key={m.id} className="flex items-center gap-2 text-gray-700"><Download size={14} /> {m.titulo} <span className="text-xs text-gray-400">({m.formato})</span></li>
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
