# Portal de Produtos — protótipo

Protótipo navegável de um portal para cadastro e gestão dos **produtos (planos de saúde)** de uma operadora,
construído para apresentação de solução. **Todos os dados são fictícios** (operadora "Aurora Saúde", prestadores e usuários inventados).

## Funcionalidades (escopo do MVP)

| Módulo | O que tem |
|---|---|
| **Home** | Grandes números do portfólio (PF/PJ, ativos/inativos, nacional/regional, ticket médio) e gráficos |
| **Portfólio** | Cards com filtro PF/PJ, abrangência, status, coparticipação e busca por nome/registro ANS |
| **Produto** | Detalhe com abas Preço (comercial × NTRP), Perfil de Coparticipação, Hospitais, Laboratórios, Imagem, Clínicas e Mais (dados ANS, área de atuação, histórico) |
| **Cadastro/edição** | Formulário com campos ANS e validação em tempo real da **RN 63/2003** (faixas etárias) e da **CONSU 8/1998** (coparticipação) |
| **Comparativos** | Dois produtos lado a lado, só as diferenças, gráfico de preço por faixa e rede "só em A / em ambos / só em B" |
| **Materiais** | Kit de comunicação por produto: uso interno, uso externo, lâminas, tabelas; download e envio de arquivos com versionamento |
| **Notificações** | Feed gerado automaticamente a partir das alterações (preço, rede, status, coparticipação, materiais) + **moderação do gestor** (publicar/descartar, ex.: erro material) |
| **Usuários** | Perfis Administrador, Gestor, Colaborador e Consulta, matriz de permissões, inclusão/edição |
| **Meu perfil** | Troca de foto, dados e senha (simulada) |
| **Configurações** | Em construção: dados da operadora, tolerância NTRP, moderação obrigatória, restaurar dados da demo |

Use o seletor **"Simular perfil (demo)"** no menu lateral para ver o portal como cada perfil de acesso.

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
  lib/ans.ts      regras ANS (RN 63/2003, CONSU 8/1998), formatações
  lib/store.ts    estado, permissões e geração automática do feed
.claude/skills/saude-suplementar/   base de conhecimento ANS para o desenvolvimento assistido
```
