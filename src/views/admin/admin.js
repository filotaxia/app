/* ============================================
   Views — Admin
   ============================================ */

// El panel de carga (/admin/): una página interna, sin link desde la app.
// Solo entra quien tiene usuario en Supabase Auth, y solo puede escribir si
// su email está en la tabla `admins` (lo controla la base, no esta página).
//
// Pantallas (con su propia dirección después del #, así se pueden recargar):
//   #/              lista de terrarios (todos, también los borradores)
//   #/nuevo         terrario nuevo
//   #/editar/07     editar uno (con su QR)
//   #/imprimir      hoja con los QR elegidos, lista para imprimir
// Sin sesión, cualquiera de ellas muestra "Entrar".

import { escapeHTML } from "../../utils/html.js";
import { arrow, icon } from "../../utils/icons.js";
import { formatTime, formatDate } from "../../utils/format.js";
import { terrariumArt } from "../../components/terrarium-art/terrarium-art.js";
import { signIn, signOut, currentUser, isAdmin, listTerrarios, publicFileURL, AdminError } from "../../store/admin.js";
import { renderForm } from "./admin-form.js";
import { qrFor } from "./admin-qr.js";

const root = document.querySelector("[data-admin]");
const STATUS_LABEL = { borrador: "Borrador", publicado: "Publicado", retirado: "Retirado" };

let rows = [];   // las filas de la última lista
let visit = 0;   // cuenta los cambios de pantalla (ver abajo)

async function route() {
  // Si se cambia de pantalla mientras esta todavía espera a Supabase,
  // gana la última: esta no pinta nada
  const current = ++visit;
  const stale = () => current !== visit;

  const user = await currentUser();
  if (stale()) return;
  if (!user) return renderLogin();

  try {
    const admin = await isAdmin();
    if (stale()) return;
    if (!admin) return renderNoAccess(user);
    rows = await listTerrarios();
    if (stale()) return;
  } catch (error) {
    if (stale()) return;
    // La sesión venció o no sirve (store/admin.js la borra): a entrar de nuevo
    if (!(await currentUser())) return renderLogin();
    return renderProblem(error);
  }

  const [, screen, id] = location.hash.replace(/^#\/?/, "/").split("/");
  if (screen === "nuevo") return showForm(null);
  if (screen === "editar") {
    const row = rows.find((r) => r.id === id);
    return row ? showForm(row) : renderList(user);
  }
  if (screen === "imprimir") return renderPrint();
  return renderList(user);
}

// Después de pintar: arriba de todo y el foco en el título (lectores de pantalla)
function done() {
  window.scrollTo(0, 0);
  root.querySelector("[data-focus]")?.focus();
}

/* ---------------------------------------- */
/* Entrar */
/* ---------------------------------------- */

function renderLogin() {
  root.innerHTML = `
    <section class="admin-login">
      <p class="eyebrow">Filotaxia · Panel interno</p>
      <h1 class="title" tabindex="-1" data-focus>Entrar</h1>
      <p class="lead">Para cargar y editar terrarios. La app no tiene cuentas: esto es solo para el panel.</p>
      <form class="admin-login__form" novalidate data-login>
        <div class="field">
          <label class="field__label eyebrow" for="email">Email</label>
          <input class="field__input" id="email" name="email" type="email" autocomplete="username" required />
        </div>
        <div class="field">
          <label class="field__label eyebrow" for="password">Contraseña</label>
          <input class="field__input" id="password" name="password" type="password" autocomplete="current-password" required />
        </div>
        <p class="field__error" role="alert" data-error hidden></p>
        <button class="btn btn--primary btn--block" type="submit">Entrar</button>
      </form>
    </section>
  `;
  done();

  const form = root.querySelector("[data-login]");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const error = root.querySelector("[data-error]");
    const button = form.querySelector("button");
    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;
    if (!email || !password) {
      error.textContent = "Escribí tu email y tu contraseña.";
      error.hidden = false;
      return;
    }
    button.disabled = true;
    try {
      await signIn(email, password);
      route();
    } catch (failure) {
      error.textContent = failure instanceof AdminError ? failure.message : "No se pudo entrar.";
      error.hidden = false;
      button.disabled = false;
    }
  });
}

function renderNoAccess(user) {
  root.innerHTML = `
    <section class="admin-login">
      <p class="eyebrow">${escapeHTML(user.email)}</p>
      <h1 class="title" tabindex="-1" data-focus>Sin permiso</h1>
      <p class="lead">Esta cuenta puede entrar, pero no está en la lista de admins, así que no puede ver ni cambiar terrarios.
        Para sumarla, agregá su email a la tabla <code>admins</code> en Supabase.</p>
      <button class="btn btn--ghost btn--block" type="button" data-out>Salir</button>
    </section>
  `;
  root.querySelector("[data-out]").addEventListener("click", logOut);
  done();
}

function renderProblem(error) {
  root.innerHTML = `
    <section class="admin-login">
      <h1 class="title" tabindex="-1" data-focus>No se pudo cargar</h1>
      <p class="lead">${escapeHTML(error.message)}</p>
      <button class="btn btn--primary btn--block" type="button" data-retry>Probar de nuevo</button>
    </section>
  `;
  root.querySelector("[data-retry]").addEventListener("click", route);
  done();
}

async function logOut() {
  await signOut();
  location.hash = "#/";
  route();
}

/* ---------------------------------------- */
/* Lista */
/* ---------------------------------------- */

function renderList(user) {
  const published = rows.filter((row) => row.status === "publicado").length;
  root.innerHTML = `
    <header class="admin-head">
      <div>
        <p class="eyebrow">Panel · ${escapeHTML(user.email)}</p>
        <h1 class="title" tabindex="-1" data-focus>Terrarios</h1>
        <p class="lead">${rows.length} en total · ${published} publicados</p>
      </div>
      <button class="admin-head__out" type="button" data-out>Salir</button>
    </header>

    <div class="admin-actions">
      <a class="btn btn--primary" href="#/nuevo">${icon("plus", "admin-actions__icon")} Nuevo terrario</a>
      <a class="btn btn--ghost" href="#/imprimir">Imprimir QR</a>
    </div>

    <ul class="admin-list">
      ${rows.map((row) => `
        <li>
          <a class="admin-row" href="#/editar/${escapeHTML(row.id)}">
            <span class="admin-row__photo">${terrariumArt({ photo: escapeHTML(publicFileURL(row.photo)), size: "sm" })}</span>
            <span class="admin-row__text">
              <span class="admin-row__name">${escapeHTML(row.model)}</span>
              <span class="admin-row__meta">
                <span class="chip ${row.status === "publicado" ? "" : "admin-chip--quiet"}">${STATUS_LABEL[row.status]}</span>
                ${row.duration ? `<span>${formatTime(row.duration)}</span>` : ""}
                ${row.recorded ? `<span>${formatDate(row.recorded)}</span>` : ""}
              </span>
            </span>
            <span class="admin-row__qr" data-qr-row="${escapeHTML(row.id)}"></span>
            ${arrow()}
          </a>
        </li>`).join("")}
    </ul>
  `;
  root.querySelector("[data-out]").addEventListener("click", logOut);
  done();

  // Los QR chiquitos de cada fila, cuando carga la librería
  rows.forEach(async (row) => {
    const box = root.querySelector(`[data-qr-row="${row.id}"]`);
    try {
      box.innerHTML = (await qrFor(row)).svg;
    } catch {
      // sin la librería (sin red): la fila se ve igual, sin el QR
    }
  });
}

/* ---------------------------------------- */
/* Formulario */
/* ---------------------------------------- */

function showForm(row) {
  renderForm(root, {
    row,
    rows,
    onSaved: (saved) => {
      const target = `#/editar/${saved.id}`;
      if (location.hash === target) route();
      else location.hash = target;   // dispara hashchange → route()
    },
  });
  done();
}

/* ---------------------------------------- */
/* Imprimir */
/* ---------------------------------------- */

// Reemplaza a imprimir-qr.html: se eligen los terrarios (de entrada, los
// publicados) y se imprime una hoja con su QR, su código y su link.
function renderPrint() {
  root.innerHTML = `
    <div class="admin-print__controls">
      <a class="back-link" href="#/">${arrow("left")} Terrarios</a>
      <h1 class="title" tabindex="-1" data-focus>Imprimir QR</h1>
      <p class="lead">Elegí cuáles. Cada QR es el link https://app.filotaxia.com/t/&lt;código&gt; de su terrario y no cambia nunca.
        Antes de imprimir en el material final, escaneá uno impreso en papel común.</p>
      <fieldset class="admin-checks admin-checks--row" data-pick>
        <legend class="visually-hidden">Terrarios a imprimir</legend>
        ${rows.map((row) => `
          <label class="admin-check">
            <input type="checkbox" value="${escapeHTML(row.id)}" ${row.status === "publicado" ? "checked" : ""} />
            <span>${escapeHTML(row.model)}</span>
            <span class="admin-check__note">${STATUS_LABEL[row.status]}</span>
          </label>`).join("")}
      </fieldset>
      <button class="btn btn--primary" type="button" data-print>Imprimir</button>
    </div>
    <div class="admin-print__grid" data-grid></div>
  `;
  done();

  const grid = root.querySelector("[data-grid]");
  const cards = {};   // id → HTML de su tarjeta

  async function paint() {
    const ids = [...root.querySelectorAll("[data-pick] input:checked")].map((box) => box.value);
    for (const id of ids) {
      if (cards[id]) continue;
      const row = rows.find((r) => r.id === id);
      const { link, svg } = await qrFor(row);
      cards[id] = `
        <article class="admin-print__card">
          ${svg}
          <p class="admin-print__name">${escapeHTML(row.model)}</p>
          <p class="admin-print__link">${escapeHTML(link)}</p>
        </article>`;
    }
    grid.innerHTML = ids.map((id) => cards[id]).join("");
  }

  root.querySelector("[data-pick]").addEventListener("change", paint);
  root.querySelector("[data-print]").addEventListener("click", () => window.print());
  paint().catch(() => { grid.textContent = "No se pudieron dibujar los QR (¿sin conexión?)."; });
}

window.addEventListener("hashchange", route);
route();
