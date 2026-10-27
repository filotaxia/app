/* ============================================
   Store — Admin
   ============================================ */

// Todo lo que el panel (/admin/) le pide a Supabase: entrar, leer, crear y
// editar terrarios, y subir sus archivos. Junto con catalog.js (la app
// pública), es el único archivo que habla con Supabase. Usa fetch, sin
// librería, igual que catalog.js.
//
//   await signIn(email, password)     → entra (o lanza AdminError con el motivo en palabras)
//   await signOut()
//   await currentUser()               → { email } o null si no hay sesión
//   await isAdmin()                   → ¿el email está en la tabla admins?
//   await listTerrarios()             → todas las filas, también los borradores
//   await createTerrario(row)         → la fila creada (con su qr_code nuevo)
//   await updateTerrario(id, cambios) → la fila actualizada
//   await uploadFile(path, blob, type) → sube a Storage ("07/foto-….jpg") y devuelve la ruta
//   publicFileURL(path)               → el link para mostrar un archivo guardado en la fila
//   await listBackups()               → los backups, el más nuevo primero (sin los datos, que pesan)
//   await getBackup(id)               → un backup con sus datos ({ terrarios, admins })
//   await makeBackup()                → hace uno en el momento y lo devuelve (sin los datos)
//
// Cómo funciona el login: Supabase Auth devuelve un "access token" (vale una
// hora) y un "refresh token" (para pedir otro sin volver a escribir la
// contraseña). Los dos se guardan en el store (clave admin_session). Cada
// pedido lleva el access token: con él, la base sabe quién es y aplica sus
// reglas (RLS): solo un email de la tabla admins puede escribir.

import { get, set } from "./store.js";
import { SUPABASE_URL, SUPABASE_KEY } from "./supabase-config.js";

const AUTH = `${SUPABASE_URL}/auth/v1`;
const REST = `${SUPABASE_URL}/rest/v1`;
const STORAGE = `${SUPABASE_URL}/storage/v1/object/terrarios`;
const STORAGE_PUBLIC = `${SUPABASE_URL}/storage/v1/object/public/terrarios/`;
const APP_ROOT = new URL("../../", import.meta.url);   // la raíz de la app (donde está index.html)

// Error con un mensaje que se puede mostrar tal cual en pantalla
export class AdminError extends Error {
  name = "AdminError";
}

/* ---------------------------------------- */
/* Sesión */
/* ---------------------------------------- */

export async function signIn(email, password) {
  const response = await fetch(`${AUTH}/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }).catch(() => {
    throw new AdminError("No hay conexión con Supabase. Probá de nuevo en un rato.");
  });
  if (response.status === 400) throw new AdminError("El email o la contraseña no son correctos.");
  if (!response.ok) throw new AdminError(`Supabase no dejó entrar (error ${response.status}).`);
  await saveSession(await response.json());
}

export async function signOut() {
  const session = await get("admin_session");
  await set("admin_session", null);
  if (!session) return;
  // Avisarle a Supabase es una cortesía: si falla, la sesión igual se borró acá
  fetch(`${AUTH}/logout`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${session.access_token}` },
  }).catch(() => {});
}

export async function currentUser() {
  const session = await validSession();
  return session ? { email: session.email } : null;
}

export async function isAdmin() {
  return request("POST", `${REST}/rpc/is_admin`, {});
}

async function saveSession(data) {
  await set("admin_session", {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,   // en segundos desde 1970
    email: data.user?.email ?? null,
  });
}

// La sesión guardada, renovada si está por vencer; null si no hay o no se pudo renovar
async function validSession() {
  const session = await get("admin_session");
  if (!session) return null;
  const now = Date.now() / 1000;
  if (session.expires_at - now > 60) return session;

  try {
    const response = await fetch(`${AUTH}/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    if (!response.ok) throw new Error(`refresh ${response.status}`);
    await saveSession(await response.json());
    return get("admin_session");
  } catch {
    await set("admin_session", null);
    return null;
  }
}

/* ---------------------------------------- */
/* Terrarios */
/* ---------------------------------------- */

export async function listTerrarios() {
  return request("GET", `${REST}/terrarios?select=*&order=id`);
}

// El qr_code lo inventa la base al azar. Si justo sale uno que ya existe
// (una vez en millones), se vuelve a intentar solo.
export async function createTerrario(row) {
  for (let attempt = 1; ; attempt++) {
    try {
      const [created] = await request("POST", `${REST}/terrarios`, row, { Prefer: "return=representation" });
      return created;
    } catch (error) {
      if (!error.qrClash || attempt === 3) throw error;
    }
  }
}

export async function updateTerrario(id, changes) {
  const url = `${REST}/terrarios?id=eq.${encodeURIComponent(id)}`;
  const [updated] = await request("PATCH", url, changes, { Prefer: "return=representation" });
  if (!updated) throw new AdminError("No se pudo guardar: esta cuenta no tiene permiso para editar.");
  return updated;
}

/* ---------------------------------------- */
/* Archivos */
/* ---------------------------------------- */

export async function uploadFile(path, blob, contentType) {
  const session = await requireSession();
  const response = await fetch(`${STORAGE}/${path}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": contentType,
    },
    body: blob,
  }).catch(() => {
    throw new AdminError("Se cortó la conexión mientras se subía el archivo.");
  });
  if (!response.ok) {
    const { message } = await response.json().catch(() => ({}));
    if (/size/i.test(message ?? "")) throw new AdminError("El archivo pesa más de 50 MB.");
    if (/mime/i.test(message ?? "")) throw new AdminError("Ese tipo de archivo no se puede subir.");
    throw new AdminError(`No se pudo subir el archivo (${message ?? response.status}).`);
  }
  return path;
}

// Una ruta de archivo de la fila → su link. Las fotos de TR01–TR05 todavía
// son de la app ("src/assets/…"); las que sube el panel están en Storage.
export function publicFileURL(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  if (path.startsWith("src/")) return new URL(path, APP_ROOT).href;
  return STORAGE_PUBLIC + path;
}

/* ---------------------------------------- */
/* Backups */
/* ---------------------------------------- */

// Los hace la base sola cada lunes (supabase/migrations/20261027133539_backups.sql);
// el panel los lista, los descarga y puede pedir uno en el momento.

export async function listBackups() {
  return request("GET", `${REST}/backups?select=id,created_at,kind,row_count&order=created_at.desc`);
}

export async function getBackup(id) {
  const [backup] = await request("GET", `${REST}/backups?select=*&id=eq.${encodeURIComponent(id)}`);
  if (!backup) throw new AdminError("Ese backup no existe.");
  return backup;
}

export async function makeBackup() {
  return request("POST", `${REST}/rpc/make_backup`, {});
}

/* ---------------------------------------- */
/* Pedidos */
/* ---------------------------------------- */

async function requireSession() {
  const session = await validSession();
  if (!session) throw new AdminError("La sesión venció. Volvé a entrar.");
  return session;
}

// Un pedido a la API de la base con la sesión del admin. Devuelve el JSON
// de la respuesta, o lanza AdminError con un mensaje para la pantalla.
async function request(method, url, body, extraHeaders = {}) {
  const session = await requireSession();
  const response = await fetch(url, {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).catch(() => {
    throw new AdminError("No hay conexión con Supabase. Probá de nuevo en un rato.");
  });

  if (response.ok) return response.status === 204 ? null : response.json();

  // 401: el token ya no sirve (venció o se cerró la sesión en otro lado)
  if (response.status === 401) {
    await set("admin_session", null);
    throw new AdminError("La sesión venció. Volvé a entrar.");
  }

  const error = await response.json().catch(() => ({}));
  const failure = new AdminError(explain(error, response.status));
  failure.qrClash = error.code === "23505" && /qr_code/.test(error.message ?? "");
  throw failure;
}

// Los errores de la base, en palabras
function explain(error, status) {
  const text = `${error.message ?? ""} ${error.details ?? ""}`;
  if (error.code === "23505" && /qr_code/.test(text)) return "Se repitió un código de QR (pasa una vez en millones). Guardá de nuevo.";
  if (error.code === "23505") return "Ya hay un terrario con ese número.";
  if (error.code === "42501" || status === 401 || status === 403) return "Esta cuenta no tiene permiso para editar.";
  if (/no se puede cambiar|no vuelve a borrador/.test(text)) return error.message;
  return `La base no aceptó el cambio: ${error.message ?? `error ${status}`}.`;
}
