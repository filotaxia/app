/* ============================================
   Store — Local
   ============================================ */

// Adaptador de datos sobre localStorage.
//
// Es el ÚNICO archivo de la app que toca localStorage.
// Las funciones son async aunque localStorage sea sincrónico:
// así la firma ya es la misma que tendrá un adaptador remoto (Supabase).

const PREFIX = "filotaxia:";

// Memoria de respaldo si localStorage no está disponible
// (modo privado estricto, cookies bloqueadas). La app sigue andando,
// solo que los datos no sobreviven a una recarga.
const memory = new Map();

function storage() {
  try {
    const test = PREFIX + "__test";
    localStorage.setItem(test, "1");
    localStorage.removeItem(test);
    return localStorage;
  } catch {
    return null;
  }
}

const ls = storage();

export async function read(key) {
  const raw = ls ? ls.getItem(PREFIX + key) : memory.get(key);
  if (raw == null) return null;

  try {
    return JSON.parse(raw);
  } catch {
    // Dato corrupto: mejor devolver vacío que romper la vista
    console.warn(`[store] valor inválido en "${key}", se ignora`);
    return null;
  }
}

export async function write(key, value) {
  const raw = JSON.stringify(value);
  if (ls) ls.setItem(PREFIX + key, raw);
  else memory.set(key, raw);
}
