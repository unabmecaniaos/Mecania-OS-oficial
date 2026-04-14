# Alineacion con el PRD

## Lectura ejecutiva

Estamos alineados en la direccion del producto, pero no todavia en el alcance funcional completo del PRD 1.0.

La base actual ya se parece a un sistema operativo de taller y no a un CRUD academico aislado. En particular, ya existen piezas importantes del flujo que definiste:

- gestion interna de clientes y vehiculos.
- ordenes de trabajo con trazabilidad de estados.
- responsable actual en la OT.
- evidencia fotografica.
- historial por vehiculo y VIN.
- dashboard operativo basico.
- autoinspeccion remota.

La desalineacion principal hoy no es conceptual, sino de cobertura funcional. Todavia faltan modulos que en tu PRD son centrales:

- progreso por tareas.
- portal cliente.
- portal aseguradora.
- notificaciones por correo.
- roles externos y especializados.

## Lo que ya esta alineado

### Problema y propuesta

El repo ya refleja bien estas ideas del PRD:

- centralizar la operacion del taller.
- dejar trazabilidad de cambios.
- consultar historial tecnico del vehiculo.
- anticipar la recepcion mediante autoinspeccion.
- dar una vista de supervision resumida.

### Modulos ya presentes

- `Auth y Roles`:
  existe autenticacion y administracion de usuarios internos, aunque con roles aun simplificados.
- `Clientes`:
  existe CRUD y relacion con vehiculos.
- `Vehiculos`:
  existe registro, detalle y busqueda por VIN/patente.
- `Ordenes de trabajo`:
  existe creacion, actualizacion, asignacion de responsable y cambios de estado.
- `Evidencia`:
  existe carga de evidencia en OT.
- `Dashboard`:
  existe dashboard base con metricas operativas iniciales.
- `Autoinspeccion`:
  existe flujo publico por token y revision interna.

## Lo que aun no esta alineado

### Reglas de negocio faltantes

- el cliente todavia no obtiene acceso luego de aprobar presupuesto, porque no existe ese modulo.
- el progreso no se calcula por tareas completadas.
- no existe visibilidad diferenciada cliente/aseguradora sobre evidencia.
- no existe restriccion por organizacion aseguradora.
- no hay notificaciones por correo.

### Modelo de datos faltante

No aparecen aun estas entidades del PRD:

- `WorkOrderTask`
- `InsuranceCompany`
- `InsuranceAdjuster`
- `Notification`

`WorkOrderAssignment` hoy esta simplificado como un responsable actual dentro de la OT, lo cual coincide con la simplificacion que planteaste para esta primera version.

### Roles faltantes

Hoy el sistema maneja principalmente:

- `ADMIN`
- `MECHANIC`
- `CUSTOMER` en esquema, pero no como portal funcional

Faltan roles operativos y externos del PRD:

- supervisor como actor explicito del negocio.
- pintura/desabolladura.
- cliente con portal propio.
- aseguradora/liquidador.

## Mapa PRD vs estado actual

| Area | Estado |
| --- | --- |
| Registro de clientes | Implementado |
| Registro de vehiculos | Implementado |
| Historial por VIN | Implementado |
| Ordenes de trabajo | Implementado parcialmente |
| Responsable actual de OT | Implementado |
| Evidencia fotografica | Implementado parcialmente |
| Dashboard basico | Implementado parcialmente |
| Autoinspeccion remota | Implementado |
| Presupuestos | Implementado parcialmente |
| Aprobacion de presupuestos | Implementado parcialmente |
| Tareas en OT | No implementado |
| Progreso automatico | No implementado |
| Portal cliente | No implementado |
| Portal aseguradora | No implementado |
| Correos automaticos | No implementado |
| KPIs completos | No implementado |

## Decision documental

Desde ahora la documentacion del repo deberia describir MecaniaOS como:

- sistema de gestion operativa de taller mecanico.
- producto operativo para gestion de taller.
- plataforma con nucleo ya implementado y roadmap claro hacia progreso por tareas y portales externos.

No deberia seguir describirse como:

- sistema generico de mantenciones.
- proyecto donde cotizaciones, evidencia o portal cliente son solo ideas futuras, porque parte de esa base ya existe y otra parte ya es compromiso del PRD.

## Siguiente corte recomendado

Si queremos que el repo quede realmente alineado con tu PRD, el siguiente bloque de desarrollo deberia ser:

1. `quotes`
2. aprobacion de presupuesto
3. creacion de OT desde presupuesto aprobado
4. tareas por OT
5. progreso automatico
6. portal cliente

Ese corte deja el producto mucho mas cerca del criterio de exito que definiste.
