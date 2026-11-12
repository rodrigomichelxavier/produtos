"use client";

import { ArrowRight, Building2, CheckCircle2, Globe2, Package, PauseCircle, Users2 } from "lucide-react";
import Link from "next/link";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/ui";
import { FeedItem } from "@/components/feed";
import { brl, precoBase, tipoPessoa } from "@/lib/ans";
import { useStore, useUsuarioAtual } from "@/lib/store";

const CORES = ["#1d5a23", "#4fa555", "#a5d6a7", "#7fc083", "#2e8b34", "#d7ecd8"];

function contar<T extends string>(itens: T[]) {
  const m = new Map<string, number>();
  itens.forEach((i) => m.set(i, (m.get(i) ?? 0) + 1));
  return [...m.entries()].map(([nome, valor]) => ({ nome, valor }));
}

export default function HomePage() {
  const produtos = useStore((s) => s.produtos);
  const alteracoes = useStore((s) => s.alteracoes);
  const usuario = useUsuarioAtual();

  const ativos = produtos.filter((p) => p.statusComercial === "Em comercialização");
  const pf = produtos.filter((p) => tipoPessoa(p.contratacao) === "PF").length;
  const nacionais = produtos.filter((p) => p.abrangencia === "Nacional").length;
  const ticket = ativos.length ? ativos.reduce((s, p) => s + precoBase(p), 0) / ativos.length : 0;

  const kpis = [
    { label: "Produtos cadastrados", valor: produtos.length, icon: Package, sub: `${ativos.length} em comercialização` },
    { label: "Pessoa Física / Jurídica", valor: `${pf} / ${produtos.length - pf}`, icon: Users2, sub: "Individual/Familiar × Coletivos" },
    { label: "Ativos / Inativos", valor: `${ativos.length} / ${produtos.length - ativos.length}`, icon: CheckCircle2, sub: "para comercialização" },
    { label: "Nacional / Regional", valor: `${nacionais} / ${produtos.length - nacionais}`, icon: Globe2, sub: "abrangência geográfica" },
    { label: "Ticket médio 1ª faixa", valor: brl(ticket), icon: Building2, sub: "produtos em comercialização" },
    {
      label: "Comercialização suspensa",
      valor: produtos.filter((p) => p.situacaoANS !== "Ativo").length,
      icon: PauseCircle,
      sub: "suspensos ou cancelados na ANS",
    },
  ];

  const porContratacao = contar(produtos.map((p) => p.contratacao));
  const porAbrangencia = contar(produtos.map((p) => p.abrangencia));
  const porSegmentacao = contar(produtos.map((p) => p.segmentacao.replace("Ambulatorial", "Amb").replace("Hospitalar", "Hosp")));
  const porStatus = contar(produtos.map((p) => p.statusComercial));

  const feed = alteracoes.filter((a) => a.status === "Publicada").slice(0, 5);

  return (
    <>
      <PageHeader titulo={`Olá, ${usuario.nome.split(" ")[0]}`} subtitulo="Visão geral do portfólio de produtos da operadora" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map(({ label, valor, icon: Icon, sub }) => (
          <div key={label} className="card flex items-center gap-4 p-5">
            <div className="rounded-xl bg-brand-50 p-3 text-brand-700"><Icon size={24} /></div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
              <div className="text-2xl font-bold text-brand-900">{valor}</div>
              <div className="text-xs text-gray-500">{sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Grafico titulo="Tipo de contratação">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={porContratacao} dataKey="valor" nameKey="nome" innerRadius={50} outerRadius={85} paddingAngle={2}>
                {porContratacao.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <Legenda dados={porContratacao} />
        </Grafico>
        <Grafico titulo="Abrangência geográfica">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={porAbrangencia} layout="vertical" margin={{ left: 30 }}>
              <XAxis type="number" allowDecimals={false} hide />
              <YAxis type="category" dataKey="nome" width={130} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="valor" name="Produtos" fill="#2e8b34" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Grafico>
        <Grafico titulo="Segmentação assistencial">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={porSegmentacao} layout="vertical" margin={{ left: 30 }}>
              <XAxis type="number" allowDecimals={false} hide />
              <YAxis type="category" dataKey="nome" width={170} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="valor" name="Produtos" fill="#4fa555" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Grafico>
        <Grafico titulo="Status comercial">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={porStatus} dataKey="valor" nameKey="nome" innerRadius={50} outerRadius={85} paddingAngle={2}>
                {porStatus.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <Legenda dados={porStatus} />
        </Grafico>
      </div>

      <div className="card mt-6 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-brand-900">Últimas atualizações do portfólio</h2>
          <Link href="/notificacoes/" className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
            Ver todas <ArrowRight size={16} />
          </Link>
        </div>
        <div className="space-y-3">{feed.map((a) => <FeedItem key={a.id} alteracao={a} />)}</div>
      </div>
    </>
  );
}

function Grafico({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h2 className="mb-2 font-bold text-brand-900">{titulo}</h2>
      {children}
    </div>
  );
}

function Legenda({ dados }: { dados: { nome: string; valor: number }[] }) {
  return (
    <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-gray-600">
      {dados.map((d, i) => (
        <span key={d.nome} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: CORES[i % CORES.length] }} />
          {d.nome} ({d.valor})
        </span>
      ))}
    </div>
  );
}
