# Modelo de datos (borrador)

Multi-tenant por `empresa_id` en todas las tablas, aislado con Row Level Security de Postgres.

| Tabla | Campos principales |
|---|---|
| `empresas` | id, nombre, moneda, parametros_liquidacion (jsonb) |
| `locales` | id, empresa_id, nombre, direccion, lat, lng, radio_m, qr_secret, activo |
| `perfiles` | id (= auth.users), empresa_id, rol (`admin`/`encargado`/`empleado`), nombre |
| `empleados` | id, empresa_id, perfil_id, legajo, documento, fecha_ingreso, activo |
| `montos_jornada` | id, empleado_id, monto, vigente_desde (historial; el vigente es el último con `vigente_desde <= fecha`) |
| `asignaciones` | id, empleado_id, local_id, desde, hasta |
| `turnos_previstos` | id, empleado_id, local_id, fecha, hora_desde, hora_hasta |
| `marcas` | id, empleado_id, local_id, tipo (`ingreso`/`egreso`), ts, lat, lng, accuracy_m, slot, valida, motivo_rechazo, corregida_por |
| `ausencias` | id, empleado_id, fecha, justificada, motivo, cargada_por |
| `consumos` | id, empleado_id, fecha, descripcion, monto, estado (`pendiente`/`aprobado`/`rechazado`/`liquidado`) |
| `liquidaciones` | id, empresa_id, periodo, estado, creada_por |
| `liquidacion_items` | id, liquidacion_id, empleado_id, jornadas_trabajadas, monto_jornada, jornadas_ausentes, bruto, desc_cupones, neto |
| `liquidacion_lineas` | id, item_id, concepto, monto (extensible a aportes) |

## RLS
- Toda fila se filtra por `empresa_id = (select empresa_id from perfiles where id = auth.uid())`.
- `empleado` solo lee/escribe lo suyo; `admin` todo lo de su empresa.
- La inserción de `marcas` se hace solo desde la función de servidor que valida QR y geocerca (no directamente desde el cliente).
