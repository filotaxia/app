/* ============================================
   Utils — Catalog
   ============================================ */

// Convierte una fila de la tabla `terrarios` de Supabase en el terrario
// que usan las vistas (la misma forma que tenía content/terrarios.js):
//
//   rowToTerrario(row, storageBase) → { id, model, qr_code, photo, midi: { plantas, sustrato }, … }
//
// - Los null de la base pasan a undefined: las vistas preguntan con ?? y ?.
// - Los archivos (foto, video, MIDI) pueden ser una ruta local de la app
//   ("src/assets/…"), un link completo ("https://…") o una ruta dentro del
//   Storage de Supabase ("07/foto.jpg"); a esta última se le antepone storageBase.

export function rowToTerrario(row, storageBase) {
  const file = (path) => {
    if (path == null) return undefined;
    return path.startsWith("src/") || path.startsWith("http") ? path : storageBase + path;
  };
  const value = (field) => row[field] ?? undefined;

  const terrario = {
    id: row.id,
    model: row.model,
    qr_code: value("qr_code"),
    status: value("status"),
    recorded: value("recorded"),
    duration: value("duration"),
    story: value("story"),
    photo: file(row.photo),
    video: file(row.video),
    specs: value("specs"),
    plants: value("plants"),
    waves: value("waves"),
    care: row.care,
  };

  // Las dos secuencias MIDI de los Biodata (audio/lanes.js); si falta una, se simula
  if (row.midi_plantas || row.midi_sustrato) {
    terrario.midi = { plantas: file(row.midi_plantas), sustrato: file(row.midi_sustrato) };
  }
  return terrario;
}
