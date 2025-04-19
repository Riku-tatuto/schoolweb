import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  linkWithPopup
} from "https://www.gstatic.com/firebasejs/9.6.11/firebase-auth.js";

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
const db = getFirestore(app);
const auth = getAuth(app);

// 要素参照
const menuHome = document.getElementById("menu-home");
const menuTimetable = document.getElementById("menu-timetable");
const menuAccount = document.getElementById("menu-account");
const homeSection = document.getElementById("home-section");
const timetableSection = document.getElementById("timetable-section");
const accountSection = document.getElementById("account-section");
const logoutBtn = document.getElementById("logout");
const welcomeEl = document.getElementById("welcome-message");
const userInfoEl = document.getElementById("user-info");
const timetableBody = document.getElementById("timetable-body");
const accountListEl = document.getElementById("account-list");
const linkGoogleBtn = document.getElementById("link-google-btn");

let currentUserDocRef = null;
let linkedAccounts = [];

// メニュー切り替え共通
function showSection(sec) {
  [homeSection, timetableSection, accountSection].forEach(s => s.style.display = "none");
  document.querySelectorAll(".menu-item").forEach(i => i.classList.remove("active"));
  switch(sec) {
    case "home":
      homeSection.style.display = "block";
      menuHome.classList.add("active");
      break;
    case "timetable":
      timetableSection.style.display = "block";
      menuTimetable.classList.add("active");
      loadTimetable();
      break;
    case "account":
      accountSection.style.display = "block";
      menuAccount.classList.add("active");
      renderAccountList();
      break;
  }
}
menuHome.addEventListener("click", () => showSection("home"));
menuTimetable.addEventListener("click", () => showSection("timetable"));
menuAccount.addEventListener("click", () => showSection("account"));

// ログアウト
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  location.href = "index.html";
});

// ログイン状態確認 & ユーザーデータ取得
onAuthStateChanged(auth, async user => {
  if (!user) return location.href = "index.html";
  const uid = sessionStorage.getItem("uid");
  currentUserDocRef = doc(db, "users", uid);
  const userSnap = await getDoc(currentUserDocRef);
  if (!userSnap.exists()) {
    welcomeEl.textContent = "ユーザー情報が見つかりません。";
    return;
  }
  const data = userSnap.data();
  welcomeEl.textContent = `ようこそ ${data.course}コースの${data.grade}年${data.class}組${data.number}番 ${data.realName}さん！`;
  userInfoEl.textContent = `メール: ${user.email}`;
  linkedAccounts = data.linkedGoogleAccounts || [];
});

// 時間割読み込み
async function loadTimetable() {
  // ... 既存の renderTimetable ロジックをここに記述 ...
}

// アカウント一覧表示
function renderAccountList() {
  accountListEl.innerHTML = "";
  if (linkedAccounts.length === 0) {
    accountListEl.textContent = "連携中の Google アカウントはありません。";
    return;
  }
  linkedAccounts.forEach((acct, i) => {
    const div = document.createElement("div");
    div.className = "account-item";
    div.innerHTML = `
      <span>${acct.displayName || acct.email}</span>
      <button class="unlink-btn" data-index="${i}">連携解除</button>
    `;
    accountListEl.appendChild(div);
  });
  document.querySelectorAll(".unlink-btn").forEach(btn => {
    btn.addEventListener("click", async e => {
      const idx = +e.target.dataset.index;
      linkedAccounts.splice(idx, 1);
      await updateDoc(currentUserDocRef, { linkedGoogleAccounts: linkedAccounts });
      renderAccountList();
    });
  });
}

// Google 連携
linkGoogleBtn.addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await linkWithPopup(auth.currentUser, provider);
    // Googleプロバイダ情報だけ取り出す
    const googleInfo = result.user.providerData
      .find(p => p.providerId === "google.com");
    const newAcct = {
      email:    googleInfo.email,
      displayName: googleInfo.displayName,
      photoURL: googleInfo.photoURL   // 必要なら写真も保存
    };
    linkedAccounts.push(newAcct);
    await updateDoc(currentUserDocRef, { linkedGoogleAccounts: linkedAccounts });
    renderAccountList();
  } catch (err) {
    alert("連携に失敗しました：" + err.message);
  }
});
