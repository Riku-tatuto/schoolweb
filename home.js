import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, doc, getDocs, collection, query, where } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyA7zF6AG8DutMOe2PZWmr3aGZU9RhsU9-A",
  authDomain: "schoolweb-db.firebaseapp.com",
  projectId: "schoolweb-db",
  storageBucket: "schoolweb-db.appspot.com",
  messagingSenderId: "324683464267",
  appId: "1:324683464267:web:f3a558fa58069c8cd397ce"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

onAuthStateChanged(auth, async (user) => {
  const welcomeEl = document.getElementById("welcome-message");

  if (user) {
    // Firestoreからユーザー情報を取得
    const q = query(collection(db, "users"), where("email", "==", user.email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const data = querySnapshot.docs[0].data();
      const courseLabel = data.course.toUpperCase(); // AGなど
      const message = `ようこそ、${courseLabel}コースの${data.grade}年${data.class}組${data.number}番${data.fullname}さん！`;
      welcomeEl.textContent = message;
    } else {
      welcomeEl.textContent = "ユーザー情報が見つかりません。";
    }
  } else {
    location.href = "index.html";
  }
});

document.getElementById("logout").addEventListener("click", () => {
  signOut(auth).then(() => {
    location.href = "index.html";
  });
});
