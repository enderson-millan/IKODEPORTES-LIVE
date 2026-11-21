# IKODEPORTES Live — Fase 1 + Fase 2

Branch: `feat/ikodeportes-phase-1-2` · Delivery: local work-unit commits · Test runner: none (no test framework installed; structural + `tsc` + `next build` + `eslint` + `docker compose config`).

## Specs

- **S1** — Marca: `IKODEPORTES Live` (marca `IKODEPORTES` con K) y eslogan `"EL DEPORTE, EN CONTEXTO."`. Fondos `#070D1A`, `#0D172A`, `#12203A`; acentos `#FACC15`, `#EAB308`, `#1D4ED8`, `#2563EB`. Números tabulares para marcadores, conteo `B-S-O` y velocidades `MPH`/`KM/H`.
- **S2** — Reutilizar del template: Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, shadcn/ui, `dayjs`, TanStack Query v5, `cn()`, tema claro/oscuro y diccionario i18n en `src/lib/app-context.tsx`.
- **S3** — Remover: "Toda la lógica de palpites/bracket de fútbol (`picks`, `match_results`, `ranking_view`, `/bracket`)."
- **S4** — i18n con tres idiomas: "i18n (`ES` predeterminado, `PT`, `EN`)".
- **S5** — Contrato canónico en `shared/types/baseball-state.ts`: `CanonicalBaseballState`, `LeagueCode` (`LVBP`, `MLB`, `LIDOM`, `LMP`, `WBC`, `SOFTBALL`, `CUSTOM`), `BasesState`, `CountState`, `LineScoreInning`, `PitchDetail`, `PlayByPlayItem`. Arquitectura agnóstica de disciplinas y ligas.
- **S6** — `prisma/schema.prisma`: modelos `Game` (con `league`, `externalGameId`, `feedUrl`, `status`, `latestState` en `Json`, `updatedAt`) y `PlayEvent` (`gameId`, `sequence`, `inning`, `isTopInning`, `description`, `createdAt`, `@@unique([gameId, sequence])`).
- **S7** — `Dockerfile` multi-stage optimizado para Next.js + Node/Express/Socket.IO.
- **S8** — `docker-compose.test.yml`: instancia de app + base `db_test` en puerto aislado `5433`.
- **S9** — `docker-compose.prod.yml`: instancia de producción + base `db_prod` (`5432`) con persistencia en volúmenes.
- **S10** — `docs/dokploy-setup.md` con variables de entorno para ambos proyectos Dokploy: `DATABASE_URL`, `NEXT_PUBLIC_WS_URL`, `PORT`, `FEED_POLL_INTERVAL_MS`.
- **S11** — Convenciones: archivos `kebab-case`, componentes `PascalCase`, funciones/variables `camelCase`, commits Conventional Commits en minúsculas.
- **S12** — Copyright: no usar logos/marcas de ligas o equipos; códigos de texto de 3 letras, avatares estilizados y componentes vectoriales propios.

Fuera de alcance de esta entrega (Fase 3+): overlay OBS `/overlay/[gameId]` completo con controles de paneles, tracker web completo `/games/[gameId]` con WebSockets, adaptadores de feeds (`MlbStatsAdapter`, `HttpJsonFeedAdapter`, `CustomFeedAdapter`) y polling productivo.

## Tasks

- T1 — Limpieza del template de fútbol y configuración del repo (S3, S11) — inline — **hecho**. 37 archivos de fútbol eliminados; `middleware.ts` → `proxy.ts` (convención Next 16); `.gitattributes`, `.prettierrc` EOL `auto`, `tsconfig.tsbuildinfo` destrackeado. Commit `eb66087`.
- T2 — Identidad visual IKODEPORTES + i18n ES/PT/EN + shell navegable (S1, S2, S4, S12) — inline — **hecho**. Tokens oklch, `font-display`, `BrandLogo`/`BrandWordmark`, landing, header, footer, login, `/games`, `/games/[gameId]`. Commit `56a13f9`.
- T3 — Contrato canónico `shared/types/baseball-state.ts` + fixture demo + consumidor mínimo (S5) — inline — **hecho**. Contrato + `shared/realtime/contract.ts` + `shared/fixtures/demo-game.ts`; consumidores: web y API. Commit `566068e`.
- T4 — `prisma/schema.prisma` + esqueleto backend Express/Socket.IO (S6) — inline — **hecho**. Schema válido, migración inicial generada, API con `/health` y rooms. Commit `6e4270e`.
- T5 — Dockerfile multi-stage + compose test/prod + docs Dokploy (S7, S8, S9, S10) — inline — **hecho**. Imágenes `web`/`api`, compose validado con `docker compose config`. Commit `89ec14f`.
- T6 — Verificación: typecheck, `next build`, lint, smoke HTTP, `docker compose config` — inline — **hecho**. Detalle en el log.

## Log

- **L1** (solicitud original, verbatim, resumen fiel): "Vamos a adaptar el proyecto base clonado de **MataMata.live** (Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, TanStack Query v5) para construir la plataforma **IKODEPORTES Live** ("EL DEPORTE, EN CONTEXTO."), un motor de seguimiento en tiempo real (_Game Tracker / Play-by-Play_) inicialmente enfocado en **béisbol y softbol**, pero con una **arquitectura 100% agnóstica de disciplinas y ligas**." … "Comenzar ejecutando la **Fase 1** (limpieza del template de fútbol, assets/colores de **IKODEPORTES Live** y definición del contrato `shared/types/baseball-state.ts`) y la **Fase 2** (`prisma/schema.prisma` y archivos Docker/Dokploy)."
- **E1** — Repo base verificado: Next 16 + React 19, `app/` con rutas de fútbol (`/bracket`, `/ranking`, `/live`, `/admin/live`, `/api/matches`, `/api/sync-results`), `src/` con componentes/acciones de picks, sin `public/`, sin runner de tests.
- **D1** — Decisión: mantener el login Google (Supabase) solo como shell de autenticación opcional; el tracker público no lo requiere. `middleware.ts` deja de proteger rutas de fútbol.
- **D2** — Decisión: `public/images/logo-circular.svg` es un vector propio (S12). El JPG oficial se integra cambiando `BRAND.logo.src` en `src/lib/brand.ts`.
- **D3** — Decisión: `backend/` es paquete autocontenido (sin pnpm workspace) para no alterar el lockfile raíz ni el build de Next.
- **D4** — Decisión: `.prettierrc` pasa a `endOfLine: "auto"` y se agrega `.gitattributes` (`eol=lf`). El checkout de Windows tenía CRLF en 73 archivos no tocados y `pnpm lint` fallaba con ~4.500 errores de EOL. Con `auto`, ambos finales de línea lintan; los checkouts nuevos quedan LF.
- **D5** — Decisión: el cliente Prisma se genera desde una copia git-ignored del schema canónico (`backend/scripts/sync-schema.cjs`). Así `prisma generate` resuelve `@prisma/client` dentro de `backend/` y no auto-instala Prisma en el `package.json` raíz (lo que ocurría al apuntar el CLI al schema de la raíz).
- **E2** — Verificación ejecutada: `pnpm typecheck` OK; `pnpm build` OK (6 rutas, sin warning de middleware); `pnpm lint` 0 errores (14 warnings preexistentes de shadcn/fast-refresh); backend `typecheck` + `tsup build` OK; `prisma validate` OK; migración `20261121190000_init` generada y revisada; smoke HTTP con `next start`: `/` 200, `/games` 200, `/games/demo-live` 200, `/login` 200, `/games/unknown` 404, y el HTML contiene marca, eslogan, equipos y relato; `docker compose config --quiet` OK en test y prod.
- **B1** — Bloqueo parcial: no se construyeron las imágenes porque el daemon de Docker Desktop está detenido (`dockerDesktopLinuxEngine` no disponible). La configuración quedó validada con `docker compose config`. Comando pendiente: `docker build --target api -t ikodeportes-api:verify .` y `docker build --target web -t ikodeportes-web:verify .`.
- **P1** — Riesgo: item 5 (delivery/entorno) por Docker/Dokploy; se solicita una verificación independiente de ese cambio.
