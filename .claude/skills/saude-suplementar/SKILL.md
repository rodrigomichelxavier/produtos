---
name: saude-suplementar
description: Conhecimento de domínio do mercado de saúde suplementar brasileiro e dos normativos da ANS para construir o Portal de Produtos (planos de saúde). Use ao criar ou alterar campos de produto, regras de preço, coparticipação, rede credenciada, status ANS, textos da interface ou dados fictícios.
---

# Saúde suplementar e ANS — referência para o Portal de Produtos

Use esta referência ao modelar dados, validar regras e escrever textos da interface.
Os dados do protótipo são **fictícios**; nunca use nomes reais de operadoras, hospitais ou beneficiários.

## Conceitos do produto (plano de saúde)

Cada produto é registrado na ANS e recebe um **nº de registro de produto** (9 dígitos).
A operadora tem um **registro ANS de operadora** (6 dígitos). Características obrigatórias (Lei 9.656/1998):

| Campo | Valores |
|---|---|
| Tipo de contratação | Individual/Familiar (PF) · Coletivo Empresarial (PJ) · Coletivo por Adesão (PJ) |
| Segmentação assistencial | Ambulatorial · Hospitalar com/sem Obstetrícia · Ambulatorial + Hospitalar com/sem Obstetrícia · Referência · Odontológico |
| Abrangência geográfica | Nacional · Grupo de Estados · Estadual · Grupo de Municípios · Municipal |
| Área de atuação | Lista de municípios/UFs coerente com a abrangência |
| Padrão de acomodação | Coletiva (enfermaria) · Individual (apartamento). Não se aplica a planos ambulatoriais/odontológicos |
| Fator moderador | Sem · Coparticipação · Franquia |
| Formação de preço | Pré-estabelecido · Pós-estabelecido · Misto |
| Situação na ANS | Ativo · Ativo com comercialização suspensa · Cancelado |

"Status comercial" (em comercialização, em elaboração, fora de comercialização) é um conceito **interno** da operadora, distinto da situação na ANS.

## Regras de preço — RN nº 63/2003

10 faixas etárias: 0–18, 19–23, 24–28, 29–33, 34–38, 39–43, 44–48, 49–53, 54–58, 59+.

1. O valor da 10ª faixa não pode ser superior a **6 vezes** o da 1ª faixa.
2. A variação acumulada entre a 7ª e a 10ª faixas não pode ser superior à variação acumulada entre a 1ª e a 7ª faixas.
3. As variações entre faixas não podem ser negativas.

Implementação: `src/lib/ans.ts → validarFaixasRN63`.

**NTRP (Nota Técnica de Registro de Produto)**: base atuarial do preço registrada na ANS. O portal compara preço comercial × NTRP com uma tolerância interna configurável.

Reajuste: planos individuais/familiares têm reajuste anual limitado ao índice divulgado pela ANS; coletivos são negociados (com agrupamento de contratos para carteiras pequenas).

## Coparticipação e franquia — Resolução CONSU nº 8/1998

- Não pode caracterizar financiamento integral do procedimento pelo beneficiário nem fator restritor severo.
- Em **internação**, não pode ser cobrada em percentual (exceção: saúde mental, conforme regras específicas) — usar valor fixo.
- Boa prática: informar limite (teto) por evento.

Implementação: `src/lib/ans.ts → validarCoparticipacao`.

## Rede credenciada

- Tipos usados no portal: hospitais, laboratórios, centros de imagem e clínicas.
- Substituição de entidade hospitalar exige equivalência e comunicação à ANS e aos beneficiários; redução de rede hospitalar depende de autorização prévia da ANS (Lei 9.656/1998, art. 17).
- Toda alteração de rede deve gerar evento no feed de notificações (sujeito a moderação).

## Outros normativos úteis

- **RN 465/2021** — Rol de Procedimentos e Eventos em Saúde (cobertura mínima obrigatória; atualizado periodicamente).
- **RN 557/2022** — contratação de planos coletivos empresariais e por adesão (adesão exige vínculo com entidade profissional, classista ou setorial).
- **RN 438/2018** — portabilidade de carências.
- Carências máximas (Lei 9.656/1998, art. 12): 24h urgência/emergência; 300 dias parto a termo; 180 dias demais casos; CPT de até 24 meses para doenças preexistentes.

> Sempre que citar um normativo na interface, mostre a sigla e o tema. Em caso de dúvida sobre número/vigência, prefira descrever a regra sem citar o número e sinalize para validação com as áreas técnica e jurídica — normativos da ANS são revisados e consolidados com frequência.

## Glossário rápido

Beneficiário (titular/dependente) · Operadora · Administradora de benefícios · Carência · CPT (cobertura parcial temporária) · DUT (diretriz de utilização) · Rol · NTRP · SIB · RPS (Registro de Planos de Saúde) · IDSS · NIP (notificação de intermediação preliminar).
