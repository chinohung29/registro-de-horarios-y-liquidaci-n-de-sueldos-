# Modelo de datos (borrador)

Multi-tenant por `empresa_id` en todas las tablas, aislado con Row Level Security de Postgres.

| Tabla | Campos principales |
|---|---|
| `empresas` | id, nombre, moneda, parametros_liquidacion (jsonb: divisor_dias = 26, horas_jornada = 8, bloque_min = 15, tolerancia_min = 10, recargo_extra, descuento_empleado_pct = 20, tope_adelanto_pct, cupones_familiares_mes = 2, porcentaje_cupon = 15) |
| `locales` | id, empresa_id, nombre, direccion, tipo (`sucursal` / `produccion`), lat, lng, radio_m, ip_red_local, qr_secret, activo, fudo_api_key / fudo_api_secret (cifrados) |
| `perfiles` | id (= auth.users), empresa_id, rol (`admin`/`encargado`/`empleado`), nombre |
| `empleados` | id, empresa_id, perfil_id, legajo, nombre, apellido, documento (único por empresa), telefono, email (único; será el usuario de acceso), puesto, **fecha_ingreso (obligatoria)**, **sueldo_total** (valor_jornada = sueldo / 26, valor_hora = jornada / 8, valor_15min = hora / 4; se calculan, no se guardan), local_id (sucursal donde ficha), **centro_costos_id** (local de tipo sucursal o producción; por defecto el mismo), horas_jornada (override opcional), activo |
| `sueldos` | id, empleado_id, sueldo_total, vigente_desde (historial; el vigente es el último con `vigente_desde <= fecha`) |
| `asignaciones` | id, empleado_id, local_id, desde, hasta |
| `habilitaciones_local` | id, empleado_id, local_id, desde, hasta, motivo, habilitada_por (permite fichar en un local distinto del asignado) |
| `turnos_previstos` | id, empleado_id, local_id, fecha, hora_desde, hora_hasta |
| `marcas` | id, empleado_id, local_id, tipo (`ingreso`/`egreso`), ts, lat, lng, accuracy_m, slot, valida, motivo_rechazo, corregida_por |
| `jornadas` | id, empleado_id, local_id, fecha, ingreso_ts, egreso_ts, horas, fraccion (1 / 0.5 / null=revisar), horas_extra, extra_especial, estado_extra (`pendiente`/`aprobado`/`rechazado`), ajustada_por, motivo_ajuste |
| `ausencias` | id, empleado_id, fecha, tipo (`autorizada`/`injustificada`/`franco`), motivo, cargada_por |
| `adelantos` | id, empleado_id, fecha, quincena, monto, motivo, **comprobante_transferencia_url**, estado (`pendiente`/`aprobado`/`rechazado`/`liquidado`), solicitado_por, aprobado_por. Tope validado en servidor: % de lo devengado por las jornadas trabajadas de la quincena |
| `consumos` | id, empleado_id, fecha, ticket_numero (único por empresa, del sistema de facturación externo), monto, descuento_empleado (bool, 20 %), monto_a_descontar, foto_ticket_url, origen (`fudo` / `manual`), estado (`pendiente`/`aprobado`/`rechazado`/`liquidado`), cargado_por, **aprobado_por (solo administrador)** |
| `cupones_familiares` | id, empresa_id, empleado_id, periodo, pedido_por (encargado), estado (`pedido`/`pendiente`/`autorizado`/`usado`/`rechazado`/`vencido`), codigo (único, lo genera el encargado; inactivo hasta autorizar), generado_por, autorizado_por, autorizado_en, ticket_numero (al usarse). Máximo 2 autorizados por empleado y período; no impacta en la liquidación |
| `liquidaciones` | id, empresa_id, periodo (`2026-10`), **quincena (1 o 2)**, estado, creada_por |
| `liquidacion_items` | id, liquidacion_id, empleado_id, jornadas_pagas, monto_jornada, jornadas_autorizadas, jornadas_injustificadas, horas_extra_bloques, atraso_min, atraso_bloques, haberes, desc_atrasos, desc_adelantos, desc_consumos, neto, centro_costos_id, recibo_pdf_url |
| `vacaciones_aguinaldo` | id, empresa_id, empleado_id, tipo (`vacaciones` / `aguinaldo`), fecha_corte, mejor_remuneracion, indice_indec_pct, indice_indec_mes, base_actualizada, dias_vacaciones, proporcion_semestre, monto, estado (`borrador`/`aprobado`/`confirmado`), aprobado_por (administrador) |
| `archivo_periodos` | id, empresa_id, periodo, tipo (`quincena` / `aguinaldo`), cerrado_en, resumen_pdf_url, recibos_zip_url, fichajes_url, adjuntos (tickets y comprobantes), tamano_bytes, archivado_largo_plazo (bool; pasa a `true` a los 36 meses, sin borrar) |
| `liquidacion_lineas` | id, item_id, concepto, monto (extensible a aportes) |

## RLS
- Toda fila se filtra por `empresa_id = (select empresa_id from perfiles where id = auth.uid())`.
- `empleado` solo lee/escribe lo suyo; `admin` todo lo de su empresa.
- La inserción de `marcas` se hace solo desde la función de servidor que valida QR y geocerca (no directamente desde el cliente).
