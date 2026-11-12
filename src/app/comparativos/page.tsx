"use client";

import clsx from "clsx";
import { ArrowLeftRight, Check, Globe2, Minus, Plus, Star } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { NIVEL_COR, ProdutoCapa } from "@/components/produto";
import { PageHeader, Vazio } from "@/components/ui";
import { brl, formatarRegistro, pct, resumoCoparticipacao } from "@/lib/ans";
import { locaisPrestador, useStore } from "@/lib/store";
import { FAIXAS_ETARIAS, type PerfilVenda, type Prestador, type Produto, type TipoPrestador } from "@/lib/types";

const COR_A = "#2e8b34";
const COR_B = "#0284c7";
const TIPOS: { tipo: TipoPrestador; label: string }[] = [
  { tipo: "Hospital", label: "Hospitais" },
  { tipo: "Pronto atendimento", label: "Pronto atendimento" },
  { tipo: "Laboratório", label: "Laboratórios" },
  { tipo: "Imagem", label: "Centros de imagem" },
  { tipo: "Clínica", label: "Clínicas" },
];

export default function Page() {
  return <Suspense><Comparativos /></Suspense>;
}

function Comparativos() {
  const produtos = useStore((s) => s.produtos);
  const params = useSearchParams();
  const [aId, setA] = useState(params.get("a") ?? produtos[0]?.id ?? "");
  const [bId, setB] = useState(params.get("b") ?? produtos.find((p) => p.id !== aId)?.id ?? "");
  const [soDif, setSoDif] = useState(true);
  const a = produtos.find((p) => p.id === aId);
  const b = produtos.find((p) => p.id === bId);
  const [perfilA, setPerfilA] = useState("");
  const [perfilB, setPerfilB] = useState("");
  const pa = a?.perfis.find((x) => x.id === perfilA) ?? a?.perfis[0];
  const pb = b?.perfis.find((x) => x.id === perfilB) ?? b?.perfis[0];

  return (
    <>
      <PageHeader titulo="Comparativos" subtitulo="Selecione dois produtos para ver, lado a lado, tudo o que é diferente entre eles" />

      <div className="card mb-6 grid items-center gap-4 p-4 md:grid-cols-[1fr_auto_1fr]">
        <div>
          <Seletor cor={COR_A} rotulo="Produto A" valor={aId} onChange={(v) => { setA(v); setPerfilA(""); }} produtos={produtos} />
          {a && a.perfis.length > 1 && <SeletorPerfil produto={a} valor={pa!.id} onChange={setPerfilA} cor={COR_A} />}
        </div>
        <button className="btn-outline mx-auto" onClick={() => { setA(bId); setB(aId); setPerfilA(perfilB); setPerfilB(perfilA); }} title="Inverter">
          <ArrowLeftRight size={18} />
        </button>
        <div>
          <Seletor cor={COR_B} rotulo="Produto B" valor={bId} onChange={(v) => { setB(v); setPerfilB(""); }} produtos={produtos} />
          {b && b.perfis.length > 1 && <SeletorPerfil produto={b} valor={pb!.id} onChange={setPerfilB} cor={COR_B} />}
        </div>
      </div>

      {!a || !b ? (
        <Vazio texto="Selecione dois produtos." />
      ) : a.id === b.id ? (
        <Vazio texto="Selecione produtos diferentes para comparar." />
      ) : (
        <Resultado a={a} b={b} pa={pa!} pb={pb!} soDif={soDif} setSoDif={setSoDif} />
      )}
    </>
  );
}

function Seletor({ cor, rotulo, valor, onChange, produtos }: {
  cor: string; rotulo: string; valor: string; onChange: (v: string) => void; produtos: Produto[];
}) {
  const p = produtos.find((x) => x.id === valor);
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 shrink-0">{p && <ProdutoCapa produto={p} altura={56} />}</div>
      <div className="flex-1">
        <label className="label" style={{ color: cor }}>{rotulo}</label>
        <select className="input" style={{ borderColor: cor }} value={valor} onChange={(e) => onChange(e.target.value)}>
          {produtos.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
        </select>
      </div>
    </div>
  );
}

function Resultado({ a, b, pa, pb, soDif, setSoDif }: {
  a: Produto; b: Produto; pa: PerfilVenda; pb: PerfilVenda; soDif: boolean; setSoDif: (v: boolean) => void;
}) {
  const solucoes = useStore((s) => s.solucoes);
  const nomesSol = (p: Produto) => solucoes.filter((s) => p.solucoes.includes(s.id)).map((s) => s.nome).join(", ") || "Nenhuma";
  const lg = (p: PerfilVenda) => (p.limiteGlobal ? `${brl(p.limiteGlobal.valor)} (${p.limiteGlobal.periodo.toLowerCase()})` : "—");
  const linhas: [string, string, string][] = [
    ["Registro ANS", formatarRegistro(a.registroANS), formatarRegistro(b.registroANS)],
    ["Linha", a.linha, b.linha],
    ["Tipo de contratação", a.contratacao, b.contratacao],
    ["Segmentação", a.segmentacao, b.segmentacao],
    ["Abrangência", a.abrangencia, b.abrangencia],
    ["Rede nacional", a.redeNacional ? `+ Rede Nacional ${a.redeNacional}` : "Somente rede direta", b.redeNacional ? `+ Rede Nacional ${b.redeNacional}` : "Somente rede direta"],
    ["Área de atuação", a.areaAtuacao.join(", "), b.areaAtuacao.join(", ")],
    ["Acomodação", a.acomodacao, b.acomodacao],
    ["Fator moderador", a.fatorModerador, b.fatorModerador],
    ["Perfil de coparticipação", pa.nome, pb.nome],
    ["Resumo da coparticipação", resumoCoparticipacao(pa, 6), resumoCoparticipacao(pb, 6)],
    ["Formação de preço", a.formacaoPreco, b.formacaoPreco],
    ["Situação ANS", a.situacaoANS, b.situacaoANS],
    ["Status comercial", a.statusComercial, b.statusComercial],
    ["Preço 1ª faixa", brl(pa.precoComercial[0]), brl(pb.precoComercial[0])],
    ["Preço 10ª faixa", brl(pa.precoComercial[9]), brl(pb.precoComercial[9])],
    ["Rede direta", `${a.rede.length} prestadores`, `${b.rede.length} prestadores`],
    ["Limite global de coparticipação", lg(pa), lg(pb)],
    ["Soluções adicionais", nomesSol(a), nomesSol(b)],
  ];
  const difs = linhas.filter(([, x, y]) => x !== y);
  const visiveis = soDif ? difs : linhas;
  const precos = FAIXAS_ETARIAS.map((f, i) => ({ faixa: f.replace(" anos", "").replace(" ou mais", "+"), A: pa.precoComercial[i], B: pb.precoComercial[i] }));

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-brand-900">Resumo das diferenças</h2>
            <p className="text-sm text-gray-500">{difs.length} de {linhas.length} características são diferentes</p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-brand-600" checked={soDif} onChange={(e) => setSoDif(e.target.checked)} />
            Mostrar somente diferenças
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide">
                <th className="py-2 text-gray-500">Característica</th>
                <th className="py-2" style={{ color: COR_A }}>{a.nome}</th>
                <th className="py-2" style={{ color: COR_B }}>{b.nome}</th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map(([k, x, y]) => (
                <tr key={k} className={clsx("border-b border-gray-100", x !== y && "bg-amber-50/60")}>
                  <td className="py-2 pr-4 font-medium text-gray-600">{k}</td>
                  <td className="py-2 pr-4">{x}</td>
                  <td className="py-2">{y}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-4 font-bold text-brand-900">Preço por faixa etária</h2>
        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={precos}>
              <XAxis dataKey="faixa" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
              <Tooltip formatter={(v) => brl(Number(v))} />
              <Legend formatter={(v) => (v === "A" ? a.nome : b.nome)} />
              <Bar dataKey="A" fill={COR_A} radius={[4, 4, 0, 0]} />
              <Bar dataKey="B" fill={COR_B} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-gray-500">
                <th className="py-1">Faixa</th><th className="py-1 text-right">A</th><th className="py-1 text-right">B</th><th className="py-1 text-right">B vs A</th>
              </tr>
            </thead>
            <tbody>
              {FAIXAS_ETARIAS.map((f, i) => {
                const d = pb.precoComercial[i] / pa.precoComercial[i] - 1;
                return (
                  <tr key={f} className="border-b border-gray-100">
                    <td className="py-1">{f}</td>
                    <td className="py-1 text-right">{brl(pa.precoComercial[i])}</td>
                    <td className="py-1 text-right">{brl(pb.precoComercial[i])}</td>
                    <td className={clsx("py-1 text-right font-semibold", d > 0 ? "text-red-600" : d < 0 ? "text-brand-700" : "text-gray-400")}>
                      {d > 0 ? "+" : ""}{pct(d)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ComparaSolucoes a={a} b={b} />

      <div className="card p-5">
        <h2 className="font-bold text-brand-900">Rede credenciada</h2>
        <p className="mb-5 text-sm text-gray-500">Rede nacional referenciada e, na rede direta, o que cada produto tem a mais ou a menos por tipo de prestador</p>
        <ComparaRedeNacional a={a} b={b} />
        <div className="space-y-8">
          {TIPOS.map(({ tipo, label }) => <ComparaRede key={tipo} a={a} b={b} tipo={tipo} label={label} />)}
        </div>
      </div>
    </div>
  );
}

function ComparaRede({ a, b, tipo, label }: { a: Produto; b: Produto; tipo: TipoPrestador; label: string }) {
  const prestadores = useStore((s) => s.prestadores);
  const todos = prestadores.filter((p) => p.tipo === tipo);
  const soA = todos.filter((p) => a.rede.includes(p.id) && !b.rede.includes(p.id));
  const soB = todos.filter((p) => b.rede.includes(p.id) && !a.rede.includes(p.id));
  const ambos = todos.filter((p) => a.rede.includes(p.id) && b.rede.includes(p.id));
  const total = soA.length + soB.length + ambos.length;
  if (!total) return null;
  const dif = soA.length - soB.length;
  const frase =
    dif === 0 ? "mesma quantidade" : `${dif > 0 ? a.nome : b.nome} tem ${Math.abs(dif)} a mais`;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold text-gray-800">{label}</h3>
        <span className="text-xs text-gray-500">
          <span style={{ color: COR_A }} className="font-semibold">A: {soA.length + ambos.length}</span>
          {" · "}
          <span style={{ color: COR_B }} className="font-semibold">B: {soB.length + ambos.length}</span>
          {" · "}em comum: {ambos.length} · <span className="font-semibold text-gray-700">{frase}</span>
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Coluna titulo={`Somente em ${a.nome}`} cor={COR_A} itens={soA} icone={<Plus size={14} />} />
        <Coluna titulo="Em ambos" cor="#6b7280" itens={ambos} />
        <Coluna titulo={`Somente em ${b.nome}`} cor={COR_B} itens={soB} icone={<Plus size={14} />} />
      </div>
    </div>
  );
}

function Coluna({ titulo, cor, itens, icone }: { titulo: string; cor: string; itens: Prestador[]; icone?: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: `${cor}55`, background: `${cor}0a` }}>
      <div className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: cor }}>
        {titulo} ({itens.length})
      </div>
      {itens.length === 0 ? (
        <div className="flex items-center gap-1 text-xs text-gray-400"><Minus size={14} /> nenhum</div>
      ) : (
        <ul className="space-y-1 text-sm">
          {itens.map((p) => (
            <li key={p.id} className="flex items-start gap-1.5">
              <span className="mt-0.5" style={{ color: cor }}>{icone ?? "•"}</span>
              <span>
                {p.nome} {p.destaque && <Star size={12} className="inline fill-amber-400 text-amber-400" />}
                <span className="block text-xs text-gray-400">{locaisPrestador(p)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const ORDEM_NACIONAL = { Básica: 1, Especial: 2, Master: 3 } as const;

function ComparaRedeNacional({ a, b }: { a: Produto; b: Produto }) {
  const redes = useStore((s) => s.redesNacionais);
  if (!a.redeNacional && !b.redeNacional) return null;
  const nA = a.redeNacional ? ORDEM_NACIONAL[a.redeNacional] : 0;
  const nB = b.redeNacional ? ORDEM_NACIONAL[b.redeNacional] : 0;
  const resumo =
    nA === nB ? "Mesma rede nacional referenciada" : nA > nB ? `${a.nome} tem rede nacional superior` : `${b.nome} tem rede nacional superior`;
  const Caixa = ({ p, cor }: { p: Produto; cor: string }) =>
    p.redeNacional ? (
      <div className="rounded-xl p-4 text-white" style={{ background: NIVEL_COR[p.redeNacional] }}>
        <div className="flex items-center gap-2 font-bold"><Globe2 size={18} /> + Rede Nacional {p.redeNacional}</div>
        <div className="mt-1 text-xs text-white/90">{redes.find((r) => r.nivel === p.redeNacional)?.descricao}</div>
      </div>
    ) : (
      <div className="rounded-xl border border-dashed p-4 text-sm text-gray-500" style={{ borderColor: cor }}>
        Somente rede direta ({p.abrangencia.toLowerCase()})
      </div>
    );
  return (
    <div className="mb-8">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold text-gray-800">Rede nacional referenciada</h3>
        <span className={clsx("text-xs font-semibold", nA === nB ? "text-gray-500" : "text-amber-700")}>{resumo}</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Caixa p={a} cor={COR_A} />
        <Caixa p={b} cor={COR_B} />
      </div>
    </div>
  );
}

function ComparaSolucoes({ a, b }: { a: Produto; b: Produto }) {
  const solucoes = useStore((s) => s.solucoes);
  const usadas = solucoes.filter((s) => a.solucoes.includes(s.id) || b.solucoes.includes(s.id));
  return (
    <div className="card p-5">
      <h2 className="mb-4 font-bold text-brand-900">Soluções adicionais permitidas</h2>
      {!usadas.length ? (
        <Vazio texto="Nenhum dos produtos permite soluções adicionais." />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide">
              <th className="py-2 text-gray-500">Solução</th>
              <th className="py-2 text-center" style={{ color: COR_A }}>A</th>
              <th className="py-2 text-center" style={{ color: COR_B }}>B</th>
            </tr>
          </thead>
          <tbody>
            {usadas.map((s) => {
              const emA = a.solucoes.includes(s.id);
              const emB = b.solucoes.includes(s.id);
              return (
                <tr key={s.id} className={clsx("border-b border-gray-100", emA !== emB && "bg-amber-50/60")}>
                  <td className="py-2 font-medium">{s.nome}</td>
                  <td className="py-2 text-center">{emA ? <Check size={18} className="inline" style={{ color: COR_A }} /> : <Minus size={18} className="inline text-gray-300" />}</td>
                  <td className="py-2 text-center">{emB ? <Check size={18} className="inline" style={{ color: COR_B }} /> : <Minus size={18} className="inline text-gray-300" />}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function SeletorPerfil({ produto, valor, onChange, cor }: { produto: Produto; valor: string; onChange: (v: string) => void; cor: string }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-[92px]">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Perfil</span>
      {produto.perfis.map((x) => (
        <button
          key={x.id}
          onClick={() => onChange(x.id)}
          className="rounded-full border px-2.5 py-0.5 text-xs font-semibold transition"
          style={x.id === valor ? { background: cor, borderColor: cor, color: "#fff" } : { borderColor: "var(--color-gray-300)", color: "var(--color-gray-600)" }}
        >
          {x.nome}
        </button>
      ))}
    </div>
  );
}
