# Sprint 2

- Project: MOS
- Board ID: 100
- State: active
- Synced at: 2026-04-14T13:06:41.372Z
- Goal: Iniciar el ciclo de presupuestos junto con una base de control de inventario para el taller.

## Issues

### MOS-62 - Rechazar presupuesto
- Status: Finalizada
- Type: Historia
- Priority: Medium
- Assignee: Carlos Gonzalez
- Jira: https://uandresbello-team-bg7iosbc.atlassian.net/browse/MOS-62

Description:
Como cliente, quiero rechazar un presupuesto, para dejar constancia de que el trabajo no fue aprobado.

Acceptance Criteria:
- Un presupuesto enviado puede marcarse como rechazado.
- El rechazo queda registrado con fecha y actor responsable.
- El sistema evita convertir en OT un presupuesto rechazado.
- El estado rechazado queda visible en listados y detalle.

Acceptance Criteria:
- Un presupuesto enviado puede marcarse como rechazado.
- El rechazo queda registrado con fecha y actor responsable.
- El sistema evita convertir en OT un presupuesto rechazado.
- El estado rechazado queda visible en listados y detalle.

### MOS-11 - Aprobar presupuesto
- Status: Finalizada
- Type: Historia
- Priority: Medium
- Assignee: Ignacio Benegas
- Jira: https://uandresbello-team-bg7iosbc.atlassian.net/browse/MOS-11

Description:
Como cliente, quiero aprobar un presupuesto, para autorizar el inicio del trabajo sin requerir firma avanzada en esta etapa.

Acceptance Criteria:
- El presupuesto puede cambiar a estado aprobado mediante una accion simple en el sistema.
- La aprobacion queda registrada con fecha y actor responsable.
- Un presupuesto aprobado queda listo para convertirse en orden de trabajo.
- El sistema evita aprobar dos veces el mismo presupuesto.

Acceptance Criteria:
- El presupuesto puede cambiar a estado aprobado mediante una accion simple en el sistema.
- La aprobacion queda registrada con fecha y actor responsable.
- Un presupuesto aprobado queda listo para convertirse en orden de trabajo.
- El sistema evita aprobar dos veces el mismo presupuesto.

### MOS-61 - Enviar presupuesto al cliente
- Status: Finalizada
- Type: Historia
- Priority: Medium
- Assignee: Martín Andrés Araya Díaz
- Jira: https://uandresbello-team-bg7iosbc.atlassian.net/browse/MOS-61

Description:
Como usuario interno, quiero enviar un presupuesto, para dejarlo disponible para revision y aprobacion externa.

Acceptance Criteria:
- Un presupuesto en borrador puede cambiar a estado enviado.
- El envio registra fecha y actor que realizo la accion.
- El presupuesto enviado queda disponible para cliente o aseguradora segun corresponda.
- El sistema evita enviar presupuestos en estados incompatibles.

Acceptance Criteria:
- Un presupuesto en borrador puede cambiar a estado enviado.
- El envio registra fecha y actor que realizo la accion.
- El presupuesto enviado queda disponible para cliente o aseguradora segun corresponda.
- El sistema evita enviar presupuestos en estados incompatibles.

### MOS-7 - Generar presupuesto
- Status: Finalizada
- Type: Historia
- Priority: Medium
- Assignee: Ignacio Benegas
- Jira: https://uandresbello-team-bg7iosbc.atlassian.net/browse/MOS-7

Description:
Como mecanico o supervisor, quiero generar un presupuesto para un vehiculo, para desglosar mano de obra, repuestos y suministros antes de ejecutar el trabajo.

Acceptance Criteria:
- El presupuesto se puede asociar a un cliente y vehiculo existentes o a una autoinspeccion revisada.
- El formulario permite registrar items de mano de obra, repuestos y suministros.
- El presupuesto queda guardado en estado borrador.
- El presupuesto creado queda disponible para su revision y posterior envio.

Acceptance Criteria:
- El presupuesto se puede asociar a un cliente y vehiculo existentes o a una autoinspeccion revisada.
- El formulario permite registrar items de mano de obra, repuestos y suministros.
- El presupuesto queda guardado en estado borrador.
- El presupuesto creado queda disponible para su revision y posterior envio.

### MOS-84 - Registrar ingreso de stock de repuestos
- Status: Tareas por hacer
- Type: Historia
- Priority: Medium
- Assignee: Martín Andrés Araya Díaz
- Jira: https://uandresbello-team-bg7iosbc.atlassian.net/browse/MOS-84

Description:
Como administrador, quiero registrar el ingreso de nuevas unidades de un repuesto, para actualizar el stock disponible despues de una compra o reposicion.
Acceptance Criteria:
- El sistema permite seleccionar un repuesto existente e ingresar una cantidad de unidades nuevas.
- El stock total del repuesto se actualiza automaticamente despues del ingreso.
- El movimiento queda registrado con fecha y cantidad ingresada.
- El ingreso de stock queda disponible para trazabilidad posterior.

Acceptance Criteria:
- El sistema permite seleccionar un repuesto existente e ingresar una cantidad de unidades nuevas.
- El stock total del repuesto se actualiza automaticamente despues del ingreso.
- El movimiento queda registrado con fecha y cantidad ingresada.
- El ingreso de stock queda disponible para trazabilidad posterior.

### MOS-6 - Registrar repuestos en inventario
- Status: Tareas por hacer
- Type: Historia
- Priority: Medium
- Assignee: Carlos Gonzalez
- Jira: https://uandresbello-team-bg7iosbc.atlassian.net/browse/MOS-6

Description:
Como administrador, quiero registrar repuestos en el sistema, para mantener un catalogo interno disponible para el taller.
Acceptance Criteria:
- El sistema permite crear un repuesto con nombre, codigo o referencia, stock inicial y stock minimo.
- El repuesto queda visible en el listado de inventario.
- El sistema evita duplicar el codigo o referencia cuando se define como identificador unico.
- El registro queda persistido y disponible para movimientos posteriores de stock.

Acceptance Criteria:
- El sistema permite crear un repuesto con nombre, codigo o referencia, stock inicial y stock minimo.
- El repuesto queda visible en el listado de inventario.
- El sistema evita duplicar el codigo o referencia cuando se define como identificador unico.
- El registro queda persistido y disponible para movimientos posteriores de stock.

### MOS-85 - Descontar repuestos utilizados en una orden de trabajo
- Status: Tareas por hacer
- Type: Historia
- Priority: Medium
- Assignee: Benjamin Yañez Lasalvia
- Jira: https://uandresbello-team-bg7iosbc.atlassian.net/browse/MOS-85

Description:
Como mecanico, quiero registrar los repuestos utilizados en una orden de trabajo, para descontarlos automaticamente del inventario y mantener trazabilidad del consumo.
Acceptance Criteria:
- Desde una orden de trabajo se pueden asociar uno o mas repuestos utilizados.
- El sistema descuenta del stock la cantidad efectivamente usada.
- El sistema impide registrar una salida mayor al stock disponible.
- La orden de trabajo conserva el detalle de los repuestos consumidos y sus cantidades.

Acceptance Criteria:
- Desde una orden de trabajo se pueden asociar uno o mas repuestos utilizados.
- El sistema descuenta del stock la cantidad efectivamente usada.
- El sistema impide registrar una salida mayor al stock disponible.
- La orden de trabajo conserva el detalle de los repuestos consumidos y sus cantidades.

### MOS-87 - Ajustar stock manualmente
- Status: Tareas por hacer
- Type: Historia
- Priority: Medium
- Assignee: Ignacio Benegas
- Jira: https://uandresbello-team-bg7iosbc.atlassian.net/browse/MOS-87

Description:
Como administrador, quiero ajustar manualmente el stock de un repuesto, para corregir diferencias entre inventario fisico y sistema.
Acceptance Criteria:
- El sistema permite aumentar o disminuir manualmente el stock de un repuesto existente.
- El ajuste queda registrado con fecha, cantidad y razon o comentario.
- El stock final se actualiza correctamente luego del ajuste.
- Solo usuarios autorizados pueden realizar ajustes manuales.

Acceptance Criteria:
- El sistema permite aumentar o disminuir manualmente el stock de un repuesto existente.
- El ajuste queda registrado con fecha, cantidad y razon o comentario.
- El stock final se actualiza correctamente luego del ajuste.
- Solo usuarios autorizados pueden realizar ajustes manuales.

### MOS-86 - Consultar stock disponible y stock bajo
- Status: Tareas por hacer
- Type: Historia
- Priority: Medium
- Assignee: Carlos Gonzalez
- Jira: https://uandresbello-team-bg7iosbc.atlassian.net/browse/MOS-86

Description:
Como administrador o mecanico, quiero visualizar el stock actual de los repuestos, para saber que materiales hay disponibles antes de ejecutar un trabajo.
Acceptance Criteria:
- El sistema muestra nombre, codigo o referencia, stock actual y stock minimo por repuesto.
- La vista permite identificar rapidamente repuestos con stock bajo.
- La informacion mostrada corresponde al stock actualizado despues de ingresos y consumos.
- El listado de inventario se puede consultar sin modificar los registros.

Acceptance Criteria:
- El sistema muestra nombre, codigo o referencia, stock actual y stock minimo por repuesto.
- La vista permite identificar rapidamente repuestos con stock bajo.
- La informacion mostrada corresponde al stock actualizado despues de ingresos y consumos.
- El listado de inventario se puede consultar sin modificar los registros.

### MOS-63 - Crear orden de trabajo desde presupuesto aprobado
- Status: Tareas por hacer
- Type: Historia
- Priority: Medium
- Assignee: Carlos Gonzalez
- Jira: https://uandresbello-team-bg7iosbc.atlassian.net/browse/MOS-63

Description:
Como supervisor o mecanico, quiero crear una orden de trabajo desde un presupuesto aprobado, para iniciar la ejecucion sin duplicar datos.

Acceptance Criteria:
- Solo un presupuesto aprobado puede convertirse en OT.
- La OT reutiliza cliente, vehiculo y datos relevantes del presupuesto.
- El sistema evita crear multiples OT activas desde el mismo presupuesto sin una regla explicita.
- La relacion entre presupuesto y OT queda persistida.

Acceptance Criteria:
- Solo un presupuesto aprobado puede convertirse en OT.
- La OT reutiliza cliente, vehiculo y datos relevantes del presupuesto.
- El sistema evita crear multiples OT activas desde el mismo presupuesto sin una regla explicita.
- La relacion entre presupuesto y OT queda persistida.

