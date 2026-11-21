# Implementation Plan: MataMata.live Next.js Migration

## Overview

Migração incremental do projeto TanStack Start + Lovable para Next.js 16 App Router + Supabase, no mesmo repositório. Cada grupo de tarefas é independente o suficiente para ser executado e verificado antes do próximo.

## Tasks

- [x] 1. Checkpoint git e limpeza do projeto Lovable

  - [x] 1.1 Fazer commit de checkpoint do estado atual antes de qualquer mudança
    - Rodar `git add . && git commit -m "chore: lovable checkpoint before next.js migration"`
    - Verificar que o commit foi criado com sucesso
  - [x] 1.2 Remover arquivos de infraestrutura do TanStack Start / Vite / Lovable
    - Deletar arquivos: `vite.config.ts`, `bunfig.toml`, `bun.lock`, `src/server.ts`, `src/start.ts`, `src/router.tsx`, `src/routeTree.gen.ts`
    - Deletar diretório `.lovable/`
    - Deletar diretório `src/routes/`
    - Deletar diretório `.tanstack/`
    - Deletar arquivos de erro do Lovable: `src/lib/error-capture.ts`, `src/lib/error-page.ts`, `src/lib/lovable-error-reporting.ts`
    - Atualizar `AGENTS.md` removendo todo o bloco `<!-- LOVABLE:BEGIN -->` até `<!-- LOVABLE:END -->`
  - [x] 1.3 Atualizar `package.json` para Next.js 16
    - Remover dependências: `@lovable.dev/vite-tanstack-config`, `@tanstack/react-start`, `@tanstack/react-router`, `@tanstack/router-plugin`, `@tailwindcss/vite`, `vite`, `vite-tsconfig-paths`, `@vitejs/plugin-react`, `nitro`
    - Adicionar dependências: `next@^16`, `@supabase/ssr@^0.6`, `@supabase/supabase-js@^2`, `next-themes@^0.4`, `@tailwindcss/postcss@^4`
    - Atualizar scripts: `"dev": "next dev"`, `"build": "next build"`, `"preview": "next start"`
    - Atualizar `"name"` para `"matamata-live"`
    - Remover campos `"type": "module"` e `"sideEffects": false`
  - [x] 1.4 Criar arquivos de configuração do Next.js
    - Criar `next.config.ts` com `images.remotePatterns` para `a.espncdn.com`, `flagcdn.com`, `lh3.googleusercontent.com`
    - Criar `postcss.config.mjs` com `{ plugins: { "@tailwindcss/postcss": {} } }`
    - Atualizar `tsconfig.json` para Next.js (adicionar `"plugins": [{ "name": "next" }]`, paths `@/*`, `include` com `app/**/*`)
    - Criar `app/globals.css` copiando o conteúdo de `src/styles.css` (Tailwind v4 oklch — sem mudanças)
    - Adicionar `.env.local` ao `.gitignore` se ainda não estiver
  - [x] 1.5 Instalar dependências e verificar build inicial vazio
    - Rodar `npm install` (ou `pnpm install`)
    - Criar `app/layout.tsx` mínimo e `app/page.tsx` mínimo para verificar que `next build` passa

- [x] 2. Tipos e adaptador ESPN

  - [x] 2.1 Criar `src/lib/types.ts` com tipos canônicos
    - Definir tipos: `Stage` (com `"r32"`), `Status`, `Team` (com `logo` e `abbr` no lugar de `flag`), `Match`, `RankRow`
    - Definir constantes: `stageOrder`, `ESPN_STAGE_MAP`, `ESPN_SLUG_MAP`
    - Exportar todos os tipos e constantes necessários para os demais módulos
  - [x] 2.2 Atualizar `src/lib/mock-matches.ts`
    - Adicionar stage `"r32"` ao array `stageOrder`
    - Adicionar 16 jogos de mock para fase R32 com times reais da Copa 2026
    - Substituir campo `flag` (emoji) por `logo` (URL ESPN CDN `https://a.espncdn.com/i/teamlogos/countries/500/{abbr}.png`) e `abbr` em cada `Team`
    - Importar tipos de `@/lib/types` ao invés de definir localmente
  - [x] 2.3 Criar `src/lib/espn-adapter.ts`
    - Definir interface `EspnRawEvent` com os campos necessários da ESPN API
    - Implementar `normalizeEspnEvent(event: EspnRawEvent): Match | null`
    - Mapear `status.type.state` → `Status`: `"pre"` → `"UPCOMING"`, `"in"` → `"LIVE"`, `"post"` → `"FINISHED"`
    - Mapear `season.slug` para `Stage` via `ESPN_SLUG_MAP`; retornar `null` se slug não reconhecido
    - Extrair `teamA` (order=0) e `teamB` (order=1) com id, name, abbr, logo, score
    - Determinar `winnerId` via `competitor.winner === true && status === "FINISHED"`
    - Implementar `getRevalidateSeconds(matches: Match[]): number` com lógica de cache dinâmico

- [x] 3. Clientes Supabase e variáveis de ambiente

  - [x] 3.1 Criar `.env.local` com variáveis de ambiente
    - Adicionar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
    - Criar `.env.local.example` com as chaves mas sem valores para documentação
  - [x] 3.2 Criar `src/lib/supabase/client.ts`
    - Adicionar `"use client"` no topo
    - Implementar `getSupabaseBrowserClient()` usando `createBrowserClient` do `@supabase/ssr`
    - Exportar função (não singleton) para evitar problemas com SSR
  - [x] 3.3 Criar `src/lib/supabase/server.ts`
    - Implementar `createSupabaseServerClient()` async usando `createServerClient` do `@supabase/ssr`
    - Usar `await cookies()` do `next/headers`
    - Implementar `getAll` e `setAll` para gerenciamento de cookies da sessão

- [ ] 4. Banco de dados Supabase

  - [x] 4.1 Criar tabela `picks` no Supabase Dashboard
    - Executar SQL da tabela `picks` com todas as colunas, FK, constraint unique e timestamps
    - Habilitar RLS e criar as três políticas (select, insert, update)
    - Verificar que as políticas funcionam logando como usuário de teste
  - [x] 4.2 Criar tabela `match_results` no Supabase Dashboard
    - Executar SQL da tabela `match_results` com `espn_event_id` como PK
    - Inserir 1 linha de teste para validar que a view funciona
  - [x] 4.3 Criar view `ranking_view` no Supabase Dashboard
    - Executar SQL da view conforme design doc
    - Verificar que a view retorna dados corretos com dados de teste

- [x] 5. ESPN API Proxy

  - [x] 5.1 Criar `app/api/matches/route.ts`
    - Implementar `GET` handler que busca as 6 fases (groups 2–7) em paralelo com `Promise.allSettled`
    - Para cada fase bem-sucedida, extrair `events` e normalizar com `normalizeEspnEvent`
    - Combinar todos os matches em um único array, filtrar `null`
    - Calcular `revalidate` com `getRevalidateSeconds` e adicionar header `Cache-Control`
    - Em caso de todas as fases falharem, retornar `mock-matches` com header `X-Data-Source: fallback`
    - Retornar `NextResponse.json({ matches, source })`
  - [x] 5.2 Verificar funcionamento do proxy
    - Rodar `next dev` e acessar `http://localhost:3000/api/matches`
    - Confirmar que o JSON retornado tem o shape `{ matches: Match[], source: string }`
    - Confirmar que logos são URLs válidas (`a.espncdn.com`)
    - Confirmar que os stages estão sendo mapeados corretamente

- [x] 6. Server Actions

  - [x] 6.1 Criar `src/actions/picks.ts`
    - Adicionar `"use server"` no topo
    - Implementar `getPicks()`: buscar picks da tabela onde `user_id = auth.uid()`, retornar `Record<string, string>`
    - Implementar `savePick(espnEventId, teamId)`: upsert com `onConflict: "user_id,espn_event_id"` e atualizar `updated_at`
    - Ambas devem verificar sessão e retornar erro `{ success: false, error: "unauthorized" }` se não autenticado
  - [x] 6.2 Criar `src/actions/ranking.ts`
    - Adicionar `"use server"` no topo
    - Implementar `getRanking()`: query na `ranking_view` com LIMIT 50
    - Adicionar campo `rank` (1-based index)
    - Buscar ID do usuário logado e marcar `isMe: true` na linha correspondente
    - Calcular `avatarFallback` a partir das iniciais do `display_name`
    - Retornar `trend: "flat"` para todos na v1

- [x] 7. Autenticação e Middleware

  - [x] 7.1 Criar `app/auth/callback/route.ts`
    - Implementar `GET` handler que extrai `code` dos searchParams
    - Chamar `supabase.auth.exchangeCodeForSession(code)`
    - Sucesso: `NextResponse.redirect(new URL("/bracket", request.url))`
    - Erro: `NextResponse.redirect(new URL("/login?error=auth_failed", request.url))`
  - [x] 7.2 Criar `middleware.ts` na raiz do projeto
    - Usar `createServerClient` do `@supabase/ssr` com `NextRequest`/`NextResponse` mutável
    - Chamar `supabase.auth.getSession()` para verificar sessão
    - Rotas `/bracket`, `/ranking` sem sessão → redirect `/login`
    - Rota `/login` com sessão → redirect `/bracket`
    - Retornar a response com cookies atualizados em todos os casos
    - Configurar `export const config = { matcher: [...] }`
  - [x] 7.3 Configurar Google OAuth no Supabase Dashboard
    - Habilitar provider Google em Authentication → Providers
    - Adicionar `http://localhost:3000/auth/callback` nas Redirect URLs
    - Confirmar que `signInWithOAuth` retorna URL de redirecionamento válida

- [x] 8. AppContext e Providers

  - [x] 8.1 Atualizar `src/lib/app-context.tsx`
    - Remover `picks` e `setPick` do tipo `Ctx` e da implementação
    - Adicionar tipo `AppUser` e campos `user`/`setUser` ao contexto
    - Integrar `useTheme` do `next-themes` para `theme` e `toggleTheme`
    - Manter `lang`, `setLang`, `t()` idênticos ao atual
    - Persistir `lang` em `localStorage` via `useEffect`
    - Manter `"use client"` no topo
  - [x] 8.2 Criar `src/components/providers.tsx`
    - Adicionar `"use client"` no topo
    - Criar `QueryClient` com `defaultOptions: { queries: { staleTime: 30_000 } }`
    - Envolver com `QueryClientProvider` → `ThemeProvider attribute="class"` → `AppProvider`
    - Exportar componente `Providers`

- [x] 9. App Router — Layout e Páginas

  - [x] 9.1 Criar `app/layout.tsx` (RootLayout)
    - Importar `./globals.css`
    - Envolver `{children}` com `<Providers>`
    - Adicionar `suppressHydrationWarning` ao `<html>`
    - Definir metadata padrão (`title`, `description`)
  - [x] 9.2 Criar `app/page.tsx`
    - Usar `redirect("/login")` do `next/navigation`
  - [x] 9.3 Criar `src/components/LoginPage.tsx` e `app/login/page.tsx`
    - Extrair toda a UI de `src/routes/login.tsx` para `src/components/LoginPage.tsx`
    - Substituir `useNavigate()` por `useRouter()` do `next/navigation`
    - Substituir `onClick={() => navigate({ to: "/bracket" })}` pelo handler de autenticação real:
      - Criar `handleGoogleLogin()` que chama `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '/auth/callback' } })`
    - Em `app/login/page.tsx`: importar e renderizar `<LoginPage />` + definir metadata
  - [x] 9.4 Criar `src/components/BracketView.tsx` e `app/bracket/page.tsx`
    - Extrair UI de `src/routes/bracket.tsx` para `src/components/BracketView.tsx`
    - Adicionar `"use client"` ao `BracketView`
    - Substituir `queryFn: async () => mockMatches` por `fetch("/api/matches").then(r => r.json()).then(d => d.matches)`
    - Adicionar `useQuery(["picks"], getPicks)` para carregar picks do Supabase
    - Adicionar mutation `useMutation` com `savePick` e optimistic update
    - Passar `picked` e `onPick` como props para cada `MatchCard`
    - Adicionar `refetchInterval` de 30s quando há partida LIVE
    - Adicionar stage `"r32"` ao `stageLabels` com label `t("r32")`
    - Em `app/bracket/page.tsx`: Server Component que renderiza `<BracketView />` + metadata
  - [x] 9.5 Criar `src/components/RankingView.tsx` e `app/ranking/page.tsx`
    - Extrair UI de `src/routes/ranking.tsx` para `src/components/RankingView.tsx`
    - Adicionar `"use client"` ao `RankingView`
    - Substituir `queryFn: async () => mockRanking` por `getRanking` (Server Action)
    - Usar `user.avatarUrl` para avatares reais com `<Image>` do `next/image`
    - Em `app/ranking/page.tsx`: Server Component que renderiza `<RankingView />` + metadata

- [x] 10. Adaptação dos Componentes de UI

  - [x] 10.1 Adaptar `src/components/AppHeader.tsx`
    - Adicionar `"use client"` no topo
    - Substituir `Link` de `@tanstack/react-router` por `Link` de `next/link`
    - Substituir `useRouterState(...)` por `usePathname()` de `next/navigation`
    - Substituir `useNavigate()` por `useRouter()` de `next/navigation`
    - Usar `user` do AppContext para exibir nome e foto real (Google)
    - Substituir avatar hardcoded "EU" por `<Image>` com `user?.avatarUrl` e fallback com iniciais
    - Implementar logout: `await supabase.auth.signOut()` + `router.push("/login")`
  - [x] 10.2 Adaptar `src/components/MatchCard.tsx`
    - Adicionar `"use client"` no topo
    - Substituir `import type { Match } from "@/lib/mock-matches"` por `import type { Match } from "@/lib/types"`
    - Substituir `team.flag` (emoji) por `<Image src={team.logo} alt={team.name} width={28} height={28} className="rounded-full object-cover" />`
    - Remover dependência de `picks`/`setPick` do AppContext
    - Adicionar props `picked: boolean` e `onPick: () => void` à interface do componente e ao `TeamRow`
  - [x] 10.3 Adicionar chaves de tradução para o novo stage `r32`
    - Em `src/lib/app-context.tsx`, adicionar ao `dict`:
      `r32: { PT: "R. de 32", ES: "Ronda de 32", EN: "Round of 32" }`

- [ ] 11. Verificação e Build Final

  - [x] 11.1 Verificar TypeScript
    - Rodar `npx tsc --noEmit` e corrigir todos os erros de tipo
    - Garantir que não há imports quebrados de `@tanstack/react-router`, `@tanstack/react-start` ou `@lovable.dev/*`
  - [x] 11.2 Verificar build de produção
    - Rodar `pnpm build` e confirmar que compila sem erros
    - Verificar que não há warnings críticos de bundle size ou missing exports
  - [x] 11.3 Testar fluxo completo em desenvolvimento
    - `/` redireciona para `/login`
    - `/bracket` sem sessão redireciona para `/login`
    - Login com Google funciona e redireciona para `/bracket`
    - Dados da ESPN aparecem no bracket (ou fallback mock se ESPN offline)
    - Clicar em time registra pick em verde e persiste após reload da página
    - Partida LIVE/FINISHED bloqueia pick e mostra resultado (acerto/erro)
    - `/ranking` mostra dados reais do Supabase com usuário destacado no final
    - Logout funciona e redireciona para `/login`
    - Alternância de tema light/dark funciona e persiste
    - Alternância de idioma PT/ES/EN funciona e persiste

## Notes

- **Next.js 16 vs 16**: Não existe Next.js 16. A versão estável mais recente é a 16. A spec usa Next.js 16.
- **`cookies()` assíncrono**: No Next.js 16, `cookies()` do `next/headers` é assíncrono e requer `await`. Todos os server clients do Supabase devem ser funções async.
- **`"use client"` granular**: Apenas componentes com hooks de estado, `usePathname`, `useRouter`, ou event handlers precisam de `"use client"`. Pages em `app/` são Server Components por padrão.
- **Lovable branch sync**: Após o commit de checkpoint (Task 1.1), a branch continuará sincronizando com o Lovable, mas os arquivos migrados para Next.js não serão compatíveis com o Lovable editor. Isso é esperado e intencional.
- **match_results v1**: Na v1, a tabela `match_results` é populada manualmente via Supabase Dashboard após cada partida terminar. Uma automação via cron/webhook pode ser adicionada posteriormente.
- **pnpm vs npm**: O projeto original usa pnpm (`pnpm-lock.yaml`). Manter pnpm para consistência; substituir `pnpm-lock.yaml` após trocar o `package.json`.

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["1"],
      "description": "Checkpoint git, limpeza Lovable/Vite, configuração Next.js e instalação de dependências"
    },
    {
      "wave": 2,
      "tasks": ["2", "3"],
      "description": "Tipos canônicos + adaptador ESPN (paralelo com clientes Supabase)"
    },
    {
      "wave": 3,
      "tasks": ["4", "5", "8"],
      "description": "Schema do banco Supabase, proxy ESPN e AppContext/Providers"
    },
    {
      "wave": 4,
      "tasks": ["6", "7"],
      "description": "Server Actions (picks/ranking) e autenticação (middleware + callback)"
    },
    {
      "wave": 5,
      "tasks": ["9", "10"],
      "description": "App Router (layout, pages) e adaptação dos componentes UI"
    },
    {
      "wave": 6,
      "tasks": ["11"],
      "description": "Verificação TypeScript, build de produção e testes de fluxo completo"
    }
  ]
}
```
