# Portal de Produtos — protótipo

Protótipo navegável de um portal para cadastro e gestão dos **produtos (planos de saúde)** de uma operadora,
construído para apresentação de solução. **Todos os dados são fictícios** (operadora "Aurora Saúde", prestadores e usuários inventados).

## Funcionalidades (escopo do MVP)

| Módulo | O que tem |
|---|---|
| **Home** | Grandes números do portfólio (PF/PJ, ativos/inativos, nacional/regional, ticket médio) e gráficos |
| **Portfólio** | Experiência estilo streaming: Todos / Pessoa Física / Pessoa Jurídica, menu **Características** (abrangência, rede nacional, contratação, segmentação, acomodação, coparticipação, status e soluções adicionais), banner de destaque, fileiras temáticas, Top 10 e "espiada" do produto |
| **Produto** | Abas Preço (comercial × NTRP), Coparticipação (limites por classificação + limite global), rede direta por tipo de prestador, rede nacional, Soluções adicionais e Mais |
| **Cadastro/edição** | Capa do produto (imagem do marketing ou arte provisória + briefing de imagem), campos ANS, validação da **RN 63/2003** (faixas etárias), área de atuação na RMC, rede nacional (Básica/Especial/Master), rede direta e soluções permitidas |
| **Soluções adicionais** | Cadastro de serviços extras (Aeromédica, TotalPass, Clube de Desconto, Seguro Viagem, Pet…) e em quais produtos podem ser vendidos |
| **Comparativos** | Dois produtos lado a lado, só as diferenças, preço por faixa, rede nacional, rede direta "só em A / em ambos / só em B" e soluções |
| **Materiais** | Kit de comunicação por produto (Uso interno / Uso externo), download e envio de arquivos com versionamento |
| **Gestão de Rede** | (Administrador e Gestor) cadastro de hospitais, PAs, laboratórios, imagem e clínicas com cidade/UF, bairro e CNES; descrição das redes nacionais |
| **Notificações** | Feed gerado automaticamente a partir das alterações (preço, rede, status, coparticipação, materiais) + **moderação do gestor** (publicar/descartar, ex.: erro material) |
| **Usuários** | Perfis Administrador, Gestor, Colaborador e Consulta, matriz de permissões, inclusão/edição |
| **Meu perfil** | Troca de foto, dados e senha (simulada) |
| **Configurações** | Em construção: dados da operadora, tolerância NTRP, moderação obrigatória, restaurar dados da demo |

O portal tem **modo escuro** (botão no menu lateral). Use o seletor **"Simular perfil (demo)"** no menu lateral para ver o portal como cada perfil de acesso.

## Stack

- **Next.js 16** (App Router) com `output: "export"` → site 100% estático, hospedado no **GitHub Pages**
- **TypeScript**, **Tailwind CSS 4**, **lucide-react** (ícones), **Recharts** (gráficos)
- **Zustand** com persistência em `localStorage` simulando o backend (cada navegador tem sua própria cópia dos dados)

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse http://localhost:3000.

## Publicação (GitHub Pages)

O workflow `.github/workflows/deploy.yml` gera o build estático e publica a cada push na `main`.
Na primeira vez: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
O site fica em `https://<usuario>.github.io/produtos/`.

## Estrutura

```
src/
  app/            páginas (uma pasta por menu)
  components/     shell, UI, feed, regras
  data/seed.ts    dados fictícios
  lib/ans.ts      regras ANS (RN 63/2003), formatações
  lib/store.ts    estado, permissões e geração automática do feed
.claude/skills/saude-suplementar/   base de conhecimento ANS para o desenvolvimento assistido
```
