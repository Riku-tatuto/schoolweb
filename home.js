import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "XXXXXXX",
  appId: "APP_ID"
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
