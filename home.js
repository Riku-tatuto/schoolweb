import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA7zF6AG8DutMOe2PZWmr3aGZU9RhsU9-A",
  authDomain: "schoolweb-db.firebaseapp.com",
  projectId: "schoolweb-db",
  storageBucket: "schoolweb-db.firebasestorage.app",
  messagingSenderId: "324683464267",
  appId: "1:324683464267:web:f3a558fa58069c8cd397ce"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "index.html";
    return;
  }

  const uid = sessionStorage.getItem("uid");
  if (!uid) {
    location.href = "index.html";
    return;
  }

  const userDoc = await getDoc(doc(db, "users", uid));
  if (userDoc.exists()) {
    const data = userDoc.data();
    const message = `ようこそ、${data.course}コースの${data.grade}年${data.class}組${data.number}番${data.realName}さん！`;
    document.getElementById("welcome").textContent = message;
  } else {
    document.getElementById("welcome").textContent = "ユーザー情報が見つかりません。";
  }
});

document.getElementById("logout").addEventListener("click", () => {
  signOut(auth).then(() => {
    sessionStorage.clear();
    location.href = "index.html";
  });
});
