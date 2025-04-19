// login.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  fetchSignInMethodsForEmail,
  EmailAuthProvider,
  linkWithCredential,
  signOut
} from "https://www.gstatic.com/firebasejs/9.6.11/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  arrayUnion
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

// --- 通常ログイン ---
form.addEventListener("submit", async e => {
  e.preventDefault();
  errorMessage.style.display = "none";

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  try {
    // ユーザー名から Firestore ドキュメントを検索
    const q = query(
      collection(db, "users"),
      where("username", "==", username)
    );
    const snap = await getDocs(q);
    if (snap.empty) throw new Error("ユーザー名が見つかりません");

    const userDoc = snap.docs[0];
    // メール + パスワードでサインイン
    await signInWithEmailAndPassword(auth, userDoc.data().email, password);

    // セッション保存・リダイレクト
    sessionStorage.setItem("uid", userDoc.id);
    location.href = "home.html";

  } catch (err) {
    // エラー表示
    errorMessage.style.display = "block";
    errorMessage.textContent = err.message;
  }
});

// --- Google ログイン（Popup方式 + 既存アカウントマージ対応） ---
googleBtn.addEventListener("click", async () => {
  errorMessage.style.display = "none";
  const provider = new GoogleAuthProvider();

  try {
    // 1) ポップアップで Google サインイン
    const result = await signInWithPopup(auth, provider);
    const googleEmail = result.user.providerData
      .find(p => p.providerId === "google.com")
      .email;

    // 2) Firestore で linkedGoogleEmails 配列に含まれるかチェック
    const q = query(
      collection(db, "users"),
      where("linkedGoogleEmails", "array-contains", googleEmail)
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      // 連携されていなければエラー
      throw new Error("この Google アカウントは連携されていません");
    }

    // 3) ログイン成功 → uid 保存・リダイレクト
    const userDoc = snap.docs[0];
    sessionStorage.setItem("uid", userDoc.id);
    location.href = "home.html";

  } catch (error) {
    // 既存メールと別プロバイダの衝突（例：パスワード認証済み）の場合
    if (error.code === 'auth/account-exists-with-different-credential') {
      try {
        const pendingCred = GoogleAuthProvider.credentialFromError(error);
        const email       = error.customData.email;

        // どのサインイン方法が使われているか調べる
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.includes(EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD)) {
          // パスワード認証で再ログインしてマージ
          const password = prompt('このメールはすでに登録済みです。パスワードを入力してください:');
          const userCred = await signInWithEmailAndPassword(auth, email, password);

          // Google 資格情報をリンク
          await linkWithCredential(userCred.user, pendingCred);

          // Firestore 側の linkedGoogleEmails 配列にも追加
          const userRef = doc(db, "users", userCred.user.uid);
          await updateDoc(userRef, {
            linkedGoogleEmails: arrayUnion(email)
          });

          // マージ後、ホームへ遷移
          sessionStorage.setItem("uid", userCred.user.uid);
          location.href = "home.html";
          return;
        }
      } catch (mergeError) {
        // マージ中のエラーもキャッチして下部でエラー表示
        error = mergeError;
      }
    }

    // それ以外の失敗時はサインアウト＆エラー表示
    await signOut(auth);
    errorMessage.style.display = "block";
    errorMessage.textContent = error.message;
  }
});
