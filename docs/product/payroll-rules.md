# Reglas de liquidación

Actualizado: 2026-10-26, a partir de la reunión con Mirana Burger.

> **Pendiente de validación con un contador/legislación vigente.** Las reglas son configurables por empresa. No usar para liquidaciones reales hasta validar.

## Estructura: tres cálculos separados
| Cálculo | Período | Qué incluye |
|---|---|---|
| **Liquidación quincenal** | 1ª quincena (días 1 al 15) y 2ª quincena (16 a fin de mes) | Jornadas, ausencias, horas extra, atrasos, adelantos, consumos |
| **Vacaciones y aguinaldo** | Por evento (vacaciones) y junio/diciembre (aguinaldo) | Tabla propia, con índice INDEC, aprobada por el administrador |
| **Archivo histórico** | 36 meses hacia atrás | Resúmenes, comprobantes, fichajes y adjuntos de cada período cerrado |

Adelantos y consumos se imputan a la **quincena de su fecha**.

## Legajo del empleado (datos que alimentan el cálculo)
- **Fecha de ingreso** (obligatoria): define antigüedad, vacaciones y proporción del aguinaldo.
- **Sueldo total mensual**: es la base del cálculo. Todo lo demás se deriva de acá.
- **Sucursal** (donde ficha) y **centro de costos** (a qué costo se imputa el sueldo; por defecto es la misma sucursal).

## Valor jornada, valor hora y bloque de 15 minutos
```
valor_jornada = sueldo_total / 26
valor_hora    = valor_jornada / 8
valor_15min   = valor_hora / 4          (base de cálculo para pagos y descuentos)
```
Ejemplo: sueldo $988.000 → jornada $38.000 → hora $4.750 → 15 min $1.187,50.

## Parámetros de la empresa (configurables)
| Parámetro | Valor inicial |
|---|---|
| `divisor_dias` | 26 |
| `horas_jornada` | 8 (override por empleado, p. ej. cocina 9 h, salón 6 h) |
| `bloque_min` | 15 |
| `tolerancia_min` (atrasos) | 10 |
| `recargo_extra` | 1,5 (domingos/feriados: 2,0), **a confirmar** |
| `descuento_empleado_pct` | 20 %, **aplicado por Fudo en el ticket** (informativo: el sistema no lo vuelve a aplicar). Sin límite mensual |
| `tope_adelanto_pct` | 50 % de lo devengado, **a confirmar** |

## Definiciones
- **Jornada**: ingreso válido más su egreso, en un mismo día. Media jornada y jornada corta según las horas fichadas (≥ 8 h − tolerancia = 1; ≥ 4 h − tolerancia = 0,5; menos: lo decide el administrador).
- **Ausencia autorizada**: se **paga** la jornada. **Injustificada**: **no se paga**. **Franco / día libre**: no es ausencia.
- **Jornada incompleta** (ingreso sin egreso): no se paga hasta que el administrador la resuelve antes de confirmar.

### Atrasos y horas extra en bloques de 15 minutos
- **Atraso** (llegada tarde o salida anticipada): si supera la tolerancia de 10 min, se descuenta en bloques de 15 min, redondeando hacia arriba: `bloques = ceil(minutos / 15)`. Hasta 10 min no se descuenta. *Ejemplo: 14 min → 1 bloque; 30 min → 2 bloques.*
- **Horas extra**: se pagan por bloques de 15 min completos sobre la jornada: `bloques x valor_15min x recargo`. El administrador las aprueba.
- Regla del atraso (redondeo hacia arriba y tolerancia) y recargo: **a confirmar** con Mirana.

## Cálculo de la quincena
```
haberes     = (jornadas trabajadas + ausencias autorizadas) x valor_jornada
              + bloques_extra_aprobados x valor_15min x recargo
atrasos     = bloques_atraso x valor_15min
adelantos   = suma de adelantos APROBADOS de la quincena
consumos    = suma de consumos APROBADOS de la quincena (monto del ticket de Fudo, ya con el 20 % de descuento)
neto        = haberes - atrasos - adelantos - consumos
```
Las horas extra, los adelantos y los consumos quedan `pendientes` hasta que **el administrador** los aprueba. **Solo el administrador aprueba consumos extra y descuentos.** El encargado no aprueba nada de sueldos.

## Adelantos
- El empleado los pide desde su celular o el administrador los carga. **El encargado del local puede ver** los adelantos disponibles y los pedidos de su equipo, pero **solo el administrador los aprueba**.
- **Tope**: un porcentaje (propuesta: 50 %) de lo **devengado por las jornadas realmente trabajadas** en la quincena. El sistema no deja aprobar ni cargar un adelanto que supere lo disponible. *Ejemplo: 11,5 jornadas × $38.000 = $437.000 → tope $218.500.*
- Cada adelanto admite adjuntar la **captura del comprobante de la transferencia** realizada.
- Se descuenta del neto de la quincena en que se otorga.

## Consumos del empleado
- Cada consumo es un ítem individual que va **contra el ticket del sistema de facturación externo (Fudo)**: número de ticket, fecha, monto y foto opcional. El número de ticket no puede repetirse.
- **Descuento de empleado: 20 %**, **sin límite** de consumos en el mes. **El 20 % ya viene aplicado en el ticket de Fudo**: el monto del consumo es el total del ticket tal como lo informa Fudo y **se descuenta del sueldo sin restarle otro 20 %**.
- Los consumos extra y los descuentos los aprueba **solo el administrador**.
- Se cargan desde el celular (quedan pendientes), o llegan solos desde Fudo (ver [integración con Fudo](../architecture/integracion-fudo.md)).

## Cupones familiares: eliminados
En la reunión del 2026-10-26 se decidió **eliminar los cupones familiares**. El único descuento es el **descuento de empleado del 20 %** sobre los consumos propios, sin límite en el mes, y **lo aplica Fudo en el ticket**.

## Vacaciones y aguinaldo (tabla separada)
Se calculan por separado de la quincena, con datos del legajo, y **los aprueba el administrador**. Incluye una casilla con el **índice del INDEC (IPC) actualizado** y el mes al que corresponde.
```
base_actualizada = mejor_remuneración_mensual x (1 + indice_INDEC / 100)
vacaciones       = días_de_vacaciones x (base_actualizada / 25)
aguinaldo        = 50 % x base_actualizada x proporción_del_semestre_trabajado
```
- **Días de vacaciones** según antigüedad a la fecha de corte: hasta 5 años 14 días; hasta 10 años 21; hasta 20 años 28; más de 20 años 35. Si en el año trabajó menos de 6 meses: 1 día cada 20 días trabajados.
- **Mejor remuneración mensual**: por defecto el sueldo del legajo, editable por fila.
- **Aguinaldo**: 50 % de la mejor remuneración mensual del semestre, proporcional al tiempo trabajado en el semestre.
- Cómo se aplica el índice INDEC y la base de cálculo son **criterios a validar con el contador**; el índice cargado en el boceto es un valor de ejemplo.

## Comprobante interno de liquidación (no es un recibo oficial)
**Solo lo genera y lo ve el administrador.** El recibo oficial de sueldo se gestiona **de forma externa** al sistema; el empleado no recibe ni ve este comprobante. Es un documento de control, uno por empleado y por quincena, con el **logo centrado arriba**, nombre y apellido, legajo, DNI, puesto, fecha de ingreso, sucursal, centro de costos y valor hora. Detalle de haberes (jornadas, ausencias autorizadas, horas extra), descuentos (atrasos, cada adelanto con su comprobante, cada consumo con ticket; el monto ya incluye el 20 %), neto a cobrar, dato informativo de ausencias injustificadas y una leyenda que aclara que es un documento interno. **No lleva renglón de firma.**

## PDF para el administrador
Un PDF por liquidación: primera hoja con el **resumen igual al listado** (empleados, centro de costos, haberes, adelantos, consumos, neto, totales y **subtotal por centro de costos**) y a continuación **todos los comprobantes internos**, uno por hoja.

## Centros de costos
La empresa tiene sucursales (Villa Crespo, Belgrano, Almagro "Turbo") y un **centro de producción en Villa Crespo**. Un empleado puede fichar en su sucursal y pertenecer al **centro de costos** de producción: sigue ligado a su sucursal para fichar, pero su sueldo se imputa a producción. El resumen muestra el costo por centro de costos.

## Archivo histórico (36 meses)
Cada período cerrado guarda su resumen, comprobantes, fichajes y adjuntos (fotos de tickets y comprobantes). Se conservan **36 meses** hacia atrás y se pueden filtrar por año y tipo. Lo anterior pasa a un archivo de largo plazo y **no se borra sin autorización**. **A validar con el contador**: el plazo legal de conservación de la documentación laboral podría ser mayor que 36 meses.

## Estados
`borrador` → `confirmada` (inmutable; los errores posteriores se corrigen con un ajuste en la quincena siguiente). Vacaciones y aguinaldo: `borrador` → `confirmado` por fila aprobada.
