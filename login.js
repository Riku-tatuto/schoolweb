// login.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

// 🔧 Firebase設定（あなたのプロジェクトに置き換えてね）
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

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const errorMessage = document.getElementById("error-message");

  try {
    // ユーザー名からメールを取得
    const q = query(collection(db, "users"), where("username", "==", username));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      errorMessage.textContent = "ユーザー名が見つかりません";
      return;
    }

    const email = snapshot.docs[0].data().email;

    // ログイン
    await signInWithEmailAndPassword(auth, email, password);
    location.href = "home.html"; // ログイン成功で遷移
  } catch (error) {
    errorMessage.textContent = "ログイン失敗：" + error.message;
  }
});
