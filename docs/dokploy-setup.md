# Despliegue en Dokploy — IKODEPORTES Live

Guía de los dos entornos aislados (`test` y `production`) para la web, la API en
tiempo real y PostgreSQL 17.

## Arquitectura

| Servicio | Imagen / etapa                                    | Puerto interno | Dominio sugerido                                             |
| -------- | ------------------------------------------------- | -------------- | ------------------------------------------------------------ |
| `web`    | `Dockerfile` → target `web` (Next.js standalone)  | `3000`         | `live.ikodeportes.com` / `test.live.ikodeportes.com`         |
| `api`    | `Dockerfile` → target `api` (Express + Socket.IO) | `4000`         | `api.live.ikodeportes.com` / `test-api.live.ikodeportes.com` |
| `db`     | `postgres:17-alpine`                              | `5432`         | solo red interna                                             |

El cliente del navegador habla con la API a través de `NEXT_PUBLIC_WS_URL`
(Socket.IO usa WebSocket y, como respaldo, polling HTTP).

> `NEXT_PUBLIC_*` se incrusta en el bundle **durante el build**. En Dokploy hay
> que definirla como _build arg_, no solo como variable de runtime.

## Variables de entorno

### Proyecto `test`

| Variable                        | Ejemplo                                                           | Ámbito          | Obligatoria |
| ------------------------------- | ----------------------------------------------------------------- | --------------- | ----------- |
| `DATABASE_URL`                  | `postgresql://ikodeportes:***@db_test:5432/db_test?schema=public` | api             | sí          |
| `NEXT_PUBLIC_WS_URL`            | `https://test-api.live.ikodeportes.com`                           | web (build arg) | sí          |
| `PORT`                          | `3000` (web) / `4000` (api)                                       | web, api        | sí          |
| `FEED_POLL_INTERVAL_MS`         | `3000`                                                            | api             | recomendada |
| `CORS_ORIGIN`                   | `https://test.live.ikodeportes.com`                               | api             | sí          |
| `DB_PASSWORD`                   | contraseña fuerte                                                 | db              | sí          |
| `NEXT_PUBLIC_SUPABASE_URL`      | `https://xxxx.supabase.co`                                        | web (build arg) | opcional    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...`                                                          | web (build arg) | opcional    |
| `ADMIN_EMAIL`                   | `admin@ikodeportes.com`                                           | web             | opcional    |

### Proyecto `production`

Mismas variables con valores de producción:

| Variable                | Ejemplo                                                           |
| ----------------------- | ----------------------------------------------------------------- |
| `DATABASE_URL`          | `postgresql://ikodeportes:***@db_prod:5432/db_prod?schema=public` |
| `NEXT_PUBLIC_WS_URL`    | `https://api.live.ikodeportes.com`                                |
| `PORT`                  | `3000` / `4000`                                                   |
| `FEED_POLL_INTERVAL_MS` | `2000`                                                            |
| `CORS_ORIGIN`           | `https://live.ikodeportes.com`                                    |
| `DB_PASSWORD`           | contraseña fuerte, distinta de `test`                             |

Plantilla completa: [`env.example`](../env.example).

## Crear los proyectos en Dokploy

1. **Proyecto `ikodeportes-test`**
   1. Crear una base de datos PostgreSQL 17 (`db_test`). Copiar su URL interna en
      `DATABASE_URL`.
   2. Crear una aplicación desde el repositorio Git, método **Dockerfile**,
      con `Dockerfile Path = Dockerfile` y `Target = api`. Puerto `4000`.
   3. Crear otra aplicación, mismo repositorio, `Target = web`. Puerto `3000`.
   4. Añadir los dominios y habilitar TLS (Let's Encrypt) en cada aplicación.
2. **Proyecto `ikodeportes-production`**
   - Repetir los pasos con `db_prod`, dominios de producción y volúmenes propios.
   - No compartir la base de datos ni las contraseñas entre entornos.

## Despliegue

```bash
# validar la configuración local de ambos stacks
docker compose -f docker-compose.test.yml config
docker compose -f docker-compose.prod.yml config

# levantar el stack de test en local
docker compose -f docker-compose.test.yml up --build

# producción (en el servidor o localmente con variables reales)
docker compose -f docker-compose.prod.yml up --build -d
```

En Dokploy, cada aplicación se reconstruye desde el mismo `Dockerfile`
seleccionando el target correspondiente (`web` o `api`).

## Dimensionamiento del VPS (todo-en-Dokploy)

Perfil: ~8 partidos LVBP, polling `diffPatch` cada 5 s, 1 overlay de OBS por
transmisión y pocos usuarios web concurrentes.

| Recurso        | Mínimo           | Recomendado |
| -------------- | ---------------- | ----------- |
| vCPU           | 2                | 2–4         |
| RAM            | 2 GB + 2 GB swap | 4 GB        |
| Disco SSD      | 40 GB            | 80 GB       |
| Ancho de banda | 1 TB/mes         | 2 TB/mes    |

Consumo aproximado en régimen: Dokploy/Traefik ~300 MB, PostgreSQL ~200 MB, API
~120 MB, web ~200 MB. Total ~800 MB–1 GB antes de picos.

**El build es el pico, no el runtime.** `next build` puede pedir 1.5–2 GB de RAM.
En un VPS de 2 GB conviene construir la imagen en CI (GitHub Actions → GHCR) y que
Dokploy solo haga `pull`, o añadir swap y detener el resto de servicios durante el
build.

Notas para plan free:

- Un free tier de 512 MB–1 GB alcanza solo para **staging** y aun así con build
  externo. Postgres + web + API + Dokploy no conviven cómodos en 1 GB.
- Oracle Cloud Always Free (ARM 4 OCPU / 24 GB) es la excepción: sobra para
  producción; requiere imágenes `linux/arm64`.
- Los free tiers no tienen SLA y pueden reclamar instancias inactivas: no los uses
  para el entorno `production`.

Operación:

- Rotar logs de Docker (`max-size: 10m`, `max-file: 3`) para no llenar el disco.
- `docker image prune` periódico; las imágenes de Next + API + Prisma ocupan varios GB.
- Si `test` y `production` comparten VPS, apagar `test` cuando no se use: duplica
  el consumo.
- Con una sola instancia de API no hace falta Redis. Si algún día hay 2+, Socket.IO
  necesita el adaptador de Redis.

## Migraciones de base de datos

El `Dockerfile` genera el cliente Prisma en la etapa `api-builder`. Las
migraciones se aplican como paso previo al arranque de la API. La imagen `api`
usa `WORKDIR /app` y el schema queda en `/app/prisma`:

```bash
# dentro del contenedor de la API (cwd /app), con DATABASE_URL definida
pnpm exec prisma migrate deploy --schema prisma/schema.prisma

# alternativa desde el host / repo, usando el script del paquete backend
pnpm --dir backend run prisma:migrate
```

En Dokploy se configura como **comando de pre-deploy** de la aplicación `api`.
Si el esquema cambia:

```bash
# local, contra la base de test
DATABASE_URL="postgresql://ikodeportes:...@localhost:5433/db_test?schema=public" \
  pnpm --dir backend exec prisma migrate dev --schema ../prisma/schema.prisma --name <nombre>
```

## Persistencia y respaldos

- `db_prod_data` es un volumen Docker nombrado; no lo elimines al recrear la
  aplicación.
- Programa respaldos (`pg_dump`) diarios y guárdalos fuera del servidor.
- `test` puede reconstruirse desde cero: no requiere respaldos.

## Verificación

| Comprobación       | Comando                                                                              |
| ------------------ | ------------------------------------------------------------------------------------ |
| API viva           | `curl https://api.live.ikodeportes.com/health`                                       |
| Web arriba         | `curl -I https://live.ikodeportes.com`                                               |
| Rooms de Socket.IO | conectar a `NEXT_PUBLIC_WS_URL` y emitir `join-game` con `{ "gameId": "demo-live" }` |
| Base de datos      | `prisma migrate status`                                                              |

## Problemas frecuentes

| Síntoma                           | Causa probable                                                        | Solución                                                     |
| --------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| El navegador no conecta el socket | `NEXT_PUBLIC_WS_URL` apunta a `localhost` o no se pasó como build arg | redefinir la variable y reconstruir la imagen `web`          |
| Error CORS en la API              | `CORS_ORIGIN` no incluye el dominio exacto del frontend               | agregar el origen (sin barra final)                          |
| `P1001` al conectar Prisma        | `DATABASE_URL` usa `localhost` dentro de la red de Dokploy            | usar el hostname interno del servicio (`db_prod`, `db_test`) |
| Contenedor `web` reinicia         | falta `HOSTNAME=0.0.0.0` o el puerto no coincide                      | revisar `PORT`/`HOSTNAME` del servicio                       |
