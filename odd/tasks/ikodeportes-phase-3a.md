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

- T1 — Contrato aditivo + fixture demo con corredores y batazo. **Hecho** (commit `feat: add live lvbp statsapi adapter and polling` + `feat: add live overlay with field visual`).
- T2 — `IBaseballFeedAdapter` + `MlbStatsAdapter` (StatsAPI LVBP) + registro. **Hecho**; smoke real contra `869962`.
- T3 — `PollingService` con bootstrap, `diffPatch`, SHA-256 y broadcast. **Hecho**; E2E HTTP+socket OK.
- T4 — Rutas live (`start`/`stop`/`state`/`discover`) + Socket.IO con estado al unirse. **Hecho**.
- T5 — Hook `useLiveGame` + `FieldView` + overlay 1920x1080. **Hecho**; verificado en Chrome headless con datos en vivo.
- T6 — Compose local + túnel Cloudflare + env/docs. **Hecho**; `docker compose config` OK.
- T7 — Smoke del adaptador, E2E HTTP+socket, build, lint y compose config. **Hecho**.

## Log

- **L1** (solicitud): "si arranca" (Fase 3a) y "la api en mi pc local, y solo rodar cuando vaya a transmitir el juego", exponiéndola con el túnel de Cloudflare del servidor `dunamis`.

## Verificación

- pnpm --dir backend typecheck OK; pnpm --dir backend build OK (28 KB).
- pnpm --dir backend smoke:lvbp contra el partido en vivo 869962: 3 juegos en el schedule, 9 defensores, 61-62 jugadas, corredor con nombre/dorsal, último batazo con coordenadas, AVG/ERA presentes.
-

ode scripts/verify-live.mjs 869962 con API local: /health, POST /start, GET /state y game-state por Socket.IO (defense 9).

- pnpm typecheck, pnpm build y pnpm lint (0 errores) OK. La ruta /overlay/[gameId] quedó dinámica.
- Chrome headless sobre http://127.0.0.1:3111/overlay/869962: DOM con ambos equipos, <svg> del campo y EN VIVO; ya no muestra Conectando (socket + estado en vivo).
- docker compose -f docker-compose.local.yml --profile tunnel config OK.

## Hallazgos

- El feed gameData.teams.{away,home} del live feed trae los campos del equipo en la raíz (sin eam ni score), a diferencia del schedule ({team, score}). El normalizador acepta ambas formas; el score sale de linescore.teams.
- diffPatch devuelve 2 bytes sin cambios y ~20 KB por ventana activa; el feed completo es ~630 KB. El polling queda barato.
- La web lee LIVE_WS_URL en runtime (server component), así que cambiar entre localhost y el túnel no exige reconstruir la imagen.
- Un túnel de Cloudflare solo alcanza su propio host: el túnel del servidor no puede ver el stack del PC. El modo local usa un túnel propio (ikodeportes-local) y no se une a cloudflare_network.

## Verificación independiente y correcciones

- **V2** — gentle-ai-verify revisó contrato, adaptador, polling, sockets, overlay y despliegue. Encontró 2 bloqueadores reales:
  - **B1** — PollingService.start tenía TOCTOU: dos /start concurrentes hacían dos bootstraps, creaban dos timers y dejaban uno huérfano. Corregido con pending map (comparte el bootstrap), cancelled set (stop durante bootstrap) y tope maxGames. Regresión: pnpm --dir backend check:polling OK; dos POST /start concurrentes por HTTP → un solo polling-started y un solo timer.
  - **B2** — el default no vacío de LIVE_WS_URL en el compose eclipsaba NEXT_PUBLIC_WS_URL en el modo "solo local". Corregido con LIVE_WS_URL: ${"$"}{LIVE_WS_URL:-}` en compose, || en el server component y el comando documentado usando LIVE_WS_URL. Commit e3170e9.
- **N1** — No bloqueante: /stop queda abierto si CONTROL_TOKEN está vacío. Antes de exponer por túnel, definir el token. Se agregó MAX_TRACKED_GAMES=20 como tope de /start públicos.
- **N2** — D en StatsAPI es _Delayed_; el contrato todavía no tiene DELAYED, se mapea a POSTPONED (documentado en el adaptador).
