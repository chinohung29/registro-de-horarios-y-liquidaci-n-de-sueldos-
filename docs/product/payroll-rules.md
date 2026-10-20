# Reglas de liquidación

> **Pendiente de validación con un contador/legislación vigente.** Las reglas son configurables por empresa. No usar para liquidaciones reales hasta validar.

## Base: jornada trabajada
No hay sueldo mensual ni divisor de días fijo. Al crear la ficha del empleado se define su **monto por jornada** (ARS). La liquidación paga las jornadas efectivamente trabajadas en el período.

## Entradas (automáticas desde el perfil del empleado)
- `monto_jornada` de la ficha.
- Marcas válidas de ingreso/egreso del período (las horas fichadas definen jornada, media jornada y extras).
- Turnos previstos (para detectar ausencias y medir el retraso del ingreso).
- Consumos aprobados.

## Parámetros de la empresa (configurables)
| Parámetro | Valor inicial propuesto |
|---|---|
| `horas_jornada` (horas de una jornada completa) | 8 |
| `horas_media_jornada` (mínimo para contar media jornada) | 4 |
| `tolerancia_min` (minutos sin penalizar al borde de un umbral) | 10 |
| `recargo_extra` (multiplicador de hora extra normal) | 1.5 |
| `recargo_extra_especial` (domingos/feriados) | 2.0 |
| Aprobación de horas extra | requerida por el administrador |

Cada empleado puede tener un override de `horas_jornada` en su ficha (p. ej. cocina 9 h, salón 6 h).

## Definiciones
- **Jornada**: ingreso válido más su egreso, en un mismo día.
- **Fracción de jornada** según las horas fichadas (`h`):
  - `h >= horas_jornada - tolerancia` → **1 jornada**.
  - `horas_media_jornada - tolerancia <= h < horas_jornada - tolerancia` → **0,5 jornada**.
  - `h < horas_media_jornada - tolerancia` → **jornada corta**: no se paga automáticamente; el administrador decide (0,5, 1 o 0) al liquidar.
- **Horas extra**: horas fichadas por encima de `horas_jornada` (solo si la fracción es 1). Se redondean a bloques de 15 min.
- **Ajuste manual**: el administrador puede forzar la fracción de una jornada o las horas extra de un día, con motivo; queda auditado.
- **Jornada incompleta**: ingreso sin egreso. No se paga hasta que el administrador la resuelva (corrige la marca o la descarta) antes de confirmar.
- **Ausencia**: día con turno previsto y sin jornada trabajada. Tiene un tipo:
  - **Autorizada**: el administrador la autoriza. **Se paga la jornada** (no se descuenta).
  - **Injustificada**: **no se paga la jornada** (se descuenta). Es el tipo por defecto cuando no hay marca ni autorización.
  - **Franco / día libre**: no es una ausencia. No se descuenta ni cuenta como ausente.
  No hay penalización adicional en ningún caso. El recibo muestra cada tipo por separado.

## Cálculo
```
jornadas_pagas   = suma de fracciones de jornada trabajadas + ausencias autorizadas
valor_hora_extra = monto_jornada / horas_jornada x recargo
haberes          = jornadas_pagas x monto_jornada + horas_extra_aprobadas x valor_hora_extra
desc_adelantos   = suma de adelantos APROBADOS del período
desc_consumos    = suma de consumos APROBADOS del período (con cupón familiar: monto x (1 - %cupón))
neto             = haberes - desc_adelantos - desc_consumos
```
La ausencia injustificada no genera un descuento aparte: esa jornada simplemente no se paga. La ausencia autorizada se paga como una jornada completa.

Las horas extra, los adelantos y los consumos quedan en estado `pendiente` hasta que el administrador los aprueba o rechaza en el detalle de cada empleado. Solo los aprobados se liquidan.

Si el monto por jornada cambia, el nuevo valor rige desde su fecha de vigencia; las liquidaciones cerradas no se recalculan.

## Adelantos
- El empleado solicita un adelanto (monto y motivo) o el administrador lo carga.
- El administrador lo aprueba en el detalle de la liquidación; el aprobado se descuenta del neto del período.

## Consumos del empleado
- Cada consumo es un ítem individual (no una suma global) y va **contra el ticket emitido por el sistema de facturación externo**: se registra el número de ticket, la fecha y el monto.
- Se puede **adjuntar una foto del ticket** como respaldo.
- El número de ticket no puede repetirse.
- El empleado puede cargar sus consumos desde el celular (quedan pendientes); el administrador los aprueba al liquidar.

## Cupón familiar
- Cada empleado tiene **2 cupones por mes** para descuentos en consumos de familiares.
- El cupón se aplica a un consumo y descuenta un porcentaje configurable por empresa (valor inicial propuesto: 20%; a confirmar).
- El sistema no permite marcar un tercer cupón en el mismo mes. Lo que no se usa no se acumula.
- El recibo muestra cuántos cupones se usaron y el ahorro.

## Recibo de haberes
Uno por empleado, con:
- Logo de la empresa centrado arriba, nombre de la empresa y período.
- **Nombre y apellido** del empleado, legajo, DNI, puesto, local y monto por jornada.
- Detalle: jornadas trabajadas, ausencias autorizadas, horas extra, total haberes; cada adelanto y cada consumo (con número de ticket y cupón, si corresponde), total descuentos y **neto a cobrar**.
- Dato informativo: ausencias injustificadas y cupones usados.
- Renglón **"Recibí conforme"** con espacios para firma, aclaración y fecha.

## PDF para el administrador
Un único PDF por liquidación: primera hoja con el **resumen igual al listado** (todos los empleados y totales) y, a continuación, **todos los recibos**, uno por hoja. El empleado ve su propio recibo desde el celular.

## Estados de una liquidación
`borrador` → `confirmada` (inmutable, genera recibo). Los errores posteriores se corrigen con un ajuste en el período siguiente.
