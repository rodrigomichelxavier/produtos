// DADOS 100% FICTÍCIOS — apenas para demonstração do protótipo.
// Área de atuação regional: 13 municípios da Região Metropolitana de Campinas.
import type {
  Alteracao,
  Configuracoes,
  InfoRedeNacional,
  ItemCoparticipacao,
  Material,
  Prestador,
  Produto,
  SolucaoAdicional,
  Usuario,
} from "@/lib/types";

export const MUNICIPIOS_REGIAO = [
  "Campinas/SP",
  "Artur Nogueira/SP",
  "Cosmópolis/SP",
  "Holambra/SP",
  "Hortolândia/SP",
  "Indaiatuba/SP",
  "Jaguariúna/SP",
  "Monte Mor/SP",
  "Paulínia/SP",
  "Santo Antônio de Posse/SP",
  "Sumaré/SP",
  "Valinhos/SP",
  "Vinhedo/SP",
];

// Fatores por faixa que respeitam a RN 63/2003 (10ª ≤ 6x 1ª; var 7→10 ≤ var 1→7).
const FATORES = [1, 1.2, 1.38, 1.55, 1.72, 1.95, 2.5, 3.25, 4.2, 5.9];
const tabela = (base: number) => FATORES.map((f) => Math.round(base * f * 100) / 100);

const pr = (
  id: string, nome: string, tipo: Prestador["tipo"], cidade: string, bairro: string, cnes: string, destaque = false,
): Prestador => ({ id, nome, tipo, cidade, uf: "SP", bairro, cnes, ativo: true, destaque });

export const PRESTADORES: Prestador[] = [
  // Hospitais
  pr("h1", "Hospital Aurora Central", "Hospital", "Campinas", "Cambuí", "9100001", true),
  pr("h2", "Hospital Santa Lívia", "Hospital", "Campinas", "Centro", "9100002"),
  pr("h3", "Hospital e Maternidade Vale Verde", "Hospital", "Campinas", "Taquaral", "9100003"),
  pr("h4", "Hospital Infantil Pequeno Sol", "Hospital", "Campinas", "Nova Campinas", "9100004", true),
  pr("h5", "Hospital Barão Geraldo", "Hospital", "Campinas", "Barão Geraldo", "9100005"),
  pr("h6", "Hospital Bom Pastor", "Hospital", "Sumaré", "Centro", "9100006"),
  pr("h7", "Hospital Regional Hortolândia", "Hospital", "Hortolândia", "Jardim Amanda", "9100007"),
  pr("h8", "Hospital Santa Clara de Indaiatuba", "Hospital", "Indaiatuba", "Cidade Nova", "9100008"),
  pr("h9", "Hospital Vinhedo Saúde", "Hospital", "Vinhedo", "Centro", "9100009"),
  pr("h10", "Hospital Paulínia Vida", "Hospital", "Paulínia", "Morumbi", "9100010"),
  // Pronto atendimento
  pr("pa1", "Pronto Atendimento 24h Guanabara", "Pronto atendimento", "Campinas", "Guanabara", "9200001"),
  pr("pa2", "PA Infantil Valinhos", "Pronto atendimento", "Valinhos", "Centro", "9200002"),
  pr("pa3", "Pronto Atendimento Jaguariúna", "Pronto atendimento", "Jaguariúna", "Centro", "9200003"),
  // Laboratórios
  pr("l1", "Laboratório Analisa+", "Laboratório", "Campinas", "Cambuí", "9300001"),
  pr("l2", "LabVida Diagnósticos", "Laboratório", "Campinas", "Castelo", "9300002"),
  pr("l3", "Laboratório Precisão", "Laboratório", "Sumaré", "Nova Veneza", "9300003"),
  pr("l4", "Biolab Express", "Laboratório", "Indaiatuba", "Centro", "9300004"),
  pr("l5", "Laboratório Cosmópolis", "Laboratório", "Cosmópolis", "Centro", "9300005"),
  pr("l6", "Laboratório Monte Mor", "Laboratório", "Monte Mor", "Centro", "9300006"),
  // Imagem
  pr("i1", "Centro de Imagem Nítida", "Imagem", "Campinas", "Taquaral", "9400001"),
  pr("i2", "RadioCenter", "Imagem", "Campinas", "Bosque", "9400002"),
  pr("i3", "Ressonar Premium", "Imagem", "Campinas", "Cambuí", "9400003", true),
  pr("i4", "Imagem & Diagnóstico Valinhos", "Imagem", "Valinhos", "Jardim Planalto", "9400004"),
  pr("i5", "Imagem Paulínia", "Imagem", "Paulínia", "Centro", "9400005"),
  // Clínicas
  pr("c1", "Clínica Bem Estar", "Clínica", "Campinas", "Swift", "9500001"),
  pr("c2", "Policlínica Integrada", "Clínica", "Campinas", "Ponte Preta", "9500002"),
  pr("c3", "Espaço Terapias Integradas", "Clínica", "Campinas", "Nova Campinas", "9500003"),
  pr("c4", "Clínica Cuidar Hortolândia", "Clínica", "Hortolândia", "Remanso Campineiro", "9500004"),
  pr("c5", "Clínica Holambra Saúde", "Clínica", "Holambra", "Centro", "9500005"),
  pr("c6", "Clínica Artur Nogueira", "Clínica", "Artur Nogueira", "Centro", "9500006"),
  pr("c7", "Clínica Posse Saúde", "Clínica", "Santo Antônio de Posse", "Centro", "9500007"),
  pr("c8", "Clínica Mente Sã", "Clínica", "Sumaré", "Centro", "9500008"),
];

export const REDES_NACIONAIS: InfoRedeNacional[] = [
  { nivel: "Básica", descricao: "Rede referenciada nacional essencial: hospitais gerais e pronto-socorros nas capitais e principais cidades do país." },
  { nivel: "Especial", descricao: "Rede Básica + hospitais de média e alta complexidade em capitais e polos regionais." },
  { nivel: "Master", descricao: "Rede Especial + hospitais de excelência e centros de referência de alta complexidade em todo o país." },
];

const sol = (
  id: string, nome: string, icone: SolucaoAdicional["icone"], categoria: SolucaoAdicional["categoria"], fornecedor: string,
  descricao: string, precoMensal: number, cor: string, cobranca: SolucaoAdicional["cobranca"] = "Por beneficiário", ativa = true,
): SolucaoAdicional => ({ id, nome, icone, categoria, fornecedor, descricao, precoMensal, cobranca, ativa, cor });

export const SOLUCOES: SolucaoAdicional[] = [
  sol("s1", "Cobertura Aeromédica", "aviao", "Assistência", "AeroVida Remoções (fictício)", "Remoção aérea inter-hospitalar em casos de urgência e emergência, com equipe médica a bordo, em todo o território nacional.", 6.9, "#0369a1"),
  sol("s2", "TotalPass", "academia", "Bem-estar", "TotalPass", "Acesso a uma ampla rede de academias, estúdios e aulas on-line, com planos a partir de valores reduzidos para beneficiários.", 0, "#6d28d9"),
  sol("s3", "Clube de Desconto", "desconto", "Benefícios", "Clube Aurora+ (fictício)", "Descontos exclusivos em farmácias, óticas, cursos, lazer e lojas parceiras em todo o país.", 2.5, "#be185d"),
  sol("s4", "Seguro Viagem", "viagem", "Seguros", "Viaje Seguro (fictício)", "Assistência médica e hospitalar em viagens internacionais de até 30 dias, bagagem extraviada e suporte 24h.", 9.9, "#c2410c"),
  sol("s5", "Cobertura Pet", "pet", "Assistência", "PetCare (fictício)", "Consultas veterinárias, vacinas, exames e pronto-atendimento 24h para cães e gatos da família.", 29.9, "#15803d", "Por contrato"),
  sol("s6", "Assistência Funeral", "flor", "Assistência", "Amparo Familiar (fictício)", "Assistência funeral familiar com cobertura nacional e atendimento humanizado 24h.", 4.5, "#475569", "Por beneficiário", false),
  sol("s7", "Telemedicina 24h", "telemedicina", "Assistência", "Doutor Agora (fictício)", "Pronto-atendimento por vídeo a qualquer hora, com emissão de receitas e atestados digitais.", 3.9, "#0e7490"),
  sol("s8", "Odonto Essencial", "sorriso", "Assistência", "Sorriso Pleno (fictício)", "Cobertura odontológica com consultas, limpeza, restaurações e urgência odontológica.", 24.9, "#0891b2"),
  sol("s9", "Programa Gestante", "gestante", "Bem-estar", "Aurora Cuidar (fictício)", "Acompanhamento da gestação com enfermeira dedicada, cursos para gestantes e kit bebê.", 0, "#db2777"),
  sol("s10", "Check-up Executivo", "checkup", "Bem-estar", "Vitta Check-up (fictício)", "Check-up anual completo em um único dia, com laudo integrado e consulta de devolutiva.", 39.9, "#1d4ed8", "Por beneficiário"),
  sol("s11", "Desconto em Farmácias", "farmacia", "Benefícios", "Farma+ (fictício)", "Até 35% de desconto em medicamentos de uso contínuo em redes de farmácias parceiras.", 1.9, "#b91c1c"),
  sol("s12", "Seguro de Vida", "vida", "Seguros", "Proteger Seguros (fictício)", "Indenização por morte e invalidez permanente, com assistência à família.", 12.5, "#334155"),
  sol("s13", "Assistência Residencial", "casa", "Seguros", "Casa Fácil (fictício)", "Chaveiro, encanador, eletricista e vidraceiro em emergências domésticas.", 5.9, "#a16207"),
  sol("s14", "Saúde Mental Online", "mente", "Bem-estar", "Mente Leve (fictício)", "Sessões de terapia on-line, meditação guiada e conteúdos sobre bem-estar emocional.", 14.9, "#7e22ce"),
  sol("s15", "Nutri em Casa", "nutricao", "Bem-estar", "NutriPlena (fictício)", "Consultas on-line com nutricionista e planos alimentares personalizados.", 9.9, "#4d7c0f"),
];

const coparPadrao = (consulta: number): ItemCoparticipacao[] => [
  { id: "cp1", procedimento: "Consultas eletivas", tipo: "Valor fixo", valor: consulta, limite: 300 },
  { id: "cp2", procedimento: "Consultas em pronto-socorro", tipo: "Valor fixo", valor: consulta + 20, limite: 300 },
  { id: "cp3", procedimento: "Exames simples", tipo: "Percentual", valor: 30, limite: 200 },
  { id: "cp4", procedimento: "Exames especiais (TC, RM)", tipo: "Percentual", valor: 30, limite: 400 },
  { id: "cp5", procedimento: "Terapias (fisio, fono, psico)", tipo: "Percentual", valor: 30, limite: 250 },
  { id: "cp6", procedimento: "Internação", tipo: "Valor fixo", valor: 250, limite: 500 },
];

const REG_A = ["Campinas/SP", "Hortolândia/SP", "Sumaré/SP", "Paulínia/SP", "Valinhos/SP", "Vinhedo/SP"];
const NACIONAL = ["Todo o território nacional"];
const TODOS = PRESTADORES.map((p) => p.id);

const agora = new Date("2026-11-11T14:00:00-03:00").getTime();
const diasAtras = (d: number, h = 0) => new Date(agora - d * 86400000 - h * 3600000).toISOString();

type Base = Omit<Produto, "formacaoPreco" | "situacaoANS" | "atualizadoEm" | "precoComercial" | "precoNTRP"> &
  Partial<Pick<Produto, "situacaoANS">> & { preco: number; ntrp: number; dias: number };

const prod = ({ preco, ntrp, dias, ...b }: Base): Produto => ({
  formacaoPreco: "Pré-estabelecido",
  situacaoANS: "Ativo",
  ...b,
  precoComercial: tabela(preco),
  precoNTRP: tabela(ntrp),
  atualizadoEm: diasAtras(dias),
});

export const PRODUTOS: Produto[] = [
  prod({
    id: "p1", registroANS: "498765011", nome: "Aurora Essencial Enfermaria",
    vendasMes: 428, linha: "Econômico",
    descricao: "Plano de entrada para pessoa física, com rede regional na RMC, foco em atenção primária e coparticipação que reduz a mensalidade.",
    contratacao: "Individual/Familiar", segmentacao: "Ambulatorial + Hospitalar com Obstetrícia", abrangencia: "Grupo de Municípios",
    areaAtuacao: REG_A, acomodacao: "Enfermaria (coletiva)", fatorModerador: "Coparticipação", statusComercial: "Em comercialização",
    preco: 189.9, ntrp: 182.4, coparticipacao: coparPadrao(30), limiteGlobal: { valor: 600, periodo: "Mensal" },
    rede: ["h2", "h6", "h7", "pa1", "l1", "l3", "i1", "i4", "c1", "c4", "c8"], solucoes: ["s3", "s7", "s11"], cor: "#2e7d32", icone: "broto", conceitoImagem: "Jovem casal sorrindo na varanda de casa, luz natural da manhã, fundo desfocado em verde suave. Mensagem: o primeiro plano, cuidado perto de casa.", dias: 2,
  }),
  prod({
    id: "p2", registroANS: "498765022", nome: "Aurora Essencial Apartamento",
    vendasMes: 312, linha: "Econômico",
    descricao: "Mesma rede do Essencial com acomodação em apartamento. Indicado para famílias que buscam mais conforto na internação.",
    contratacao: "Individual/Familiar", segmentacao: "Ambulatorial + Hospitalar com Obstetrícia", abrangencia: "Grupo de Municípios",
    areaAtuacao: REG_A, acomodacao: "Apartamento (individual)", fatorModerador: "Coparticipação", statusComercial: "Em comercialização",
    preco: 229.5, ntrp: 221.0, coparticipacao: coparPadrao(30), limiteGlobal: { valor: 600, periodo: "Mensal" },
    rede: ["h2", "h3", "h6", "h7", "pa1", "pa2", "l1", "l3", "i1", "i4", "c1", "c4", "c8"], solucoes: ["s2", "s3", "s7", "s11"], cor: "#3d8b4f", icone: "casa", conceitoImagem: "Mãe e filho pequeno lendo juntos no sofá, ambiente claro e acolhedor, tons verde-oliva e madeira clara. Mensagem: conforto da família.", dias: 5,
  }),
  prod({
    id: "p3", registroANS: "498765033", nome: "Aurora Plus",
    vendasMes: 264, linha: "Intermediário",
    descricao: "Plano intermediário sem coparticipação, com rede ampliada nos 13 municípios da região, incluindo hospital infantil de referência.",
    contratacao: "Individual/Familiar", segmentacao: "Ambulatorial + Hospitalar com Obstetrícia", abrangencia: "Grupo de Municípios",
    areaAtuacao: MUNICIPIOS_REGIAO, acomodacao: "Apartamento (individual)", fatorModerador: "Sem fator moderador", statusComercial: "Em comercialização",
    preco: 389.0, ntrp: 372.8, coparticipacao: [],
    rede: ["h1", "h2", "h3", "h4", "h5", "h6", "h7", "h8", "pa1", "pa2", "pa3", "l1", "l2", "l3", "l4", "l5", "i1", "i2", "i4", "c1", "c2", "c3", "c4", "c5", "c6"],
    solucoes: ["s1", "s2", "s3", "s5", "s7", "s9", "s14"], cor: "#1b6e3a", icone: "familia", conceitoImagem: "Família de três gerações caminhando em parque arborizado ao entardecer, amplo espaço livre à esquerda para o título. Mensagem: rede completa na região.", dias: 1,
  }),
  prod({
    id: "p4", registroANS: "498765044", nome: "Aurora Prime",
    vendasMes: 97, linha: "Superior",
    descricao: "Linha superior para a família: a rede direta completa nos 13 municípios da região, com hospitais de referência, apartamento e sem coparticipação.",
    contratacao: "Individual/Familiar", segmentacao: "Ambulatorial + Hospitalar com Obstetrícia", abrangencia: "Grupo de Municípios",
    areaAtuacao: MUNICIPIOS_REGIAO, acomodacao: "Apartamento (individual)", fatorModerador: "Sem fator moderador", statusComercial: "Em comercialização",
    preco: 749.0, ntrp: 731.5, coparticipacao: [], rede: TODOS, solucoes: ["s1", "s2", "s3", "s4", "s5", "s7", "s8", "s9", "s10", "s14"], cor: "#12324f", icone: "coroa", conceitoImagem: "Casal maduro em casa ampla e iluminada, momento de tranquilidade, paleta azul-marinho com dourado discreto. Mensagem: o melhor da rede, perto de você.", dias: 3,
  }),
  prod({
    id: "p5", registroANS: "498765055", nome: "Aurora Hospitalar",
    vendasMes: 0, linha: "Econômico",
    descricao: "Plano exclusivamente hospitalar: internações, cirurgias e urgências. Não cobre consultas e exames ambulatoriais eletivos.",
    contratacao: "Individual/Familiar", segmentacao: "Hospitalar", abrangencia: "Grupo de Municípios",
    areaAtuacao: REG_A, acomodacao: "Enfermaria (coletiva)", fatorModerador: "Sem fator moderador",
    situacaoANS: "Ativo com comercialização suspensa", statusComercial: "Fora de comercialização",
    preco: 139.9, ntrp: 134.0, coparticipacao: [], rede: ["h2", "h6", "h7", "pa1"], solucoes: [], cor: "#4b6b5a", icone: "hospital", conceitoImagem: "Detalhe de mãos dadas junto a leito hospitalar bem iluminado, foco suave, tons neutros e verde-acinzentado. Mensagem: segurança na internação.", dias: 12,
  }),
  prod({
    id: "p6", registroANS: "498765066", nome: "Aurora Empresarial Smart",
    vendasMes: 385, linha: "Econômico",
    descricao: "Plano coletivo empresarial para PMEs (a partir de 2 vidas), rede regional e coparticipação. Ideal para reduzir custo de benefício.",
    contratacao: "Coletivo Empresarial", segmentacao: "Ambulatorial + Hospitalar com Obstetrícia", abrangencia: "Grupo de Municípios",
    areaAtuacao: MUNICIPIOS_REGIAO, acomodacao: "Enfermaria (coletiva)", fatorModerador: "Coparticipação", statusComercial: "Em comercialização",
    preco: 152.3, ntrp: 150.0, coparticipacao: coparPadrao(25), limiteGlobal: { valor: 5000, periodo: "Anual" },
    rede: ["h2", "h3", "h6", "h7", "h8", "pa1", "pa3", "l1", "l2", "l3", "l4", "l5", "l6", "i1", "i2", "i4", "c1", "c2", "c4", "c5", "c6", "c7"],
    solucoes: ["s2", "s3", "s7", "s15"], cor: "#0f5e6e", icone: "maleta", conceitoImagem: "Equipe pequena reunida em mesa de coworking, ambiente descontraído e luz natural, tons azul-petróleo. Mensagem: benefício acessível para PMEs.", dias: 4,
  }),
  prod({
    id: "p7", registroANS: "498765077", nome: "Aurora Empresarial Top",
    vendasMes: 152, linha: "Superior",
    descricao: "Coletivo empresarial nacional: rede direta ampliada na região + Rede Nacional Especial. Apartamento, sem coparticipação.",
    contratacao: "Coletivo Empresarial", segmentacao: "Ambulatorial + Hospitalar com Obstetrícia", abrangencia: "Nacional", redeNacional: "Especial",
    areaAtuacao: NACIONAL, acomodacao: "Apartamento (individual)", fatorModerador: "Sem fator moderador", statusComercial: "Em comercialização",
    preco: 318.7, ntrp: 305.0, coparticipacao: [],
    rede: ["h1", "h2", "h3", "h4", "h5", "h6", "h7", "h8", "pa1", "pa2", "pa3", "l1", "l2", "l3", "l4", "i1", "i2", "i3", "i4", "c1", "c2", "c3", "c4"],
    solucoes: ["s1", "s2", "s3", "s4", "s7", "s10", "s12"], cor: "#1e3a8a", icone: "predio", conceitoImagem: "Profissionais em escritório moderno com vista para a cidade, em movimento, azul profundo com reflexos de vidro. Mensagem: empresa que valoriza o time.", dias: 6,
  }),
  prod({
    id: "p8", registroANS: "498765088", nome: "Aurora Executivo Nacional",
    vendasMes: 61, linha: "Superior",
    descricao: "Plano coletivo empresarial para executivos: toda a rede direta + Rede Nacional Master e reembolso.",
    contratacao: "Coletivo Empresarial", segmentacao: "Ambulatorial + Hospitalar com Obstetrícia", abrangencia: "Nacional", redeNacional: "Master",
    areaAtuacao: NACIONAL, acomodacao: "Apartamento (individual)", fatorModerador: "Sem fator moderador", statusComercial: "Em comercialização",
    preco: 612.0, ntrp: 598.0, coparticipacao: [], rede: TODOS, solucoes: ["s1", "s2", "s3", "s4", "s5", "s7", "s8", "s10", "s12", "s13"], cor: "#0b2545", icone: "diamante", conceitoImagem: "Executivo(a) caminhando em saguão de aeroporto, silhueta contra janela ampla ao amanhecer, navy com acentos dourados. Mensagem: exclusividade e mobilidade.", dias: 9,
  }),
  prod({
    id: "p9", registroANS: "498765099", nome: "Aurora Adesão Profissional",
    vendasMes: 193, linha: "Intermediário",
    descricao: "Coletivo por adesão para associados de entidades de classe, com administradora de benefícios. Rede regional na RMC.",
    contratacao: "Coletivo por Adesão", segmentacao: "Ambulatorial + Hospitalar com Obstetrícia", abrangencia: "Grupo de Municípios",
    areaAtuacao: MUNICIPIOS_REGIAO, acomodacao: "Apartamento (individual)", fatorModerador: "Coparticipação", statusComercial: "Em comercialização",
    preco: 244.0, ntrp: 236.9, coparticipacao: coparPadrao(35), limiteGlobal: { valor: 800, periodo: "Mensal" },
    rede: ["h1", "h2", "h3", "h6", "h8", "pa1", "l1", "l2", "l3", "i1", "i2", "c1", "c2", "c3"], solucoes: ["s3", "s4", "s7", "s14"], cor: "#5b3fa0", icone: "cracha", conceitoImagem: "Profissionais liberais (arquiteta, advogado) em seu ambiente de trabalho, retrato com fundo limpo, violeta suave. Mensagem: o plano da sua categoria.", dias: 7,
  }),
  prod({
    id: "p10", registroANS: "498765100", nome: "Aurora Adesão Universitário",
    vendasMes: 0, linha: "Econômico",
    descricao: "Coletivo por adesão voltado a estudantes e recém-formados, enfermaria e coparticipação para preço acessível.",
    contratacao: "Coletivo por Adesão", segmentacao: "Ambulatorial + Hospitalar com Obstetrícia", abrangencia: "Grupo de Municípios",
    areaAtuacao: ["Campinas/SP", "Hortolândia/SP", "Sumaré/SP"], acomodacao: "Enfermaria (coletiva)", fatorModerador: "Coparticipação",
    statusComercial: "Em elaboração", preco: 129.0, ntrp: 125.5, coparticipacao: coparPadrao(20), limiteGlobal: { valor: 400, periodo: "Mensal" },
    rede: ["h2", "h5", "pa1", "l1", "i1", "c1", "c3"], solucoes: ["s2", "s7", "s14"], cor: "#7c4dcc", icone: "graduacao", conceitoImagem: "Estudantes conversando no campus com mochilas, energia jovem, violeta e lilás. Mensagem: primeiro plano, preço que cabe no bolso.", dias: 0,
  }),
  prod({
    id: "p11", registroANS: "498765111", nome: "Aurora Referência",
    vendasMes: 141, linha: "Econômico",
    descricao: "Plano-referência (art. 10 da Lei 9.656/1998): cobertura ambulatorial, hospitalar e obstétrica, padrão enfermaria, com rede regional.",
    contratacao: "Coletivo Empresarial", segmentacao: "Referência", abrangencia: "Grupo de Municípios",
    areaAtuacao: MUNICIPIOS_REGIAO, acomodacao: "Enfermaria (coletiva)", fatorModerador: "Sem fator moderador", statusComercial: "Em comercialização",
    preco: 198.0, ntrp: 191.0, coparticipacao: [],
    rede: ["h2", "h3", "h6", "h7", "h8", "h10", "pa1", "pa3", "l1", "l3", "l4", "l5", "i1", "i5", "c1", "c4", "c5", "c6", "c7"],
    solucoes: ["s3", "s7"], cor: "#0f766e", icone: "escudo", conceitoImagem: "Profissional de saúde acolhendo paciente em consultório claro, gesto de cuidado, teal suave. Mensagem: cobertura completa de referência.", dias: 20,
  }),
  prod({
    id: "p12", registroANS: "498765122", nome: "Aurora Nacional Básico",
    vendasMes: 118, linha: "Intermediário",
    descricao: "Coletivo empresarial de entrada com abrangência nacional: rede direta regional + Rede Nacional Básica, enfermaria e coparticipação.",
    contratacao: "Coletivo Empresarial", segmentacao: "Ambulatorial + Hospitalar com Obstetrícia", abrangencia: "Nacional", redeNacional: "Básica",
    areaAtuacao: NACIONAL, acomodacao: "Enfermaria (coletiva)", fatorModerador: "Coparticipação", statusComercial: "Em comercialização",
    preco: 209.0, ntrp: 203.0, coparticipacao: coparPadrao(25), limiteGlobal: { valor: 6000, periodo: "Anual" },
    rede: ["h2", "h6", "h7", "h8", "pa1", "l1", "l3", "l4", "i1", "i4", "c1", "c4"], solucoes: ["s1", "s3", "s7", "s12"], cor: "#1d4e89", icone: "mapa", conceitoImagem: "Mapa do Brasil em linhas finas com pontos de luz conectados, fundo azul profundo. Mensagem: proteção nacional para a sua empresa.", dias: 8,
  }),
  prod({
    id: "p13", registroANS: "498765133", nome: "Aurora Clássico 2019",
    vendasMes: 0, linha: "Econômico",
    descricao: "Produto legado substituído pela linha Essencial. Mantido apenas para a carteira existente; não pode ser comercializado.",
    contratacao: "Individual/Familiar", segmentacao: "Ambulatorial + Hospitalar com Obstetrícia", abrangencia: "Grupo de Municípios",
    areaAtuacao: ["Campinas/SP", "Valinhos/SP"], acomodacao: "Enfermaria (coletiva)", fatorModerador: "Sem fator moderador",
    situacaoANS: "Cancelado", statusComercial: "Fora de comercialização",
    preco: 275.0, ntrp: 260.0, coparticipacao: [], rede: ["h2", "l1", "i1", "c1"], solucoes: [], cor: "#6b7280", icone: "relogio", conceitoImagem: "Uso interno, sem campanha. Manter imagem neutra de arquivo.", dias: 60,
  }),
];

export const USUARIOS: Usuario[] = [
  { id: "u1", nome: "Ana Ribeiro", email: "ana.ribeiro@aurora.exemplo", perfil: "Administrador", area: "TI / Sistemas", ativo: true, senhaDefinida: true, criadoEm: diasAtras(200) },
  { id: "u2", nome: "Carlos Mendes", email: "carlos.mendes@aurora.exemplo", perfil: "Gestor", area: "Produtos", ativo: true, senhaDefinida: true, criadoEm: diasAtras(180) },
  { id: "u3", nome: "Beatriz Lima", email: "beatriz.lima@aurora.exemplo", perfil: "Colaborador", area: "Produtos", ativo: true, senhaDefinida: true, criadoEm: diasAtras(120) },
  { id: "u4", nome: "Diego Santos", email: "diego.santos@aurora.exemplo", perfil: "Colaborador", area: "Atuarial", ativo: true, senhaDefinida: true, criadoEm: diasAtras(90) },
  { id: "u5", nome: "Fernanda Costa", email: "fernanda.costa@aurora.exemplo", perfil: "Consulta", area: "Comercial", ativo: true, senhaDefinida: true, criadoEm: diasAtras(60) },
  { id: "u6", nome: "Gustavo Rocha", email: "gustavo.rocha@aurora.exemplo", perfil: "Consulta", area: "Atendimento", ativo: true, senhaDefinida: false, criadoEm: diasAtras(3) },
  { id: "u7", nome: "Helena Prado", email: "helena.prado@aurora.exemplo", perfil: "Colaborador", area: "Marketing", ativo: false, senhaDefinida: true, criadoEm: diasAtras(300) },
];

const mat = (
  id: string, produtoId: string, categoria: Material["categoria"], titulo: string, formato: Material["formato"], dias: number, versao = 1,
): Material => ({
  id,
  produtoId,
  categoria,
  titulo,
  arquivo: `${titulo.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-")}.${formato.toLowerCase()}`,
  formato,
  tamanhoKB: 120 + ((id.charCodeAt(1) * 97 + titulo.length * 31) % 4800),
  versao,
  atualizadoEm: diasAtras(dias),
});

export const MATERIAIS: Material[] = PRODUTOS.flatMap((p, idx) => [
  mat(`m${idx}a`, p.id, "Uso interno", `Ficha técnica ${p.nome}`, "PDF", 10 + idx, 2),
  mat(`m${idx}b`, p.id, "Uso interno", `Treinamento comercial ${p.nome}`, "PPTX", 30 + idx),
  mat(`m${idx}c`, p.id, "Uso interno", `Tabela de preços ${p.nome} 2026`, "XLSX", 2 + idx, 4),
  mat(`m${idx}d`, p.id, "Uso externo", `Lâmina de vendas ${p.nome}`, "PDF", 5 + idx, 3),
  mat(`m${idx}e`, p.id, "Uso externo", `Folder digital ${p.nome}`, "PDF", 15 + idx),
  mat(`m${idx}f`, p.id, "Uso externo", `Post redes sociais ${p.nome}`, "PNG", 8 + idx),
]);

export const ALTERACOES: Alteracao[] = [
  { id: "a1", produtoId: "p3", tipo: "Rede", titulo: "Inclusão de hospital na rede", detalhes: ["Incluído: Hospital Aurora Central (Cambuí · Campinas/SP)"], autorId: "u3", data: diasAtras(1, 2), status: "Publicada", moderadorId: "u2" },
  { id: "a2", produtoId: "p1", tipo: "Preço", titulo: "Atualização da tabela de preços", detalhes: ["Reajuste de 6,9% aplicado nas 10 faixas etárias", "1ª faixa: R$ 177,64 → R$ 189,90"], autorId: "u4", data: diasAtras(2, 1), status: "Publicada", moderadorId: "u2" },
  { id: "a3", produtoId: "p5", tipo: "Status", titulo: "Comercialização suspensa", detalhes: ["Status comercial: Em comercialização → Fora de comercialização", "Situação ANS: Ativo → Ativo com comercialização suspensa"], autorId: "u2", data: diasAtras(12), status: "Publicada", moderadorId: "u2" },
  { id: "a4", produtoId: "p6", tipo: "Coparticipação", titulo: "Novo perfil de coparticipação", detalhes: ["Consultas eletivas: R$ 30,00 → R$ 25,00", "Limite global: R$ 5.000,00 (anual)"], autorId: "u3", data: diasAtras(4), status: "Publicada", moderadorId: "u2" },
  { id: "a5", produtoId: "p9", tipo: "Material", titulo: "Nova lâmina de vendas", detalhes: ["Uso externo: Lâmina de vendas Aurora Adesão Profissional (v3)"], autorId: "u7", data: diasAtras(7), status: "Publicada", moderadorId: "u2" },
  { id: "a6", produtoId: "p7", tipo: "Rede", titulo: "Upgrade da rede nacional", detalhes: ["Rede nacional: Básica → Especial"], autorId: "u2", data: diasAtras(6), status: "Publicada", moderadorId: "u2" },
  { id: "a7", produtoId: "p4", tipo: "Soluções adicionais", titulo: "Nova solução adicional disponível", detalhes: ["Permitido: Cobertura Pet"], autorId: "u3", data: diasAtras(3, 4), status: "Publicada", moderadorId: "u2" },
  { id: "a8", produtoId: "p10", tipo: "Novo produto", titulo: "Produto cadastrado: Aurora Adesão Universitário", detalhes: ["Produto em elaboração — aguardando registro na ANS"], autorId: "u3", data: diasAtras(0, 5), status: "Pendente" },
  { id: "a9", produtoId: "p2", tipo: "Cadastro", titulo: "Correção na descrição do produto", detalhes: ["Descrição: correção de erro de digitação"], autorId: "u4", data: diasAtras(0, 3), status: "Pendente" },
  { id: "a10", produtoId: "p7", tipo: "Rede", titulo: "Inclusão de prestador premium", detalhes: ["Incluído: Ressonar Premium (Cambuí · Campinas/SP)"], autorId: "u3", data: diasAtras(0, 1), status: "Pendente" },
  { id: "a11", produtoId: "p4", tipo: "Preço", titulo: "Ajuste pontual na 1ª faixa", detalhes: ["Lançamento duplicado por erro material"], autorId: "u4", data: diasAtras(3), status: "Descartada", moderadorId: "u2", motivo: "Erro material — não comunicar" },
];

export const CONFIG_INICIAL: Configuracoes = {
  operadora: "Aurora Saúde (operadora fictícia)",
  registroOperadora: "999999",
  toleranciaNTRP: 10,
  exigirModeracao: true,
};
