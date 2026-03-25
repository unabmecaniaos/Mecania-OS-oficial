# MecaniaOS

MVP de un sistema de seguimiento de mantenciones mecanicas para talleres.

## Stack

- Next.js 16
- TypeScript
- Prisma 6.18
- PostgreSQL
- Tailwind CSS 4
- Zod
- Autenticacion por sesion con cookie `httpOnly`

## Arquitectura

Se usa un monolito modular: la UI y la API viven en el mismo proyecto, pero la logica de negocio queda separada por dominios dentro de `src/modules`.

Documentacion base:

- `docs/architecture.md`
- `docs/implementation-plan.md`
- `docs/ui-direction-taller-alpha.md`

Skill local de direccion visual:

- `.codex/skills/mecania-ui-director/SKILL.md`

## Estructura

```text
.
|-- docs/
|-- prisma/
|-- src/
|   |-- app/
|   |   |-- api/
|   |   |-- login/
|   |   `-- (protected)/
|   |-- components/
|   |-- lib/
|   `-- modules/
|-- .env.example
`-- README.md
```

## Modulos implementados en Sprint 1

- Autenticacion
- Clientes
- Vehiculos
- Ordenes de trabajo
- Estados de reparacion
- Historial tecnico

## Variables de entorno

Crear `.env` o `.env.local` usando `.env.example` como base:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/mecaniaos?schema=public"
SESSION_SECRET="replace-this-with-a-long-random-secret"
APP_URL="http://localhost:3000"
```

En este repo ya deje una `.env.local` para desarrollo local con PostgreSQL en Docker.
El contenedor de MecaniaOS usa el puerto host `5433` para no chocar con otros proyectos.

## Ejecucion local

1. Instalar dependencias:

```bash
pnpm install
```

2. Levantar PostgreSQL con Docker:

```bash
pnpm docker:db:up
```

3. Generar cliente de Prisma:

```bash
pnpm db:generate
```

4. Crear la base o aplicar esquema:

```bash
pnpm db:push
```

5. Cargar datos de prueba:

```bash
pnpm db:seed
```

6. Levantar la aplicacion:

```bash
pnpm dev
```

## Flujo con Docker

Uso recomendado para desarrollo de equipo:

- App local con `pnpm dev`
- Base de datos en Docker con `pnpm docker:db:up`

Comandos utiles:

- `pnpm docker:db:up`
- `pnpm docker:db:down`
- `pnpm docker:db:logs`

Tambien deje preparada una imagen de la app:

```bash
pnpm docker:app:up
```

Eso levanta `db` y `app` juntos en contenedores.

## Credenciales seed

- Administrador: `admin@mecaniaos.local` / `Admin1234!`
- Mecanico: `mecanico@mecaniaos.local` / `Mechanic1234!`

## Scripts

- `pnpm dev`
- `pnpm build`
- `pnpm start`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm db:generate`
- `pnpm db:push`
- `pnpm db:migrate`
- `pnpm db:seed`
- `pnpm studio`
- `pnpm docker:db:up`
- `pnpm docker:db:down`
- `pnpm docker:db:logs`
- `pnpm docker:app:up`
- `pnpm docker:app:down`

## Endpoints base

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/clients`
- `POST /api/clients`
- `GET /api/clients/:id`
- `PATCH /api/clients/:id`
- `GET /api/vehicles`
- `POST /api/vehicles`
- `GET /api/vehicles/:id`
- `PATCH /api/vehicles/:id`
- `GET /api/vehicles/search?vin=...&plate=...`
- `GET /api/vehicles/:id/history`
- `GET /api/vehicles/history/search?vin=...`
- `GET /api/work-orders`
- `POST /api/work-orders`
- `GET /api/work-orders/:id`
- `PATCH /api/work-orders/:id`
- `PATCH /api/work-orders/:id/status`

## Siguiente fase sugerida

- Inventario basico
- Cotizaciones
- Evidencias fotograficas
- Portal cliente
