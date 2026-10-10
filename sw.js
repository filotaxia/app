/* ============================================
   App — Service Worker
   ============================================ */

// Hace que Filotaxia se pueda instalar y abrir sin conexión.
//
// Estrategia "primero la red": con internet siempre se usa la versión más
// nueva (y se guarda una copia); sin internet se usa la copia guardada.
// Así nunca queda una versión vieja trabada después de publicar cambios.
//
// Vive en la raíz (no en src/) para que controle toda la app.

const CACHE = "filotaxia-v2";

// Lo mínimo para abrir la app offline; el resto se guarda a medida que se usa
const SHELL = ["./", "./index.html", "./src/styles.css", "./src/main.js", "./manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Borra cachés de versiones anteriores
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Solo GET del mismo sitio (las fuentes y el CDN van directo a la red)
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  // cache: "no-cache" → siempre le pregunta al servidor si hay versión nueva
  // (si no cambió, responde "304" sin volver a bajar el archivo). Sin esto,
  // el navegador puede devolver su copia vieja y la app no se actualiza.
  event.respondWith(
    fetch(request, { cache: "no-cache" })
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request, { ignoreSearch: true })),
  );
});
