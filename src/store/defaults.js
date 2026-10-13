/* ============================================
   Store — Defaults
   ============================================ */

// Valor inicial de cada clave del store (lo que devuelve get() si no hay nada guardado).
//
// No hay cuentas: todo vive en el teléfono. Escanear un QR (o abrir
// su link) suma el terrario a la colección y listo.
//
//   links            terrarios escaneados: [{ id, terrario_id, linked_at, scanned_at }]
//                    (linked_at: el primer escaneo · scanned_at: el último)
//   my_terrario      id del terrario propio (el primero que se escanea)
//   care_log         cuidados hechos: [{ id, terrario_id, type: "riego" | "ventilacion", date }]
//   bitacora         notas de cada terrario: [{ id, terrario_id, date, created_at, note, photo_id }]
//                    (las fotos van aparte, en IndexedDB: store/photos.js)
//   prefs            ajustes: notificaciones y apariencia ("system" | "light" | "dark"; claro por defecto)
//   journey          pasos del recorrido que no se deducen de otros datos:
//                    { ubicado, escuchado, cuidado } (ver store/journey.js)
//   manifiesto_seen  true cuando ya vio (o salteó) el Manifiesto del primer escaneo
//   manifiesto_quote índice de la última cita que mostró el Manifiesto (content/citas.js)

export const DEFAULTS = {
  links: [],
  my_terrario: null,
  care_log: [],
  bitacora: [],
  prefs: { notifications: true, theme: "light" },
  journey: {},
  manifiesto_seen: false,
  manifiesto_quote: null,
};
