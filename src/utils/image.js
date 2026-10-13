/* ============================================
   Utils — Image
   ============================================ */

// Achica una foto antes de guardarla: las del celular pesan varios MB y la
// Bitácora solo necesita verlas en pantalla. El lado más largo queda en
// 1200px y se guarda como JPEG (calidad 0.82): unos 150–300 KB por foto.
//
//   const blob = await shrinkPhoto(file)   // file: el File de un <input type="file">

const MAX_SIDE = 1200;
const QUALITY = 0.82;

export async function shrinkPhoto(file) {
  // createImageBitmap ya respeta la orientación de la foto (EXIF)
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITY));
}
