# Roles y pantallas

## Administrador (dueño de la empresa)
- **Marca propia**: espacio "Tu logo" arriba a la izquierda para subir el logo de la empresa. En PC la interfaz usa una paleta fija inspirada en hamburgueserías porteñas y sin negro (ver `docs/design/paleta-hamburgueserias.md`): la paleta de Mirana Burger tomada de su logo (fondo carbón, paneles hueso, acción naranja llama, selección rojo brasa, detalles en degradé de llama), con presets Frank's Grill, Mostaza y Smash. El modo oscuro (carbón profundo) existe solo en celulares (sigue al sistema o se elige a mano). Un menú sándwich (☰) global, arriba a la izquierda, reúne: un desplegable para elegir la vista (Administrador, Empleado, Pantalla del local), las secciones del administrador y la configuración de marca (paleta, tipografía, color). Panel **Marca** para elegir la tipografía y el color de acento de la empresa; la interfaz base usa grises suaves para que el branding se adapte sin chocar.
- **Locales**: listado de todas las sucursales con sus empleados, crear/editar (nombre, dirección, radio de geocerca de 50 a 300 m, activo/inactivo). **Asignar empleados**: lista de todos los empleados con su local actual; marcar a alguien de otro local lo cambia de local, desmarcar lo deja sin asignar. Incluye el cuadro **Ausentes hoy**: al abrirlo lista los empleados ausentes con su situación: ausencia autorizada (no descuenta la jornada), ausencia injustificada (descuenta la jornada) y franco o día libre.
- **Empleados**: alta con legajo automático. El formulario pide **nombre, apellido, documento (DNI, 7 u 8 dígitos), teléfono de contacto y correo electrónico** (obligatorios), más local asignado, puesto (desplegable: Mozo/a, Cocinero/a, Ayudante de cocina, Parrillero/a, Bachero/a, Barra / Bartender, Cajero/a, Encargado/a, Delivery, Limpieza, Otro) y monto por jornada. Documento y correo no se pueden repetir. El **correo será el usuario de acceso** del empleado a su interfaz (próxima edición). Edición de datos, filtro por local, asignación y reasignación a sucursal, baja. Habilitar a un empleado a fichar en otro local (con fecha desde/hasta y motivo).
- **Fichajes**: vista por local/día/empleado con turno, hora de ingreso y diferencia. Retraso o fuera de la tolerancia (10 min) en rojo; en horario en verde. Corrección manual con motivo (queda auditada).
- **Liquidación**: listado por empleado (jornadas, ausencias, horas extra, haberes, adelantos, consumos, cupones usados, neto). **Detalle** por empleado para aprobar horas extra, cargar/aprobar adelantos y consumos (n° de ticket y foto del ticket). **Ver recibos y PDF**: un PDF con el resumen igual al listado y todos los recibos. Confirmar y cerrar.
- **Cupones familiares**: códigos que generan los encargados para sus empleados; el administrador los autoriza (se activan) o rechaza, y marca como usado con el n° de ticket. 15% de descuento, 2 por empleado por mes, no se descuentan del sueldo.

## Encargado
Interfaz propia (vista "Encargado"):
- **Generador de códigos** de cupón familiar: elige un empleado de su local, incluido él mismo (ve cuántos cupones le quedan en el mes) y genera el código. Con las mismas condiciones para todos: después del segundo cupón del mes no deja generar otro; la cuenta se reinicia el día 1 de cada mes. El código queda inactivo hasta que lo autoriza el administrador. Botón para copiarlo.
- **Pedidos de su equipo**: los pedidos que hicieron los empleados desde el celular, con un botón para generar el código de cada uno.
- **Códigos del mes** de su local con su estado (pendiente, autorizado, usado, rechazado).
- **Su equipo** con los cupones usados por cada uno.
Sin acceso a sueldos. (Fase posterior: ver y corregir fichajes de su local.)

## Empleado
- **Fichar**: botón Ingreso/Egreso que abre la cámara, lee el QR y envía la ubicación.
- **Mis marcas**: historial y turnos del mes.
- **Mis consumos**: carga consumos con número de ticket, monto y foto; quedan pendientes hasta aprobación.
- **Mis cupones familiares**: pide el cupón al encargado, ve el estado (enviado al encargado, esperando autorización, listo para usar, usado) y el código cuando está activo (2 por mes).
- **Mi recibo**: el mismo recibo que el PDF (logo, nombre y apellido, detalle, recibí conforme).

## Pantalla del local
Vista a pantalla completa (tablet en el local) que muestra el QR vigente y su cuenta regresiva. Se autentica con un dispositivo registrado por el administrador.
