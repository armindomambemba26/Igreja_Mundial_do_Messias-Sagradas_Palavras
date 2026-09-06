// Configuração do Firebase fornecida para este projeto.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDkVxXURmRLAdtCYjdw34yfEXeJUOaLhEM",
  authDomain: "gese-cea1a.firebaseapp.com",
  projectId: "gese-cea1a",
  storageBucket: "gese-cea1a.firebasestorage.app",
  messagingSenderId: "565503460946",
  appId: "1:565503460946:web:4ced4fc7cf002f03d1818b",
  measurementId: "G-9BNVB7XZWY"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { app };
