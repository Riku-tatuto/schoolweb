import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

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

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const errorMessage = document.getElementById("error-message");

  try {
    const q = query(collection(db, "users"), where("username", "==", username));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      errorMessage.style.display = "block";
      errorMessage.textContent = "ユーザー名が見つかりません";
      return;
    }

    const userDoc = snapshot.docs[0];
    const email = userDoc.data().email;

    await signInWithEmailAndPassword(auth, email, password);
    sessionStorage.setItem("uid", userDoc.id); // 後でユーザーデータ取得用に保存
    location.href = "home.html";
  } catch (error) {
    errorMessage.style.display = "block";
    errorMessage.textContent = "ログイン失敗：" + error.message;
  }
});
