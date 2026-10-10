/* ============================================
   Camera — QR Camera
   ============================================ */

// Cámara trasera + lector de QR, para cualquier celular.
//
//   const stop = startQrCamera(video, {
//     onCode: (text) => { ... },       // cada código leído (texto crudo del QR)
//     onState: (state) => { ... },     // "starting" | "active" | "denied" | "unavailable" | "insecure"
//   });
//   stop();                            // apaga la cámara (al salir de la vista)
//
// Para leer el QR usa lo que tenga el navegador:
//   - BarcodeDetector (nativo, rápido): Chrome en Android.
//   - jsQR (librería chica, se baja del CDN solo si hace falta): Safari en
//     iPhone y el resto. Lee el cuadro de video dibujándolo en un canvas.
//
// La cámara solo anda con https (o en localhost): si no, avisa "insecure".

const JSQR_URL = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/+esm";
const SCAN_EVERY_MS = 200;
const MAX_SIDE = 640;   // se achica el cuadro antes de leerlo: más rápido, igual de preciso

export function startQrCamera(video, { onCode, onState }) {
  let stream = null;
  let timer = null;
  let stopped = false;

  function stop() {
    stopped = true;
    clearTimeout(timer);
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
  }

  (async () => {
    if (!window.isSecureContext) return onState("insecure");
    if (!navigator.mediaDevices?.getUserMedia) return onState("unavailable");

    onState("starting");
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
    } catch (error) {
      // NotAllowedError: la persona dijo que no (o lo bloqueó en ajustes)
      onState(error.name === "NotAllowedError" ? "denied" : "unavailable");
      return;
    }
    if (stopped) return stop();

    video.srcObject = stream;
    await video.play().catch(() => {});

    const read = await createReader();
    if (stopped) return stop();
    onState("active");

    const loop = async () => {
      if (stopped) return;
      const text = video.readyState >= 2 ? await read(video).catch(() => null) : null;
      if (text && !stopped) onCode(text);
      if (!stopped) timer = setTimeout(loop, SCAN_EVERY_MS);
    };
    loop();
  })();

  return stop;
}

// Devuelve una función (video) => texto del QR o null
async function createReader() {
  if ("BarcodeDetector" in window) {
    const formats = await BarcodeDetector.getSupportedFormats().catch(() => []);
    if (formats.includes("qr_code")) {
      const detector = new BarcodeDetector({ formats: ["qr_code"] });
      return async (video) => (await detector.detect(video))[0]?.rawValue ?? null;
    }
  }

  const { default: jsQR } = await import(JSQR_URL);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  return async (video) => {
    const scale = Math.min(1, MAX_SIDE / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(data, width, height, { inversionAttempts: "dontInvert" })?.data ?? null;
  };
}
