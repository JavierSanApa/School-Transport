// Importar Firebase desde CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } 
  from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } 
  from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { writeBatch } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// ⚡ Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAwmwaFOCadhTo-djyfFxDFgCPoKd1-rbs",
  authDomain: "school-transport-ae17e.firebaseapp.com",
  projectId: "school-transport-ae17e",
  storageBucket: "school-transport-ae17e.firebasestorage.app",
  messagingSenderId: "977609305371",
  appId: "1:977609305371:web:e54eba1fdae7608f42b7be"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elementos del DOM
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const loginSection = document.getElementById("login-section");
const userSection = document.getElementById("user-section");
const userInfo = document.getElementById("user-info");
const childrenSection = document.getElementById("children-section");
const childrenList = document.getElementById("children-list");
const welcomeSection = document.getElementById("welcome-section");
const shiftSelector = document.getElementById("shift-selector");
const markAllBtn = document.getElementById("mark-all-btn");
const resetBtn = document.getElementById("reset-btn");

let currentUser = null;

// Función para cargar niños según turno
async function loadChildren(shift) {
  if (!currentUser) return;
  childrenList.innerHTML = `
    <li class="list-group-item text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="mt-2">Cargando lista de niños...</p>
    </li>
  `;

  try {
    const q = query(
      collection(db, "children"),
      where("responsible", "==", currentUser.uid),
      where("shift", "==", shift) // Filtrar por turno
    );
    const snapshot = await getDocs(q);

    childrenList.innerHTML = "";
    if (snapshot.empty) {
      childrenList.innerHTML = `
        <li class="list-group-item text-center py-4">
          <i class="bi bi-exclamation-circle text-warning fs-1"></i>
          <p class="mt-2">No hay niños en este turno</p>
        </li>
      `;
      markAllBtn.disabled = true;
      return;
    }

    // Construir lista
    snapshot.forEach(docSnap => {
      const child = docSnap.data();
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.dataset.status = child.status || "pendiente";

      const childInfo = document.createElement("div");
      childInfo.className = "d-flex align-items-center";
      childInfo.innerHTML = `
        <i class="bi bi-person-badge me-3 fs-4 text-primary"></i>
        <div>
          <p class="mb-1"><strong>Nombre:</strong> ${child.name}</p>
          <p class="mb-1"><strong>Dirección:</strong> ${child.address}</p>
          <p class="mb-1"><strong>Teléfono:</strong> ${child.phone}</p>
          <p class="mb-1"><strong>Email:</strong> ${child.email}</p>
          <span class="badge ${child.status === 'recogido' ? 'bg-success' : child.status === 'entregado' ? 'bg-primary' : 'bg-warning'} rounded-pill">
            ${child.status || "pendiente"}
          </span>
        </div>
      `;

      const button = document.createElement("button");
      button.className = "btn btn-sm mt-2 mt-sm-0";

      if (child.status === "recogido") {
        button.classList.add("btn-warning");
        button.innerHTML = `<i class="bi bi-box-arrow-in-right me-1"></i> Marcar como entregado`;
      } else if (child.status === "entregado") {
        button.disabled = true;
        button.className = "btn btn-sm btn-secondary mt-2 mt-sm-0";
        button.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i> Entregado`;
      } else {
        button.classList.add("btn-success");
        button.innerHTML = `<i class="bi bi-check-circle me-1"></i> Marcar como recogido`;
      }

      button.addEventListener("click", async () => {
        try {
          button.disabled = true;
          button.innerHTML = `<i class="bi bi-hourglass-split me-1"></i> Actualizando...`;

          let newStatus;
          if (child.status === "pendiente" || !child.status) newStatus = "recogido";
          else if (child.status === "recogido") newStatus = "entregado";

          await updateDoc(doc(db, "children", docSnap.id), { status: newStatus });

          const statusBadge = childInfo.querySelector(".badge");
          if (newStatus === "recogido") {
            statusBadge.className = "ms-2 badge bg-success rounded-pill";
            statusBadge.textContent = "recogido";
            button.disabled = false;
            button.className = "btn btn-sm btn-warning mt-2 mt-sm-0";
            button.innerHTML = `<i class="bi bi-box-arrow-in-right me-1"></i> Marcar como entregado`;
          } else if (newStatus === "entregado") {
            statusBadge.className = "ms-2 badge bg-primary rounded-pill";
            statusBadge.textContent = "entregado";
            button.className = "btn btn-sm btn-secondary mt-2 mt-sm-0";
            button.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i> Entregado`;
            button.disabled = true;
          }

          const subject = `Estado de ${child.name}`;
          const body = `Estimado/a responsable de ${child.name},%0D%0A%0D%0A${child.name} ha sido ${newStatus} por ${currentUser.displayName}.%0D%0A%0D%0ASaludos cordiales,%0D%0AEquipo CODI Transport`;
          window.location.href = `mailto:${child.email}?subject=${encodeURIComponent(subject)}&body=${body}`;

        } catch (err) {
          console.error(err);
          button.disabled = false;
          button.innerHTML = `<i class="bi bi-exclamation-triangle me-1"></i> Error, reintentar`;
        }
      });

      li.appendChild(childInfo);
      li.appendChild(button);
      childrenList.appendChild(li);
    });

    updateMarkAllBtn(snapshot);

  } catch (err) {
    console.error(err);
    childrenList.innerHTML = `<li class="list-group-item text-center py-4">
      <i class="bi bi-exclamation-triangle text-danger fs-1"></i>
      <p class="mt-2">Error al cargar los datos</p>
    </li>`;
  }
}

// Actualizar texto y color del botón "Marcar todos"
function updateMarkAllBtn(snapshot) {
  if (!markAllBtn) return;
  let allPending = snapshot.docs.every(d => d.data().status === "pendiente" || !d.data().status);
  let allRecogidos = snapshot.docs.every(d => d.data().status === "recogido");
  let allEntregados = snapshot.docs.every(d => d.data().status === "entregado");

  if (allPending) {
    markAllBtn.className = "btn btn-success btn-sm";
    markAllBtn.innerHTML = `<i class="bi bi-check-circle me-1"></i> Marcar todos recogidos`;
    markAllBtn.disabled = false;
  } else if (allRecogidos) {
    markAllBtn.className = "btn btn-warning btn-sm";
    markAllBtn.innerHTML = `<i class="bi bi-box-arrow-in-right me-1"></i> Marcar todos entregados`;
    markAllBtn.disabled = false;
  } else if (allEntregados) {
    markAllBtn.className = "btn btn-secondary btn-sm";
    markAllBtn.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i> Todos entregados`;
    markAllBtn.disabled = true;
  } else {
    markAllBtn.className = "btn btn-success btn-sm";
    markAllBtn.innerHTML = `<i class="bi bi-check-circle me-1"></i> Marcar todos recogidos`;
    markAllBtn.disabled = false;
  }
}

// Login / Logout
loginBtn.addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

// Detectar usuario logueado
onAuthStateChanged(auth, user => {
  if (user) {
    currentUser = user;
    loginSection.classList.add("d-none");
    welcomeSection.classList.add("d-none");
    userSection.classList.remove("d-none");
    childrenSection.classList.remove("d-none");
    userInfo.innerHTML = `<i class="bi bi-person-circle me-1"></i> Hola, <span class="text-primary">${user.displayName}</span>`;
    loadChildren(shiftSelector.value);
  } else {
    currentUser = null;
    loginSection.classList.remove("d-none");
    welcomeSection.classList.remove("d-none");
    userSection.classList.add("d-none");
    childrenSection.classList.add("d-none");
  }
});

// Cambiar turno
shiftSelector?.addEventListener("change", () => {
  loadChildren(shiftSelector.value);
});

// Botón Resetear
resetBtn?.addEventListener("click", async () => {
  if (!currentUser) return;
  resetBtn.disabled = true;
  resetBtn.innerHTML = `<i class="bi bi-hourglass-split me-1"></i> Reseteando...`;

  try {
    const q = query(
      collection(db, "children"),
      where("responsible", "==", currentUser.uid),
      where("shift", "==", shiftSelector.value)
    );
    const snapshot = await getDocs(q);
    const updates = snapshot.docs.map(docSnap => updateDoc(doc(db, "children", docSnap.id), { status: "pendiente" }));
    await Promise.all(updates);
    alert("✅ Niños reseteados a pendiente");
    loadChildren(shiftSelector.value);
  } catch (err) {
    console.error(err);
    alert("❌ Error al resetear");
  } finally {
    resetBtn.disabled = false;
    resetBtn.innerHTML = `<i class="bi bi-arrow-counterclockwise me-1"></i> Resetear a pendiente`;
  }
});

// Botón Marcar todos
markAllBtn?.addEventListener("click", async () => {
  if (!currentUser) return;
  markAllBtn.disabled = true;

  try {
    const q = query(
      collection(db, "children"),
      where("responsible", "==", currentUser.uid),
      where("shift", "==", shiftSelector.value)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return alert("No hay niños en este turno");

    const allStatuses = snapshot.docs.map(d => d.data().status || "pendiente");
    let nextStatus = allStatuses.every(s => s === "pendiente") ? "recogido"
                     : allStatuses.every(s => s === "recogido") ? "entregado"
                     : "entregado";

    const updates = snapshot.docs.map(docSnap => updateDoc(doc(db, "children", docSnap.id), { status: nextStatus }));
    await Promise.all(updates);

    const subject = nextStatus === "recogido" ? "Niños recogidos" : "Niños entregados";
    const bodyLines = snapshot.docs.map(d => `${d.data().name} ha sido ${nextStatus}.`);
    const body = `Estimados responsables,%0D%0A%0D%0A${bodyLines.join("%0D%0A")}%0D%0A%0D%0ASaludos cordiales,%0D%0AEquipo CODI Transport`;
    const emails = snapshot.docs.map(d => d.data().email).join(",");
    window.location.href = `mailto:${emails}?subject=${encodeURIComponent(subject)}&body=${body}`;

    loadChildren(shiftSelector.value);
  } catch (err) {
    console.error(err);
    alert("❌ Error al marcar todos");
  } finally {
    markAllBtn.disabled = false;
  }
});
