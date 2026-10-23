# ERP Gastronómico — Módulo RRHH: diseño

Fecha: 2026-10-15 · Estado: **listo para revisión**

## 1. Objetivo
PWA SaaS multi-local donde el personal registra ingreso y egreso de su jornada mediante un QR que cambia cada 2 minutos y validación de ubicación, con legajos de empleado y liquidación mensual automática de sueldos (descuentos por ausencias y por consumos/cupones de empleados). Estilo y funcionalidad de referencia: Naaloo.

## 2. Decisiones acordadas con el usuario
- **Administrador:** ve todos los locales, crea nuevos y asigna empleados a cada sucursal.
- **Fichaje:** QR que se renueva cada 2 minutos + geolocalización del dispositivo.
- **Legajos:** se arman previamente con el alta del empleado. Los turnos se derivan del ingreso y egreso fichados.
- **Liquidación:** se paga por **jornada trabajada**, no por un divisor de días fijo. El monto por jornada se define al crear la ficha del empleado. Las ausencias y la liquidación se calculan automáticamente desde el perfil.
- **Cupones:** el empleado selecciona sus consumos; el administrador aprueba y confirma la sumatoria al calcular la liquidación. El catálogo de productos y descuentos se define más adelante.
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
| Liquidación | Cálculo, revisión, cierre, recibo | Todo lo anterior |

Detalle: [fichaje](../../architecture/qr-geofence.md), [datos](../../architecture/data-model.md), [liquidación](../../product/payroll-rules.md), [roles y pantallas](../../product/roles-and-screens.md).

## 6. Flujo de datos del fichaje
1. La pantalla del local pide un QR firmado al servidor cada 120 s.
2. El empleado escanea, el celular lee su ubicación y envía token + coordenadas.
3. El servidor valida usuario, QR, geocerca y alternancia ingreso/egreso, y guarda la marca (válida o rechazada con motivo).
4. Al cerrar el período, la liquidación lee marcas, ausencias y consumos aprobados.

## 7. Manejo de errores
- GPS denegado, impreciso o fuera de radio: mensaje claro, no se registra marca válida (sí un intento rechazado).
- QR vencido: pedir re-escaneo.
- Sin conexión al fichar: no se encola; se informa que hay que reintentar.
- Liquidación confirmada es inmutable; los errores se corrigen con un ajuste en el período siguiente.

## 8. Pruebas
- Unitarias: distancia haversine, firma/ventana del QR, cálculo de liquidación (casos de ausencias, cupones, mensual/por hora).
- Integración: políticas RLS (un empleado o empresa no ve datos ajenos), flujo completo de marca.
- E2E: alta de local, alta de empleado, fichaje, liquidación y aprobación de cupones.

## 8b. Integración con Fudo
Los consumos de empleados (cobrados en Fudo con el medio de pago "Cuenta corriente empleados"), el uso de cupones familiares (descuento "Cupón familiar 15%" + código en el comentario de la venta) y la lista de personal se leen de la API pública de Fudo (Plan Pro). Al confirmar la liquidación, sueldos y adelantos se registran como gastos en Fudo. Los fichajes no pasan por Fudo. Detalle: [integración con Fudo](../../architecture/integracion-fudo.md).

## 9. Fuera de alcance
POS, stock, compras, facturación, aportes y retenciones legales, app nativa, reconocimiento facial, catálogo de productos y descuentos.

- **Marca y tema:** logo personalizable de la empresa y modo día/oscuro.
- **Fichajes:** el panel marca en rojo el retraso o ingreso fuera de la tolerancia (10 min) y en verde el ingreso en horario.

## 10. Preguntas abiertas
1. ¿Validamos las reglas de liquidación con un contador antes de la fase 4? (recomendado)
2. ¿Los feriados se cargan en un calendario por empresa? (propuesta: sí, lo carga el administrador)
3. ¿Hace falta el rol encargado en la primera versión? (propuesta: no; hoy "administrador del local" se resuelve con el rol administrador)
4. Capturas o referencias de Naaloo para ajustar el estilo, si están disponibles.
5. ¿El franco o día libre se paga? Hoy el modelo no lo paga ni lo descuenta (se paga solo lo trabajado y lo autorizado).
