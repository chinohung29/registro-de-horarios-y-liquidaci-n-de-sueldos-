# Integración con Fudo

Fecha: 2026-10-23 (actualizado 2026-10-26) · Estado: **propuesta, pendiente de validar con una cuenta real**

> **PENDIENTE E IMPORTANTE** (reunión con Mirana, 2026-10-26): ver la funcionalidad y la conexión para enlazar ambas aplicaciones con **consumos, liquidación y descuentos**. Es la prioridad más alta de lo pendiente: lo primero es probar la API con una cuenta real de Fudo (Plan Pro) en modo solo lectura.

## Objetivo
Conectar el Sistema de fichajes con Fudo (sistema de gestión gastronómica del local) para que los **consumos de empleados**, el **uso de cupones familiares** y los **datos del personal** se carguen solos, y para que los **sueldos y adelantos** queden registrados como gastos en Fudo. Los **fichajes** no pasan por Fudo: los genera nuestro sistema.

## Qué ofrece Fudo
| Vía | Uso | Condición |
|---|---|---|
| **API pública de propósito general** | Leer y escribir datos de la cuenta | Solo **Plan Pro**. Se activa en *Aplicaciones externas → API Pública General* |
| Integración de pedidos externos | Ingresar pedidos de terceros | Requiere aprobación de Fudo. **No se usa** |
| Delivery Apps, Tu Delivery, Reservas, Fudo Pagos | Módulos propios | No aplican |

## API: datos técnicos
- **Versión:** `v1alpha1` (alfa: puede cambiar sin aviso). Especificación OpenAPI: `https://api.fu.do/v1alpha1/openapi.yml`. Documentación: https://dev.fu.do/api
- **URL base:** `https://api.fu.do/v1alpha1`
- **Autenticación:** usuario de API creado en Fudo (*Administración → Usuarios*) → `apiKey` + `apiSecret`. `POST https://auth.fu.do/api` con `{"apiKey","apiSecret"}` devuelve `{token, exp}`. El token dura **24 h** y se envía como `Authorization: Bearer <token>`. Lo que puede hacer depende del **rol** del usuario de API.
- **Formato:** JSON:API (`data.attributes`, `data.relationships`, `include`, `fields`).
- **Paginación:** `page[size]` (máx. 500) y `page[number]`. No informa el total: se pide hasta recibir menos de `page[size]`.
- **Filtros:** `filter[campo]=operador.valor` (`eq`, `gte`, `lte`, `in`, `ilike`, rangos `and(gte.…,lte.…)`).
- **Sin webhooks:** hay que consultar periódicamente (polling).
- **Límites de uso:** no documentados. Consultar con moderación.
- **Soporte:** Fudo no da soporte de programación sobre la API.

### Recursos relevantes
| Recurso | Operaciones | Datos útiles |
|---|---|---|
| `sales` (ventas) | Leer, modificar (**no crear**) | `createdAt`, `closedAt`, `total`, `saleType`, `saleState`, `comment`, `customerName`. Relaciones: `customer`, `items`, `payments`, `discounts`, `tips`, `waiter`, `table`, `saleIdentifier`, `commercialDocuments`. Filtros: `closedAt`, `createdAt`, `saleState`, `userId`, `shiftId`, `paymentMethodId`, `tableId` |
| `customers` (clientes) | Leer, crear, modificar, borrar | `name`, `email`, `phone`, `vatNumber`, `active`, `discountPercentage`, `houseAccountEnabled`, `houseAccountBalance` (saldo de cuenta corriente) |
| `users` (usuarios) | Leer, crear, modificar | `name`, `email`, `phone`, `active`, `admin`; relación `role` (`isWaiter`, `isDeliveryman`) |
| `discounts` | Leer, crear, modificar | `amount`, `percentage`, `maxAmount`, `canceled`; relaciones `sale`, `item`, `discountTemplate` |
| `payments` | Leer, crear, modificar | `amount`, `canceled`, `createdAt`; relaciones `paymentMethod`, `sale`, `expense` |
| `payment-methods` | Leer | `name`, `code`, `kind`, `active` |
| `expenses` / `expense-categories` | Leer, crear, modificar | Gastos del local y sus categorías |
| `items`, `products` | Leer, crear, modificar | Detalle de lo consumido (producto, cantidad, precio) |

## Mapeo con el Sistema de fichajes

### 1. Consumos de empleados (automatizado)
**Configuración en Fudo:** medio de pago **"Cuenta corriente empleados"**.
**Alta:** al dar de alta un empleado, nuestro sistema crea un **cliente** en Fudo (`POST /customers`) con nombre, correo, teléfono, DNI (`vatNumber`) y `houseAccountEnabled = true`. Guardamos el `fudo_customer_id`.
**Operación:** el cajero carga la venta en Fudo a nombre del empleado y la cobra con "Cuenta corriente empleados".
**Sincronización:** cada 15 min y antes de cerrar cada quincena:
```
GET /sales?filter[closedAt]=and(gte.<desde>,lt.<hasta>)
          &filter[paymentMethodId]=eq.<id cuenta corriente empleados>
          &include=customer,items,payments,saleIdentifier,commercialDocuments
```
Cada venta se carga como **consumo** pendiente de aprobación, con fecha, total, detalle de ítems y número de comprobante. Clave de idempotencia: `fudo_sale_id` (no se duplica).
**Conciliación:** se compara la suma liquidada con `houseAccountBalance` del cliente.
**Efecto:** ya no se tipea el número de ticket ni se saca foto (queda como respaldo opcional para cargas manuales).

### 1b. Descuento de empleado 20 % (sin límite mensual)
**En Fudo:** plantilla de descuento **"Descuento empleados 20%"** para las ventas cobradas con "Cuenta corriente empleados".
**Sincronización:** de cada venta se leen `total` y `discounts`. El sistema carga el consumo con su monto y su descuento; **solo el administrador** aprueba los consumos extra y los descuentos antes de descontarlos en la quincena que corresponda por fecha. A confirmar con una cuenta real: si el 20 % se aplica en Fudo (el ticket ya queda con descuento) o lo aplica nuestro sistema sobre el monto del ticket.

### 2. Cupón familiar 15% (control automático de uso)
**Configuración en Fudo:** plantilla de descuento **"Cupón familiar 15%"**.
**Operación:** el cajero aplica el descuento y escribe el código del cupón (ej. `FAM-3KT7`) en el **comentario** de la venta.
**Sincronización:** se leen las ventas con `include=discounts`; si tienen el descuento de esa plantilla, se busca el patrón `FAM-[A-Z0-9]{4}` en `comment` y se marca el cupón como **usado** con el número de comprobante.
**Alertas:** descuento aplicado sin código, código inexistente, no autorizado o ya usado.
**Recordatorio:** el cupón **no se descuenta del sueldo**; esta integración solo controla el uso y el límite de 2 por mes.

### 3. Empleados
`GET /users` trae el personal cargado en Fudo (nombre, correo, teléfono, activo, rol). Sirve para **precargar el alta** y para vincular cada usuario de Fudo con el **correo de acceso** del empleado en nuestro sistema (`fudo_user_id`).

### 4. Cruces con los fichajes (valor agregado)
- **Ventas sin fichaje:** ventas cuyo `waiter` no tiene un ingreso fichado en ese horario → alerta al administrador.
- **Propinas:** las ventas incluyen `tips` por mozo; a futuro se pueden repartir en la liquidación (por mozo o por horas trabajadas). Requiere definir la regla de reparto.

### 5. Sueldos y adelantos como gastos en Fudo
Al **confirmar** una liquidación quincenal, se crea en Fudo un gasto por empleado (`POST /expenses`) en la categoría "Sueldos" y, para cada adelanto aprobado, un gasto en "Adelantos" (con la captura de la transferencia como respaldo). El gasto puede imputarse al **centro de costos** del empleado (por ejemplo, producción). Así los reportes de Fudo reflejan el costo del personal sin carga doble. Requiere permiso de escritura de gastos para el usuario de API.

## Arquitectura
- **Módulo aislado** `integraciones/fudo` (por ser una API alfa): cliente HTTP, renovación del token, mapeo de datos y registro de cada sincronización.
- **Credenciales por local:** cada local suele ser una cuenta de Fudo distinta. Se guardan cifradas (`fudo_api_key`, `fudo_api_secret`) en la configuración del local; nunca en el código.
- **Tareas programadas:** cada 15 min (consumos y cupones) y una sincronización completa antes de liquidar. En Cloudflare Workers: *Cron Triggers*.
- **Idempotencia:** toda entidad importada guarda el id de Fudo (`fudo_sale_id`, `fudo_customer_id`, `fudo_user_id`, `fudo_expense_id`).
- **Registro y errores:** tabla `sync_fudo` con fecha, local, recurso, cantidad, errores. Reintentos con espera creciente; aviso al administrador si falla varias veces seguidas.

### Cambios en el modelo de datos
| Tabla | Campos nuevos |
|---|---|
| `locales` | `fudo_api_key`, `fudo_api_secret` (cifrados), `fudo_metodo_cc_id`, `fudo_descuento_cupon_id`, `fudo_ultima_sync` |
| `empleados` | `fudo_customer_id`, `fudo_user_id` |
| `consumos` | `origen` (`fudo` / `manual`), `fudo_sale_id` (único), `comprobante`, `items` (jsonb) |
| `cupones_familiares` | `fudo_sale_id`, `comprobante` |
| `liquidacion_items` | `fudo_expense_id` |
| `sync_fudo` (nueva) | `id`, `local_id`, `recurso`, `desde`, `hasta`, `importados`, `errores`, `ts` |

## Limitaciones y riesgos
- **Plan Pro** obligatorio en cada cuenta.
- **API alfa** (`v1alpha1`): campos pueden cambiar. Mitigación: módulo aislado y pruebas contra una cuenta real.
- **Sin webhooks:** demora de minutos en ver los consumos (sin impacto en la liquidación).
- **Límites de uso no documentados.**
- **Sin soporte de programación** de Fudo.
- **A confirmar con una cuenta real:** qué número de comprobante devuelve `saleIdentifier` / `commercialDocuments`; si el comentario de la venta es visible y editable para el cajero; permisos mínimos del rol de API.

## Etapas y esfuerzo
| Etapa | Alcance | Horas |
|---|---|---|
| 1. Lectura | Conexión y token, importar usuarios, consumos por cuenta corriente, uso de cupones, conciliación | 20 – 35 |
| 2. Escritura | Alta automática de clientes, registro de sueldos y adelantos como gastos | 12 – 20 |
| 3. Cruces | Ventas sin fichaje, propinas por mozo | 8 – 15 |
| **Total** | | **40 – 70** |

## Requisitos para empezar
1. Confirmar **Plan Pro** en la cuenta de Fudo.
2. En Fudo: crear el medio de pago "Cuenta corriente empleados", la plantilla de descuento "Cupón familiar 15%" y un usuario de API con lectura de ventas, clientes y usuarios (y escritura de clientes y gastos para la etapa 2).
3. Cargar `FUDO_API_KEY` y `FUDO_API_SECRET` en la configuración del entorno (nunca en el chat ni en el código) para probar la conexión en modo solo lectura.

## Fuentes
- Fudo, API Pública de Propósito General: https://soporte.fu.do/es/articles/11939789-api-publica-de-proposito-general
- Fudo, Alternativas para conectar sistemas externos: https://soporte.fu.do/es/articles/11732033-introduccion-a-las-apis
- Fudo, Integración de pedidos externos vía APIs: https://soporte.fu.do/es/articles/15707531-integracion-de-pedidos-externos-via-apis
- Documentación técnica: https://dev.fu.do/api · especificación `https://api.fu.do/v1alpha1/openapi.yml` (consultada el 2026-10-23)
