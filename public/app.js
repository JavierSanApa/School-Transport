// Importar Firebase desde CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } 
  from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, updateDoc } 
  from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

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

// Login con Google
loginBtn.addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
});

// Logout
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

// Detectar usuario logueado
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Ocultar sección de login y bienvenida
    loginSection.classList.add("d-none");
    welcomeSection.classList.add("d-none");

    // Mostrar sección de usuario y niños
    userSection.classList.remove("d-none");
    childrenSection.classList.remove("d-none");

    userInfo.innerHTML = `<i class="bi bi-person-circle me-1"></i> Hola, <span class="text-primary">${user.displayName}</span>`;

    // Mostrar indicador de carga
    childrenList.innerHTML = `
      <li class="list-group-item text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="mt-2">Cargando lista de niños...</p>
      </li>
    `;

    // Cargar niños desde Firestore
    try {
      const snapshot = await getDocs(collection(db, "children"));

      // Limpiar el indicador de carga
      childrenList.innerHTML = "";

      // Si no hay niños, mostrar mensaje
      if (snapshot.empty) {
        childrenList.innerHTML = `
          <li class="list-group-item text-center py-4">
            <i class="bi bi-exclamation-circle text-warning fs-1"></i>
            <p class="mt-2">No hay niños registrados en el sistema</p>
          </li>
        `;
        return;
      }

      snapshot.forEach(docSnap => {
        const child = docSnap.data();
        const li = document.createElement("li");
        li.className = "list-group-item";

        // Crear un contenedor para la información del niño
        const childInfo = document.createElement("div");
        childInfo.className = "d-flex align-items-center";

        // Información del niño
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

        // Crear botón dinámico
        const button = document.createElement("button");
        button.className = "btn btn-sm mt-2 mt-sm-0";

        if (child.status === 'recogido') {
          button.classList.add("btn-warning");
          button.innerHTML = `<i class="bi bi-box-arrow-in-right me-1"></i> Marcar como entregado`;
        } else if (child.status === 'entregado') {
          button.disabled = true;
          button.className = "btn btn-sm btn-secondary mt-2 mt-sm-0";
          button.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i> Entregado`;
        } else {
          button.classList.add("btn-success");
          button.innerHTML = `<i class="bi bi-check-circle me-1"></i> Marcar como recogido`;
        }

        // Evento del botón
        button.addEventListener("click", async () => {
          try {
            button.disabled = true;
            button.innerHTML = `<i class="bi bi-hourglass-split me-1"></i> Actualizando...`;

            let newStatus;
            if (child.status === 'pendiente' || !child.status) {
              newStatus = 'recogido';
            } else if (child.status === 'recogido') {
              newStatus = 'entregado';
            }

            await updateDoc(doc(db, "children", docSnap.id), { status: newStatus });

            // Actualizar UI
            const statusBadge = childInfo.querySelector('.badge');
            if (newStatus === 'recogido') {
              statusBadge.className = "ms-2 badge bg-success rounded-pill";
              statusBadge.textContent = "recogido";

              button.disabled = false;
              button.className = "btn btn-sm btn-warning mt-2 mt-sm-0";
              button.innerHTML = `<i class="bi bi-box-arrow-in-right me-1"></i> Marcar como entregado`;
              child.status = 'recogido';
            } else if (newStatus === 'entregado') {
              statusBadge.className = "ms-2 badge bg-primary rounded-pill";
              statusBadge.textContent = "entregado";

              button.className = "btn btn-sm btn-secondary mt-2 mt-sm-0";
              button.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i> Entregado`;
              button.disabled = true;
              child.status = 'entregado';
            }
          } catch (error) {
            console.error("Error al actualizar:", error);
            button.disabled = false;
            button.innerHTML = `<i class="bi bi-exclamation-triangle me-1"></i> Error, reintentar`;
          }
        });

        // Añadir elementos a la lista
        li.appendChild(childInfo);
        li.appendChild(button);
        childrenList.appendChild(li);
      });

    } catch (error) {
      console.error("Error al cargar los niños:", error);
      childrenList.innerHTML = `
        <li class="list-group-item text-center py-4">
          <i class="bi bi-exclamation-triangle text-danger fs-1"></i>
          <p class="mt-2">Error al cargar los datos</p>
          <button id="retry-btn" class="btn btn-primary mt-2">
            <i class="bi bi-arrow-clockwise me-1"></i>Reintentar
          </button>
        </li>
      `;

      document.getElementById("retry-btn").addEventListener("click", () => {
        onAuthStateChanged(auth, () => {});
      });
    }

  } else {
    // Mostrar sección de login y bienvenida
    loginSection.classList.remove("d-none");
    welcomeSection.classList.remove("d-none");

    // Ocultar sección de usuario y niños
    userSection.classList.add("d-none");
    childrenSection.classList.add("d-none");
  }
});

// Botón resetear estados a "pendiente"
const resetBtn = document.getElementById("reset-btn");

if (resetBtn) {
  resetBtn.addEventListener("click", async () => {
    resetBtn.disabled = true;
    resetBtn.innerHTML = `<i class="bi bi-hourglass-split me-1"></i> Reseteando...`;

    try {
      const snapshot = await getDocs(collection(db, "children"));
      const updates = snapshot.docs.map(docSnap =>
        updateDoc(doc(db, "children", docSnap.id), { status: "pendiente" })
      );
      await Promise.all(updates);

      alert("✅ Todos los niños han sido reseteados a pendiente");

      // Recargar la página
      location.reload();

      // Recargar la lista en pantalla
      onAuthStateChanged(auth, () => {});

    } catch (error) {
      console.error("Error al resetear:", error);
      alert("❌ Error al resetear los estados");
    } finally {
      resetBtn.disabled = false;
      resetBtn.innerHTML = `<i class="bi bi-arrow-counterclockwise me-1"></i> Resetear a pendiente`;
    }
  });
}
