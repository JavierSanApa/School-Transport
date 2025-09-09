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
    loginSection.classList.add("d-none");
    userSection.classList.remove("d-none");
    childrenSection.classList.remove("d-none");

    userInfo.textContent = `Hola, ${user.displayName}`;

    // Cargar niños desde Firestore
    childrenList.innerHTML = "";
    const snapshot = await getDocs(collection(db, "children"));
    snapshot.forEach(docSnap => {
      const child = docSnap.data();
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML = `
        ${child.name} - Estado: ${child.status || "pendiente"}
        <button class="btn btn-sm btn-success">Recogido</button>
      `;

      li.querySelector("button").addEventListener("click", async () => {
        await updateDoc(doc(db, "children", docSnap.id), {
          status: "recogido"
        });
        li.innerHTML = `${child.name} - Estado: recogido`;
      });

      childrenList.appendChild(li);
    });

  } else {
    loginSection.classList.remove("d-none");
    userSection.classList.add("d-none");
    childrenSection.classList.add("d-none");
  }
});
