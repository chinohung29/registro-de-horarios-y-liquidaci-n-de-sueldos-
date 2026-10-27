# ERP Gastronómico — Módulo RRHH: diseño

Fecha: 2026-10-15 · Estado: **listo para revisión**

## 1. Objetivo
PWA SaaS multi-local donde el personal registra ingreso y egreso de su jornada mediante un QR que cambia cada 15 segundos y validación de ubicación, con legajos de empleado y liquidación quincenal automática de sueldos (adelantos, consumos con descuento de empleado, atrasos y horas extra en bloques de 15 minutos), vacaciones y aguinaldo por separado, y archivo de 36 meses. Estilo y funcionalidad de referencia: Naaloo.

## 2. Decisiones acordadas con el usuario
- **Administrador:** ve todos los locales, crea nuevos y asigna empleados a cada sucursal.
- **Fichaje:** QR que se renueva cada **15 segundos** (cambio de la reunión del 2026-10-26) + geolocalización del dispositivo.
- **Legajos:** se arman previamente con el alta del empleado. Los turnos se derivan del ingreso y egreso fichados.
- **Liquidación:** se paga por **jornada trabajada**, no por un divisor de días fijo. El monto por jornada se define al crear la ficha del empleado. Las ausencias y la liquidación se calculan automáticamente desde el perfil.
- **Consumos:** los consumos de empleados (contra el ticket de Fudo) traen el **descuento de empleado del 20 % ya aplicado en el ticket de Fudo**: el sistema toma el total del ticket tal cual y **no descuenta otro 20 %**. Sin límite en el mes; los aprueba solo el administrador al liquidar. **Se eliminaron los cupones familiares** (decisión del 2026-10-26).
- **Alcance inicial:** opción A, solo RRHH. Sin POS, stock ni facturación.

## 3. Supuestos a confirmar
- Mercado Argentina, moneda ARS, español rioplatense.
- Naaloo se usa como referencia pública de estilo (no hay acceso a su interfaz): navegación lateral por módulos, panel de resumen, tablas con filtros.
- Una jornada es un ingreso más su egreso. Según las horas fichadas cuenta como 1 jornada, media jornada o jornada corta a resolver por el administrador, y las horas sobre `horas_jornada` son horas extra con recargo que el administrador aprueba al liquidar (ver `docs/product/payroll-rules.md`). La ausencia injustificada no se paga y no genera un descuento aparte; la autorizada se paga.
- Valores iniciales confirmados: jornada 8 h, media jornada desde 4 h, recargo extra 1,5 (2,0 domingos/feriados). Son configurables por empresa.
- **Ausencias:** tres situaciones. Autorizada (se paga la jornada), injustificada (se descuenta la jornada) y franco o día libre (no es ausencia). No hay penalización adicional.
- **Local de fichaje:** el empleado ficha solo en su local asignado. El administrador puede habilitarlo temporalmente en otros locales (ver `habilitaciones_local` en el modelo de datos).
- Las reglas necesitan validación contable.

## 4. Arquitectura propuesta
- **Frontend + servidor:** Next.js (App Router) como PWA instalable (manifest + service worker), una sola app en `apps/web`.
- **Backend de datos:** Supabase (Postgres, Auth, Row Level Security). Multi-tenant por `empresa_id`.
- **Lógica sensible en servidor:** validación de QR/geocerca y creación de marcas, y cálculo de liquidación, en route handlers o funciones de servidor; el cliente nunca escribe marcas directamente.
- **Offline:** la app abre sin conexión, pero fichar exige conexión (el QR y la ubicación se validan en servidor).

Se descartó un monorepo con API separada: agrega complejidad sin beneficio hoy (YAGNI).

## 5. Componentes
| Componente | Función | Depende de |
|---|---|---|
| Auth y roles | Login, rol admin/encargado/empleado | Supabase Auth |
| Locales | CRUD de sucursales, geocerca, dispositivo de pantalla | Datos |
| Empleados y legajos | Alta, asignación a local | Locales |
| Pantalla QR del local | Muestra QR vigente con cuenta regresiva | Locales |
| Fichaje | Escaneo, geolocalización, validación, marcas | QR, Locales, Empleados |
| Ausencias | Detección automática y justificación | Marcas, Turnos |
| Consumos | Carga del empleado, aprobación del admin | Empleados |
| Liquidación | Cálculo, revisión, cierre, comprobante interno (solo administrador) | Todo lo anterior |

Detalle: [fichaje](../../architecture/qr-geofence.md), [datos](../../architecture/data-model.md), [liquidación](../../product/payroll-rules.md), [roles y pantallas](../../product/roles-and-screens.md).

## 6. Flujo de datos del fichaje
1. La pantalla del local genera el QR firmado cada 15 s, sin internet.
2. El empleado escanea, el celular lee su ubicación y envía token + coordenadas.
3. El servidor valida usuario, QR, geocerca y alternancia ingreso/egreso, y guarda la marca (válida o rechazada con motivo).
4. Al cerrar el período, la liquidación lee marcas, ausencias y consumos aprobados.

## 7. Manejo de errores
- GPS denegado, impreciso o fuera de radio: mensaje claro, no se registra marca válida (sí un intento rechazado).
- QR vencido: pedir re-escaneo.
- Sin conexión al fichar: no se encola; se informa que hay que reintentar.
- Liquidación confirmada es inmutable; los errores se corrigen con un ajuste en el período siguiente.

## 8. Pruebas
- Unitarias: distancia haversine, firma/ventana del QR, cálculo de liquidación (ausencias, atrasos y horas extra en bloques de 15 min, adelantos con tope, consumos con el monto del ticket de Fudo, sin segundo descuento).
- Integración: políticas RLS (un empleado o empresa no ve datos ajenos), flujo completo de marca.
- E2E: alta de local, alta de empleado, fichaje, liquidación y aprobación de adelantos y consumos.

## 8b. Integración con Fudo
Los consumos de empleados (cobrados en Fudo con el medio de pago "Cuenta corriente empleados"), el total de cada ticket (que ya incluye el descuento de empleado del 20 %) y la lista de personal se leen de la API pública de Fudo (Plan Pro). Al confirmar la liquidación, sueldos y adelantos se registran como gastos en Fudo. Los fichajes no pasan por Fudo. Detalle: [integración con Fudo](../../architecture/integracion-fudo.md).

## 8c. Decisiones de la reunión con Mirana (2026-10-26)
- **Prioridad máxima pendiente:** validar la conexión con la API de Fudo (consumos, liquidación y descuentos) con una cuenta real. Ver [integración con Fudo](../../architecture/integracion-fudo.md).
- **QR cada 15 segundos.**
- **Solo el administrador aprueba consumos extra y descuentos.** Descuento de empleado: **20 %, ya aplicado por Fudo en el ticket** (el sistema no lo vuelve a calcular), sin límite en el mes. **Cupones familiares eliminados** (solo queda el descuento de empleado). **El encargado ve los adelantos disponibles y los pedidos de su local, pero solo el administrador los aprueba.**
- **Liquidación quincenal** (1–15 y 16–fin de mes), separada de **vacaciones y aguinaldo** (tabla propia con casilla del índice del INDEC, aprobada por el administrador).
- **Adelantos**: tope = % de lo devengado por las jornadas realmente trabajadas; se puede adjuntar la captura de la transferencia.
- **Archivo** que guarda la información de hasta **36 meses** hacia atrás.
- **Sucursales reales de Mirana Burger** (Villa Crespo, Belgrano, Almagro "Turbo") y un **centro de producción en Villa Crespo**. El centro de costos no desvincula al empleado de su sucursal.
- **Legajo**: fecha de ingreso y sueldo total. Valor hora = sueldo ÷ 26 ÷ 8; pagos y descuentos adicionales en bloques de 15 min (valor hora ÷ 4).
Reglas completas: [reglas de liquidación](../../product/payroll-rules.md).

## 9. Fuera de alcance
POS, stock, compras, facturación, aportes y retenciones legales, app nativa, reconocimiento facial, catálogo de productos y descuentos.

- **Marca y tema:** logo personalizable de la empresa y modo día/oscuro.
- **Fichajes:** el panel marca en rojo el retraso o ingreso fuera de la tolerancia (10 min) y en verde el ingreso en horario.

## 10. Preguntas abiertas
1. ~~Descuento de empleado 20 %: ¿dónde se aplica?~~ **Resuelto (2026-10-26):** el ticket de Fudo ya sale con el 20 % aplicado; el sistema usa ese total. Falta confirmar con una cuenta real qué campo de la venta trae el total con descuento.
2. **Adelantos**: ¿qué porcentaje de lo devengado por las jornadas trabajadas? (el boceto usa 50 %).
3. **Atrasos**: ¿se descuentan en bloques de 15 min redondeando hacia arriba, con 10 min de tolerancia? ¿Y la salida anticipada?
4. **Horas extra**: ¿se mantiene el recargo de 1,5 (y 2,0 en domingos/feriados) o se pagan al valor hora simple?
5. **Consumos y adelantos por quincena**: se imputan a la quincena de su fecha (propuesta). Confirmar.
6. **Vacaciones y aguinaldo**: cómo se aplica el índice del INDEC y qué base se usa (mejor remuneración). Validar con el contador. ¿El índice es el IPC mensual o el acumulado?
7. **Archivo de 36 meses**: validar con el contador el plazo legal de conservación.
8. **Centro de producción**: dirección y ubicación para el fichaje; ¿los empleados de producción también ficham ahí con QR?
9. **Fudo**: confirmar Plan Pro, crear el medio de pago y los descuentos, y probar la API con una cuenta real.
10. ¿Los feriados se cargan en un calendario por empresa? (propuesta: sí).
