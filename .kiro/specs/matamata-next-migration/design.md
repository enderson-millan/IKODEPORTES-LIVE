# Technical Design Document

## Overview

Este documento descreve a arquitetura técnica da migração do MataMata.live de TanStack Start + Vite + Lovable para Next.js 15 App Router + Supabase. A migração substitui a infraestrutura de framework, autenticação e dados mantendo toda a UI existente intacta.

A abordagem é incremental: os arquivos da `src/routes/` são migrados para `app/`, os componentes são adaptados pontualmente (troca de imports de roteamento, adição de `"use client"`), e a lógica de dados substitui mocks por chamadas reais à ESPN API e ao Supabase.

## Architecture

### Diagrama de Fluxo de Dados

```
Browser (React 19 Client Components)
  │
  ├── TanStack Query (cache client-side)
  │     ├── GET /api/matches  ──────────► Next.js Route Handler (Proxy ESPN)
  │     │                                        │
  │     │                              fetch com next: { revalidate }
  │     │                                        │
  │     │                                        ▼
  │     │                          site.api.espn.com (scoreboard)
  │     │                          groups=2..7 em paralelo
  │     │                          + fallback: mock-matches.ts
  │     │
  │     └── Server Actions
  │           ├── getPicks()    ──────────► Supabase: table picks
  │           ├── savePick()    ──────────► Supabase: upsert picks
  │           └── getRanking()  ──────────► Supabase: view ranking_view
  │
  └── Supabase Auth (Google OAuth)
        ├── signInWithOAuth() → Google → /auth/callback?code=xxx
        └── exchangeCodeForSession(code) → session cookie → /bracket
```

### Proteção de Rotas

```
Request → middleware.ts
  ├── /bracket, /ranking sem sessão → redirect /login
  ├── /login com sessão → redirect /bracket
  └── /auth/callback → processa OAuth, cria sessão
```

### Estrutura de Diretórios

```
world-cup-picks/
├── app/
│   ├── layout.tsx                    # RootLayout: Providers (Query, Theme, App)
│   ├── page.tsx                      # Redirect → /login
│   ├── login/
│   │   └── page.tsx                  # Renderiza LoginPage client component
│   ├── bracket/
│   │   └── page.tsx                  # Server wrapper → BracketView client component
│   ├── ranking/
│   │   └── page.tsx                  # Server wrapper → RankingView client component
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts              # OAuth callback handler
│   └── api/
│       └── matches/
│           └── route.ts              # ESPN proxy + cache dinâmico
│
├── src/
│   ├── assets/                       # Mantidos sem alteração
│   │   ├── stadium-bg.jpg
│   │   ├── trophy.png
│   │   └── mascot.png
│   ├── components/
│   │   ├── AppHeader.tsx             # Adaptado: next/link, usePathname, next-themes
│   │   ├── MatchCard.tsx             # Adaptado: next/image, tipos de src/lib/types.ts
│   │   ├── BracketView.tsx           # Extraído de src/routes/bracket.tsx
│   │   ├── RankingView.tsx           # Extraído de src/routes/ranking.tsx
│   │   ├── LoginPage.tsx             # Extraído de src/routes/login.tsx
│   │   ├── providers.tsx             # "use client": QueryClient + ThemeProvider + AppProvider
│   │   └── ui/                       # shadcn/ui — sem alterações
│   ├── lib/
│   │   ├── types.ts                  # Tipos canônicos: Match, Team, Stage, Status, RankRow
│   │   ├── mock-matches.ts           # Fallback data (atualizado com r32 e logo URLs)
│   │   ├── app-context.tsx           # Adaptado: + user, sem picks, usa next-themes
│   │   ├── espn-adapter.ts           # normalizeEspnEvent() → Match
│   │   ├── supabase/
│   │   │   ├── client.ts             # createBrowserClient (Client Components)
│   │   │   └── server.ts             # createServerClient (Server Components/Actions)
│   │   └── utils.ts                  # cn() — sem alterações
│   └── actions/
│       ├── picks.ts                  # savePick(), getPicks()
│       └── ranking.ts                # getRanking()
│
├── app/globals.css                   # Conteúdo de src/styles.css (Tailwind v4 oklch)
├── next.config.ts                    # next/image domains, etc.
├── tsconfig.json                     # Atualizado para Next.js
├── postcss.config.mjs                # @tailwindcss/postcss
├── package.json                      # Next.js deps, sem Lovable/Vite/TanStack Start
├── .env.local                        # Variáveis de ambiente (não versionado)
└── middleware.ts                     # Proteção de rotas autenticadas
```

## Components and Interfaces

### `app/api/matches/route.ts` — ESPN Proxy

```typescript
// GET /api/matches
// Busca jogos das fases 2-7 em paralelo e retorna Match[] normalizado
export async function GET(): Promise<NextResponse>;

// Retorna: { matches: Match[], source: "espn" | "fallback" }

// Cache: next: { revalidate: number } calculado dinamicamente
// 30s  → se há jogo LIVE
// 120s → se há jogo UPCOMING hoje
// 300s → sem jogos ativos
```

### `src/lib/espn-adapter.ts` — Normalizador

```typescript
// Converte evento da ESPN para tipo interno Match
export function normalizeEspnEvent(event: EspnRawEvent): Match | null;

// Tipos ESPN brutos necessários
interface EspnRawEvent {
  id: string;
  date: string;
  season: { slug: string };
  competitions: [
    {
      status: {
        type: { state: "pre" | "in" | "post"; name: string };
        displayClock: string;
      };
      competitors: [
        {
          id: string;
          order: number;
          score: string;
          winner: boolean;
          advance: boolean;
          team: {
            id: string;
            displayName: string;
            abbreviation: string;
            logo: string;
          };
        },
      ];
      venue?: { displayName: string };
    },
  ];
}
```

### `src/lib/supabase/client.ts`

```typescript
"use client";
import { createBrowserClient } from "@supabase/ssr";

export function getSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

### `src/lib/supabase/server.ts`

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    },
  );
}
```

### `src/actions/picks.ts`

```typescript
"use server";

// Retorna map de todos os picks do usuário logado
export async function getPicks(): Promise<Record<string, string>>;
// { "760492": "478", "760490": "464", ... }

// Salva ou atualiza um palpite (upsert)
export async function savePick(
  espnEventId: string,
  teamId: string,
): Promise<{ success: boolean; error?: string }>;
```

### `src/actions/ranking.ts`

```typescript
"use server";

// Busca ranking completo com posição relativa do usuário logado
export async function getRanking(): Promise<RankRow[]>;
// Retorna top 50 + linha do usuário logado se não estiver no top
```

### `src/lib/app-context.tsx` — Interface atualizada

```typescript
type AppUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

type AppContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  // theme/toggleTheme agora delegam para next-themes internamente
  theme: "light" | "dark";
  toggleTheme: () => void;
  t: (k: keyof typeof dict) => string;
  user: AppUser | null;
  setUser: (u: AppUser | null) => void;
  // picks e setPick REMOVIDOS → TanStack Query + Supabase
};
```

### `src/components/providers.tsx`

```typescript
"use client";

// Agrupa todos os providers client-side para o RootLayout
export function Providers({ children }: { children: React.ReactNode }) {
  // QueryClient com defaultOptions
  // ThemeProvider (next-themes) com attribute="class"
  // AppProvider
}
```

### Adaptações de Componentes

**`AppHeader.tsx`** — mudanças de interface:

| Antes (TanStack)                                   | Depois (Next.js)                                   |
| -------------------------------------------------- | -------------------------------------------------- |
| `Link` de `@tanstack/react-router`                 | `Link` de `next/link`                              |
| `useRouterState(select: s => s.location.pathname)` | `usePathname()` de `next/navigation`               |
| `useNavigate()` / `navigate({ to: "/login" })`     | `useRouter()` / `router.push("/login")`            |
| `Avatar` com fallback hardcoded "EU"               | `<Image>` com `user.avatarUrl` + fallback iniciais |
| Logout: `navigate({ to: "/login" })`               | `supabase.signOut()` + `router.push("/login")`     |

**`MatchCard.tsx`** — mudanças de interface:

| Antes                                             | Depois                                          |
| ------------------------------------------------- | ----------------------------------------------- |
| `team.flag` (string emoji)                        | `<Image src={team.logo} ... />` do `next/image` |
| `import type { Match } from "@/lib/mock-matches"` | `import type { Match } from "@/lib/types"`      |
| `picks[match.id]` e `setPick()` do AppContext     | Props `picked: boolean` e `onPick: () => void`  |

## Data Models

### `src/lib/types.ts` — Tipos Canônicos

```typescript
export type Stage = "r32" | "r16" | "qf" | "sf" | "third" | "final";
export type Status = "LIVE" | "UPCOMING" | "FINISHED";

export type Team = {
  id: string; // ESPN team ID ("478")
  name: string; // "France"
  abbr: string; // "FRA"
  logo: string; // "https://a.espncdn.com/i/teamlogos/countries/500/fra.png"
  score?: number;
};

export type Match = {
  id: string; // ESPN event ID ("760492")
  stage: Stage;
  status: Status;
  kickoff: string; // ISO 8601
  displayClock?: string; // "74'" ou "FT" (quando em jogo)
  teamA: Team; // home (order: 0)
  teamB: Team; // away (order: 1)
  winnerId?: string; // ESPN team ID do vencedor
  venue?: string; // "MetLife Stadium"
};

export type RankRow = {
  rank: number;
  userId: string;
  name: string;
  avatarUrl?: string;
  avatarFallback: string; // iniciais para AvatarFallback
  points: number;
  hits: number;
  trend: "up" | "down" | "flat";
  isMe?: boolean;
};

export const stageOrder: Stage[] = ["r32", "r16", "qf", "sf", "third", "final"];

// Mapeamento ESPN calendar value → Stage interno
export const ESPN_STAGE_MAP: Record<string, Stage> = {
  "2": "r32",
  "3": "r16",
  "4": "qf",
  "5": "sf",
  "6": "third",
  "7": "final",
};

// Mapeamento ESPN season.slug → Stage interno
export const ESPN_SLUG_MAP: Record<string, Stage> = {
  "round-of-32": "r32",
  "round-of-16": "r16",
  quarterfinals: "qf",
  semifinals: "sf",
  "third-place-match": "third",
  final: "final",
};
```

### Tabela Supabase: `picks`

```sql
create table public.picks (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  espn_event_id  text not null,
  team_id        text not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint picks_unique_user_event unique (user_id, espn_event_id)
);

alter table public.picks enable row level security;

create policy "users read own picks" on public.picks
  for select using (auth.uid() = user_id);

create policy "users insert own picks" on public.picks
  for insert with check (auth.uid() = user_id);

create policy "users update own picks" on public.picks
  for update using (auth.uid() = user_id);
```

### Tabela Supabase: `match_results`

```sql
create table public.match_results (
  espn_event_id  text primary key,
  winner_team_id text not null,
  stage          text not null,
  updated_at     timestamptz default now()
);
-- Sem RLS: leitura pública, escrita apenas por service role
```

### View Supabase: `ranking_view`

```sql
create or replace view public.ranking_view as
select
  p.user_id,
  u.raw_user_meta_data ->> 'full_name'  as display_name,
  u.raw_user_meta_data ->> 'avatar_url' as avatar_url,
  count(*) filter (
    where mr.winner_team_id is not null
      and p.team_id = mr.winner_team_id
  )::int as hits,
  (count(*) filter (
    where mr.winner_team_id is not null
      and p.team_id = mr.winner_team_id
  ) * 10)::int as points
from public.picks p
join auth.users u on u.id = p.user_id
left join public.match_results mr on mr.espn_event_id = p.espn_event_id
group by p.user_id, display_name, avatar_url
order by points desc, hits desc;
```

### Configurações de Build

**`next.config.ts`:**

```typescript
import type { NextConfig } from "next";
const config: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "a.espncdn.com" },
      { protocol: "https", hostname: "flagcdn.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};
export default config;
```

**`postcss.config.mjs`:**

```javascript
export default { plugins: { "@tailwindcss/postcss": {} } };
```

**`.env.local`:**

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Diff de dependências:**

Remover: `@lovable.dev/vite-tanstack-config`, `@tanstack/react-start`, `@tanstack/react-router`, `@tanstack/router-plugin`, `@tailwindcss/vite`, `vite`, `vite-tsconfig-paths`, `@vitejs/plugin-react`, `nitro`

Adicionar: `next@^15`, `@supabase/ssr@^0.6`, `@supabase/supabase-js@^2`, `next-themes@^0.4`, `@tailwindcss/postcss@^4`

Manter: `@tanstack/react-query@^5`, `react@^19`, `react-dom@^19`, `tailwindcss@^4`, todos os `@radix-ui/*`, `dayjs`, `lucide-react`, `clsx`, `tailwind-merge`, `zod`, `class-variance-authority`, `sonner`

## Error Handling

### ESPN API

- Se `fetch` lança exceção (timeout, CORS, rede): capturar e retornar fallback do `mock-matches.ts` com header `X-Data-Source: fallback`.
- Se resposta ESPN retorna status não-2xx: mesmo comportamento de fallback.
- Se `normalizeEspnEvent` retorna `null` (evento de fase de grupos): filtrar silenciosamente.

### Autenticação

- Se `exchangeCodeForSession` falha no callback: redirecionar para `/login?error=auth_failed`.
- Se Server Action é chamada sem sessão: retornar `{ success: false, error: "unauthorized" }`.
- Middleware verifica sessão em cada request para rotas protegidas.

### TanStack Query — Optimistic Update

- `onError`: reverter para estado anterior usando snapshot salvo em `onMutate`.
- `onSettled`: sempre invalidar query `["picks"]` para sincronizar com servidor.

### Supabase RLS

- Políticas garantem que usuário nunca acessa dados de outro usuário mesmo com bug no código.
- `SUPABASE_SERVICE_ROLE_KEY` nunca presente no bundle client (verificar com `NEXT_PUBLIC_` prefix ausente).

## Correctness Properties

### Property 1: Isolamento de picks por usuário

**Validates: Requirements 6.2**
Um usuário nunca deve conseguir ler, criar ou modificar palpites de outro usuário. Garantido via RLS no Supabase com política `auth.uid() = user_id` nas operações SELECT, INSERT e UPDATE.

### Property 2: Unicidade de pick por jogo

**Validates: Requirements 6.3**
Um usuário só pode ter um palpite por partida. Garantido via constraint `unique(user_id, espn_event_id)` combinado com operação upsert no `savePick`.

### Property 3: Imutabilidade de picks em partidas ativas

**Validates: Requirements 6.4**
Partidas com status `LIVE` ou `FINISHED` não devem permitir novos palpites. Garantido no client com botão `disabled` no `MatchCard` quando `match.status !== "UPCOMING"`.

### Property 4: Sessão sempre válida

**Validates: Requirements 1.3**
O middleware deve atualizar os cookies de sessão Supabase a cada request para evitar expiração silenciosa. Garantido retornando a `response` mutável com cookies atualizados pelo `createServerClient`.

### Property 5: Chaves secretas nunca expostas ao cliente

**Validates: Requirements 4.3**
`SUPABASE_SERVICE_ROLE_KEY` não tem prefixo `NEXT_PUBLIC_` e nunca é incluída no JavaScript enviado ao navegador pelo webpack do Next.js.

### Property 6: Resiliência ao fallback da ESPN

**Validates: Requirements 3.6**
Se todos os fetches à ESPN falharem, a aplicação deve renderizar com dados do `mock-matches.ts`. O estado de erro não deve resultar em crash da página.

### Property 7: Reversibilidade do optimistic update

**Validates: Requirements 6.5**
Se `savePick` falhar no servidor, a UI deve reverter automaticamente para o estado anterior do pick. Garantido pelo `onError` do TanStack Query usando o snapshot capturado no `onMutate`.

## Testing Strategy

### Testes Manuais (v1)

Por ser uma migração de projeto solo/pequeno grupo, a estratégia inicial é validação manual:

1. **Fluxo de autenticação**: login Google → callback → sessão → proteção de rotas → logout
2. **ESPN Proxy**: `GET /api/matches` retorna array de Match[] válido; testar com ESPN offline (verificar fallback)
3. **Pick'em**: clicar time → optimistic update imediato → persistência no Supabase → reload mantém pick
4. **Bloqueio de picks**: partidas LIVE/FINISHED não permitem clique
5. **Ranking**: dados aparecem após fazer palpites e registrar resultado em `match_results`
6. **Tema e idioma**: alternar light/dark, PT/ES/EN — persistência após reload
7. **Responsividade**: mobile tabs por fase, desktop colunas horizontais
8. **Next/image**: logos ESPN carregam sem erro de domínio não configurado

### Verificações de Build

- `npx tsc --noEmit` sem erros
- `next build` completa sem erros
- Nenhum import de `@tanstack/react-router` ou `@lovable.dev/*` no bundle final
