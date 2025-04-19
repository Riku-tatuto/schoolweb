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
  apiKey: "...",
  authDomain: "schoolweb-db.firebaseapp.com",
  projectId: "schoolweb-db",
  storageBucket: "schoolweb-db.firebasestorage.app",
  messagingSenderId: "...",
  appId: "..."
};
initializeApp(firebaseConfig);

const auth = getAuth();
const db = getFirestore();

// 要素
const form = document.getElementById("login-form");
const googleBtn = document.getElementById("google-login-btn");
const errorMessage = document.getElementById("error-message");

// --- 通常ログイン ---
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

// --- Google ログイン（Redirect フロー） ---
googleBtn.addEventListener("click", () => {
  errorMessage.style.display = "none";
  const provider = new GoogleAuthProvider();
  signInWithRedirect(auth, provider);
});

// --- リダイレクト後の処理 ---
getRedirectResult(auth)
  .then(async result => {
    if (!result?.user) return;
    // リンクされた Google プロバイダ情報を取得
    const googleInfo = result.user.providerData.find(p => p.providerId === "google.com");
    const googleEmail = googleInfo.email;

    // Firestore で linkedGoogleEmails に含まれるかチェック
    const q = query(collection(db, "users"), where("linkedGoogleEmails", "array-contains", googleEmail));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error("この Google アカウントは連携されていません");

    const userDoc = snap.docs[0];
    sessionStorage.setItem("uid", userDoc.id);
    location.href = "home.html";
  })
  .catch(async err => {
    // 認証エラー時にサインアウトしてメッセージ
    await signOut(auth);
    errorMessage.style.display = "block";
    errorMessage.textContent = err.message;
  });
