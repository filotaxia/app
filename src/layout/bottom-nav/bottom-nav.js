/* ============================================
   Layout — Bottom nav (nombre de la página)
   ============================================ */

// Una píldora blanca que aparece arriba del ícono tocado o apuntado con el
// mouse, mostrando el nombre de esa página (el mismo texto de su
// aria-label) — una sola píldora que viaja de ícono en ícono, no una
// etiqueta fija por cada uno (bottom-nav.css, .bottom-nav__tip).
//
//   mountBottomNavTips()   (main.js, junto con el resto del layout)

export function mountBottomNavTips() {
  const nav = document.querySelector("[data-nav]");
  if (!nav) return;

  const tip = document.createElement("span");
  tip.className = "bottom-nav__tip";
  tip.dataset.ready = "false";
  tip.setAttribute("aria-hidden", "true");
  const word = document.createElement("span");
  tip.append(word);
  nav.append(tip);

  let hideTimer = null;

  function show(link) {
    const label = link.getAttribute("aria-label");
    if (!label) return;
    clearTimeout(hideTimer);

    word.textContent = label;
    const width = Math.ceil(word.scrollWidth) + 28;
    const navRect = nav.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    const x = linkRect.left - navRect.left + linkRect.width / 2 - width / 2;

    tip.style.width = `${width}px`;
    tip.style.transform = `translateX(${x}px)`;
    tip.classList.add("is-on");

    if (tip.dataset.ready === "false") requestAnimationFrame(() => (tip.dataset.ready = "true"));
  }

  function hide() {
    hideTimer = setTimeout(() => tip.classList.remove("is-on"), 80);
  }

  // pointerover / pointerout burbujean (a diferencia de enter/leave), así que
  // un solo par de listeners en la barra alcanza para cualquier ícono; en el
  // celular el toque también los dispara, antes de la navegación
  nav.addEventListener("pointerover", (event) => {
    const link = event.target.closest(".bottom-nav__link");
    if (link) show(link);
  });

  nav.addEventListener("pointerout", (event) => {
    const from = event.target.closest(".bottom-nav__link");
    const to = event.relatedTarget?.closest?.(".bottom-nav__link");
    if (from && !to) hide();
  });

  nav.addEventListener("pointerleave", hide);
}
