// Sistema de fichajes · prueba de concepto
// El Worker reenvía /api/* a un único Durable Object (Store) que guarda los datos y valida cada marca.
// El resto de las rutas lo sirve Cloudflare desde /public.
import { DurableObject } from "cloudflare:workers";

const SLOT_SEG = 120;            // el QR cambia cada 2 minutos
const PRECISION_MAX_M = 150;     // con peor precisión se pide reintentar
const DUPLICADA_SEG = 60;        // dos marcas en menos de 60 s son la misma
const RADIOS = [50, 100, 150, 200, 300];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      const stub = env.STORE.get(env.STORE.idFromName("demo"));
      return stub.fetch(request);
    }
    return env.ASSETS.fetch(request);
  },
};

// ---------- utilidades ----------
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

const hexToBytes = (hex) => new Uint8Array(hex.match(/../g).map((h) => parseInt(h, 16)));
const bytesToHex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const randomHex = (n) => bytesToHex(crypto.getRandomValues(new Uint8Array(n)));

// Firma del QR: HMAC-SHA256(secreto del local, "localId.slot"), primeros 8 bytes en hex.
// La pantalla del local calcula lo mismo sin internet (ver public/common.js).
async function firma(secretHex, localId, slot) {
  const key = await crypto.subtle.importKey("raw", hexToBytes(secretHex), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${localId}.${slot}`));
  return bytesToHex(sig).slice(0, 16);
}

function distanciaM(lat1, lng1, lat2, lng2) {
  const R = 6371000, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1), dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const clientIp = (req) => req.headers.get("cf-connecting-ip") || (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "";
const diaAR = (ts) => new Date(ts - 3 * 3600 * 1000).toISOString().slice(0, 10); // Argentina, UTC-3

function datosIniciales() {
  return {
    locales: [{ id: "centro", nombre: "Casa Fuego · Centro", lat: null, lng: null, radio: 150, ipLocal: "", secreto: randomHex(20) }],
    empleados: [
      { id: "e1", nombre: "Lucía Benítez", puesto: "Moza", localId: "centro", pin: "1111", deviceId: "" },
      { id: "e2", nombre: "Martín Aguirre", puesto: "Cocinero", localId: "centro", pin: "2222", deviceId: "" },
      { id: "e3", nombre: "Julián Paredes", puesto: "Bachero", localId: "centro", pin: "3333", deviceId: "" },
    ],
  };
}

export class Store extends DurableObject {
  async datos() {
    let d = await this.ctx.storage.get("datos");
    if (!d) { d = datosIniciales(); await this.ctx.storage.put("datos", d); }
    return d;
  }
  async guardar(d) { await this.ctx.storage.put("datos", d); }

  async marcas(limit = 200) {
    const m = await this.ctx.storage.list({ prefix: "m:", reverse: true, limit });
    return [...m.values()];
  }
  async ultimaMarca(empleadoId) {
    for (const m of await this.marcas(500)) if (m.empleadoId === empleadoId && m.estado !== "rechazada") return m;
    return null;
  }
  async ultimaCualquiera(empleadoId) {
    for (const m of await this.marcas(500)) if (m.empleadoId === empleadoId) return m;
    return null;
  }
  async registrar(marca) {
    marca.id = `m:${String(marca.ts).padStart(15, "0")}:${randomHex(3)}`;
    await this.ctx.storage.put(marca.id, marca);
    return marca;
  }

  esAdmin(req) { return req.headers.get("x-admin-pin") === String(this.env.ADMIN_PIN || "1234"); }

  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/api/, "");
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    try {
      // ----- público -----
      if (path === "/estado" && req.method === "GET") {
        const d = await this.datos();
        return json({
          locales: d.locales.map(({ secreto, ...l }) => l),
          empleados: d.empleados.map(({ pin, deviceId, ...e }) => ({ ...e, dispositivoVinculado: !!deviceId })),
          ahora: Date.now(), slotSeg: SLOT_SEG,
        });
      }
      if (path === "/fichar" && req.method === "POST") return json(await this.fichar(req, body));
      if (path === "/fichar-pin" && req.method === "POST") return json(await this.ficharPin(req, body));

      // ----- administrador -----
      if (!path.startsWith("/admin/")) return json({ error: "Ruta inexistente" }, 404);
      if (!this.esAdmin(req)) return json({ error: "PIN de administrador incorrecto" }, 401);
      const d = await this.datos();

      if (path === "/admin/estado") {
        return json({
          locales: d.locales.map(({ secreto, ...l }) => l),
          empleados: d.empleados.map(({ deviceId, ...e }) => ({ ...e, dispositivoVinculado: !!deviceId })),
          marcas: await this.marcas(200), miIp: clientIp(req),
        });
      }
      if (path === "/admin/local") {
        const l = d.locales.find((x) => x.id === body.id);
        if (!l) return json({ error: "Local inexistente" }, 404);
        if (body.nombre) l.nombre = String(body.nombre).slice(0, 80);
        if (body.lat != null && body.lng != null) {
          const lat = Number(body.lat), lng = Number(body.lng);
          if (!(Math.abs(lat) <= 90 && Math.abs(lng) <= 180)) return json({ error: "Coordenadas inválidas" }, 400);
          l.lat = lat; l.lng = lng;
        }
        if (body.radio != null) { const r = Number(body.radio); if (!RADIOS.includes(r)) return json({ error: "Radio inválido" }, 400); l.radio = r; }
        if (body.registrarIp) l.ipLocal = clientIp(req);
        if (body.borrarIp) l.ipLocal = "";
        await this.guardar(d);
        return json({ ok: true, local: (({ secreto, ...x }) => x)(l) });
      }
      if (path === "/admin/vincular-pantalla") {
        const l = d.locales.find((x) => x.id === body.localId);
        if (!l) return json({ error: "Local inexistente" }, 404);
        return json({ localId: l.id, nombre: l.nombre, secreto: l.secreto, slotSeg: SLOT_SEG });
      }
      if (path === "/admin/revisar") {
        const m = await this.ctx.storage.get(body.marcaId);
        if (!m) return json({ error: "Marca inexistente" }, 404);
        if (!["aprobar", "rechazar"].includes(body.decision)) return json({ error: "Decisión inválida" }, 400);
        m.estado = body.decision === "aprobar" ? "valida" : "rechazada";
        m.revisada = { decision: body.decision, ts: Date.now() };
        await this.ctx.storage.put(m.id, m);
        return json({ ok: true, marca: m });
      }
      if (path === "/admin/desvincular") {
        const e = d.empleados.find((x) => x.id === body.empleadoId);
        if (!e) return json({ error: "Empleado inexistente" }, 404);
        e.deviceId = ""; await this.guardar(d);
        return json({ ok: true });
      }
      if (path === "/admin/reiniciar-demo") {
        await this.ctx.storage.deleteAll();
        await this.datos();
        return json({ ok: true });
      }
      return json({ error: "Ruta inexistente" }, 404);
    } catch (err) {
      return json({ error: "Error interno", detalle: String(err && err.message || err) }, 500);
    }
  }

  // ---------- validación de una marca con QR + GPS ----------
  async fichar(req, b) {
    const d = await this.datos();
    const ahora = Date.now();
    const motivos = [], senales = [];
    const base = { ts: ahora, via: "qr", ip: clientIp(req), lat: b.lat ?? null, lng: b.lng ?? null, precision: b.precision ?? null };
    const rechazar = async (motivo, extra = {}) => ({ ...(await this.registrar({ ...base, ...extra, estado: "rechazada", motivos: [motivo], senales })) });

    // 1. QR auténtico y vigente
    const [localId, slotStr, sig] = String(b.token || "").split(".");
    const local = d.locales.find((l) => l.id === localId);
    const emp = d.empleados.find((e) => e.id === b.empleadoId);
    if (!emp) return { error: "Elegí quién sos antes de fichar." };
    base.empleadoId = emp.id; base.empleado = emp.nombre; base.localId = localId || ""; base.local = local ? local.nombre : "";
    if (!local || !slotStr || !sig) return rechazar("QR inválido: no corresponde a ningún local.");
    const slot = Number(slotStr), slotAhora = Math.floor(ahora / 1000 / SLOT_SEG);
    if (!(Number.isInteger(slot) && Math.abs(slotAhora - slot) <= 1)) return rechazar("QR vencido: escaneá el código que está en pantalla ahora.");
    if ((await firma(local.secreto, local.id, slot)) !== sig) return rechazar("QR inválido: la firma no coincide.");
    senales.push("QR vigente");

    // 2. Empleado asignado a ese local
    if (emp.localId !== local.id) return rechazar("No estás asignado a este local.");

    // 3. Duplicadas
    const ultima = await this.ultimaCualquiera(emp.id);
    if (ultima && ahora - ultima.ts < DUPLICADA_SEG * 1000 && ultima.estado !== "rechazada") {
      return { duplicada: true, marca: ultima, mensaje: "Ya registramos tu marca hace menos de un minuto." };
    }

    // 4. Ubicación
    let estado = "valida";
    const lat = Number(b.lat), lng = Number(b.lng), prec = Number(b.precision);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      estado = "a_revisar"; motivos.push(b.errorGps ? `Sin ubicación: ${String(b.errorGps).slice(0, 80)}` : "Sin ubicación del dispositivo.");
    } else if (local.lat == null) {
      estado = "a_revisar"; motivos.push("El local todavía no tiene la ubicación configurada.");
    } else {
      const dist = Math.round(distanciaM(lat, lng, local.lat, local.lng));
      base.distancia = dist;
      if (Number.isFinite(prec) && prec > PRECISION_MAX_M) {
        return rechazar(`Ubicación imprecisa (±${Math.round(prec)} m). Salí de la zona techada o activá el GPS y reintentá.`, { distancia: dist });
      }
      const margen = Number.isFinite(prec) ? prec : 0;
      if (dist - margen <= local.radio) senales.push(`Dentro del radio (${dist} m, ±${Math.round(margen)} m)`);
      else if (dist - margen <= local.radio * 1.5) { estado = "a_revisar"; motivos.push(`En el borde de la geocerca (${dist} m, radio ${local.radio} m).`); }
      else return rechazar(`Fuera del local: estás a ${dist} m (radio ${local.radio} m).`);
      if (Number.isFinite(prec) && prec <= 1) { estado = "a_revisar"; motivos.push("Precisión sospechosa (≤ 1 m): posible ubicación simulada."); }
      if (ultima && ultima.lat === lat && ultima.lng === lng && diaAR(ultima.ts) !== diaAR(ahora)) {
        estado = "a_revisar"; motivos.push("Coordenadas idénticas a otro día: posible ubicación simulada.");
      }
    }

    // 5. Dispositivo vinculado
    const dev = String(b.deviceId || "").slice(0, 64);
    if (!dev) { estado = "a_revisar"; motivos.push("Dispositivo sin identificar."); }
    else if (!emp.deviceId) { emp.deviceId = dev; await this.guardar(d); senales.push("Dispositivo vinculado en esta marca"); }
    else if (emp.deviceId !== dev) { estado = "a_revisar"; motivos.push("Fichó desde un dispositivo distinto al vinculado."); }
    else senales.push("Dispositivo vinculado");

    // 6. Red del local (señal positiva, no obligatoria)
    if (local.ipLocal && base.ip && base.ip === local.ipLocal) senales.push("Conectado a la red del local");

    // Ingreso o egreso: alterna según la última marca no rechazada del día
    const prev = await this.ultimaMarca(emp.id);
    const tipo = prev && diaAR(prev.ts) === diaAR(ahora) && prev.tipo === "ingreso" ? "egreso" : "ingreso";

    return await this.registrar({ ...base, tipo, estado, motivos, senales });
  }

  // ---------- respaldo: fichaje desde la pantalla del local con PIN y foto ----------
  async ficharPin(req, b) {
    const d = await this.datos();
    const local = d.locales.find((l) => l.id === b.localId);
    const emp = d.empleados.find((e) => e.id === b.empleadoId);
    if (!local || !emp) return { error: "Local o empleado inexistente." };
    if (String(b.pin || "") !== emp.pin) return { error: "PIN incorrecto." };
    if (emp.localId !== local.id) return { error: "No estás asignado a este local." };
    const ahora = Date.now();
    const ultima = await this.ultimaCualquiera(emp.id);
    if (ultima && ahora - ultima.ts < DUPLICADA_SEG * 1000 && ultima.estado !== "rechazada") return { duplicada: true, marca: ultima, mensaje: "Ya registramos tu marca hace menos de un minuto." };
    let foto = typeof b.foto === "string" && b.foto.startsWith("data:image/") && b.foto.length < 120000 ? b.foto : "";
    const prev = await this.ultimaMarca(emp.id);
    const tipo = prev && diaAR(prev.ts) === diaAR(ahora) && prev.tipo === "ingreso" ? "egreso" : "ingreso";
    return await this.registrar({
      ts: ahora, via: "pin", ip: clientIp(req), empleadoId: emp.id, empleado: emp.nombre, localId: local.id, local: local.nombre,
      tipo, estado: "a_revisar", motivos: ["Fichaje con PIN desde la pantalla del local (sin GPS del celular)." + (foto ? "" : " Sin foto.")], senales: foto ? ["Foto tomada en la pantalla del local"] : [], foto,
    });
  }
}
