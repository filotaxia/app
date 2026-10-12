/* ============================================
   Components — Theme dot
   ============================================ */

// El punto del nav de filotaxia.com: un círculo del color del texto.
// Al tocarlo cambia entre tema claro y oscuro (el listener lo pone la vista).

export function themeDot() {
  return `
    <button class="theme-dot" type="button" data-theme-dot aria-label="Cambiar entre tema claro y oscuro">
      <span class="theme-dot__circle" aria-hidden="true"></span>
    </button>
  `;
}
