// login.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  deleteUser,
  signOut
} from "https://www.gstatic.com/firebasejs/9.6.11/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js";

// --- Firebase 初期化 ---
const firebaseConfig = {
  apiKey: "AIzaSyA7zF6AG8DutMOe2PZWmr3aGZU9RhsU9-A",
  authDomain: "schoolweb-db.firebaseapp.com",
  projectId: "schoolweb-db",
  storageBucket: "schoolweb-db.firebasestorage.app",
  messagingSenderId: "324683464267",
  appId: "1:324683464267:web:f3a558fa58069c8cd397ce"
};
initializeApp(firebaseConfig);
const auth = getAuth();
const db   = getFirestore();

// --- 要素取得 ---
const form         = document.getElementById("login-form");
const googleBtn    = document.getElementById("google-login-btn");
const errorMessage = document.getElementById("error-message");

// 通常ログイン（変更なし）
form.addEventListener("submit", async e => {
  e.preventDefault();
  errorMessage.style.display = "none";
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  try {
    const q = query(collection(db, "users"), where("username", "==", username));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error("ユーザー名が見つかりません");
    const userDoc = snap.docs[0];
    await signInWithEmailAndPassword(auth, userDoc.data().email, password);
    sessionStorage.setItem("uid", userDoc.id);
    location.href = "home.html";
  } catch (err) {
    errorMessage.style.display = "block";
    errorMessage.textContent = err.message;
  }
});

// Google ログイン（Popup 方式＋未連携時に即削除）
googleBtn.addEventListener("click", async () => {
  errorMessage.style.display = "none";
  const provider = new GoogleAuthProvider();

  try {
    // 1) Google ポップアップで認証
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const googleEmail = user.providerData
      .find(p => p.providerId === "google.com")
      .email;

    // 2) Firestore に fake-email アカウントが登録されているかチェック
    const q = query(
      collection(db, "users"),
      where("linkedGoogleEmails", "array-contains", googleEmail)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      // ── 連携前の Google アカウントなら即削除 ──
      await deleteUser(user);
      await signOut(auth);
      throw new Error("この Google アカウントは連携されていません");
    }

    // 3) 連携済みならログイン成功
    const userDoc = snap.docs[0];
    sessionStorage.setItem("uid", userDoc.id);
    location.href = "home.html";

  } catch (err) {
    // deleteUser や signInWithPopup のエラーもこちらに
    await signOut(auth);
    errorMessage.style.display = "block";
    errorMessage.textContent = err.message;
  }
});
