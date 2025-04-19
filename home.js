import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  linkWithRedirect,
  getRedirectResult,
  unlink
} from "https://www.gstatic.com/firebasejs/9.6.11/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc
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
const db = getFirestore();

// --- グローバル変数 ---
let currentUserRef = null;
let linkedAccounts = [];

// --- リダイレクト後のリンク結果を受け取る ---
getRedirectResult(auth)
  .then(async (result) => {
    if (!result?.user || !currentUserRef) return;
    // Googleプロバイダ情報だけ取り出す
    const googleInfo = result.user.providerData.find(p => p.providerId === "google.com");
    if (!googleInfo) return;

    // Firestore の linkedGoogleAccounts に追加
    linkedAccounts.push({
      email: googleInfo.email,
      displayName: googleInfo.displayName
    });
    await updateDoc(currentUserRef, { linkedGoogleAccounts: linkedAccounts });
    renderAccountList();
  })
  .catch(err => {
    console.error("リンク結果取得エラー:", err);
  });

// --- 要素参照 ---
const menuHome       = document.getElementById("menu-home");
const menuTimetable  = document.getElementById("menu-timetable");
const menuAccount    = document.getElementById("menu-account");
const homeSection    = document.getElementById("home-section");
const timetableSection = document.getElementById("timetable-section");
const accountSection = document.getElementById("account-section");
const logoutBtn      = document.getElementById("logout");
const welcomeEl      = document.getElementById("welcome-message");
const timetableBody  = document.getElementById("timetable-body");
const accountListEl  = document.getElementById("account-list");
const linkGoogleBtn  = document.getElementById("link-google-btn");

// --- メニュー切り替え ---
function showSection(sec) {
  [homeSection, timetableSection, accountSection].forEach(s => s.style.display = "none");
  document.querySelectorAll(".menu-item").forEach(i => i.classList.remove("active"));
  if (sec === "home") {
    homeSection.style.display = "block";
    menuHome.classList.add("active");
  } else if (sec === "timetable") {
    timetableSection.style.display = "block";
    menuTimetable.classList.add("active");
    renderTimetable();
  } else {
    accountSection.style.display = "block";
    menuAccount.classList.add("active");
    renderAccountList();
  }
}
menuHome.onclick      = () => showSection("home");
menuTimetable.onclick = () => showSection("timetable");
menuAccount.onclick   = () => showSection("account");

// --- ログアウト ---
logoutBtn.onclick = async () => {
  await signOut(auth);
  location.href = "index.html";
};

// --- 認証状態監視 ---
onAuthStateChanged(auth, async user => {
  if (!user) return location.href = "index.html";

  // Firestore のユーザードキュメント参照
  const uid = sessionStorage.getItem("uid");
  currentUserRef = doc(db, "users", uid);
  const snap = await getDoc(currentUserRef);
  if (!snap.exists()) return;

  const data = snap.data();
  // ようこそメッセージ
  welcomeEl.textContent =
    `ようこそ ${data.course}コースの${data.grade}年${data.class}組${data.number}番 ${data.realName}さん！`;

  // 既に連携済みのアカウントを読み込む
  linkedAccounts = data.linkedGoogleAccounts || [];
});

// --- Google連携ボタン ---
linkGoogleBtn.onclick = () => {
  const provider = new GoogleAuthProvider();
  // 既存ユーザーに Google プロバイダをリンク（Redirect フロー）
  linkWithRedirect(auth.currentUser, provider);
};

// --- 時間割描画（省略。既存ロジックをここに） ---
async function renderTimetable() {
  // ... あなたの既存のコード ...
}

// --- アカウント一覧描画 ---
function renderAccountList() {
  accountListEl.innerHTML = "";
  if (linkedAccounts.length === 0) {
    accountListEl.textContent = "連携中の Google アカウントはありません。";
    return;
  }
  linkedAccounts.forEach((acc, i) => {
    const div = document.createElement("div");
    div.className = "account-item";
    div.innerHTML = `
      <span>${acc.displayName||acc.email}</span>
      <button class="unlink-btn" data-i="${i}">連携解除</button>
    `;
    accountListEl.appendChild(div);
  });
  document.querySelectorAll(".unlink-btn").forEach(btn => {
    btn.onclick = async (e) => {
      const i = +e.target.dataset.i;
      // Auth側のunlink
      await unlink(auth.currentUser, "google.com");
      linkedAccounts.splice(i, 1);
      await updateDoc(currentUserRef, { linkedGoogleAccounts: linkedAccounts });
      renderAccountList();
    };
  });
}

// --- 初期はホーム表示 ---
showSection("home");
