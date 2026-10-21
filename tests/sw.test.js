/* ============================================
   Tests — Service worker
   ============================================ */

// Carga sw.js de verdad (con node:vm) sobre un `self`, una caché y un fetch
// falsos, y le manda pedidos como lo haría el navegador sin red.
// Lo importante: un QR escaneado sin red (/t/<código>, una dirección que
// nunca se visitó) tiene que caer en 404.html, que abre la app.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
const ORIGIN = "https://app.filotaxia.com";

// cache: Map de "ruta" → Response guardada. Sin red: fetch siempre falla.
function offlineWorker(cache) {
  const listeners = {};
  const self = {
    location: { origin: ORIGIN },
    addEventListener: (type, listener) => (listeners[type] = listener),
    skipWaiting() {},
    clients: { claim() {} },
  };
  const caches = {
    match: async (request) => cache.get(typeof request === "string" ? request : new URL(request.url).pathname),
    open: async () => ({ put: async () => {}, addAll: async () => {} }),
    keys: async () => [],
  };
  const fetch = async () => { throw new TypeError("Failed to fetch"); };
  vm.runInContext(source, vm.createContext({ self, caches, fetch, URL, Response, console }));

  // Devuelve lo que el service worker responde a ese pedido
  return (path, mode) => {
    let responded;
    listeners.fetch({
      request: { url: ORIGIN + path, method: "GET", mode },
      respondWith: (promise) => (responded = promise),
    });
    return responded;
  };
}

const page404 = new Response("404.html");
const pageIndex = new Response("index.html");
const cache = new Map([["./404.html", page404], ["/index.html", pageIndex]]);

test("sin red, el link de un QR que nunca se abrió cae en 404.html", async () => {
  const request = offlineWorker(cache);
  assert.equal(await request("/t/c4kn39", "navigate"), page404);
});

test("sin red, lo que ya estaba guardado sale de la caché", async () => {
  const request = offlineWorker(cache);
  assert.equal(await request("/index.html", "navigate"), pageIndex);
});

test("sin red, un archivo que no está guardado da error (no 404.html)", async () => {
  const request = offlineWorker(cache);
  assert.equal((await request("/src/no-existe.js", "no-cors")).type, "error");
});
