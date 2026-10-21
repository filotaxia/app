/* ============================================
   Store — Supabase config
   ============================================ */

// Dirección del proyecto de Supabase ("App", organización Filotaxia) y su
// clave pública. La clave publishable es pública a propósito: va en el
// navegador y solo deja hacer lo que permiten las reglas de la base (RLS):
// leer los terrarios publicados. La clave secreta (service_role / sb_secret)
// NUNCA va acá ni en ningún archivo del repo, que es público.

export const SUPABASE_URL = "https://hsokwxemfnhrmtpuwhxd.supabase.co";
export const SUPABASE_KEY = "sb_publishable_yKske4Irpcbs-kaRiQh3fA_t7Z0_Ev6";
