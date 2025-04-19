import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut
} from "https://www.gstatic.com/firebasejs/9.6.11/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js";

// Firebase 初期化
const firebaseConfig = {
  apiKey: "AIzaSyA7zF6AG8DutMOe2PZWmr3aGZU9RhsU9-A",
  authDomain: "schoolweb-db.firebaseapp.com",
  projectId: "schoolweb-db",
  storageBucket: "schoolweb-db.firebasestorage.app",
  messagingSenderId: "324683464267",
  appId: "1:324683464267:web:f3a558fa58069c8cd397ce"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 要素取得
const form = document.getElementById("login-form");
const googleBtn = document.getElementById("google-login-btn");
const errorMessage = document.getElementById("error-message");

// — 通常ログイン（ユーザー名＋パスワード） —
form.addEventListener("submit", async e => {
  e.preventDefault();
  errorMessage.style.display = "none";

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  try {
    const q = query(collection(db, "users"), where("username", "==", username));
    const snap = await getDocs(q);
    if (snap.empty) {
      throw new Error("ユーザー名が見つかりません");
    }
    const userDoc = snap.docs[0];
    const email = userDoc.data().email;
    await signInWithEmailAndPassword(auth, email, password);
    sessionStorage.setItem("uid", userDoc.id);
    window.location.href = "home.html";
  } catch (err) {
    errorMessage.style.display = "block";
    errorMessage.textContent = err.message;
  }
});

// — Googleログイン（Redirect フロー） —
googleBtn.addEventListener("click", () => {
  errorMessage.style.display = "none";
  const provider = new GoogleAuthProvider();
  signInWithRedirect(auth, provider);
});

// — Redirect 復帰後の結果取得・連携チェック —
getRedirectResult(auth)
  .then(async result => {
    if (!result || !result.user) return;
    // リンクしたい Google アカウント情報を取得
    const googleInfo = result.user.providerData.find(p => p.providerId === "google.com");
    const googleEmail = googleInfo.email;

    // Firestore 上の linkedGoogleEmails フィールドをチェック
    const q = query(
      collection(db, "users"),
      where("linkedGoogleEmails", "array-contains", googleEmail)
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      throw new Error("この Google アカウントは連携されていません");
    }
    const userDoc = snap.docs[0];
    sessionStorage.setItem("uid", userDoc.id);
    window.location.href = "home.html";
  })
  .catch(async err => {
    // 認証エラー時はサインアウトしてメッセージ表示
    await signOut(auth);
    errorMessage.style.display = "block";
    errorMessage.textContent = err.message;
  });
