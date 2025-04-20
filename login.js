// login.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  GithubAuthProvider,
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
const githubBtn    = document.getElementById("github-login-btn");
const errorMessage = document.getElementById("error-message");

// 通常ログイン
form.addEventListener("submit", async e => {
  e.preventDefault();
  errorMessage.style.display = "none";
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  try {
    const q = query(
      collection(db, "users"),
      where("username", "==", username)
    );
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

// Googleログイン
googleBtn.addEventListener("click", async () => {
  errorMessage.style.display = "none";
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const googleEmail = result.user.providerData
      .find(p => p.providerId === "google.com").email;

    const q = query(
      collection(db, "users"),
      where("linkedGoogleEmails", "array-contains", googleEmail)
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      // 未連携なら Auth 上の一時ユーザーを削除
      await deleteUser(result.user);
      await signOut(auth);
      throw new Error("この Google アカウントは連携されていません");
    }

    const userDoc = snap.docs[0];
    sessionStorage.setItem("uid", userDoc.id);
    location.href = "home.html";
  } catch (err) {
    errorMessage.style.display = "block";
    errorMessage.textContent = err.message;
  }
});

// GitHubログイン
githubBtn.addEventListener("click", async () => {
  errorMessage.style.display = "none";
  const provider = new GithubAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const ghEmail = result.user.providerData
      .find(p => p.providerId === "github.com").email;

    const q = query(
      collection(db, "users"),
      where("linkedGitHubEmails", "array-contains", ghEmail)
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      await deleteUser(result.user);
      await signOut(auth);
      throw new Error("この GitHub アカウントは連携されていません");
    }

    const userDoc = snap.docs[0];
    sessionStorage.setItem("uid", userDoc.id);
    location.href = "home.html";
  } catch (err) {
    errorMessage.style.display = "block";
    errorMessage.textContent = err.message;
  }
});
