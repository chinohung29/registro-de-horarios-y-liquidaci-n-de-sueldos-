# Fichaje: QR rotativo + geocerca

## Objetivo
Que una marca solo sea válida si el empleado está físicamente en el local en ese momento.

## QR rotativo
- Cada local tiene un `qr_secret` (aleatorio, solo servidor).
- Ventana de tiempo: `slot = floor(unix_time / 120)`.
- Contenido del QR: `local_id.slot.firma`, con `firma = HMAC_SHA256(qr_secret, local_id + slot)` recortada.
- La pantalla del local lo regenera cada 120 s (la firma la pide al servidor, el secreto nunca sale).
- El servidor acepta el `slot` actual y el anterior (tolerancia de 1 ventana por demoras de red/escaneo).

## Geocerca
- El local define `lat`, `lng` y `radio_m` (por defecto 100 m).
- El celular envía `lat`, `lng`, `accuracy_m` junto al token.
- Se acepta si `distancia(haversine) <= radio_m` y `accuracy_m <= 100`. Si la precisión es peor, se rechaza y se pide reintentar.

## Validación (servidor)
1. Usuario autenticado y empleado activo asignado a ese local.
2. Firma y ventana del QR válidas.
3. Geocerca válida.
4. Alterna ingreso/egreso según la última marca abierta; evita duplicados dentro de 60 s.
5. Guarda la marca con `slot`, coordenadas, precisión, IP y user-agent.

## Límites conocidos
- GPS falsificado en el dispositivo no se puede descartar al 100%. El QR rotativo que exige estar frente a la pantalla reduce mucho el fraude (no sirve fotografiar el QR a distancia).
- Se registran marcas rechazadas (con motivo) para que el administrador detecte intentos.
- Los permisos de ubicación y cámara requieren HTTPS.
