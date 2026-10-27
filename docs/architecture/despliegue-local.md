# Despliegue en servidor local con dominio

Actualizado: 2026-10-27 · Estado: propuesta para Mirana Burger

## Esquema
- **Un servidor** en el centro de producción (Villa Crespo): una PC con Windows 10/11, siempre encendida, con IP fija. Corre el sistema y su base de datos, con copia de seguridad diaria.
- **Dominio** registrado por LMH Apps a su nombre en Cloudflare (cerca de US$ 10 por año, cobro anual). Un **túnel cifrado** (Cloudflare Tunnel) lo conecta con el servidor sin abrir puertos del router y entrega HTTPS, necesario para usar la ubicación del celular.
- **Sin instalar programas en cada equipo.** Cada local abre la dirección en el navegador de su PC (acceso directo; opcionalmente como app instalable del navegador). El celular del empleado usa la misma dirección. Solo el servidor lleva instalación.
- **Vista en vivo:** los clientes mantienen una conexión con el servidor y reciben fichajes y casos a revisar al instante.
- Cada local necesita internet. La PC servidor, además, necesita internet estable y, si es posible, UPS.

## Qué pasa si falla el internet de un local (plan B)
| Situación | Resultado |
|---|---|
| El WiFi del local falla, pero la PC del local ya tenía la pantalla cargada | La pantalla sigue mostrando el QR (se genera sin conexión). El empleado ficha con los **datos móviles** de su celular. |
| La PC del local no llega al servidor y el celular tampoco | **Fichaje con clave personal (PIN) en la PC del local.** La marca se guarda en esa PC con su hora, se envía sola al volver la conexión y queda **"a revisar"** para el administrador. |
| El servidor de Mirana está apagado o sin internet | No hay vista en vivo ni fichaje validado. Los locales siguen guardando las marcas con clave y las envían al volver. |

### Trabajo adicional respecto de la prueba actual
La prueba de fichaje ya tiene el fichaje con PIN, pero **solo funciona con conexión**. Falta:
1. Cola local en la PC del local (almacenamiento del navegador) para guardar las marcas con PIN sin conexión.
2. Envío automático al volver la conexión, con validación del PIN en el servidor y sin duplicados.
3. Aviso en pantalla de "marca guardada en esta PC, pendiente de envío".
4. Control de la hora de la PC (se guarda también la hora de envío para detectar desvíos).

Estimación interna: 8 a 12 horas. **Está incluido en el precio acordado (US$ 2.000): no se cobra aparte.**
