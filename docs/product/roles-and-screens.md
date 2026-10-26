# Roles y pantallas

## Administrador (dueño de la empresa)
- **Marca propia**: espacio "Tu logo" arriba a la izquierda para subir el logo de la empresa. En PC la interfaz usa una paleta fija inspirada en hamburgueserías porteñas y sin negro (ver `docs/design/paleta-hamburgueserias.md`): la paleta de Mirana Burger tomada de su logo (fondo carbón, paneles hueso, acción naranja llama, selección rojo brasa, detalles en degradé de llama), con presets Frank's Grill, Mostaza y Smash. El modo oscuro (carbón profundo) existe solo en celulares (sigue al sistema o se elige a mano). Un menú sándwich (☰) global, arriba a la izquierda, reúne: un desplegable para elegir la vista (Administrador, Empleado, Pantalla del local), las secciones del administrador y la configuración de marca (paleta, tipografía, color). Panel **Marca** para elegir la tipografía y el color de acento de la empresa; la interfaz base usa grises suaves para que el branding se adapte sin chocar.
- **Locales**: sucursales (Villa Crespo, Belgrano, Almagro "Turbo") y **centro de producción** (Villa Crespo), con sus empleados; crear/editar (nombre, dirección, radio de geocerca de 50 a 300 m, activo/inactivo). **Asignar empleados**: lista de todos los empleados con su local actual; marcar a alguien de otro local lo cambia de local, desmarcar lo deja sin asignar. Incluye el cuadro **Ausentes hoy**: al abrirlo lista los empleados ausentes con su situación: ausencia autorizada (no descuenta la jornada), ausencia injustificada (descuenta la jornada) y franco o día libre.
- **Archivo (36 meses)**: períodos cerrados con resumen, recibos, fichajes y adjuntos; filtro por año y tipo; descarga por período.
- **Vacaciones y aguinaldo**: tabla con fecha de ingreso, antigüedad, días, mejor remuneración editable, **casilla del índice INDEC**, base actualizada, montos y aprobación del administrador.
- **Empleados**: alta con legajo automático, **fecha de ingreso obligatoria**, **sueldo total mensual** (se muestran valor jornada, hora y bloque de 15 min), sucursal y **centro de costos**. El formulario pide **nombre, apellido, documento (DNI, 7 u 8 dígitos), teléfono de contacto y correo electrónico** (obligatorios), más local asignado, puesto (desplegable: Mozo/a, Cocinero/a, Ayudante de cocina, Parrillero/a, Bachero/a, Barra / Bartender, Cajero/a, Encargado/a, Delivery, Limpieza, Otro) y monto por jornada. Documento y correo no se pueden repetir. El **correo será el usuario de acceso** del empleado a su interfaz (próxima edición). Edición de datos, filtro por local, asignación y reasignación a sucursal, baja. Habilitar a un empleado a fichar en otro local (con fecha desde/hasta y motivo).
- **Fichajes**: vista por local/día/empleado con turno, hora de ingreso y diferencia. Retraso o fuera de la tolerancia (10 min) en rojo; en horario en verde. Corrección manual con motivo (queda auditada).
- **Liquidación quincenal** (1ª y 2ª quincena): listado por empleado (jornadas, ausencias, valor jornada, horas extra, atrasos, haberes, adelantos, consumos, neto) y costo por centro de costos. **Detalle** por empleado: horas extra, adelantos con tope y captura de la transferencia, consumos con el monto del ticket de Fudo, que ya incluye el 20 % (n° de ticket y foto). Solo el administrador aprueba consumos extra y descuentos. **Ver recibos y PDF**: un PDF con el resumen igual al listado y todos los recibos. Confirmar y cerrar.

## Encargado
Interfaz propia (vista "Encargado"), **solo lectura**:
- **Adelantos disponibles** de su local en la quincena: por empleado, jornadas trabajadas, devengado, tope, ya aprobado y disponible.
- **Pedidos de adelanto de su equipo** con su estado (pendiente o aprobado). **Solo el administrador aprueba los adelantos**; el encargado no aprueba ni modifica nada.
- Sin acceso a sueldos ni a consumos. (Fase posterior: ver y corregir fichajes de su local.)

## Empleado
- **Fichar**: botón Ingreso/Egreso que abre la cámara, lee el QR y envía la ubicación.
- **Mis marcas**: historial y turnos del mes.
- **Mis consumos**: carga consumos con número de ticket, monto y foto (el total del ticket ya trae el 20 % de descuento de empleado); quedan pendientes hasta que los apruebe el administrador.
- **Mis adelantos**: ve cuánto puede pedir (tope sobre las jornadas ya trabajadas en la quincena) y pide el adelanto; lo aprueba el administrador.
- **Mi recibo**: el mismo recibo que el PDF (logo, nombre y apellido, detalle, recibí conforme).

## Pantalla del local
Vista a pantalla completa (tablet en el local) que muestra el QR vigente y su cuenta regresiva. Se autentica con un dispositivo registrado por el administrador.
