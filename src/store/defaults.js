/* ============================================
   Store — Defaults
   ============================================ */

// Valor inicial de cada clave del store (lo que devuelve get() si no hay nada guardado).
//
// No hay cuentas: todo vive en el teléfono. Escanear un QR (o abrir
// su link) suma el terrario a la colección y listo.
//
//   links            terrarios escaneados: [{ id, terrario_id, linked_at }]
//   my_terrario      id del terrario propio (el primero que se escanea; se puede cambiar)
//   care_log         cuidados hechos: [{ id, terrario_id, type: "riego" | "ventilacion", date }]
//   last_played      último terrario escuchado (para "Escuchar" en la barra)
//   prefs            ajustes: notificaciones y apariencia ("system" | "light" | "dark")

export const DEFAULTS = {
  links: [],
  my_terrario: null,
  care_log: [],
  last_played: null,
  prefs: { notifications: true, theme: "system" },
};
