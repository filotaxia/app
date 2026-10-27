/* ============================================
   Utils — Share card
   ============================================ */

// Dibuja la imagen para compartir en historias (1080 × 1920, el tamaño de
// Instagram), como la de Spotify: el fondo elegido y, al centro, la tarjeta
// oscura con la foto del terrario, su nombre, "Filotaxia" y el logotipo.
//
// Copia la vista previa de la hoja de compartir (components/share-sheet):
// los colores los lee del CSS de esa vista previa (getComputedStyle), así
// viven en un solo lugar y siguen al fondo que se eligió.
//
//   const blob = await shareCardImage(story, { photo, name, meta })
//     story  el elemento [data-story] de la vista previa
//     photo  la foto del terrario (puede faltar: queda el cuadrado gris)
//     → un PNG (Blob)

const W = 1080;
const H = 1920;
const CARD = 800;          // ancho de la tarjeta
const PAD = 48;            // aire adentro de la tarjeta
const PHOTO = CARD - PAD * 2;
const FONT = '"PP Neue Montreal", sans-serif';
const LOGO = new URL("../assets/images/marca/logotipo.png", import.meta.url).href;

export async function shareCardImage(story, { photo, name, meta }) {
  const card = story.querySelector("[data-card]");
  const colors = {
    background: stops(story),
    card: getComputedStyle(card).backgroundColor,
    photo: getComputedStyle(card.querySelector("[data-photo]")).backgroundColor,
    text: getComputedStyle(card.querySelector("[data-name]")).color,
    muted: getComputedStyle(card.querySelector("[data-meta]")).color,
  };

  await document.fonts.load(`500 80px ${FONT}`);
  const [image, logo] = await Promise.all([loadImage(photo), loadImage(LOGO)]);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Fondo: un color o un degradado de arriba hacia abajo
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, colors.background[0]);
  gradient.addColorStop(1, colors.background.at(-1));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  // La tarjeta, centrada: foto · nombre · "Filotaxia" · logotipo
  const cardHeight = PAD + PHOTO + 56 + 80 + 8 + 52 + 64 + 36 + PAD;
  const x = (W - CARD) / 2;
  let y = (H - cardHeight) / 2;
  ctx.fillStyle = colors.card;
  ctx.fillRect(x, y, CARD, cardHeight);
  y += PAD;

  ctx.fillStyle = colors.photo;
  ctx.fillRect(x + PAD, y, PHOTO, PHOTO);
  if (image) drawCover(ctx, image, x + PAD, y, PHOTO);
  y += PHOTO + 56;

  ctx.textBaseline = "top";
  ctx.fillStyle = colors.text;
  ctx.font = `500 80px ${FONT}`;
  ctx.fillText(name, x + PAD, y);
  y += 80 + 8;

  ctx.fillStyle = colors.muted;
  ctx.font = `500 52px ${FONT}`;
  ctx.fillText(meta, x + PAD, y);
  y += 52 + 64;

  if (logo) {
    const logoWidth = (36 / logo.height) * logo.width;
    ctx.drawImage(tint(logo, colors.text), x + PAD, y, logoWidth, 36);
  }

  try {
    return await new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject()), "image/png"));
  } catch {
    // Una foto de otro sitio sin permiso (CORS) "ensucia" el canvas y no se
    // puede exportar: se vuelve a dibujar sin la foto
    return image ? shareCardImage(story, { photo: "", name, meta }) : null;
  }
}

// Los colores del fondo de la vista previa: los del degradado, o el color liso
function stops(element) {
  const style = getComputedStyle(element);
  return style.backgroundImage.match(/rgba?\([^)]*\)/g) ?? [style.backgroundColor];
}

// La foto recortada al cuadrado, como object-fit: cover
function drawCover(ctx, image, x, y, size) {
  const side = Math.min(image.naturalWidth, image.naturalHeight);
  const sx = (image.naturalWidth - side) / 2;
  const sy = (image.naturalHeight - side) / 2;
  ctx.drawImage(image, sx, sy, side, side, x, y, size, size);
}

// El logotipo es un PNG negro con transparencia: se pinta del color del texto
function tint(image, color) {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

// Carga una imagen; si no hay o falla, null (la tarjeta se dibuja igual)
async function loadImage(src) {
  if (!src) return null;
  const image = new Image();
  image.crossOrigin = "anonymous";   // fotos de Supabase Storage: sin esto no se puede exportar
  image.src = src;
  try {
    await image.decode();
    return image;
  } catch {
    return null;
  }
}
