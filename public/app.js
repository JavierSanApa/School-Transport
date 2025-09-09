// Importar Firebase desde CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } 
  from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, updateDoc } 
  from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// ⚡ Aquí pegas tu configuración de Firebase
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
      
      // Añadir icono y nombre del niño con estilo
      childInfo.innerHTML = `
        <i class="bi bi-person-badge me-2 fs-5 text-primary"></i>
        <div>
          <strong>${child.name}</strong>
          <span class="ms-2 badge ${child.status === 'recogido' ? 'bg-success' : 'bg-warning'} rounded-pill">
            ${child.status || "pendiente"}
          </span>
        </div>
      `;
      
      // Crear botón con icono
      const button = document.createElement("button");
      button.className = "btn btn-sm btn-success mt-2 mt-sm-0";
      button.innerHTML = `<i class="bi bi-check-circle me-1"></i> Marcar como recogido`;
      
      // Si ya está recogido, deshabilitar el botón
      if (child.status === 'recogido') {
        button.disabled = true;
        button.className = "btn btn-sm btn-secondary mt-2 mt-sm-0";
        button.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i> Recogido`;
      }
      
      // Añadir elementos al li
      li.appendChild(childInfo);
      li.appendChild(button);

      button.addEventListener("click", async () => {
        try {
          button.disabled = true;
          button.innerHTML = `<i class="bi bi-hourglass-split me-1"></i> Actualizando...`;
          
          await updateDoc(doc(db, "children", docSnap.id), {
            status: "recogido"
          });
          
          // Actualizar la UI
          const statusBadge = childInfo.querySelector('.badge');
          statusBadge.className = "ms-2 badge bg-success rounded-pill";
          statusBadge.textContent = "recogido";
          
          button.className = "btn btn-sm btn-secondary mt-2 mt-sm-0";
          button.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i> Recogido`;
        } catch (error) {
          console.error("Error al actualizar:", error);
          button.disabled = false;
          button.innerHTML = `<i class="bi bi-exclamation-triangle me-1"></i> Error, reintentar`;
        }
      });

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
      
      // Añadir evento para reintentar
      document.getElementById("retry-btn").addEventListener("click", () => {
        // Simular un cambio en el estado de autenticación para recargar
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
