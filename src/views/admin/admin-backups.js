/* ============================================
   Views — Admin Backups
   ============================================ */

// La pantalla de backups del panel (#/backups). Cada lunes la base guarda
// sola una copia de todos los terrarios (también los borradores) y de la
// lista de admins; acá se ven, se descargan en JSON y se puede hacer uno
// en el momento. Cómo se recupera un terrario desde un backup está escrito
// al final de supabase/migrations/20261027133539_backups.sql.

import { escapeHTML } from "../../utils/html.js";
import { arrow } from "../../utils/icons.js";
import { listBackups, getBackup, makeBackup, AdminError } from "../../store/admin.js";
import { toast } from "../../components/toast/toast.js";

const KIND_LABEL = { semanal: "Semanal", manual: "Manual" };

// "2026-10-27T06:00:00Z" → "lun 27/10/2026 · 03:00" (hora de Argentina)
const WHEN = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  weekday: "short", day: "2-digit", month: "2-digit", year: "numeric",
  hour: "2-digit", minute: "2-digit", hour12: false,
});

function formatWhen(timestamp) {
  const parts = Object.fromEntries(WHEN.formatToParts(new Date(timestamp)).map((p) => [p.type, p.value]));
  return `${parts.weekday.replace(".", "")} ${parts.day}/${parts.month}/${parts.year} · ${parts.hour}:${parts.minute}`;
}

// El nombre del archivo descargado: "filotaxia-backup-2026-10-27-12.json"
// (la fecha y el número del backup, así dos del mismo día no se pisan)
function fileName(backup) {
  const day = new Date(backup.created_at).toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
  return `filotaxia-backup-${day}-${backup.id}.json`;
}

export async function renderBackups(root) {
  let backups = null;   // null = no se pudo leer la lista (el motivo queda en problem)
  let problem = "";
  try {
    backups = await listBackups();
  } catch (error) {
    problem = error instanceof AdminError ? error.message : "No se pudo leer la lista.";
  }

  root.innerHTML = `
    <header class="admin-form__head">
      <a class="back-link" href="#/">${arrow("left")} Terrarios</a>
      <h1 class="title" tabindex="-1" data-focus>Backups</h1>
      <p class="lead">Cada lunes a las 03:00 la base guarda una copia de todos los terrarios, también los borradores.
        Sirve para ver o recuperar cómo estaba uno antes de un cambio. Las fotos, videos y MIDI no se copian:
        quedan en Storage, donde nunca se pisan ni se borran.</p>
    </header>

    <div class="admin-actions">
      <button class="btn btn--primary" type="button" data-make>Hacer backup ahora</button>
    </div>

    ${backups === null
      ? `<p class="field__error" role="alert">${escapeHTML(problem)}</p>`
      : backups.length === 0
        ? `<p class="lead">Todavía no hay backups. El primero se hace el lunes, o hacé uno ahora.</p>`
        : `<ul class="admin-list">
            ${backups.map((backup) => `
              <li class="admin-backup">
                <span class="admin-row__text">
                  <span class="admin-backup__when">${escapeHTML(formatWhen(backup.created_at))}</span>
                  <span class="admin-row__meta">
                    <span class="chip ${backup.kind === "semanal" ? "" : "admin-chip--quiet"}">${KIND_LABEL[backup.kind]}</span>
                    <span>${backup.row_count} ${backup.row_count === 1 ? "terrario" : "terrarios"}</span>
                  </span>
                </span>
                <button class="btn btn--ghost" type="button" data-download="${backup.id}">Descargar</button>
              </li>`).join("")}
          </ul>`}
  `;

  root.querySelector("[data-make]").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await makeBackup();
      toast("Backup hecho");
      await renderBackups(root);
      root.querySelector("[data-focus]")?.focus();
    } catch (error) {
      toast(error instanceof AdminError ? error.message : "No se pudo hacer el backup.");
      button.disabled = false;
    }
  });

  root.querySelectorAll("[data-download]").forEach((button) => {
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        const backup = await getBackup(button.dataset.download);
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
        save(blob, fileName(backup));
      } catch (error) {
        toast(error instanceof AdminError ? error.message : "No se pudo descargar.");
      }
      button.disabled = false;
    });
  });
}

// Baja un archivo con un link temporal (igual que los QR en admin-qr.js)
function save(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
