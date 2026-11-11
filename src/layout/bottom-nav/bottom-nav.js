/* ============================================
   Layout — Bottom Nav
   ============================================ */

// Como Instagram: la píldora arranca un poco más grande arriba de todo y se
// achica apenas se empieza a scrollear (bottom-nav.css, .is-scrolled). La
// página scrollea con la ventana (app-shell.css), así que alcanza con un
// solo listener acá, para toda la app.

export function bindBottomNav() {
  const nav = document.querySelector(".bottom-nav");
  const paint = () => nav.classList.toggle("is-scrolled", window.scrollY > 0);
  document.addEventListener("scroll", paint, { passive: true });
  paint();
}
