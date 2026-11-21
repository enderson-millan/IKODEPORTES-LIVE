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

## Migraciones de base de datos

El `Dockerfile` genera el cliente Prisma en la etapa `api-builder`. Las
migraciones se aplican como paso previo al arranque de la API:

```bash
# dentro del contenedor de la API, con DATABASE_URL definida
pnpm exec prisma migrate deploy --schema ../prisma/schema.prisma
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
