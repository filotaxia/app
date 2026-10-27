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

// Cambiar el número borra las copias guardadas de la versión anterior
// (v4: el ícono del iPhone pasó a /apple-touch-icon.png).
const CACHE = "filotaxia-v4";

// Lo mínimo para abrir la app offline; el resto se guarda a medida que se usa.
// 404.html y catalogo.json: para que un QR escaneado sin red igual abra su
// terrario (ver abajo y store/catalog.js).
const SHELL = [
  "./", "./index.html", "./src/styles.css", "./src/main.js", "./manifest.webmanifest",
  "./404.html", "./catalogo.json",
];

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
      .catch(async () => {
        const cached = await caches.match(request, { ignoreSearch: true });
        if (cached) return cached;
        // Sin red, abrir una dirección que nunca se visitó (el link de un QR,
        // /t/k7f2q9): 404.html la pasa a la app, que busca el terrario en la
        // copia del catálogo guardada en el teléfono.
        if (request.mode === "navigate") return caches.match("./404.html");
        return Response.error();
      }),
  );
});
