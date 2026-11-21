# IKODEPORTES Live

**EL DEPORTE, EN CONTEXTO.**

Plataforma de seguimiento en tiempo real (_game tracker / play-by-play_) para
béisbol y softbol, con arquitectura agnóstica de disciplinas y ligas.

Alimenta dos superficies desde un único estado canónico:

- **Overlay para OBS** (`/overlay/[gameId]`) — canvas transparente 1920x1080 con
  paneles individuales para transmisiones en vivo.
- **Web app** (`/games/[gameId]`) — centro de datos interactivo con pizarra por
  entradas, bases, cuenta, zona de pitcheos y relato jugada por jugada.

## Estado actual

| Fase | Alcance                                                                  | Estado |
| ---- | ------------------------------------------------------------------------ | ------ |
| 1    | Limpieza del template, identidad visual, contrato canónico               | ✅     |
| 2    | `prisma/schema.prisma`, Docker multi-stage, Dokploy `test`/`production`  | ✅     |
| 3    | Tracker modular, overlay OBS, adaptadores de feeds, polling + WebSockets | 🔲     |

La web ya incluye un **partido demo** servido desde el contrato canónico
(`shared/fixtures/demo-game.ts`) para validar tipos y diseño.

## Stack

Next.js 16 · React 19 · TypeScript (strict) · Tailwind v4 · shadcn/ui ·
TanStack Query v5 · dayjs · Express 5 · Socket.IO 4 · Prisma 6 · PostgreSQL 17 ·
Docker + Dokploy.

## Empezar

```bash
pnpm install

cp env.example .env   # o exporta las variables en tu shell
pnpm dev              # http://localhost:3000
```

API en tiempo real (opcional en esta fase):

```bash
pnpm --dir backend install
pnpm --dir backend dev   # http://localhost:4000/health
```

## Docker

```bash
# test: web :3001 · api :4001 · db_test :5433
docker compose -f docker-compose.test.yml up --build

# producción: web :3000 · api :4000 · db_prod :5432
docker compose -f docker-compose.prod.yml up --build -d
```

Variables de entorno y despliegue en Dokploy: [`docs/dokploy-setup.md`](docs/dokploy-setup.md).

## Contrato canónico

`shared/types/baseball-state.ts` define `CanonicalBaseballState`, `LeagueCode`,
`BasesState`, `CountState`, `LineScoreInning`, `PitchDetail`, `PlayByPlayItem` y
la selección de paneles del overlay. Es la única interfaz entre los adaptadores
de feeds, la API y las dos UIs.

```ts
import type { CanonicalBaseballState } from "@shared/types/baseball-state";
```

## Base de datos

```bash
pnpm --dir backend exec prisma migrate deploy --schema ../prisma/schema.prisma
```

Modelos: `Game` (estado último en `Json`) y `PlayEvent` (feed append-only con
`@@unique([gameId, sequence])`).

## Convenciones

- `pnpm` siempre; nunca npm ni yarn.
- Conventional Commits en minúsculas.
- Archivos `kebab-case`, componentes `PascalCase`, funciones `camelCase`.
- Copyright: sin logos ni marcas de ligas/equipos; códigos de 3 letras y vectores propios.
