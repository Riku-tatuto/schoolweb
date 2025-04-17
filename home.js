// home.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

// Firebase設定（login.jsと同じにする）
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "XXXXXXXXXXXX",
  appId: "APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
  const userInfo = document.getElementById("user-info");
  if (user) {
    userInfo.textContent = `ログイン中: ${user.email}`;
  } else {
    location.href = "index.html"; // 未ログインなら戻す
  }
});

document.getElementById("logout-button").addEventListener("click", () => {
  signOut(auth).then(() => {
    location.href = "index.html";
  });
});
