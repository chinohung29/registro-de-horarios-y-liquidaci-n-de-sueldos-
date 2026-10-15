# Reglas de liquidación

> **Pendiente de validación con un contador/legislación vigente.** Los valores por defecto asumen Argentina (convenio gastronómico) pero todo parámetro es configurable por empresa. No usar para liquidaciones reales hasta validar.

## Entradas (automáticas desde el perfil del empleado)
- Tipo de pago: `mensual` u `hora`.
- Sueldo básico o valor hora.
- Turnos previstos y marcas de ingreso/egreso del período.
- Ausencias (justificadas / injustificadas).

## Cálculo
```
bruto            = sueldo básico  (mensual)  |  horas trabajadas x valor hora
valor_dia        = sueldo básico / 30        (configurable)
desc_ausencias   = valor_dia x días_ausencia_injustificada
desc_cupones     = suma de consumos APROBADOS en el período
neto             = bruto - desc_ausencias - desc_cupones
```
- Ausencia = día con turno previsto sin marca de ingreso, no justificado por el administrador.
- Retenciones legales y aportes: fase posterior; el modelo deja un concepto de `liquidacion_linea` extensible.

## Cupones y consumos
1. El administrador define (más adelante) productos y descuentos disponibles.
2. El empleado selecciona sus consumos durante el mes (estado `pendiente`).
3. Al calcular la liquidación, el administrador ve la sumatoria, aprueba o rechaza cada consumo.
4. Solo los `aprobados` se descuentan. Al cerrar la liquidación quedan en estado `liquidado`.

## Estados de una liquidación
`borrador` → `confirmada` (inmutable, genera recibo). Cualquier corrección posterior se hace con un ajuste en el período siguiente.
