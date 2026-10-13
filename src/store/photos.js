/* ============================================
   Store — Photos
   ============================================ */

// Adaptador de fotos sobre IndexedDB (las fotos de la Bitácora).
//
// Es el ÚNICO archivo de la app que toca IndexedDB. localStorage guarda
// unos 5 MB en total y solo texto: no entran fotos. IndexedDB guarda
// archivos (Blob) y mucho más espacio, también solo en este teléfono.
//
//   const id = await savePhoto(blob)
//   const url = await photoURL(id)    → "blob:…" para un <img> (o null si no está)
//   URL.revokeObjectURL(url)          → al salir de la pantalla, para liberar memoria
//   await deletePhoto(id)

const DB_NAME = "filotaxia";
const STORE = "photos";

let dbPromise = null;

function db() {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

// Una operación sobre la tabla de fotos, como promesa
async function run(mode, operation) {
  const tx = (await db()).transaction(STORE, mode);
  const request = operation(tx.objectStore(STORE));
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error);
  });
}

export async function savePhoto(blob) {
  const id = crypto.randomUUID();
  await run("readwrite", (store) => store.put(blob, id));
  return id;
}

export async function photoURL(id) {
  const blob = await run("readonly", (store) => store.get(id));
  return blob ? URL.createObjectURL(blob) : null;
}

export async function deletePhoto(id) {
  await run("readwrite", (store) => store.delete(id));
}
