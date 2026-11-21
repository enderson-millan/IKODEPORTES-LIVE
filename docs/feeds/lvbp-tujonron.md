# Fuente de datos LVBP — TuJonrón GameDay

> **Estado:** investigación (Fase 3, no implementado). No se ha escrito ningún
> adaptador ni se ha automatizado el acceso a la API interna.

## Resumen

El GameDay de la LVBP está servido por **TuJonrón.com**:

- Partido de ejemplo: `https://gameday.tujonron.com/lvbp/2026/11/21/oriwin-arawin-1/869962`
  (la URL canónica responde en `/tjrn/...`).
- Hay **dos capas de datos**: el payload SSR público y una API interna protegida.
- El feed completo tiene **forma MLB StatsAPI** (`gamePk`, `gameData`, `liveData`,
  `linescore`, `boxscore`, `plays`). Esto permite reutilizar la normalización del
  futuro `MlbStatsAdapter` y cambiar solo el transporte.

## Capa 1 — HTML SSR (público)

Todo el estado del partido llega embebido en el HTML:

```html
<script data-page="app" type="application/json">
  { ... }
</script>
```

Campos observados dentro de `props`:

| Ruta                           | Contenido                                                          |
| ------------------------------ | ------------------------------------------------------------------ |
| `scoreboard.games[]`           | un objeto por partido del día                                      |
| `game_pk`, `slug`, `game_guid` | identidad del partido                                              |
| `status_id`, `status`          | `I` = En progreso, `S` = Calendario, `P` = Lineup                  |
| `away_*`, `home_*`             | id, nombre, abreviatura, récord, logo, carreras, hits, errores     |
| `inning`, `inning_top`         | entrada y mitad (`1` = alta)                                       |
| `balls`, `strikes`, `outs`     | conteo                                                             |
| `batter`, `pitcher`            | nombres del duelo actual                                           |
| `linescore[]`                  | por inning: carreras/hits/errores de cada equipo                   |
| `live.defense`                 | jardineros, cuadro, catcher, pitcher, bateador                     |
| `live.offense`                 | `batter`, `onDeck`, `inHole`, `battingOrder`                       |
| `venue`, `weather`, `tv`       | estadio, clima, transmisión                                        |
| `summary`                      | `statusLabel`, `innings`, `scoringPlays`, `decisions`, `probables` |
| `liveToken: { t, e }`          | token con expiración para el canal en vivo                         |

**Lo que NO trae esta capa:** ocupación de bases (`first/second/third`) ni el
detalle pitcheo por pitcheo. Para la zona de strike y el registro de lanzamientos
hace falta el feed completo.

## Capa 2 — API interna (no documentada, con anti-bot)

El bundle `internal-api-*.js` revela el endpoint que usa el navegador:

```
GET /api/game/{gamePk}
  Accept: application/json
  X-Requested-With: XMLHttpRequest
  X-CSRF-TOKEN: <meta name="csrf-token">
  cookies: same-origin
```

Mecanismos de protección observados:

1. **403** → `GET /api/session-token` devuelve un token nuevo y se reintenta.
2. **Proof-of-work**: si la respuesta trae `X-Archive-Challenge`, el cliente debe
   calcular `SHA-256("{challenge}.{n}")` hasta obtener `digest[0] === 0 &&
digest[1] < 16`, y reintentar con `X-Archive-Pass`. La respuesta `428` fuerza
   el reintento.

Es un mecanismo **deliberado anti-automatización**. La respuesta completa
(`game.gameData` + `game.liveData`) sí incluye bases, boxscore, alineaciones,
pitcheos y el `timeStamp` del feed (`metaData.timeStamp`), que sirve para
deduplicar.

## Mapeo propuesto a `CanonicalBaseballState`

| Origen (LVBP)                                         | Destino canónico                                            |
| ----------------------------------------------------- | ----------------------------------------------------------- |
| `away_runs` / `home_runs`                             | `score.away` / `score.home`                                 |
| `linescore[]` + totales                               | `lineScore.{away,home}.innings/runs/hits/errors`            |
| `inning` + `inning_top`                               | `clock.inning` + `clock.half`                               |
| `balls/strikes/outs`                                  | `count`                                                     |
| `live.offense.batter` + `live.defense.pitcher`        | `atBat.batter` / `atBat.pitcher` (sin stats en la capa SSR) |
| `live.offense.onDeck` / `inHole`                      | `onDeck[]`                                                  |
| `live.defense` (pitcher, catcher, 1B…RF)              | `defense[]`                                                 |
| `summary.scoringPlays`                                | `playByPlay[]` (solo jugadas con carrera)                   |
| `liveData.plays.allPlays` (API interna)               | `playByPlay[]` completo                                     |
| `liveData.linescore.offense` (API interna)            | `bases`                                                     |
| `liveData.plays.currentPlay.playEvents` (API interna) | `atBat.pitches[]`                                           |
| `venue`, `game_date`, `game_time`                     | `venue`, `scheduledStart`                                   |
| `metaData.timeStamp`                                  | `source.fetchedAt` / `source.hash`                          |

`e()` del bundle también expone la clasificación de liga usada por el proveedor:
`league.id 135` = LVBP, `162` = Serie del Caribe, `160` = WBC, `sport.id 1` = MLB.

## Recomendación

1. **Preferido:** pedir acceso oficial a TuJonrón/LVBP. El proveedor ya tiene un
   feed JSON estable y documentable; conviene acordar cuota, formato y licencia.
2. **Alternativa permitida:** `TujonronHtmlAdapter` que parsea el payload SSR
   público (capa 1) con intervalo ≥ 15 s, `User-Agent` identificable, backoff,
   caché y atribución visible. Acepta que `bases` y el log de pitcheos queden
   vacíos hasta tener el feed completo.
3. **No hacer:** replicar el proof-of-work ni el token de sesión para consumir la
   API interna sin autorización escrita. Es evadir un control anti-bot.
4. **Arquitectura:** un único normalizador estilo StatsAPI con transporte
   intercambiable (`statsapi.mlb.com`, TuJonrón u otro proveedor compatible).

## Datos de la muestra (2026-11-21)

- `gamePk` `869962`, `ANZ` 6 – `ARA` 2, baja del 5.º, conteo 2-0.
- Equipos LVBP con id `692–699` (Zulia, Caribes, Leones, Magallanes, Bravos,
  Tigres, …).
- `status_id` observados: `I` (En progreso), `S` (Calendario), `P` (Lineup).
- Slug del partido: `2026/11/21/oriwin-arawin-1`.
