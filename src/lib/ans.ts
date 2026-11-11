import type { ItemCoparticipacao, Produto } from "./types";

export interface Regra {
  ok: boolean;
  titulo: string;
  detalhe: string;
  base: string;
}

/**
 * Validação das regras de precificação por faixa etária — RN ANS nº 63/2003, art. 3º:
 * I   - o valor da 10ª faixa não pode ser superior a 6x o valor da 1ª faixa;
 * II  - a variação acumulada entre a 7ª e a 10ª faixas não pode ser superior
 *       à variação acumulada entre a 1ª e a 7ª faixas;
 * III - as variações por mudança de faixa etária não podem ser negativas.
 */
export function validarFaixasRN63(precos: number[]): Regra[] {
  const p = precos.map((v) => Number(v) || 0);
  if (p.length !== 10 || p[0] <= 0) {
    return [
      {
        ok: false,
        titulo: "Tabela incompleta",
        detalhe: "Informe os valores das 10 faixas etárias.",
        base: "RN 63/2003",
      },
    ];
  }
  const razao = p[9] / p[0];
  const var17 = p[6] / p[0] - 1;
  const var710 = p[9] / p[6] - 1;
  const negativas = p
    .map((v, i) => (i > 0 && v < p[i - 1] ? i : -1))
    .filter((i) => i > 0);

  return [
    {
      ok: razao <= 6,
      titulo: "10ª faixa ≤ 6x a 1ª faixa",
      detalhe: `A 10ª faixa equivale a ${razao.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}x a 1ª faixa.`,
      base: "RN 63/2003, art. 3º, I",
    },
    {
      ok: var710 <= var17 + 1e-9,
      titulo: "Variação 7ª→10ª ≤ variação 1ª→7ª",
      detalhe: `Variação 1ª→7ª: ${pct(var17)} · Variação 7ª→10ª: ${pct(var710)}.`,
      base: "RN 63/2003, art. 3º, II",
    },
    {
      ok: negativas.length === 0,
      titulo: "Sem variações negativas entre faixas",
      detalhe:
        negativas.length === 0
          ? "Todas as faixas são iguais ou superiores à anterior."
          : `Variação negativa na(s) faixa(s): ${negativas.map((i) => i + 1).join(", ")}.`,
      base: "RN 63/2003, art. 3º, III",
    },
  ];
}

/** Desvio do preço comercial em relação à NTRP, por faixa. */
export function desvioNTRP(produto: Pick<Produto, "precoComercial" | "precoNTRP">): number[] {
  return produto.precoComercial.map((v, i) => {
    const base = produto.precoNTRP[i];
    return base ? v / base - 1 : 0;
  });
}

/**
 * Regras de mecanismos de regulação (coparticipação/franquia) — Resolução CONSU nº 8/1998:
 * não pode caracterizar financiamento integral do procedimento pelo beneficiário e,
 * em internações, não pode ser cobrada em percentual (exceto saúde mental após 30 dias).
 */
export function validarCoparticipacao(itens: ItemCoparticipacao[]): Regra[] {
  const pctInternacao = itens.filter(
    (i) =>
      i.tipo === "Percentual" &&
      /interna/i.test(i.procedimento) &&
      !/sa[uú]de mental|psiqui/i.test(i.procedimento),
  );
  const integral = itens.filter((i) => i.tipo === "Percentual" && i.valor >= 100);
  const semTeto = itens.filter((i) => i.tipo === "Percentual" && !i.limite);
  return [
    {
      ok: integral.length === 0,
      titulo: "Não caracteriza financiamento integral",
      detalhe:
        integral.length === 0
          ? "Nenhum item com coparticipação de 100% ou mais."
          : `Itens com 100%: ${integral.map((i) => i.procedimento).join(", ")}.`,
      base: "CONSU 8/1998, art. 2º, VII",
    },
    {
      ok: pctInternacao.length === 0,
      titulo: "Internação sem coparticipação percentual",
      detalhe:
        pctInternacao.length === 0
          ? "Internações com valor fixo (ou sem coparticipação)."
          : `Ajustar para valor fixo: ${pctInternacao.map((i) => i.procedimento).join(", ")}.`,
      base: "CONSU 8/1998, art. 2º, VIII",
    },
    {
      ok: semTeto.length === 0,
      titulo: "Itens percentuais com limite por evento",
      detalhe:
        semTeto.length === 0
          ? "Todos os itens percentuais possuem teto."
          : `Boa prática: definir teto para ${semTeto.map((i) => i.procedimento).join(", ")}.`,
      base: "Boa prática / transparência ao beneficiário",
    },
  ];
}

export function tipoPessoa(c: Produto["contratacao"]): "PF" | "PJ" {
  return c === "Individual/Familiar" ? "PF" : "PJ";
}

export function siglaSegmentacao(s: Produto["segmentacao"]): string {
  const map: Record<Produto["segmentacao"], string> = {
    Ambulatorial: "Amb",
    "Hospitalar com Obstetrícia": "Hosp + Obs",
    "Hospitalar sem Obstetrícia": "Hosp",
    "Ambulatorial + Hospitalar com Obstetrícia": "Amb + Hosp + Obs",
    "Ambulatorial + Hospitalar sem Obstetrícia": "Amb + Hosp",
    Referência: "Referência",
    Odontológico: "Odonto",
  };
  return map[s];
}

export function formatarRegistro(r: string): string {
  const d = r.replace(/\D/g, "").padStart(9, "0").slice(0, 9);
  return `${d.slice(0, 3)}.${d.slice(3, 6)}/${d.slice(6, 8)}-${d.slice(8)}`;
}

export const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const brl = (v: number) => BRL.format(v || 0);
export const pct = (v: number) =>
  `${v >= 0 ? "" : "−"}${Math.abs(v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

export function dataBR(iso: string, comHora = false): string {
  const d = new Date(iso);
  return comHora
    ? d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
    : d.toLocaleDateString("pt-BR");
}

/** Referências normativas exibidas na interface. */
export const NORMATIVOS = [
  { sigla: "Lei 9.656/1998", tema: "Lei dos Planos de Saúde — segmentações, coberturas e registro de produtos" },
  { sigla: "RN 63/2003", tema: "Faixas etárias e limites de variação de preço" },
  { sigla: "CONSU 8/1998", tema: "Mecanismos de regulação: coparticipação e franquia" },
  { sigla: "RN 465/2021", tema: "Rol de Procedimentos e Eventos em Saúde (cobertura mínima)" },
  { sigla: "RN 557/2022", tema: "Contratação de planos coletivos empresariais e por adesão" },
  { sigla: "RN 438/2018", tema: "Portabilidade de carências" },
  { sigla: "Lei 9.656/1998, art. 17", tema: "Substituição/redimensionamento de rede hospitalar" },
];
