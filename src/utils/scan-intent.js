/* ============================================
   Utils — Scan intent
   ============================================ */

// Recuerda que el próximo terrario que se abra llega de un escaneo.
//
// Un terrario se conecta SOLO escaneando su QR: el link /t/<código>
// (views/qr) lo marca acá y después abre la ficha, que pregunta si llegó
// escaneando. Escribir #/terrario/03 en la barra no conecta nada.
//
//   markScanIntent("03")
//   takeScanIntent("03")  → true (una sola vez; la siguiente da false)
//
// Vive en memoria: una recarga la borra.

let pending = null;

export function markScanIntent(id) {
  pending = id;
}

export function takeScanIntent(id) {
  if (pending !== id) return false;
  pending = null;
  return true;
}
