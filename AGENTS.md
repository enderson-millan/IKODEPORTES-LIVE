# AGENTS.md — MataMata.live

## Sobre o Projeto

**MataMata.live** é uma web app de palpites do mata-mata da Copa do Mundo 2026. Usuários fazem login com Google, escolhem quem avança em cada rodada eliminatória e competem num placar ao vivo.

Projeto **single-package** (sem monorepo / sem backend separado): Next.js App Router, Supabase como backend (auth + banco).

## Stack

| Camada        | Tecnologia                                                              |
| ------------- | ----------------------------------------------------------------------- |
| Framework     | **Next.js 16** (App Router) — rotas em `app/`                           |
| Runtime UI    | **React 19** + **TypeScript 5** (strict)                                |
| Estilo        | **Tailwind CSS v4** + **shadcn/ui** (New York, slate, CSS vars)         |
| Ícones        | **lucide-react**                                                        |
| State global  | **React Context** (`src/lib/app-context.tsx`) — lang, theme, picks      |
| Data fetching | **TanStack Query v5** — todas as chamadas async                         |
| Backend/Auth  | **Supabase** (`@supabase/supabase-js` + `@supabase/ssr`) — OAuth Google |
| Formulários   | **React Hook Form v7** + **Zod v3** + `@hookform/resolvers`             |
| Datas         | **dayjs** (preferir sobre date-fns)                                     |
| Utilitários   | `cn()` via **clsx + tailwind-merge** (`src/lib/utils.ts`)               |
| Package mgr   | **pnpm** (obrigatório — nunca npm/yarn)                                 |

## Estrutura de Pastas

```
world-cup-picks/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout — html/body, metadata
│   ├── page.tsx                # Redireciona para /login
│   └── globals.css             # Imports CSS globais
│
├── src/                        # Código-fonte (alias @/*)
│   ├── assets/                 # Imagens estáticas (mascot, stadium-bg, trophy)
│   ├── components/
│   │   ├── ui/                 # Primitivas shadcn/ui — NÃO editar manualmente
│   │   ├── AppHeader.tsx       # Barra de navegação superior
│   │   └── MatchCard.tsx       # Card de palpite de partida
│   ├── hooks/
│   │   ├── queries/            # TanStack Query — hooks de leitura
│   │   ├── mutations/          # TanStack Query — hooks de escrita
│   │   └── use-mobile.tsx      # Hook de breakpoint responsivo
│   ├── lib/
│   │   ├── app-context.tsx     # Context global + dicionário i18n (PT/ES/EN)
│   │   ├── mock-matches.ts     # Tipos Match/Team/RankRow + dados mock
│   │   └── utils.ts            # cn() utility
│   └── styles.css              # Tailwind base + CSS variables (shadcn tokens)
│
├── .kiro/
│   ├── specs/                  # Feature specs (requirements, design, tasks)
│   └── steering/               # Regras para agentes de IA
│
├── components.json             # Configuração shadcn/ui
├── next.config.ts              # Next.js config (ignoreBuildErrors durante migração)
├── tsconfig.json               # TypeScript config
└── package.json
```

## Comandos

```bash
pnpm dev        # Servidor de desenvolvimento
pnpm build      # Build de produção
pnpm preview    # Preview do build (next start)
pnpm lint       # ESLint
pnpm format     # Prettier
```

> Nunca use `npm` ou `yarn`. Sempre `pnpm`.

## Git & Commits

- **Conventional Commits**, todas as letras **minúsculas** (ex: `feat: adiciona leaderboard`)
- Nomenclatura: `kebab-case` para arquivos/pastas, `PascalCase` para componentes React, `camelCase` para funções/variáveis
- Nunca commitar `.env` — apenas `.env.example` com valores fictícios

## Convenções de Código

- **TypeScript** em todos os arquivos — sem JS puro
- **Interfaces** ao invés de `type` para objetos
- **Nomes descritivos**: `isLoading`, `hasError`, `matchId`
- **DRY** — extrair componentes e funções reutilizáveis quando necessário
- Componente usado só em uma página → criar em `_components/` dentro da pasta da rota
- Queries TanStack Query em `src/hooks/queries/`, mutations em `src/hooks/mutations/`
- Datas sempre com **dayjs**
- Estilização apenas com **Tailwind CSS** — sem CSS inline ou styled-components
- Usar componentes **shadcn/ui** sempre que possível
- Validação de formulários com **Zod** + **React Hook Form**

## Contexto de Migração

O projeto está migrando de **TanStack Router** (legacy em `src/`) para **Next.js App Router**. Novos pages vão em `app/`. Erros de TypeScript em arquivos legados de `src/` são ignorados intencionalmente (`ignoreBuildErrors: true` no `next.config.ts`) durante a migração.

O `AppHeader.tsx` ainda importa `@tanstack/react-router` — será substituído durante a migração.

## Internacionalização (i18n)

Suporte a 3 idiomas via dicionário embutido em `src/lib/app-context.tsx`:

- **PT** — Português (padrão)
- **ES** — Espanhol
- **EN** — Inglês

Usar sempre `t("chave")` do `useApp()` para textos visíveis ao usuário.

## Domínios de Imagem Permitidos (`next.config.ts`)

`a.espncdn.com`, `flagcdn.com`, `lh3.googleusercontent.com`
