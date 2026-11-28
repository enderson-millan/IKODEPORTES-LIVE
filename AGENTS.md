# AGENTS.md — IKODEPORTES Live

## About the project

**IKODEPORTES Live** is a realtime sports tracking platform for baseball and
softball (game tracker / play-by-play), built to be **discipline- and
league-agnostic**. Brand: `IKODEPORTES` (with K). Claim: `EL DEPORTE, EN CONTEXTO.`

It feeds two surfaces from a single canonical state:

1. `app/overlay/[gameId]` — OBS browser source: transparent 1920x1080 canvas,
   per-panel visibility controls. (Phase 3)
2. `app/games/[gameId]` — interactive data center for viewers:
   line score, bases, count, pitch zone and play-by-play. (Phase 3)

Current status: **Phases 1 and 2 complete** — template cleanup, brand identity,
canonical contract, Prisma schema and Docker/Dokploy deployment. The full
tracker UI and the feed adapters land in Phase 3.

## Stack

| Layer           | Technology                                                            |
| --------------- | --------------------------------------------------------------------- |
| Web framework   | Next.js 16 (App Router), React 19, TypeScript 5 (strict)              |
| Styling         | Tailwind CSS v4, shadcn/ui (New York, slate, CSS vars)                |
| Icons           | lucide-react                                                          |
| Client state    | React Context (`src/lib/app-context.tsx`) — lang, theme, user         |
| Data fetching   | TanStack Query v5                                                     |
| Auth (optional) | Supabase Google OAuth (`@supabase/ssr`)                               |
| Validation      | React Hook Form v7 + Zod v3                                           |
| Dates           | dayjs (preferred over date-fns)                                       |
| API             | Node.js + TypeScript, Express 5, Socket.IO 4, Prisma 6                |
| Database        | PostgreSQL 17                                                         |
| Deploy          | Docker (multi-stage), Docker Compose, Dokploy (`test` / `production`) |
| Package manager | pnpm (never npm/yarn)                                                 |

## Structure

```
.
├── app/                          # Next.js App Router
│   ├── layout.tsx                # root html/body + providers
│   ├── globals.css               # Tailwind entry + IKODEPORTES tokens
│   ├── (site)/                   # public chrome: header + footer
│   │   ├── page.tsx              # landing
│   │   ├── login/page.tsx        # optional Google login
│   │   └── games/                # games list + game detail shell
│   └── auth/callback/route.ts    # Supabase OAuth callback
├── src/
│   ├── components/
│   │   ├── ui/                   # shadcn/ui primitives — do not hand-edit
│   │   ├── brand/                # BrandLogo / BrandWordmark
│   │   ├── game/                 # bases, count, line score, play-by-play
│   │   ├── AppHeader.tsx
│   │   └── Footer.tsx
│   ├── hooks/                    # TanStack Query hooks
│   └── lib/
│       ├── app-context.tsx       # i18n (ES default, PT, EN) + theme
│       ├── brand.ts              # brand copy + logo path + palette
│       ├── game-format.ts        # number/velocity formatting helpers
│       ├── supabase/             # browser + server clients
│       └── utils.ts              # cn()
├── shared/                       # contract shared by web + api
│   ├── types/baseball-state.ts   # CanonicalBaseballState and friends
│   ├── realtime/contract.ts      # rooms + socket events
│   └── fixtures/demo-game.ts     # deterministic demo state
├── backend/                      # Express + Socket.IO + Prisma service
│   ├── src/index.ts
│   ├── src/config.ts
│   ├── src/realtime/socket-server.ts
│   └── src/routes/health.ts
├── prisma/schema.prisma          # Game + PlayEvent models
├── Dockerfile                    # targets: web | api
├── docker-compose.test.yml       # :3001 web · :4001 api · :5433 db_test
├── docker-compose.prod.yml       # :3000 web · :4000 api · :5432 db_prod
├── docs/deploy-topology.md       # what runs where: local, Vercel, OBS, tunnel
└── docs/dokploy-setup.md         # env vars + deploy steps
```

## Commands

```bash
pnpm dev                # web dev server
pnpm build              # production build (type-checked)
pnpm typecheck          # tsc --noEmit
pnpm lint               # ESLint
pnpm format             # Prettier

pnpm --dir backend dev  # API dev server (tsx watch)
pnpm --dir backend build

docker compose -f docker-compose.test.yml up --build
docker compose -f docker-compose.prod.yml up --build -d
```

> Never use `npm` or `yarn`. Always `pnpm`.

## Architecture rules

- **One canonical contract.** Both the web app and the API import
  `shared/types/baseball-state.ts`. Adapters normalize vendor payloads into
  `CanonicalBaseballState`; UI never reads vendor shapes.
- **Agnostic adapters.** A feed adapter implements the adapter interface and
  returns the canonical state. Leagues are data (`LeagueCode`), not branches.
- **Realtime rooms.** `game:${gameId}` carries canonical state;
  `overlay:${gameId}` carries panel visibility. Room helpers live in
  `shared/realtime/contract.ts`.
- **Team crests.** Club crests live in `public/teams/<name>.<ext>` and are
  resolved by team code in `src/lib/team-logo.ts`; a feed-provided
  `TeamIdentity.logoUrl` wins when present. Every badge keeps the 3-letter code
  as fallback, so a missing asset never breaks a panel. Crests are club
  trademarks: using them on streamed overlays is the project owner's call.
- **Overlay transparency.** The OBS route lives outside `app/(site)` so no site
  chrome (header/footer) leaks into the canvas.

## Conventions

- TypeScript everywhere; `interface` for object shapes.
- Files `kebab-case`; components `PascalCase`; functions/variables `camelCase`.
- Conventional Commits, lowercase only: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`.
- Tailwind only — no inline CSS or styled-components. Brand tokens:
  `bg-surface-1|2|3`, `text-brand-gold`, `bg-brand-blue`, `text-live`.
- All visible user copy goes through `t("key")` from `useApp()`.
- Form validation with Zod + React Hook Form.
- Never commit `.env`; use `env.example` as the template (the leading-dot
  template name is blocked by the agent environment policy).

## i18n

Three languages in `src/lib/app-context.tsx`: **ES (default)**, PT and EN.
Persisted in `localStorage` under `ikodeportes.lang`.

## Known gaps (Phase 3+)

- Full modular tracker and OBS overlay with per-panel controls.
- Feed adapters: `IBaseballFeedAdapter`, `feed-registry.ts`, `MlbStatsAdapter`,
  `HttpJsonFeedAdapter`, `CustomFeedAdapter`.
- Polling with SHA-256 deduplication and Socket.IO broadcasting.
- Persistence wiring (Prisma client usage, `/games` reading from the database).
