// Modelo de domínio do Portal de Produtos.
// Os termos seguem a nomenclatura da ANS (Lei 9.656/1998 e normativos relacionados).

export type TipoContratacao =
  | "Individual/Familiar"
  | "Coletivo Empresarial"
  | "Coletivo por Adesão";

export type Segmentacao =
  | "Ambulatorial + Hospitalar com Obstetrícia"
  | "Hospitalar"
  | "Referência";

export type Abrangencia = "Nacional" | "Grupo de Municípios";

/** Nível da rede nacional referenciada que complementa a rede direta nos produtos nacionais. */
export type RedeNacional = "Básica" | "Especial" | "Master";

export type Acomodacao = "Enfermaria (coletiva)" | "Apartamento (individual)";

export type FatorModerador = "Sem fator moderador" | "Coparticipação" | "Franquia";

export type FormacaoPreco = "Pré-estabelecido" | "Pós-estabelecido" | "Misto";

export type SituacaoANS = "Ativo" | "Ativo com comercialização suspensa" | "Cancelado";

export type StatusComercial = "Em comercialização" | "Fora de comercialização" | "Em elaboração";

export const TIPOS_PRESTADOR = ["Hospital", "Pronto atendimento", "Laboratório", "Imagem", "Clínica"] as const;
export type TipoPrestador = (typeof TIPOS_PRESTADOR)[number];

export interface Prestador {
  id: string;
  nome: string;
  tipo: TipoPrestador;
  cidade: string;
  uf: string;
  bairro: string;
  cnes?: string; // Cadastro Nacional de Estabelecimentos de Saúde (7 dígitos)
  ativo: boolean;
  destaque?: boolean; // prestador de referência / premium
}

export interface InfoRedeNacional {
  nivel: RedeNacional;
  descricao: string;
}

export interface ItemCoparticipacao {
  id: string;
  procedimento: string; // classificação (consultas, exames, terapias, internação...)
  tipo: "Percentual" | "Valor fixo";
  valor: number; // % ou R$
  limite?: number; // limite da classificação em R$
}

export interface LimiteGlobal {
  valor: number; // R$ — somatório de todas as classificações
  periodo: "Mensal" | "Anual";
}

/** As 10 faixas etárias da RN nº 63/2003. */
export const FAIXAS_ETARIAS = [
  "0 a 18 anos",
  "19 a 23 anos",
  "24 a 28 anos",
  "29 a 33 anos",
  "34 a 38 anos",
  "39 a 43 anos",
  "44 a 48 anos",
  "49 a 53 anos",
  "54 a 58 anos",
  "59 anos ou mais",
] as const;

export interface Produto {
  id: string;
  registroANS: string; // nº de registro do produto na ANS (9 dígitos)
  nome: string;
  descricao: string;
  contratacao: TipoContratacao;
  segmentacao: Segmentacao;
  abrangencia: Abrangencia;
  redeNacional?: RedeNacional; // obrigatório quando abrangência = Nacional
  areaAtuacao: string[]; // municípios
  acomodacao: Acomodacao;
  fatorModerador: FatorModerador;
  formacaoPreco: FormacaoPreco;
  situacaoANS: SituacaoANS;
  statusComercial: StatusComercial;
  precoComercial: number[]; // 10 faixas
  precoNTRP: number[]; // 10 faixas (Nota Técnica de Registro de Produto)
  coparticipacao: ItemCoparticipacao[];
  limiteGlobal?: LimiteGlobal;
  rede: string[]; // ids de prestadores da rede direta
  solucoes: string[]; // ids das soluções adicionais permitidas
  cor: string; // cor do card (visual)
  atualizadoEm: string;
}

export interface SolucaoAdicional {
  id: string;
  nome: string;
  categoria: "Assistência" | "Bem-estar" | "Benefícios" | "Seguros";
  fornecedor: string;
  descricao: string;
  precoMensal: number;
  cobranca: "Por beneficiário" | "Por contrato";
  ativa: boolean;
  cor: string;
}

export type Perfil = "Administrador" | "Gestor" | "Colaborador" | "Consulta";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  area: string;
  ativo: boolean;
  foto?: string; // data URL
  senhaDefinida: boolean;
  criadoEm: string;
}

export type CategoriaMaterial = "Uso interno" | "Uso externo";

export interface Material {
  id: string;
  produtoId: string;
  categoria: CategoriaMaterial;
  titulo: string;
  arquivo: string; // nome do arquivo
  formato: "PDF" | "PNG" | "JPG" | "PPTX" | "XLSX" | "MP4" | "DOCX";
  tamanhoKB: number;
  versao: number;
  atualizadoEm: string;
  dataUrl?: string; // arquivo enviado na demo
}

export type TipoAlteracao =
  | "Preço"
  | "Rede"
  | "Status"
  | "Coparticipação"
  | "Material"
  | "Cadastro"
  | "Soluções adicionais"
  | "Novo produto";

export type StatusModeracao = "Pendente" | "Publicada" | "Descartada";

export interface Alteracao {
  id: string;
  produtoId: string;
  tipo: TipoAlteracao;
  titulo: string;
  detalhes: string[];
  autorId: string;
  data: string;
  status: StatusModeracao;
  moderadorId?: string;
  motivo?: string;
}

export interface Configuracoes {
  operadora: string;
  registroOperadora: string;
  toleranciaNTRP: number; // % de desvio aceito entre preço comercial e NTRP
  exigirModeracao: boolean;
}
