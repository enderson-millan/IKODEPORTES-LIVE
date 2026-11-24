# Live dashboard: una pantalla + densidad (fase 3a)

Objective: que `/games/[gameId]` muestre todo el juego en una pantalla y se acerque a la
densidad de la referencia, sin cambiar el contrato. Branch `feat/ikodeportes-phase-3a`.
Delivery: ask-on-risk. Runner: `pnpm dev` + Playwright (1920x1080, 1366x768, 1024x768).

## Specs

- **S1** — "entrar toda la interfaz del en vivo en una sola pantalla con los detalles".
  En viewport >= 1280x860 (modo `desk`): el documento no scrollea, la altura del documento
  iguala el viewport, y solo hacen scroll interno la lista de defensa y el play-by-play.
  Aceptación: `document.documentElement.scrollHeight === window.innerHeight` a 1920x1080.
- **S2** — Responsive sin clipping. A 1366x768 y 1024x768 ningún panel queda cortado: los
  paneles recuperan altura natural y la página scrollea. Debajo de `lg` una sola columna.
  Aceptación: ninguna lista/panel con contenido visible truncado sin scroll propio.
- **S3** — Densidad visual similar a la imagen de referencia: ticker con la jornada,
  scoreboard con marcador grande y marcas de equipo, cuenta en puntos, play-by-play con
  badge de entrada y marcador, pizarra con la entrada activa resaltada.
- **S4** — "verificar que este en la ultima version y rama correcta". Verificado: la imagen
  Docker se construyó 2026-11-22 00:21 (después del último edit 00:19) y el HTML servido
  contiene clases que no existen en HEAD. No era versión anterior.
- **S5** — Alcance sin cambios de contrato (decisión del usuario: "Responsive + densidad
  visual"). Quedan fuera: fotos de jugador y zona de strike con coordenadas de pitcheo.
- **S6** — Todo texto visible pasa por `t("key")` en ES/PT/EN. Sin strings sueltos.

## Tasks

| ID | S# | Ruta | Estado | Commit |
| --- | --- | --- | --- | --- |
| T1 | S1,S2 | inline | done | pendiente (sin commit) |
| T2 | S3 | inline | done | pendiente (sin commit) |
| T3 | S3 | inline | done | pendiente (sin commit) |
| T4 | S6 | inline | done | pendiente (sin commit) |

## Log

- **L1** (usuario, verbatim): "ya estoy con docker rodando, se podria mejorar para entrar
  toda la interfaz del en vivo en una sola pantalla con los detalles? [Image 1] similar a la
  imagen en anexo?"
- **L2** (usuario, verbatim): "podria ser una version anterior? verificar que este en la
  ultima version y rama correcta"
- **L3** — Causa raíz encontrada (memoria `bugfix/tailwind-source-none-app-router`):
  `app/globals.css` usaba `@import "tailwindcss" source(none)` con solo `@source "../src"`,
  así que ninguna clase usada bajo `app/` se generaba. Evidencia: el CSS servido no contenía
  `380px`, `.h-24`, `.w-24` ni `1fr_auto_1fr`; el grid computado era una sola columna de
  1896px y el documento medía 4926px. Fix: `@source "../app";`.
- **L4** — Se reemplazó la aritmética `calc(100vh-8rem)` por layout basado en espacio:
  `(site)/layout.tsx` usa `h-dvh` + `main` `min-h-0 flex-1 overflow-y-auto`.
  Medido post-fix: `scrollHeight === 1080` a 1920x1080, grid `300px 1076px 380px`.
- **L5** — Decisión de alcance del usuario: "Responsive + densidad visual (Recomendado)".
  Sin tocar `shared/types/baseball-state.ts` ni adapters.
- **L6** — Hallazgo a 1366x768: entra sin scroll pero se vuelve ilegible (defensa cortada,
  campo ~280px). Consecuencia: el modo de pantalla fija se limita a viewports altos
  (`desk` = min-width 1280 + min-height 860); por debajo, altura natural y scroll de página.

- **L7** (T1) — Implementado: variant `desk` (`min-width: 1280px and min-height: 860px`) en
  `globals.css`; grid `grid-cols-1 lg:grid-cols-[minmax(0,258px)_minmax(0,1fr)]
  xl:grid-cols-[280px_minmax(0,1fr)_340px]`; aside derecho `lg:col-span-2 lg:grid
  lg:grid-cols-2 xl:col-span-1 xl:flex`; scroll interno de defensa y play-by-play solo en
  `desk`. Medido: 1920x1080 doc=1080 sin scroll (grid 280/1244/340); 1600x900 doc=900 sin
  clipping; 1366x768 `main` scrollea 915/640 sin recortes; 1024x768 2 columnas (258/738).
- **L8** (T1, bug) — Detectado en mobile: el grid sin `grid-cols-1` explícito creaba una
  columna implícita de `max-content` (549px en viewport de 390 → scroll horizontal). Fix:
  `grid-cols-1`. Verificado: grid 370px, sin overflow horizontal. Además el scoreboard pasa
  a apilarse con `grid-cols-1 sm:grid-cols-[1fr_auto_1fr]`.
- **L9** (T2,T3) — Densidad: scoreboard con marcador 4xl + chips B/S/O + venue/fecha,
  `Panel` con icono y borde de sección, cuenta en puntos, defensa con chip de posición y
  filas alternadas, último pitcheo en la cabecera del duelo, pizarra con la entrada activa en
  rojo (`bg-live/25` + ring). Ticker de jornada nuevo (`GameTicker`) alimentado por
  `fetchGameSummaries()` en el server component; si discovery falla se cae a
  `demoGameSummary` en demo y a ocultarse en producción.
- **L10** (T4) — Nueva clave i18n `ticker` (ES "Jornada", PT "Rodada", EN "Slate").
  Verificación: `pnpm typecheck` OK; `eslint` 0 errores (1 warning preexistente de
  react-refresh en `page.tsx`); `prettier --check` OK.

- **L11** (usuario, verbatim): "en general guste bastante del resultado, solo en la fecha en vez de utc mostrar la hoar de venezuela por ser la LVBP"
- **L12** (T5, nuevo) — Horas en hora de liga: `LEAGUE_UTC_OFFSET_MINUTES = -240` y
  `formatLeagueDateTime` / `formatLeagueTime` en `src/lib/game-format.ts`; el scoreboard y el
  ticker lo usan con sufijo `VET` (clave i18n `timezoneAbbr`). Verificado en el contenedor:
  `24 NOV 2026 · 19:00 VET` (antes 23:00 UTC) y ticker `19:00`.
- **L13** (bug propio, corregido) — Al reemplazar texto en `GameDetailView.tsx` usé
  `Get-Content -Raw` sin `-Encoding` en PowerShell 5.1: leyó UTF-8 sin BOM como CP1252 y
  corrompió los no-ASCII (`·` → `Â·`, `—` → `â€"`). Detectado en la captura del contenedor.
  Reparado revirtiendo la doble codificación (texto → CP1252 bytes → UTF-8) y verificado por
  code points: 3 × U+00B7, 11 × U+2014, 0 × U+FFFD. Regla: para editar estos archivos usar la
  herramienta de edición, nunca `Get-Content | Set-Content`.
- **L14** — Hidratación: el ticker formateaba la hora con la zona del navegador
  (`dayjs(...).format`), lo que producía React #418 contra el server (`TZ=America/Caracas`)
  apenas la API devolvió un partido `SCHEDULED`. Al pasar a hora de liga fija el texto es
  determinista y se eliminó el flag `mounted`. Contenedor: consola con 0 errores.
