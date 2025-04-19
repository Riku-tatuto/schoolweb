// home.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  linkWithPopup
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

let currentUserRef = null;
let linkedAccounts = [];

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

// --- 認証状態変化 ---
onAuthStateChanged(auth, async user => {
  if (!user) return location.href = "index.html";

  // Firestore のユーザードキュメント参照
  const uid = sessionStorage.getItem("uid");
  currentUserRef = doc(db, "users", uid);
  const snap = await getDoc(currentUserRef);
  if (!snap.exists()) {
    welcomeEl.textContent = "ユーザー情報が見つかりません。";
    return;
  }
  const data = snap.data();

  // ようこそメッセージ表示
  welcomeEl.textContent =
    `ようこそ ${data.course}コースの${data.grade}年${data.class}組${data.number}番 ${data.realName}さん！`;

  // 連携済みアカウント読み込み
  linkedAccounts = data.linkedGoogleAccounts || [];
});

// --- Googleアカウント連携（Popup） ---
linkGoogleBtn.onclick = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await linkWithPopup(auth.currentUser, provider);
    // リンクした Google プロバイダの情報を取得
    const googleInfo = result.user.providerData.find(p => p.providerId === "google.com");
    // Firestore に保存
    linkedAccounts.push({
      email:       googleInfo.email,
      displayName: googleInfo.displayName
    });
    await updateDoc(currentUserRef, { linkedGoogleAccounts: linkedAccounts });
    renderAccountList();
  } catch (err) {
    alert("連携に失敗しました：" + err.message);
  }
};

// --- 時間割読み込み & 描画 ---
async function renderTimetable() {
  const uid = sessionStorage.getItem("uid");
  const userSnap = await getDoc(doc(db, "users", uid));
  const userData = userSnap.data();
  // コース名マッピング (必要なら)
  const courseId = userData.course === "本科" ? "HONKA" : userData.course;
  const ttSnap = await getDoc(doc(db, "timetables", courseId));
  const ttData = ttSnap.exists() ? ttSnap.data() : {};
  // 曜日ラベル
  const days = ["mon","tue","wed","thu","fri","sat"];
  const labels = ["月","火","水","木","金","土"];

  timetableBody.innerHTML = "";
  days.forEach((key, idx) => {
    const row = document.createElement("tr");
    // 曜日セル
    row.innerHTML = `<td>${labels[idx]}</td>`;
    // 6限分生成
    const periods = ttData[key] || [];
    for (let i = 0; i < 6; i++) {
      const p = periods[i];
      row.innerHTML += p
        ? `<td>
            <div class="subject">${p.subject}</div>
            <div class="detail">${p.room}/${p.teacher}</div>
          </td>`
        : `<td>-</td>`;
    }
    timetableBody.appendChild(row);
  });
}

// --- アカウント一覧描画 ---
function renderAccountList() {
  accountListEl.innerHTML = "";
  if (linkedAccounts.length === 0) {
    accountListEl.textContent = "連携中の Google アカウントはありません。";
    return;
  }
  linkedAccounts.forEach((acc, i) => {
    const item = document.createElement("div");
    item.className = "account-item";
    item.innerHTML = `
      <span>${acc.displayName || acc.email}</span>
      <button class="unlink-btn" data-i="${i}">連携解除</button>
    `;
    accountListEl.appendChild(item);
  });
  document.querySelectorAll(".unlink-btn").forEach(btn => {
    btn.onclick = async e => {
      const idx = +e.target.dataset.i;
      // Auth 側からも unlink
      await unlink(auth.currentUser, "google.com");
      linkedAccounts.splice(idx, 1);
      await updateDoc(currentUserRef, { linkedGoogleAccounts: linkedAccounts });
      renderAccountList();
    };
  });
}

// --- 初期表示はホーム ---
showSection("home");
