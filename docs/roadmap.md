# Roadmap — Subproyecto RRHH

Cada fase termina con algo usable y probado.

1. **Base SaaS + PWA**: empresas, locales, usuarios, roles, login, instalación PWA, panel de administrador (ver/crear locales, asignar empleados).
2. **Fichaje**: pantalla QR del local (se renueva cada 15 s), escaneo del empleado, validación de geocerca, registro de ingreso/egreso.
3. **Legajos y turnos**: alta de empleado con legajo, asignación a sucursal, turnos derivados de las marcas.
4. **Liquidación quincenal**: cálculo automático desde el sueldo de la ficha (jornada = sueldo ÷ 26, hora = jornada ÷ 8, bloques de 15 min), atrasos y horas extra, ausencias, adelantos con tope, consumos con descuento de empleado, recibo y PDF.
5. **Consumos de empleados**: carga por el empleado (o desde Fudo), monto del ticket de Fudo (ya con el 20 % de descuento de empleado), aprobación del administrador al liquidar.

6. **Integración con Fudo — PRIORIDAD ALTA** (40–70 h; primero validar la API con una cuenta real, pedido en la reunión del 2026-10-26): lectura de consumos por cuenta corriente y personal; luego alta automática de clientes y sueldos/adelantos como gastos; luego cruces de ventas sin fichaje y propinas. Ver `docs/architecture/integracion-fudo.md`.

7. **Vacaciones y aguinaldo**: tabla propia con índice del INDEC, aprobada por el administrador (reglas en `docs/product/payroll-rules.md`).
8. **Archivo de 36 meses**: guarda resúmenes, recibos, fichajes y adjuntos de cada período; lo anterior pasa a archivo de largo plazo sin borrarse.

Fuera de alcance (otros subproyectos): POS, stock, compras, facturación.
