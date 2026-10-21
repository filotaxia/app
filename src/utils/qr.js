/* ============================================
   Utils — QR
   ============================================ */

// Lee lo que trae el QR pegado en la base de cada terrario y devuelve su
// código ("k7f2q9"), o null si no es un QR de Filotaxia.
//
// El QR impreso es siempre el link https://app.filotaxia.com/t/<código>
// (también vale el de la app: …/#/t/<código>). El código son 6 caracteres
// sin los que se confunden (sin 0 o 1 l i); lo genera Supabase y no cambia
// nunca. Los formatos viejos por número ("04", "filotaxia:04",
// …/#/terrario/04) ya no conectan: un terrario se conecta solo escaneándolo.

const CODE = /^[a-hjkmnp-z2-9]{6}$/;

export function parseQrLink(raw) {
  const match = String(raw ?? "").match(/\/t\/([a-z0-9]+)/i);
  if (!match) return null;
  const code = match[1].toLowerCase();
  return CODE.test(code) ? code : null;
}
