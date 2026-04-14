# Arquitectura MecaniaOS

## Decision principal

MecaniaOS usa un **monolito modular** con `Next.js` como frontend y backend del sistema. Esta decision prioriza velocidad de entrega, coherencia funcional y menor complejidad operativa, manteniendo separacion clara por dominios para evolucionar el producto despues.

## Enfoque de producto soportado por la arquitectura

La arquitectura actual esta pensada para cubrir estos flujos del taller:

- recepcion de clientes y vehiculos.
- gestion interna de ordenes de trabajo.
- trazabilidad de estados y evidencia.
- autoinspeccion remota previa al ingreso.
- consulta historica por vehiculo.
- vista operativa resumida para supervision.

La arquitectura todavia debe crecer para soportar de forma completa:

- tareas y progreso calculado por OT.
- portales externos de cliente y aseguradora.
- notificaciones por correo.
- permisos mas finos por tipo de actor.

## Capas

- `src/app`: rutas UI, layouts, server actions y route handlers HTTP.
- `src/modules`: logica por dominio, validacion, repositorios, servicios y adaptadores de storage.
- `src/components`: UI reutilizable y componentes de dominio.
- `src/lib`: utilidades transversales, auth, Prisma, errores y helpers.
- `prisma`: esquema, seed y evolucion del modelo de datos.
- `docs`: decisiones tecnicas, plan y alineacion con el PRD.

## Modulos actuales

- `auth`
- `users`
- `clients`
- `vehicles`
- `work-orders`
- `service-history`
- `dashboard`
- `quotes`
- `self-inspections`

## Principios

- validacion de entrada con `Zod`.
- reglas de negocio dentro de `src/modules`, no en las rutas HTTP.
- persistencia centralizada en Prisma.
- trazabilidad de cambios relevantes mediante tablas de historial.
- componentes server-first para la interfaz interna.
- storage encapsulado por dominio para no acoplarse temprano a un proveedor.

## Estado del modelo de datos

El modelo actual cubre bien la base operativa del taller:

- usuarios internos con sesiones.
- clientes.
- vehiculos.
- ordenes de trabajo.
- evidencia de OT.
- historial de estados de OT.
- autoinspecciones y sus tablas satelite.
- presupuestos, items y bitacora de estado.

Todavia faltan agregados centrales para el PRD 1.0:

- `WorkOrderTask`
- `WorkOrderAssignment` separado si se quiere historial de responsables
- `InsuranceCompany`
- `InsuranceAdjuster`
- `Notification`

## Estructura de carpetas

```text
.
|-- docs/
|-- prisma/
|   |-- schema.prisma
|   `-- seed.ts
|-- src/
|   |-- app/
|   |   |-- api/
|   |   |-- login/
|   |   |-- self-inspections/
|   |   `-- (protected)/
|   |-- components/
|   |-- lib/
|   `-- modules/
|       |-- auth/
|       |-- users/
|       |-- clients/
|       |-- vehicles/
|       |-- work-orders/
|       |-- service-history/
|       |-- dashboard/
|       |-- quotes/
|       `-- self-inspections/
|-- .env.example
`-- README.md
```

## Extensibilidad prevista

Los siguientes modulos son la continuacion natural del diseno actual:

- `work-order-tasks`
- `customer-portal`
- `insurance-portal`
- `notifications`

## Lectura recomendada

- `README.md`: posicionamiento general y estado actual.
- `docs/implementation-plan.md`: roadmap ajustado al PRD.
- `docs/prd-alignment.md`: implementado vs pendiente.
