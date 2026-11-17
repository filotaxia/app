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
//   #/backups       las copias semanales de la base (admin-backups.js)
// Sin sesión, cualquiera de ellas muestra "Entrar".

import { escapeHTML } from "../../utils/html.js";
import { arrow, icon, googleMark } from "../../utils/icons.js";
import { formatDate } from "../../utils/format.js";
import { applyTheme } from "../../utils/theme.js";
import { get, set, subscribe } from "../../store/store.js";
import { terrariumArt } from "../../components/terrarium-art/terrarium-art.js";
import { settingsLink } from "../../components/settings-link/settings-link.js";
import { segmented } from "../../components/segmented/segmented.js";
import { openSheet } from "../../components/sheet/sheet.js";
import { toast } from "../../components/toast/toast.js";
import {
  signIn, signInWithGoogle, completeOAuthRedirect, signOut, changePassword, currentUser, isAdmin,
  listTerrarios, publicFileURL, AdminError,
} from "../../store/admin.js";
import { renderForm } from "./admin-form.js";
import { qrFor } from "./admin-qr.js";
import { renderBackups } from "./admin-backups.js";
import { mountBottomNavTips } from "../../layout/bottom-nav/bottom-nav.js";

const root = document.querySelector("[data-admin]");
const navEl = document.querySelector("[data-nav]");
const STATUS_LABEL = { borrador: "Borrador", publicado: "Publicado", retirado: "Retirado" };
const THEME_OPTIONS = [
  { value: "system", label: "Auto" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
];

// La apariencia es del store (store/store.js: el mismo localStorage de la
// app, claves en común), así que Ajustes del panel y Ajustes de la app
// comparten el valor: cambiarlo en uno se ve en el otro.
applyTheme((await get("prefs")).theme);
subscribe("prefs", (prefs) => applyTheme(prefs.theme));

// Muestra/oculta la barra (la misma del front, con las páginas del panel) y
// marca la activa. `section` null: sin sesión (Entrar, Sin permiso, error).
function setNav(section) {
  root.toggleAttribute("data-nav", section !== null);
  navEl.toggleAttribute("hidden", section === null);
  navEl.querySelectorAll("[data-route]").forEach((link) => {
    if (link.dataset.route === section) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

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
    return row ? showForm(row) : renderList();
  }
  if (screen === "imprimir") return renderPrint();
  if (screen === "ajustes") return renderAjustes(user);
  if (screen === "backups") {
    setNav("backups");
    await renderBackups(root);
    if (!stale()) done();
    return;
  }
  return renderList();
}

// Después de pintar: arriba de todo y el foco en el título (lectores de pantalla)
function done() {
  window.scrollTo(0, 0);
  root.querySelector("[data-focus]")?.focus();
}

/* ---------------------------------------- */
/* Entrar */
/* ---------------------------------------- */

// Un campo con el label flotante: arranca adentro, de placeholder, y sube
// afuera del borde (con un hueco, como un <fieldset> con <legend>) apenas
// se escribe algo o se entra en foco. El password suma el ojo que muestra
// u oculta lo escrito.
function authField({ id, label, type, autocomplete }) {
  const secret = type === "password";
  return `
    <div class="admin-field${secret ? " admin-field--secret" : ""}">
      <input
        class="admin-field__input" id="${id}" name="${id}"
        type="${type}" autocomplete="${autocomplete}" placeholder=" " required
      />
      <label class="admin-field__label" for="${id}">${label}</label>
      ${secret ? `
        <button class="admin-field__eye" type="button" data-eye aria-label="Mostrar contraseña">
          ${icon("eye")}${icon("eye-off")}
        </button>
      ` : ""}
    </div>
  `;
}

function renderLogin() {
  setNav(null);
  root.innerHTML = `
    <section class="admin-login">
      <h1 class="title" tabindex="-1" data-focus>Entrar</h1>
      <form class="admin-login__form" novalidate data-login>
        ${authField({ id: "email", label: "Email", type: "email", autocomplete: "username" })}
        ${authField({ id: "password", label: "Contraseña", type: "password", autocomplete: "current-password" })}
        <p class="field__error" role="alert" data-error hidden></p>
        <button class="btn btn--primary btn--block" type="submit">Entrar</button>
      </form>
      <p class="auth-divider"><span>o</span></p>
      <button class="btn btn--ghost btn--block auth-google" type="button" data-google>
        ${googleMark()} Continuar con Google
      </button>
    </section>
  `;
  done();

  const form = root.querySelector("[data-login]");

  // El ojo del password: solo cambia el tipo del campo, no toca el foco
  const password = form.elements.password;
  const eye = form.querySelector("[data-eye]");
  eye.addEventListener("click", () => {
    const shown = password.type === "text";
    password.type = shown ? "password" : "text";
    eye.closest(".admin-field").dataset.show = String(!shown);
    eye.setAttribute("aria-label", shown ? "Mostrar contraseña" : "Ocultar contraseña");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const error = root.querySelector("[data-error]");
    const button = form.querySelector("button[type=submit]");
    const email = form.elements.email.value.trim();
    const pass = password.value;
    if (!email || !pass) {
      error.textContent = "Escribí tu email y tu contraseña.";
      error.hidden = false;
      return;
    }
    button.disabled = true;
    try {
      await signIn(email, pass);
      route();
    } catch (failure) {
      error.textContent = failure instanceof AdminError ? failure.message : "No se pudo entrar.";
      error.hidden = false;
      button.disabled = false;
    }
  });

  root.querySelector("[data-google]").addEventListener("click", signInWithGoogle);
}

function renderNoAccess(user) {
  setNav(null);
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
  setNav(null);
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

async function renderList() {
  setNav("lista");
  const published = rows.filter((row) => row.status === "publicado").length;
  let view = (await get("prefs")).admin_terrarios_view ?? "list";

  root.innerHTML = `
    <header class="admin-head">
      <div>
        <h1 class="title" tabindex="-1" data-focus>Terrarios</h1>
        <p class="lead">${rows.length} en total · ${published} publicados</p>
      </div>
      <div class="collection-head__tools">
        <label class="view-toggle">
          <input type="checkbox" role="switch" data-view-toggle aria-label="Ver en lista" ${view === "list" ? "checked" : ""} />
          <span class="view-toggle__track" aria-hidden="true">
            <span class="view-toggle__thumb"></span>
            ${icon("layout-grid", "view-toggle__icon view-toggle__icon--grid")}
            ${icon("list", "view-toggle__icon view-toggle__icon--list")}
          </span>
        </label>
        ${settingsLink()}
      </div>
    </header>

    <ul data-admin-list></ul>
  `;
  done();

  const list = root.querySelector("[data-admin-list]");
  const paint = () => {
    list.className = view === "list" ? "admin-list" : "collection";
    list.innerHTML = view === "list" ? rows.map(listRow).join("") : rows.map(tile).join("");

    // Los QR chiquitos de cada fila (solo en lista), cuando carga la librería
    if (view !== "list") return;
    rows.forEach(async (row) => {
      const box = root.querySelector(`[data-qr-row="${row.id}"]`);
      try {
        box.innerHTML = (await qrFor(row)).svg;
      } catch {
        // sin la librería (sin red): la fila se ve igual, sin el QR
      }
    });
  };
  paint();

  root.querySelector("[data-view-toggle]").addEventListener("change", async (event) => {
    view = event.target.checked ? "list" : "gallery";
    paint();
    await set("prefs", { ...(await get("prefs")), admin_terrarios_view: view });
  });
}

function listRow(row) {
  return `
    <li>
      <a class="admin-row" href="#/editar/${escapeHTML(row.id)}">
        <span class="admin-row__photo">${terrariumArt({ photo: escapeHTML(publicFileURL(row.photo)), size: "sm" })}</span>
        <span class="admin-row__text">
          <span class="admin-row__name">${escapeHTML(row.model)}</span>
          <span class="admin-row__meta">
            <span>${STATUS_LABEL[row.status]}</span>
            ${row.recorded ? `<span>${formatDate(row.recorded)}</span>` : ""}
          </span>
        </span>
        <span class="admin-row__qr" data-qr-row="${escapeHTML(row.id)}"></span>
        ${arrow()}
      </a>
    </li>`;
}

// Como collection__tile del front, pero cada tarjeta lleva a editarlo
function tile(row) {
  return `
    <li>
      <a class="collection__tile" href="#/editar/${escapeHTML(row.id)}">
        ${terrariumArt({ photo: escapeHTML(publicFileURL(row.photo)), size: "sm" })}
        <span class="admin-tile__row">
          <span class="collection__name">${escapeHTML(row.model)}</span>
          <span class="admin-row__meta"><span>${STATUS_LABEL[row.status]}</span></span>
        </span>
      </a>
    </li>`;
}

/* ---------------------------------------- */
/* Ajustes */
/* ---------------------------------------- */

// Como la de la app (apariencia, la misma lista): acá suma la cuenta que
// entró, cambiar su contraseña y cerrar sesión. Se llega desde el punto
// de arriba a la derecha, igual que en el front.
async function renderAjustes(user) {
  setNav("ajustes");
  const prefs = await get("prefs");
  root.innerHTML = `
    <a class="back-link" href="#/">${arrow("left")} Terrarios</a>
    <h1 class="title" tabindex="-1" data-focus>Ajustes</h1>

    <nav class="list" aria-label="Ajustes">
      <div class="list-row">
        <span aria-hidden="true">Apariencia</span>
        ${segmented({ name: "theme", legend: "Apariencia", value: prefs.theme ?? "light", options: THEME_OPTIONS })}
      </div>
      <div class="list-row">
        <span>Cuenta</span>
        <span class="lead">${escapeHTML(user.email)}</span>
      </div>
      ${user.provider === "google"
        ? `<div class="list-row"><span class="lead">Entraste con Google: no tiene contraseña para cambiar.</span></div>`
        : `<button class="list-row" type="button" data-password>Cambiar contraseña ${arrow()}</button>`}
    </nav>

    <button class="btn btn--ghost btn--block" type="button" data-out>Cerrar sesión</button>
  `;
  done();

  // La apariencia se guarda al toque, como en la app (y se ve ahí también:
  // mismo store, misma clave)
  root.querySelector('[data-segmented="theme"]').addEventListener("change", async (event) => {
    await set("prefs", { ...(await get("prefs")), theme: event.target.value });
  });

  root.querySelector("[data-password]")?.addEventListener("click", openChangePassword);
  root.querySelector("[data-out]").addEventListener("click", logOut);
}

function openChangePassword() {
  const sheet = openSheet({
    title: "Cambiar contraseña",
    body: `
      <form novalidate data-password-form>
        <div class="field">
          <label class="field__label eyebrow" for="new-password">Contraseña nueva</label>
          <input class="field__input" id="new-password" name="password" type="password"
            autocomplete="new-password" minlength="6" required />
        </div>
        <p class="field__error" role="alert" data-error hidden></p>
        <button class="btn btn--primary btn--block" type="submit">Guardar</button>
      </form>
    `,
  });

  const form = sheet.element.querySelector("[data-password-form]");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const error = form.querySelector("[data-error]");
    const button = form.querySelector("button");
    const password = form.elements.password.value;
    if (password.length < 6) {
      error.textContent = "Al menos 6 caracteres.";
      error.hidden = false;
      return;
    }
    button.disabled = true;
    try {
      await changePassword(password);
      sheet.close();
      toast("Contraseña actualizada");
    } catch (failure) {
      error.textContent = failure instanceof AdminError ? failure.message : "No se pudo cambiar la contraseña.";
      error.hidden = false;
      button.disabled = false;
    }
  });
}

/* ---------------------------------------- */
/* Formulario */
/* ---------------------------------------- */

function showForm(row) {
  setNav(row ? null : "nuevo");   // editar no es una página propia de la barra; nuevo sí
  renderForm(root, {
    row,
    rows,
    onSaved: (saved) => {
      const target = `#/editar/${saved.id}`;
      if (location.hash === target) route();
      else location.hash = target;   // dispara hashchange → route()
    },
    onDeleted: () => {
      if (location.hash === "#/") route();
      else location.hash = "#/";
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
  setNav("imprimir");
  root.innerHTML = `
    <div class="admin-print__controls">
      <h1 class="title" tabindex="-1" data-focus>Imprimir QR</h1>
      <p class="lead">Elegí cuáles. Cada QR es el link https://app.filotaxia.com/t/&lt;código&gt; de su terrario y no cambia nunca.
        Antes de imprimir en el material final, escaneá uno impreso en papel común.</p>
      <fieldset class="admin-checks" data-pick>
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

mountBottomNavTips();
window.addEventListener("hashchange", route);
// Si se viene de elegir la cuenta en Google, guardar esa sesión antes de
// que el router lea el hash (ahí vienen sus tokens, no una pantalla)
completeOAuthRedirect().catch(() => {}).then(route);
