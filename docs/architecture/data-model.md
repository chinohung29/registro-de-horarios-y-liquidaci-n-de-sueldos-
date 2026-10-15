# Modelo de datos (borrador)

Multi-tenant por `empresa_id` en todas las tablas, aislado con Row Level Security de Postgres.

| Tabla | Campos principales |
|---|---|
| `empresas` | id, nombre, moneda, parametros_liquidacion (jsonb: horas_jornada, horas_media_jornada, tolerancia_min, recargos) |
| `locales` | id, empresa_id, nombre, direccion, lat, lng, radio_m, qr_secret, activo |
| `perfiles` | id (= auth.users), empresa_id, rol (`admin`/`encargado`/`empleado`), nombre |
| `empleados` | id, empresa_id, perfil_id, legajo, documento, fecha_ingreso, horas_jornada (override opcional), activo |
| `montos_jornada` | id, empleado_id, monto, vigente_desde (historial; el vigente es el último con `vigente_desde <= fecha`) |
| `asignaciones` | id, empleado_id, local_id, desde, hasta |
| `habilitaciones_local` | id, empleado_id, local_id, desde, hasta, motivo, habilitada_por (permite fichar en un local distinto del asignado) |
| `turnos_previstos` | id, empleado_id, local_id, fecha, hora_desde, hora_hasta |
| `marcas` | id, empleado_id, local_id, tipo (`ingreso`/`egreso`), ts, lat, lng, accuracy_m, slot, valida, motivo_rechazo, corregida_por |
| `jornadas` | id, empleado_id, local_id, fecha, ingreso_ts, egreso_ts, horas, fraccion (1 / 0.5 / null=revisar), horas_extra, extra_especial, estado_extra (`pendiente`/`aprobado`/`rechazado`), ajustada_por, motivo_ajuste |
| `ausencias` | id, empleado_id, fecha, justificada, motivo, cargada_por |
| `consumos` | id, empleado_id, fecha, descripcion, monto, estado (`pendiente`/`aprobado`/`rechazado`/`liquidado`) |
| `liquidaciones` | id, empresa_id, periodo, estado, creada_por |
| `liquidacion_items` | id, liquidacion_id, empleado_id, jornadas_pagas, monto_jornada, jornadas_ausentes, horas_extra, bruto_jornadas, bruto_extras, desc_cupones, neto |
| `liquidacion_lineas` | id, item_id, concepto, monto (extensible a aportes) |

## RLS
- Toda fila se filtra por `empresa_id = (select empresa_id from perfiles where id = auth.uid())`.
- `empleado` solo lee/escribe lo suyo; `admin` todo lo de su empresa.
- La inserción de `marcas` se hace solo desde la función de servidor que valida QR y geocerca (no directamente desde el cliente).
