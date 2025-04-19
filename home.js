import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  unlink,
  GoogleAuthProvider,
  linkWithRedirect,
  getRedirectResult
} from "https://www.gstatic.com/firebasejs/9.6.11/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc
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
initializeApp(firebaseConfig);

const auth = getAuth();
const db = getFirestore();

let currentUserRef = null;
let linkedAccounts = [];

// 要素参照
const menuHome = document.getElementById("menu-home");
const menuTimetable = document.getElementById("menu-timetable");
const menuAccount = document.getElementById("menu-account");
const homeSection = document.getElementById("home-section");
const timetableSection = document.getElementById("timetable-section");
const accountSection = document.getElementById("account-section");
const logoutBtn = document.getElementById("logout");
const welcomeEl = document.getElementById("welcome-message");
const timetableBody = document.getElementById("timetable-body");
const accountListEl = document.getElementById("account-list");
const linkGoogleBtn = document.getElementById("link-google-btn");

// メニュー切替
function showSection(sec) {
  [homeSection, timetableSection, accountSection].forEach(s => s.style.display = "none");
  document.querySelectorAll(".menu-item").forEach(i => i.classList.remove("active"));
  if (sec === "home") {
    homeSection.style.display = "block";
    menuHome.classList.add("active");
  } else if (sec === "timetable") {
    timetableSection.style.display = "block";
    menuTimetable.classList.add("active");
    renderTimetable();  // 追加：レンダリング呼び出し
  } else {
    accountSection.style.display = "block";
    menuAccount.classList.add("active");
    renderAccountList();
  }
}
menuHome.onclick = () => showSection("home");
menuTimetable.onclick = () => showSection("timetable");
menuAccount.onclick = () => showSection("account");

logoutBtn.onclick = async () => {
  await signOut(auth);
  location.href = "index.html";
};

// 初期ロード時のリダイレクト結果処理（アカウント連携）
getRedirectResult(auth)
  .then(async result => {
    if (result?.user && currentUserRef) {
      // Auth unlink してから再リンク
      await unlink(auth.currentUser, "google.com");
      const googleInfo = result.user.providerData.find(p => p.providerId==="google.com");
      linkedAccounts.push({ email: googleInfo.email, displayName: googleInfo.displayName });
      await updateDoc(currentUserRef, { linkedGoogleAccounts: linkedAccounts });
      renderAccountList();
    }
  })
  .catch(console.error);

// 認証状態変化
onAuthStateChanged(auth, async user => {
  if (!user) return location.href = "index.html";
  // Firestore の users ドキュメント取得
  const uid = sessionStorage.getItem("uid");
  currentUserRef = doc(db, "users", uid);
  const snap = await getDoc(currentUserRef);
  if (!snap.exists()) return;
  const data = snap.data();

  // ようこそ表示
  welcomeEl.textContent = 
    `ようこそ ${data.course}コースの${data.grade}年${data.class}組${data.number}番 ${data.realName}さん！`;

  // linkedAccounts 初期化
  linkedAccounts = data.linkedGoogleAccounts || [];
});

// 時間割レンダリング（コース名に合わせて docId マッピング）
async function renderTimetable() {
  const uid = sessionStorage.getItem("uid");
  const userSnap = await getDoc(doc(db, "users", uid));
  const data = userSnap.data();
  // コース名が "本科" なら Firestore 側は "HONKA" など別IDの場合は変換
  const courseMap = { 本科: "HONKA" };
  const docId = courseMap[data.course] || data.course;
  const ttSnap = await getDoc(doc(db, "timetables", docId));
  const tt = ttSnap.exists() ? ttSnap.data() : {};
  const days = ["mon","tue","wed","thu","fri","sat"];
  const labels = ["月","火","水","木","金","土"];
  timetableBody.innerHTML = "";
  days.forEach((d,i) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${labels[i]}</td>` +
      Array.from({length:6}, (_,j) => {
        const p = (tt[d]||[])[j];
        return `<td>
          ${p ? `<div class="subject">${p.subject}</div>
                 <div class="detail">${p.room}/${p.teacher}</div>` : "-"}
        </td>`;
      }).join("");
    timetableBody.appendChild(row);
  });
}

// アカウント一覧描画
function renderAccountList() {
  accountListEl.innerHTML = "";
  if (!linkedAccounts.length) {
    accountListEl.textContent = "連携中の Google アカウントはありません。";
    return;
  }
  linkedAccounts.forEach((acc,i) => {
    const div = document.createElement("div");
    div.className = "account-item";
    div.innerHTML = `
      <span>${acc.displayName||acc.email}</span>
      <button class="unlink-btn" data-i="${i}">連携解除</button>
    `;
    accountListEl.appendChild(div);
  });
  document.querySelectorAll(".unlink-btn").forEach(btn => {
    btn.onclick = async e => {
      const idx = +e.target.dataset.i;
      // Auth 側も unlink
      await unlink(auth.currentUser, "google.com");
      linkedAccounts.splice(idx,1);
      await updateDoc(currentUserRef, { linkedGoogleAccounts: linkedAccounts });
      renderAccountList();
    };
  });
}

// 初期はホームを表示
showSection("home");
