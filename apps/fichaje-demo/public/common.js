// Utilidades compartidas por las pantallas de la demo.
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};
async function api(path, body, adminPin) {
  const opt = { method: body ? "POST" : "GET", headers: { "content-type": "application/json" } };
  if (body) opt.body = JSON.stringify(body);
  if (adminPin) opt.headers["x-admin-pin"] = adminPin;
  const r = await fetch("/api" + path, opt);
  const data = await r.json().catch(() => ({ error: "Respuesta inválida del servidor" }));
  if (!r.ok && !data.error) data.error = "Error " + r.status;
  return data;
}
let toastT;
function toast(t) { let el = $("#toast"); if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); } el.textContent = t; el.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("on"), 3000); }
const hora = (ts) => new Date(ts).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
const fechaHora = (ts) => new Date(ts).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

// Firma del QR, igual que en el servidor: HMAC-SHA256(secreto, "localId.slot"), 8 bytes en hex.
async function firmaQR(secretHex, localId, slot) {
  const bytes = new Uint8Array(secretHex.match(/../g).map((h) => parseInt(h, 16)));
  const key = await crypto.subtle.importKey("raw", bytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${localId}.${slot}`));
  return [...new Uint8Array(sig)].map((x) => x.toString(16).padStart(2, "0")).join("").slice(0, 16);
}
const ESTADO = { valida: ["Válida", "ok"], a_revisar: ["A revisar", "warn"], rechazada: ["Rechazada", "bad"] };
if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
