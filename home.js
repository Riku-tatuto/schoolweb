// --- Firebase SDKの読み込み ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  GithubAuthProvider,
  linkWithPopup,
  unlink
} from "https://www.gstatic.com/firebasejs/9.6.11/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove
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

// --- 要素参照 ---
const menuHome        = document.getElementById("menu-home");
const menuTimetable   = document.getElementById("menu-timetable");
const menuAccount     = document.getElementById("menu-account");
const homeSection     = document.getElementById("home-section");
const timetableSection= document.getElementById("timetable-section");
const accountSection  = document.getElementById("account-section");
const logoutBtn       = document.getElementById("logout");
const welcomeEl       = document.getElementById("welcome-message");
const timetableBody   = document.getElementById("timetable-body");
const accountListEl   = document.getElementById("account-list");
const linkGoogleBtn   = document.getElementById("link-google-btn");
const linkGithubBtn   = document.getElementById("link-github-btn");

let currentUserRef    = null;
let linkedAccounts    = [];     // { email, displayName, photoURL } の配列
let linkedGoogleEmails= [];
let linkedGitHubEmails= [];

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

  const uid = sessionStorage.getItem("uid");
  currentUserRef = doc(db, "users", uid);
  const snap = await getDoc(currentUserRef);
  if (!snap.exists()) {
    welcomeEl.textContent = "ユーザー情報が見つかりません。";
    return;
  }
  const data = snap.data();
  welcomeEl.textContent =
    `ようこそ ${data.course}コース ${data.grade}年${data.class}組${data.number}番 ${data.realName}さん！`;

  // Firestore の配列フィールド読み込み
  linkedAccounts      = data.linkedGoogleAccounts   || [];
  linkedGoogleEmails  = data.linkedGoogleEmails     || [];
  if (data.linkedGitHubAccounts) {
    linkedAccounts = linkedAccounts.concat(data.linkedGitHubAccounts);
  }
  linkedGitHubEmails = data.linkedGitHubEmails || [];
});

// --- Googleアカウント連携（Popup） ---
linkGoogleBtn.onclick = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await linkWithPopup(auth.currentUser, provider);
    const info = result.user.providerData.find(p => p.providerId === "google.com");
    if (!info || !info.email) throw new Error("Google アカウント情報が取得できませんでした");

    const rec = {
      email:       info.email,
      displayName: info.displayName,
      photoURL:    info.photoURL
    };
    await updateDoc(currentUserRef, {
      linkedGoogleAccounts: arrayUnion(rec),
      linkedGoogleEmails:   arrayUnion(rec.email)
    });
    linkedAccounts.push(rec);
    linkedGoogleEmails.push(rec.email);
    renderAccountList();
  } catch (err) {
    alert("Google連携に失敗しました：" + err.message);
  }
};

// --- GitHubアカウント連携（Popup + user:email スコープ） ---
linkGithubBtn.onclick = async () => {
  const provider = new GithubAuthProvider();
  provider.addScope("user:email");
  try {
    // 既存ユーザーに対して連携する場合は linkWithPopup を使う
    const result = await linkWithPopup(auth.currentUser, provider);
    const info = result.user.providerData.find(p => p.providerId === "github.com");
    if (!info || !info.email) throw new Error("GitHub アカウント情報が取得できませんでした");

    const rec = {
      email:       info.email,
      displayName: info.displayName || info.login,
      photoURL:    info.photoURL
    };
    await updateDoc(currentUserRef, {
      linkedGitHubAccounts: arrayUnion(rec),
      linkedGitHubEmails:   arrayUnion(rec.email)
    });
    linkedAccounts.push(rec);
    linkedGitHubEmails.push(rec.email);
    renderAccountList();
  } catch (err) {
    alert("GitHub連携に失敗しました：" + err.message);
  }
};

// --- 時間割読み込み & 描画 ---
async function renderTimetable() {
  const uid = sessionStorage.getItem("uid");
  const userSnap = await getDoc(doc(db, "users", uid));
  const userData = userSnap.data();
  const courseId = userData.course === "本科" ? "HONKA" : userData.course;
  const ttSnap = await getDoc(doc(db, "timetables", courseId));
  const ttData = ttSnap.exists() ? ttSnap.data() : {};
  const days   = ["mon","tue","wed","thu","fri","sat"];
  const labels = ["月","火","水","木","金","土"];

  timetableBody.innerHTML = "";
  days.forEach((key, idx) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${labels[idx]}</td>`;
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
    accountListEl.textContent = "連携中のアカウントはありません。";
    return;
  }
  linkedAccounts.forEach((acc, i) => {
    const item = document.createElement("div");
    item.className = "account-item";
    item.innerHTML = `
      ${acc.photoURL ? `<img src="${acc.photoURL}" class="account-icon">` : ""}
      <span class="account-name">${acc.displayName || acc.email}</span>
      <span class="account-email">${acc.email}</span>
