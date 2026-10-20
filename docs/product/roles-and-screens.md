# Roles y pantallas

## Administrador (dueño de la empresa)
- **Marca propia**: espacio "Tu logo" arriba a la izquierda para subir el logo de la empresa. En PC la interfaz usa una paleta fija inspirada en hamburgueserías porteñas y sin negro (ver `docs/design/paleta-hamburgueserias.md`): en prueba la paleta de Frank's Grill (fondo azul suavizado, paneles color hueso, texto azul marino, acción rosa, selección azul medio, alertas en rojo), con presets Mostaza y Smash. El modo oscuro (azul noche) existe solo en celulares (sigue al sistema o se elige a mano). Un menú sándwich (☰) global, arriba a la izquierda, reúne: un desplegable para elegir la vista (Administrador, Empleado, Pantalla del local), las secciones del administrador y la configuración de marca (paleta, tipografía, color). Panel **Marca** para elegir la tipografía y el color de acento de la empresa; la interfaz base usa grises suaves para que el branding se adapte sin chocar.
- **Locales**: listado de todas las sucursales, crear/editar (nombre, dirección, coordenadas y radio de geocerca), activar/desactivar. Incluye el cuadro **Ausentes hoy**: al abrirlo lista los empleados ausentes con su situación: ausencia autorizada (no descuenta la jornada), ausencia injustificada (descuenta la jornada) y franco o día libre.
- **Empleados**: alta con legajo y monto por jornada, asignación y reasignación a sucursal, baja. Habilitar a un empleado a fichar en otro local (con fecha desde/hasta y motivo).
- **Fichajes**: vista por local/día/empleado con turno, hora de ingreso y diferencia. Retraso o fuera de la tolerancia (10 min) en rojo; en horario en verde. Corrección manual con motivo (queda auditada).
- **Liquidación**: elegir período, ver cálculo por empleado, revisar y aprobar cupones, confirmar y cerrar.
- **Cupones**: bandeja de consumos cargados por empleados (pendientes de aprobación).

## Encargado (opcional, fase posterior)
Ve y corrige fichajes solo de su local. Sin acceso a sueldos.

## Empleado
- **Fichar**: botón Ingreso/Egreso que abre la cámara, lee el QR y envía la ubicación.
- **Mis marcas**: historial y turnos del mes.
- **Mis consumos**: selecciona consumos/cupones del mes (pendientes hasta aprobación).
- **Mi recibo**: recibo de liquidaciones cerradas.

## Pantalla del local
Vista a pantalla completa (tablet en el local) que muestra el QR vigente y su cuenta regresiva. Se autentica con un dispositivo registrado por el administrador.
