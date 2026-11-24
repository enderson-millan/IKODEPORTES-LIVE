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

## Capa 0 — MLB StatsAPI (mejor alternativa gratuita, verificada)

**La LVBP está servida por la StatsAPI pública de MLB.** Es la misma fuente que
usa TuJonrón: el `gamePk` coincide (`869962`), así que no hace falta scrapear ni
resolver tokens.

Verificado el 2026-11-21:

```bash
# ligas de invierno -> league 135 = LVBP
https://statsapi.mlb.com/api/v1/leagues?sportId=17

# solo partidos LVBP de una fecha
https://statsapi.mlb.com/api/v1/schedule?sportId=17&leagueId=135&date=2026-11-21&hydrate=linescore,team

# feed completo en vivo (sin auth, sin token)
https://statsapi.mlb.com/api/v1.1/game/869962/feed/live
```

Resultado observado para `869962`:

- `gameData.teams` y `gameData.venue` (Maracay, Estadio José Pérez Colmenares).
- `liveData.linescore`: inning 5, `isTopInning`, `balls/strikes/outs` y
  **`offense.first/second/third`** (bases).
- `liveData.linescore` también trae bateador y lanzador actuales.
- `liveData.plays.allPlays`: **50 jugadas**; `currentPlay.playEvents` con los
  pitcheos del turno (llamada, zona alta/baja y coordenadas).
- `liveData.boxscore`: alineaciones y estadísticas del día.
- Respuesta `200` con `Cache-Control: max-age=10, public` → **el propio feed
  declara 10 s de frescura**; conviene hacer polling ≥ 10 s.
- Sin `X-RateLimit-*` y sin credenciales.

**Limitación real de la LVBP (no del acceso):** en este feed los pitcheos traen
`details.call` y `pitchData.strikeZoneTop/Bottom` y `coordinates` crudas, pero
**no** `pitchData.startSpeed` ni `details.type`. Es decir: hay jugada a jugada y
bases, pero **no hay velocidad (MPH/KM-H) ni tipo de pitcheo** en la fuente.
Los paneles de "pitches del turno" con recta/slider y velocidad quedan vacíos
para LVBP hasta que la liga/proveedor publique esos campos.

Caveat: endpoint público pero **no documentado como API oficial** (sin SLA ni
contrato). Usar atribución, User-Agent identificable, backoff y un intervalo
cortés.

### Polling eficiente (`diffPatch`)

Medido el 2026-11-21 sobre el mismo partido:

| Endpoint                                             | Tamaño                                              | Uso                                 |
| ---------------------------------------------------- | --------------------------------------------------- | ----------------------------------- |
| `/feed/live`                                         | **~630 KB**                                         | bootstrap y re-sincronización       |
| `/feed/live/diffPatch?startTimecode=YYYYMMDD_HHMMSS` | **2 bytes** sin cambios · ~20 KB por ventana activa | polling continuo                    |
| `/api/v1/game/{pk}/linescore`                        | **3.5 KB**                                          | respaldo de bases/conteo/alineación |
| `/api/v1/game/{pk}/playByPlay`                       | 283 KB                                              | no usar en polling                  |
| `/api/v1/game/{pk}/boxscore`                         | 271 KB                                              | no usar en polling                  |

El `diffPatch` devuelve `[{ "diff": [ ...operaciones RFC 6902... ] }]`. Se aplica
sobre el snapshot en memoria y se actualiza `metaData.timeStamp`. Si el patch no
aplica (hueco o desincronización), se vuelve a bajar el feed completo. El propio
feed publica `metaData.wait = 10`; un intervalo de 5 s es buen equilibrio para
OBS.

**Bandwidth:** polling del feed completo cada 10 s para 8 partidos ≈ **40 GB/día**.
Con `diffPatch` baja a decenas de MB/día. No es una optimización menor: define si
entra en un VPS pequeño.

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

## Datos para el campo visual (verificado en el mismo feed)

El diamante con corredores y defensa **sí es posible** sin imágenes ni video:

| Campo                                           | Uso                                                                                                                                                                   |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `liveData.linescore.defense`                    | las 9 posiciones (`pitcher`, `catcher`, `first`, `second`, `third`, `shortstop`, `left`, `center`, `right`), más `team`, `batter`, `onDeck`, `inHole`, `battingOrder` |
| `liveData.linescore.offense.first/second/third` | corredores en base; **la clave solo existe si la base está ocupada** (si está vacía, el campo viene omitido)                                                          |
| `liveData.boxscore.teams[side].players`         | `jerseyNumber`, `position.abbreviation`, `battingOrder` para pintar número/posición                                                                                   |
| `playEvents[].hitData`                          | `coordinates.coordX/coordY`, `hardness`, `location`, `trajectory` → ubicación del batazo para el marcador de campo                                                    |
| `pitchData.zone`                                | **no existe** en LVBP; solo `details.call`, `strikeZoneTop/Bottom` y `coordinates.x/y`                                                                                |

Con eso se puede dibujar un SVG fijo (geometría del parque) y pintar encima:
corredores, defensa, bateador, pitcher y el último batazo. La zona de strike exacta
(9 cuadrantes) no es fiable sin `pitchData.zone`/`pX`/`pZ`; conviene una zona
esquemática con el último pitcheo, no una réplica del video del proveedor.

## Recomendación

1. **Primario:** `LvbpStatsApiAdapter` sobre `statsapi.mlb.com` (`sportId=17`,
   `leagueId=135`). Es gratis, sin token, usa el mismo `gamePk` y entrega bases,
   conteo, jugada a jugada y boxscore. Polling ≥ 10 s respetando `Cache-Control`.
2. **Fallback:** `TujonronHtmlAdapter` sobre el payload SSR público (capa 1) si
   StatsAPI falla o cambia. Acepta que `bases` y el log de pitcheos queden
   vacíos.
3. **Opcional:** pedir acceso oficial a TuJonrón/LVBP para obtener tipo y
   velocidad de pitcheo y un contrato con SLA.
4. **No hacer:** replicar el proof-of-work ni el token de sesión para consumir la
   API interna sin autorización escrita. Es evadir un control anti-bot.
5. **Arquitectura:** un único normalizador estilo StatsAPI con transporte
   intercambiable; `statsapi.mlb.com` (LVBP, LIDOM, LMP, MLB) y TuJonrón u otro
   proveedor compatible comparten la misma forma.

## Datos de la muestra (2026-11-21)

- `gamePk` `869962`, `ANZ` 6 – `ARA` 2, baja del 5.º, conteo 2-0.
- Equipos LVBP con id `692–699` (Zulia, Caribes, Leones, Magallanes, Bravos,
  Tigres, …).
- `status_id` observados: `I` (En progreso), `S` (Calendario), `P` (Lineup).
- Slug del partido: `2026/11/21/oriwin-arawin-1`.
