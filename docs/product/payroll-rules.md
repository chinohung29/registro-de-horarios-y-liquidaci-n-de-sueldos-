# Reglas de liquidación

> **Pendiente de validación con un contador/legislación vigente.** Las reglas son configurables por empresa. No usar para liquidaciones reales hasta validar.

## Base: jornada trabajada
No hay sueldo mensual ni divisor de días fijo. Al crear la ficha del empleado se define su **monto por jornada** (ARS). La liquidación paga las jornadas efectivamente trabajadas en el período.

## Entradas (automáticas desde el perfil del empleado)
- `monto_jornada` de la ficha.
- Marcas válidas de ingreso/egreso del período.
- Turnos previstos (para detectar ausencias).
- Consumos aprobados.

## Definiciones
- **Jornada trabajada**: día con una marca válida de ingreso y su egreso correspondiente. Cuenta como 1 jornada, sin importar la cantidad de horas.
- **Jornada incompleta**: ingreso sin egreso. No se paga hasta que el administrador la resuelva (corrige la marca o la confirma/descarta) antes de confirmar la liquidación.
- **Ausencia**: día con turno previsto y sin jornada trabajada. Se registra como justificada o injustificada; no se paga en ningún caso, y se muestra en el recibo como dato informativo.

## Cálculo
```
jornadas_trabajadas = cantidad de jornadas completas en el período
bruto               = jornadas_trabajadas x monto_jornada
desc_cupones        = suma de consumos APROBADOS en el período
neto                = bruto - desc_cupones
```
Las ausencias no generan un descuento aparte: al pagarse por jornada trabajada, la jornada no trabajada simplemente no se paga.

Si el monto por jornada cambia, el nuevo valor rige desde su fecha de vigencia; las liquidaciones cerradas no se recalculan.

## Cupones y consumos
1. El administrador define (más adelante) productos y descuentos disponibles.
2. El empleado selecciona sus consumos durante el período (estado `pendiente`).
3. Al calcular la liquidación, el administrador ve la sumatoria, aprueba o rechaza cada consumo.
4. Solo los `aprobados` se descuentan. Al cerrar la liquidación pasan a `liquidado`.

## Estados de una liquidación
`borrador` → `confirmada` (inmutable, genera recibo). Los errores posteriores se corrigen con un ajuste en el período siguiente.
