# MecaniaOS

Sistema web responsive para la gestion operativa de un taller mecanico pequeno o mediano.

## Vision del producto

MecaniaOS busca centralizar el flujo completo del taller desde el ingreso del vehiculo hasta su entrega. El producto apunta a ordenar la operacion interna, dar trazabilidad sobre cada intervencion y ofrecer visibilidad tanto al cliente como a aseguradoras en los casos derivados.

El proyecto esta preparado para operar como plataforma web de gestion de taller, con despliegue en `Vercel`, arquitectura modular y soporte para evolucionar por dominios.

## Estado actual del proyecto

La base actual ya cubre parte importante del nucleo operativo:

- autenticacion por sesiones y control de acceso interno.
- gestion de usuarios internos.
- registro y administracion de clientes.
- registro y administracion de vehiculos.
- ordenes de trabajo con responsable actual y cambios de estado trazables.
- carga de evidencia fotografica en ordenes de trabajo.
- historial tecnico por vehiculo y VIN.
- dashboard operativo basico.
- autoinspeccion remota por enlace seguro.
- presupuestos con ciclo de borrador, envio, aprobacion y rechazo.

Todavia quedan lineas de evolucion relevantes del PRD:

- tareas dentro de la OT y progreso calculado automaticamente.
- portal cliente.
- portal aseguradora y modelo organizacional para liquidadores.
- notificaciones por correo.
- KPIs operativos ampliados y alertas de atraso.
- roles mas granulares para supervisor, pintura/desabolladura, cliente y aseguradora.

## Stack

- Next.js 16
- TypeScript
- Prisma 6.18
- PostgreSQL / Supabase
- Tailwind CSS 4
- Zod
- autenticacion por sesion con cookie `httpOnly`

## Arquitectura

Se usa un monolito modular: la UI y la API viven en el mismo proyecto, pero la logica de negocio se separa por dominios dentro de `src/modules`.

Documentacion principal:

- `docs/architecture.md`
- `docs/implementation-plan.md`
- `docs/prd-alignment.md`
- `docs/self-inspection.md`
- `docs/team-workflow.md`

## Estructura

```text
.
|-- docs/
|-- prisma/
|-- src/
|   |-- app/
|   |   |-- api/
|   |   |-- login/
|   |   |-- self-inspections/
|   |   `-- (protected)/
|   |-- components/
|   |-- lib/
|   `-- modules/
|-- .env.example
`-- README.md
```

## Modulos implementados

- `auth`
- `users`
- `clients`
- `vehicles`
- `work-orders`
- `service-history`
- `dashboard`
- `self-inspections`

## Variables de entorno

Crear `.env` o `.env.local` usando `.env.example` como base:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/mecaniaos?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5433/mecaniaos?schema=public"
SESSION_SECRET="replace-this-with-a-long-random-secret"
APP_URL="http://localhost:3000"
```

En este repo ya existe una `.env.local` para desarrollo local con PostgreSQL en Docker.

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

4. Aplicar el esquema:

```bash
pnpm db:push
```

5. Cargar datos iniciales del entorno local:

```bash
pnpm db:seed
```

6. Levantar la aplicacion:

```bash
pnpm dev
```

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

## API disponible hoy

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
- `GET /api/self-inspections`
- `POST /api/self-inspections`
- `GET /api/self-inspections/:id`
- `POST /api/self-inspections/:id/review`
- `PATCH /api/self-inspections/:id/status`

## Proxima etapa recomendada

- modelar `quotes` y su aprobacion como disparador formal de la OT.
- incorporar tareas en OT con progreso derivado.
- abrir portal cliente luego de aprobacion de presupuesto.
- agregar modelo de aseguradoras y liquidadores.
- ampliar dashboard con KPIs del PRD.
