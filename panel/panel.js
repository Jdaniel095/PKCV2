const API = "https://script.google.com/macros/s/AKfycbzEpIAkxL3tWHsl80XUp6DfHp3n8pspK7mG_JZtI5snfM8yU5wKkBVnBTTbe1BxNZXwJQ/exec";
let ROLE = "";
let CURRENT_USER = "";

/* ================= LOGIN CON ENTER ================= */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const btn  = form.querySelector("button");

  form.addEventListener("submit", function(e) {
    e.preventDefault();

    if (btn.disabled) return; // evita múltiples envíos

    const user = document.getElementById("user").value.trim();
    const pin  = document.getElementById("pin").value.trim();

    if (!user || !pin) {
      alert("Completa los datos");
      return;
    }

    // 🔥 Estado visual
    btn.disabled = true;
    btn.textContent = "Ingresando…";

    fetch(`${API}?accion=login&user=${encodeURIComponent(user)}&pin=${encodeURIComponent(pin)}`)
      .then(r => r.json())
      .then(res => {
        if (!res.ok) {
          alert("Acceso denegado");
          btn.disabled = false;
          btn.textContent = "Ingresar";
          return;
        }

        ROLE = res.role;
        CURRENT_USER = user;

        document.getElementById("login").style.display = "none";
        document.getElementById("panel").style.display = "block";

        cargar();
      })
      .catch(() => {
        alert("Error de conexión");
        btn.disabled = false;
        btn.textContent = "Ingresar";
      });
  });
});


/* ================= CARGAR DATOS ================= */
function cargar() {
  document.getElementById("loading").style.display = "flex";

  fetch(`${API}?accion=panelListar`)
    .then(r => r.json())
    .then(data => {
      renderTabla(data);
      document.getElementById("loading").style.display = "none";
    })
    .catch(() => {
      document.getElementById("loading").style.display = "none";
      toast("Error cargando registros", "error");
    });
}

/* ================= RENDER TABLA ================= */
function renderTabla(registros) {
  const tbody = document.getElementById("tablaBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!registros.length) {
    tbody.innerHTML = `<tr><td colspan="5">No hay registros pendientes</td></tr>`;
    return;
  }

  registros.forEach(r => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td data-label="Nombre">${r.nombre}</td>
      <td data-label="Pokémon">${r.pokemon}</td>
      <td data-label="Código">${r.codigo}</td>
      <td data-label="Campfire">${r.campfire || "-"}</td>
      <td class="acciones">
        <button class="action-btn aprobar" onclick="aprobar(${r.fila}, this)">✔ Aprobar</button>
        <button class="action-btn rechazar" onclick="rechazar(${r.fila}, this)">✖ Rechazar</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

/* ================= ACCIONES ================= */
function aprobar(fila, btn) {
  const tr = btn.closest("tr");
  tr.classList.add("aprobado");

  fetch(`${API}?accion=aprobar&fila=${fila}&user=${CURRENT_USER}`)
    .then(() => toast(`Aprobado por ${CURRENT_USER} ✔`));
}

function rechazar(fila, btn) {
  const tr = btn.closest("tr");
  tr.classList.add("rechazado");

  fetch(`${API}?accion=rechazar&fila=${fila}&user=${CURRENT_USER}`)
    .then(() => toast(`Rechazado por ${CURRENT_USER} ✖`, "error"));
}

/* ================= PUBLICAR CAMBIOS ================= */
function actualizarDatos() {
  const btn = document.getElementById("btnActualizar");
  btn.disabled = true;
  btn.textContent = "Publicando...";

  fetch(`${API}?accion=limpiarCache`)
    .then(() => toast("Datos publicados correctamente ✔"))
    .catch(() => toast("Error al publicar", "error"))
    .finally(() => {
      btn.disabled = false;
      btn.textContent = "🔄 Publicar cambios";
    });
}

/* ================= TOAST ================= */
function toast(msg, tipo = "ok") {
  const box = document.getElementById("toastBox");
  const div = document.createElement("div");

  div.className = `toast ${tipo}`;
  div.textContent = msg;

  box.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

