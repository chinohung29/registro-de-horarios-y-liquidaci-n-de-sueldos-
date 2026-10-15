# Reglas de liquidación

> **Pendiente de validación con un contador/legislación vigente.** Las reglas son configurables por empresa. No usar para liquidaciones reales hasta validar.

## Base: jornada trabajada
No hay sueldo mensual ni divisor de días fijo. Al crear la ficha del empleado se define su **monto por jornada** (ARS). La liquidación paga las jornadas efectivamente trabajadas en el período.

## Entradas (automáticas desde el perfil del empleado)
- `monto_jornada` de la ficha.
- Marcas válidas de ingreso/egreso del período (las horas fichadas definen jornada, media jornada y extras).
- Turnos previstos (para detectar ausencias).
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
- **Ausencia**: día con turno previsto y sin jornada trabajada. Justificada o injustificada; no se paga en ningún caso y se muestra en el recibo como dato informativo.

## Cálculo
```
jornadas_pagas = suma de fracciones de jornada del período
valor_hora_extra = monto_jornada / horas_jornada x recargo
bruto_jornadas = jornadas_pagas x monto_jornada
bruto_extras   = suma(horas_extra_aprobadas x valor_hora_extra)
desc_cupones   = suma de consumos APROBADOS en el período
neto           = bruto_jornadas + bruto_extras - desc_cupones
```
Las horas extra quedan en estado `pendiente` hasta que el administrador las aprueba o rechaza al calcular la liquidación, igual que los consumos. Solo las aprobadas se pagan.

Si el monto por jornada cambia, el nuevo valor rige desde su fecha de vigencia; las liquidaciones cerradas no se recalculan.

## Cupones y consumos
1. El administrador define (más adelante) productos y descuentos disponibles.
2. El empleado selecciona sus consumos durante el período (estado `pendiente`).
3. Al calcular la liquidación, el administrador ve la sumatoria, aprueba o rechaza cada consumo.
4. Solo los `aprobados` se descuentan. Al cerrar la liquidación pasan a `liquidado`.

## Estados de una liquidación
`borrador` → `confirmada` (inmutable, genera recibo). Los errores posteriores se corrigen con un ajuste en el período siguiente.
