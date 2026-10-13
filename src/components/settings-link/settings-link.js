/* ============================================
   Components — Settings link
   ============================================ */

// El acceso a Ajustes, arriba a la derecha de cada pantalla (como el avatar
// del header de Pulso): Ajustes ya no está en la barra de abajo.
// Es el punto del nav de filotaxia.com: un círculo del color del texto.
// Lo usan el header (index.html, con el mismo HTML) y las pantallas con
// encabezado propio (Mi terrario, la ficha, Escanear).

export function settingsLink() {
  return `
    <a class="settings-link" href="#/ajustes" aria-label="Ajustes">
      <span class="settings-link__dot" aria-hidden="true"></span>
    </a>
  `;
}
