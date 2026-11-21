# IKODEPORTES Live — Fase 3a

Branch: `feat/ikodeportes-phase-3a` · Delivery: work-unit commits · Test runner: none (smoke scripts + `tsc` + `next build` + HTTP/socket checks).

## Specs

- **S1** — API local bajo demanda: el operador puede levantar el stack solo cuando transmite. `POST /api/live/games/:gameId/start` arranca el polling del partido; `POST /api/live/games/:gameId/stop` lo corta. Auto-descubrimiento desactivado por defecto.
- **S2** — Feed LVBP gratis vía MLB StatsAPI (`sportId=17`, `leagueId=135`): bootstrap del feed completo y polling `diffPatch` cada 5 s; `linescore`/re-bootstrap ante fallos; sin evadir el proof-of-work de TuJonrón.
- **S3** — Overlay OBS `/overlay/[gameId]`: canvas 1920x1080 transparente, sin chrome del sitio, sin scroll, paneles ocultables por query (`?panels=scoreboard,field,duel,lineScore,plays,ticker`).
- **S4** — Visual de campo: diamante, 9 defensores, corredores en base con identidad, bateador/lanzador, marcador del último batazo (`hitData`), cuenta, pizarra y relato.
- **S5** — Contrato aditivo y compatible: `BaseRunner`, `BattedBallLocation` y `PlayByPlayItem.hit` opcionales. Los booleanos de `BasesState` no cambian.
- **S6** — Despliegue local: `docker-compose.local.yml` con límites de memoria, healthchecks, rotación de logs, red interna y `cloudflare_network` externa; rutas por el túnel central existente (`live.ikodeportes.com`, `api.live.ikodeportes.com`).
- **S7** — Sin audio en 3a (fase separada) y sin logos/marcas de ligas o equipos.

Fuera de alcance: control de paneles desde un panel de operador, persistencia Prisma, audio y admin.

## Riesgo

- Item 3 (contrato serializado): se agregan campos opcionales a `shared/types/baseball-state.ts`.
- Item 5 (despliegue/entorno): compose local + rutas del túnel.
- Verificación independiente al final del feature.

## Tasks

- T1 — Contrato aditivo + fixture demo con corredores y batazo.
- T2 — `IBaseballFeedAdapter` + `MlbStatsAdapter` (StatsAPI LVBP) + registro.
- T3 — `PollingService` con bootstrap, `diffPatch`, SHA-256 y broadcast.
- T4 — Rutas live (`start`/`stop`/`state`/`discover`) + Socket.IO con estado al unirse.
- T5 — Hook `useLiveGame` + `FieldView` + overlay 1920x1080.
- T6 — Compose local + túnel Cloudflare + env/docs.
- T7 — Smoke del adaptador, E2E HTTP+socket, build, lint y compose config.

## Log

- **L1** (solicitud): "si arranca" (Fase 3a) y "la api en mi pc local, y solo rodar cuando vaya a transmitir el juego", exponiéndola con el túnel de Cloudflare del servidor `dunamis`.
