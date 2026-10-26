# Sistema de fichajes · prueba de concepto (QR rotativo + geolocalización)

App web instalable (PWA) que corre en **Cloudflare Workers**. Sirve para mostrar el fichaje real con la cámara y el GPS de los celulares.

| Pantalla | Ruta | Para qué |
|---|---|---|
| Inicio | `/` | Accesos y guía de la muestra |
| Administrador | `/admin` | Ubicación del local, radio, red del local, vincular la tablet, empleados, marcas y revisión |
| Pantalla del local | `/kiosco` | Tablet: QR que cambia cada 15 segundos, **funciona sin internet**; fichaje de respaldo con PIN y foto |
| Empleado | `/fichar?t=…` | Se abre al escanear el QR con la cámara del celular; pide la ubicación y ficha |

## Qué valida el servidor (`src/worker.js`)
1. QR auténtico (firma HMAC con la clave del local) y vigente (el código cambia cada 15 s; se acepta hasta ~45 s de antigüedad porque el empleado escanea y el GPS tarda, y 15 s hacia adelante por desfasaje de reloj).
2. Empleado asignado a ese local.
3. Marca duplicada (menos de 60 s): devuelve la marca existente.
4. Ubicación: precisión mayor a 150 m → se pide reintentar; dentro del radio (descontando el margen de error del GPS) → válida; hasta 1,5 × radio → "a revisar"; más lejos → rechazada.
5. Señales de ubicación simulada (precisión ≤ 1 m, mismas coordenadas que otro día) → "a revisar".
6. Celular vinculado: el primero que usa el empleado queda vinculado; desde otro → "a revisar".
7. Red del local (opcional): si la conexión sale por la red registrada, suma una señal positiva.
8. Respaldo con PIN en la pantalla del local (con foto opcional) → siempre "a revisar".

Las marcas se guardan en un Durable Object con SQLite (no hace falta crear bases ni namespaces).

## Probar en la compu
```bash
cd apps/fichaje-demo
npm install
npm run dev        # http://localhost:8787  (PIN de administrador: 1234)
```
Cámara y GPS necesitan HTTPS: en el celular solo funcionan con la app publicada (o con un túnel HTTPS).

## Publicar en Cloudflare (gratis)
Opción A, desde tu compu:
```bash
cd apps/fichaje-demo
npm install
npx wrangler login     # abre el navegador para entrar a tu cuenta de Cloudflare
npm run deploy         # publica en https://sistema-fichajes-demo.<tu-subdominio>.workers.dev
```
Opción B, sin instalar nada: en el panel de Cloudflare → Workers & Pages → Create → Import a repository → elegí este repo, rama `claude/focused-gates-ulzhhv`, **Root directory** `apps/fichaje-demo`, comando de deploy `npx wrangler deploy`. Cada push vuelve a publicar.

Antes de mostrarla, cambiá el PIN de administrador: `npx wrangler secret put ADMIN_PIN` (y borrá `ADMIN_PIN` de `[vars]` en `wrangler.toml`).

## Guion de la muestra
1. Celular del administrador, **dentro del local**: `/admin` → PIN → **Usar mi ubicación actual** → radio 150 m → **Guardar**. Opcional: conectado al wifi del local, **Registrar la red (wifi) del local**.
2. Tablet: `/admin` → **Vincular esta pantalla y abrir el QR** (o `/kiosco` + PIN). Si se corta internet, el QR sigue.
3. Celular del empleado: escanear el QR con la **cámara del teléfono** → elegir el nombre → **Fichar ahora** → aceptar la ubicación.
4. Mostrar en `/admin` → **Marcas** el resultado y el motivo. Para mostrar rechazos: fichar lejos del local, con un QR viejo (foto de hace más de 4 minutos) o desde otro celular a nombre del mismo empleado (queda "a revisar").
5. Aprobar o rechazar las marcas "a revisar".

## Límites de la demo
- Los empleados se eligen de una lista (sin login); en la versión real entran con su correo.
- Un solo local y tres empleados de ejemplo; **Reiniciar datos de la demo** vuelve al inicio (hay que volver a vincular la tablet).
- La ubicación simulada no se puede detectar al 100 % desde una app web; por eso se combina con el QR y el celular vinculado.
