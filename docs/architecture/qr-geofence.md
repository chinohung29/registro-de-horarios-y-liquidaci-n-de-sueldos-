# Fichaje: QR rotativo + geolocalización

## Objetivo
Que una marca solo sea válida si el empleado está físicamente en el local en ese momento, sin generar reclamos de quienes sí estaban.

## Por qué dos controles
| Control | Qué prueba | Punto débil |
|---|---|---|
| GPS del celular | Que el teléfono está cerca del local | Adentro de un edificio erra 20–100 m; en Android se puede falsear |
| QR rotativo | Que la persona está frente a la pantalla del local | Una foto del QR puede reenviarse a alguien que no está |

Combinados, engañar al sistema requiere un cómplice en el local **y** una app de ubicación falsa, y queda rastro.

## Pantalla del local (tablet)
- Tablet económica fija, en modo kiosco (Android: modo kiosco / app de kiosco; iPad: Acceso guiado), con hora automática.
- **Vinculación**: el administrador la vincula una vez; la tablet recibe la clave del local (`secreto`, 20 bytes) y la guarda.
- **El QR se genera en la tablet, sin internet**: `token = localId.slot.firma`, con `slot = floor(unix / 15)` (el código cambia **cada 15 segundos**; antes 2 minutos, cambio pedido en la reunión del 2026-10-26) y `firma = HMAC-SHA256(secreto, "localId.slot")` (primeros 8 bytes en hex). Mismo principio que los códigos de seguridad bancarios (TOTP).
- El QR contiene un enlace: `https://<app>/fichar?t=<token>`. Se escanea con la **cámara normal del teléfono**, que abre la app lista para fichar (funciona en iPhone y Android).
- La app de la tablet queda guardada (service worker): si se corta internet sigue mostrando el QR; los empleados fichan con los datos de su celular.
- Botón **Fichar con PIN** (respaldo cuando el celular no tiene señal): PIN del empleado + foto opcional con la cámara de la tablet. La marca queda siempre "a revisar".

## Celular del empleado
- Al abrir el enlace pide la ubicación con alta precisión (`enableHighAccuracy`, sin caché, 15 s de espera). Requiere HTTPS y permiso; se explica que se toma solo en ese momento.
- Envía `token`, empleado, identificador del dispositivo y `lat`, `lng`, `precision`.

## Validación en el servidor (nunca en el celular)
1. **QR**: local existente, firma correcta y slot actual y hasta 2 anteriores (≈ 45 s de antigüedad) y 1 posterior (desfasaje de reloj). Con 15 s hace falta la ventana: el empleado escanea, el GPS tarda y recién ahí se valida. Si no → rechazada ("QR vencido" / "QR inválido").
2. **Asignación**: el empleado está asignado al local o tiene una habilitación vigente. Si no → rechazada.
3. **Duplicada**: otra marca no rechazada en menos de 60 s → se devuelve la existente.
4. **Ubicación** (con margen de error):
   - precisión > 150 m → rechazada con "reintentá" (salir de la zona techada, activar el GPS);
   - `distancia − precisión ≤ radio` → OK;
   - `distancia − precisión ≤ 1,5 × radio` → "a revisar" (borde de la geocerca);
   - más lejos → rechazada ("estás a X m").
   - Sin ubicación (permiso denegado, GPS lento) o local sin configurar → "a revisar".
5. **Ubicación simulada**: precisión ≤ 1 m o coordenadas idénticas a las de otro día → "a revisar".
6. **Celular vinculado**: el primer dispositivo que usa el empleado queda vinculado; desde otro → "a revisar". El administrador puede desvincular (cambio de teléfono).
7. **Red del local** (opcional): si la IP pública coincide con la registrada para el local, suma una señal positiva. No es obligatoria.
8. **Ingreso / egreso**: alterna según la última marca no rechazada del día.

Cada marca guarda estado (`valida` / `a_revisar` / `rechazada`), motivos, señales positivas, distancia, precisión, IP, vía (`qr` / `pin`) y foto (si la hay).

## Marcar en vez de rechazar
Los casos dudosos no se rechazan: quedan **"a revisar"** en una bandeja del encargado/administrador, que aprueba o rechaza (queda registrado). Así no se castiga al que estaba y tuvo mal GPS.

## Configuración del local
- **Usar mi ubicación actual**: el administrador, parado en el local, toma las coordenadas con el celular (se muestra la precisión y un enlace al mapa).
- **Radio**: 50 a 300 m; recomendado 100–150 m.
- **Registrar la red del local**: conectado al wifi del local, guarda la IP pública.

## Lo que no se puede desde una app web
| Alternativa | En app web |
|---|---|
| Leer el nombre del wifi | No (solo la IP pública) |
| Detectar apps de ubicación falsa | No de forma confiable |
| NFC / balizas Bluetooth | Solo algunos Android, nunca iPhone |

Si aparece fraude real, el paso siguiente es una app nativa Android (detecta ubicación simulada).

## Aspecto legal
La ubicación se toma **solo al fichar**, nunca durante el turno. Informarlo por escrito con consentimiento firmado (Ley 25.326 de protección de datos personales); revisar el texto con un abogado laboral. No se usa reconocimiento facial (dato biométrico sensible).

## Prueba de concepto
Implementada en `apps/fichaje-demo` (Cloudflare Workers + Durable Object). Ver su README para probarla y publicarla.
