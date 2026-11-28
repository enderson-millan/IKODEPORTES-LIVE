# Topología de despliegue y operación — IKODEPORTES Live

Guía de cómo se reparten las piezas entre la PC del operador, Vercel y OBS, qué
variables necesita cada destino y cómo comprobar que todo está en pie antes de
salir al aire.

> **Regla que ordena todo:** el **API no puede vivir en Vercel**. Guarda el estado
> de cada partido en memoria (`Map<string, Runtime>`) y corre `setInterval` +
> Socket.IO. En serverless no hay proceso persistente ni memoria compartida. El
> API sale de la PC o de un VPS; Vercel solo sirve el frontend.

---

## 1. Qué corre dónde

| Pieza                       | Dónde                          | Por qué                                     |
| --------------------------- | ------------------------------ | ------------------------------------------- |
| `web` (Next.js)             | Vercel **o** Docker local      | Sin estado; solo lee del API                |
| `api` (Express + Socket.IO) | PC del operador (Docker) o VPS | Estado en memoria y timer de polling        |
| `db` (PostgreSQL 17)        | junto al API                   | Prisma; requiere red privada                |
| `cloudflared`               | PC del operador                | Publica el API sin abrir puertos            |
| Overlay de OBS              | **local**, no Vercel           | Un salto menos de red en el momento crítico |

### Diagrama

```
                    ┌──────────────────────────────┐
   visitantes ─────▶│  Vercel: web (Next.js)        │
                    │  live.ikodeportes.com         │
                    └──────────────┬───────────────┘
                                   │ HTTPS (server components)
                                   │ WSS   (socket del navegador)
                                   ▼
                    ┌──────────────────────────────┐
                    │  Cloudflare DNS + TLS        │
                    └──────────────┬───────────────┘
                                   │ Cloudflare Tunnel (saliente)
                                   ▼
   OBS ── localhost:3100 ──▶ ┌──────────────────────────────┐
   (evita el túnel)          │  PC del operador (Docker)    │
                             │  web :3100  api :4100  db:5434│
                             └──────────────┬───────────────┘
                                            │ HTTPS
                                            ▼
                                   statsapi.mlb.com
```

---

## 2. Puertos por stack

| Stack      | Archivo                    | web              | api              | db               |
| ---------- | -------------------------- | ---------------- | ---------------- | ---------------- |
| Local      | `docker-compose.local.yml` | `127.0.0.1:3100` | `127.0.0.1:4100` | `127.0.0.1:5434` |
| Test       | `docker-compose.test.yml`  | `3001`           | `4001`           | `5433`           |
| Producción | `docker-compose.prod.yml`  | `3000`           | `4000`           | `5432`           |

El stack local ata todo a `127.0.0.1`: **no** queda expuesto a la red, y el túnel
entra por la red interna de Docker, no por el host.

---

## 3. Stack local (PC del operador)

```powershell
docker compose -f docker-compose.local.yml up -d --build
docker compose -f docker-compose.local.yml ps
```

Verificación mínima:

```powershell
Invoke-WebRequest http://localhost:4100/health -UseBasicParsing | Select-Object -Expand Content
# {"status":"ok","service":"ikodeportes-api",...}
```

### El API arranca el polling solo cuando se lo piden

`LIVE_AUTO_DISCOVER=false` significa que **nadie trackea nada hasta que una
página lo pide**. Abrir `/overlay/<id>` o `/games/<id>` dispara
`POST /api/live/games/:id/start`, que es idempotente.

Consecuencia operativa: si nadie abre la página, no hay datos. Y si reiniciás el
contenedor `api`, el estado en memoria se pierde y el polling se reanuda cuando
la página vuelve a pedirlo.

---

## 4. Publicar el API con Cloudflare Tunnel

Rutas necesarias en Zero Trust → Networks → Tunnels:

| Hostname                   | Servicio                                                       |
| -------------------------- | -------------------------------------------------------------- |
| `api.live.ikodeportes.com` | `http://ikodeportes-api:4000`                                  |
| `live.ikodeportes.com`     | `http://ikodeportes-web:3000` **(solo si el web queda local)** |

Si el web se muda a Vercel, **quitá** la ruta de `live.` y dejá únicamente la del
API. Dos destinos para el mismo hostname es la forma más rápida de servir una
versión vieja sin darte cuenta.

```powershell
# perfil opcional del compose
docker compose -f docker-compose.local.yml --profile tunnel up -d
```

Notas:

- El túnel es **saliente**: no abrís puertos ni tocás el router.
- WebSockets atraviesan el túnel sin configuración extra. Socket.IO mantiene la
  conexión con su ping cada 25 s, así que no la cortan los timeouts de Cloudflare.
- Si la PC se apaga, `api.live.ikodeportes.com` deja de responder. Con Vercel eso
  se ve como "el sitio carga pero no hay datos".

---

## 5. Frontend en Vercel

### Ajustes del proyecto

| Ajuste           | Valor                              |
| ---------------- | ---------------------------------- |
| Framework Preset | Next.js                            |
| Root Directory   | `.` (raíz del repo)                |
| Install Command  | `pnpm install`                     |
| Build Command    | `pnpm build`                       |
| Node.js Version  | 22.x o superior (Next 16 lo exige) |

`next.config.ts` emite `output: "standalone"` **solo** fuera de Vercel:

```ts
const isVercel = Boolean(process.env.VERCEL);
...(isVercel ? {} : { output: "standalone" as const })
```

`standalone` existe para self-hosting en Docker; en Vercel el build lo produce la
plataforma.

### Variables de entorno

| Variable                        | Valor                              | Momento                |
| ------------------------------- | ---------------------------------- | ---------------------- |
| `NEXT_PUBLIC_WS_URL`            | `https://api.live.ikodeportes.com` | **build** (se inlinea) |
| `LIVE_WS_URL`                   | `https://api.live.ikodeportes.com` | runtime                |
| `LIVE_API_INTERNAL_URL`         | `https://api.live.ikodeportes.com` | runtime                |
| `NEXT_PUBLIC_SUPABASE_URL`      | tu proyecto                        | build                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | tu clave pública                   | build                  |
| `ADMIN_EMAIL`                   | tu correo admin                    | runtime                |

Trampa frecuente: **`NEXT_PUBLIC_*` se incrusta en el bundle**. Cambiar
`NEXT_PUBLIC_WS_URL` exige **redeploy**, no alcanza con reiniciar.

Y `LIVE_API_INTERNAL_URL` **no** puede seguir apuntando a
`http://ikodeportes-api:4000`: esa red existe solo dentro de Docker.

---

## 6. OBS

Fuente → **Navegador**:

| Campo                         | Valor                                  |
| ----------------------------- | -------------------------------------- |
| URL                           | `http://localhost:3100/overlay/869961` |
| Ancho                         | `1920`                                 |
| Alto                          | `1080`                                 |
| FPS                           | `30`                                   |
| Cerrar cuando no esté visible | **desmarcado**                         |

Si OBS descarga la fuente, se corta el socket y el overlay vuelve vacío hasta
reconectar. Para una transmisión, dejalo siempre cargado.

### Paneles por query string

```
/overlay/869961                                   → todos los paneles
/overlay/869961?panels=scoreboard,bases,count      → solo esos
/overlay/869961?panels=none                        → ninguno (fondo limpio)
```

### Por qué el overlay va local y no por Vercel

Cargarlo de `localhost` evita el viaje navegador → Cloudflare → túnel → PC por
cada snapshot. Además, si el túnel o internet fallan, **el overlay sigue
funcionando**: solo depende de tu Docker local.

El overlay fuerza tema oscuro con un wrapper `.dark`, así que un cambio de tema
en el sistema operativo no lo repinta.

---

## 7. Referencia de variables

### Base de datos

| Variable      | Default       | Nota                                          |
| ------------- | ------------- | --------------------------------------------- |
| `DB_NAME`     | `db_local`    |                                               |
| `DB_USER`     | `ikodeportes` |                                               |
| `DB_PASSWORD` | **requerida** | debe coincidir con el volumen ya inicializado |

`POSTGRES_PASSWORD` solo se aplica **al crear** el volumen. Cambiarla después
rompe la autenticación del API.

### API

| Variable                | Default                     | Nota                                           |
| ----------------------- | --------------------------- | ---------------------------------------------- |
| `PORT`                  | `4000`                      |                                                |
| `CORS_ORIGIN`           | `http://localhost:3100,...` | debe incluir **cada** origen que abra el sitio |
| `FEED_POLL_INTERVAL_MS` | `1000`                      | se recorta a `[1000, 60000]`                   |
| `LEAGUE`                | `LVBP`                      |                                                |
| `LVBP_SPORT_ID`         | `17`                        |                                                |
| `LVBP_LEAGUE_ID`        | `135`                       |                                                |
| `LIVE_AUTO_DISCOVER`    | `false`                     | `true` trackea los LIVE al arrancar            |
| `CONTROL_TOKEN`         | vacío                       | si está vacío, `POST /stop` queda abierto      |
| `MAX_TRACKED_GAMES`     | `20`                        | al llegar, `/start` responde `429`             |

### Web

| Variable                | Default                       | Nota                                   |
| ----------------------- | ----------------------------- | -------------------------------------- |
| `NEXT_PUBLIC_WS_URL`    | —                             | **build-time**, URL pública del API    |
| `LIVE_WS_URL`           | —                             | runtime; la usan los server components |
| `LIVE_API_INTERNAL_URL` | `http://ikodeportes-api:4000` | red interna o URL pública              |
| `ADMIN_EMAIL`           | vacío                         | acceso a `/admin/*`                    |

Una **precedencia** que muerde: el `env` del shell gana sobre `.env` en la
interpolación de Compose. Un `$env:FEED_POLL_INTERVAL_MS='1000'` aplica para un
`up`, y el siguiente `up` vuelve al valor de `.env`.

---

## 8. Superficie del API

| Método | Ruta                                 | Respuesta                                                      |
| ------ | ------------------------------------ | -------------------------------------------------------------- |
| GET    | `/health`                            | `{ status, service, uptimeSeconds, leagues, overlayPanels }`   |
| GET    | `/api/live/discover?date=YYYY-MM-DD` | `{ games: GameSummary[] }` · `502` si el feed falla            |
| GET    | `/api/live/games`                    | `{ games: RuntimeSummary[] }` (trackeados + `errorCount`)      |
| GET    | `/api/live/games/:gameId`            | `{ state }` · `404 not-tracked`                                |
| POST   | `/api/live/games/:gameId/start`      | `{ state }` · `400` id inválido · `429` capacidad · `502` feed |
| POST   | `/api/live/games/:gameId/stop`       | `204` · `401` si `CONTROL_TOKEN` está seteado · `404`          |

### Realtime

| Room               | Contenido                       |
| ------------------ | ------------------------------- |
| `game:<gameId>`    | estado canónico                 |
| `overlay:<gameId>` | visibilidad de paneles + estado |

| Evento                           | Dirección                               |
| -------------------------------- | --------------------------------------- |
| `join-game` / `leave-game`       | cliente → servidor                      |
| `join-overlay` / `leave-overlay` | cliente → servidor                      |
| `game-state`                     | servidor → cliente (snapshot completo)  |
| `game-play`                      | servidor → cliente (jugada incremental) |
| `overlay-state`                  | servidor → cliente (control de paneles) |

---

## 9. Checklist antes de salir al aire

```powershell
# 1. contenedores arriba y sanos
docker compose -f docker-compose.local.yml ps

# 2. API responde
Invoke-WebRequest http://localhost:4100/health -UseBasicParsing | Select-Object -Expand StatusCode

# 3. el partido está trackeado y sin errores
(Invoke-WebRequest http://localhost:4100/api/live/games -UseBasicParsing).Content

# 4. hay descubrimiento de jornada
(Invoke-WebRequest http://localhost:4100/api/live/discover -UseBasicParsing).Content

# 5. el overlay carga y no trae chrome del sitio
Invoke-WebRequest http://localhost:3100/overlay/869961 -UseBasicParsing | Select-Object -Expand StatusCode
```

En pantalla, el header debe mostrar `ACTUALIZADO: hace N s` con el punto de
conexión encendido. Si aparece `DATOS ATRASADOS`, la fuente dejó de publicar.

Durante el juego:

```powershell
docker logs -f ikodeportes-api | Select-String 'state-changed|poll-error|state-resynced'
```

---

## 10. Fallas conocidas y su causa

| Síntoma                                              | Causa                                                                | Solución                                          |
| ---------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------- |
| Todo el layout se ve apilado y enorme                | Tailwind con `source(none)` sin `@source "../app"`                   | ya corregido; verificá que el CSS no fue cacheado |
| `ACTUALIZADO` congelado pero los datos son correctos | `state.updatedAt` es el sello de la fuente, no nuestro fetch         | la UI usa `source.fetchedAt`                      |
| `DATOS ATRASADOS` durante minutos                    | el proveedor no publica (se midió 16 min)                            | esperar o usar el tracker manual                  |
| El logo da 404 en Docker y funciona en Windows       | nombre con mayúsculas en filesystem case-sensitive                   | rutas siempre en minúsculas                       |
| El socket se rechaza desde Vercel                    | `CORS_ORIGIN` sin el origen de Vercel                                | agregar el dominio exacto                         |
| React #418 en consola                                | texto dependiente de hora/zona en un componente que también hace SSR | formatear en zona fija (hora de liga)             |
| Cambié `NEXT_PUBLIC_WS_URL` y no pasa nada           | se inlinea en build                                                  | redeploy                                          |
| Reinicié `api` y no hay datos                        | estado en memoria                                                    | abrir la página para re-disparar `/start`         |
| `429 tracking-capacity-reached`                      | más partidos que `MAX_TRACKED_GAMES`                                 | subir el tope o parar partidos con `/stop`        |

---

## 11. Limitaciones conocidas

- **Cadencia del proveedor.** MLB StatsAPI regenera el feed cada **25-33 s** y se
  ha trabado 16 minutos con el juego en curso. Ningún ajuste de polling mejora
  eso: el piso es la fuente.
- **Una sola réplica del API.** El estado vive en memoria y los timers en el
  proceso. Escalar horizontalmente sirve estados distintos a clientes distintos.
- **`MAX_TRACKED_GAMES`.** Cada partido a 1 s son ~60 req/min contra una API
  pública. Con 20 partidos son ~20 req/s: candidato a throttling.
- **Contrato sin datos de posición de pitcheo** (`pX`/`pZ`) ni foto de jugador.
  La zona de strike y los avatares requieren extender el contrato.
- **`TEAM_LOGOS` indexa solo por código de 3 letras.** `CAR` es Leones del Caracas
  y también Gigantes de Carolina (Puerto Rico).

---

## 12. Noche de transmisión (runbook)

1. `docker compose -f docker-compose.local.yml up -d` en la PC.
2. Verificar `/health` y `/api/live/games`.
3. Abrir el overlay en OBS con el `gameId` real (no `demo-live`).
4. Confirmar en el dashboard `ACTUALIZADO: hace N s` y el punto en verde.
5. Dejar `docker logs -f` abierto en una terminal secundaria.
6. Si aparece `DATOS ATRASADOS` por más de 90 s: es el proveedor. Avisar en cámara
   o cambiar de fuente; el overlay no se rompe, solo repite el último estado.
