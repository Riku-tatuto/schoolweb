// --- Firebase SDKの読み込み ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithCredential,
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

// --- サブAuthインスタンス（Google認証用） ---
const secApp = initializeApp(firebaseConfig, "secondary");
const secAuth = getAuth(secApp);

// --- HTML 要素参照 ---
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

let currentUserRef = null;
let linkedAccounts = [];
let linkedGoogleEmails = [];

// --- セクション切り替え ---
function showSection(sec) {
  [homeSection, timetableSection, accountSection].forEach(s => s.style.display = "none");
  document.querySelectorAll(".menu-item").forEach(i => i.classList.remove("active"));
  if (sec === "home") {
    homeSection.style.display = "block"; menuHome.classList.add("active");
  } else if (sec === "timetable") {
    timetableSection.style.display = "block"; menuTimetable.classList.add("active");
    renderTimetable();
  } else {
    accountSection.style.display = "block"; menuAccount.classList.add("active");
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
  linkedAccounts     = data.linkedGoogleAccounts || [];
  linkedGoogleEmails = data.linkedGoogleEmails   || [];
});

// --- Google連携処理 ---
linkGoogleBtn.onclick = async () => {
  const provider = new GoogleAuthProvider();
  try {
    // サブAuthでGoogleログインしてCredential取得
    const result = await signInWithPopup(secAuth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    // メインAuthユーザーにCredentialをリンク
    const linkedUser = await linkWithCredential(auth.currentUser, credential);
    // プロバイダ情報を取得
    const info = linkedUser.providerData.find(p => p.providerId === "google.com");
    const { email, displayName, photoURL } = info;
    // Firestoreに保存
    await updateDoc(currentUserRef, {
      linkedGoogleAccounts: arrayUnion({ email, displayName, photoURL }),
      linkedGoogleEmails:   arrayUnion(email)
    });
    linkedAccounts.push({ email, displayName, photoURL });
    linkedGoogleEmails.push(email);
    renderAccountList();
    await signOut(secAuth);
  } catch (err) {
    alert("連携に失敗しました：" + err.message);
    await signOut(secAuth);
  }
};

// --- 時間割描画 ---
async function renderTimetable() {
  const uid = sessionStorage.getItem("uid");
  const userSnap = await getDoc(doc(db, "users", uid));
  const userData = userSnap.data();
  const courseId = userData.course === "本科" ? "HONKA" : userData.course;
  const ttSnap = await getDoc(doc(db, "timetables", courseId));
  const ttData = ttSnap.exists() ? ttSnap.data() : {};
  const days = ["mon","tue","wed","thu","fri","sat"];
  const labels = ["月","火","水","木","金","土"];
  timetableBody.innerHTML = "";
  days.forEach((k,i)=>{
    const row = document.createElement("tr");
    row.innerHTML = `<td>${labels[i]}</td>`;
    (ttData[k]||[]).forEach((p,j)=>{
      row.innerHTML += `<td>
        <div class="subject">${p.subject}</div>
        <div class="detail">${p.room}/${p.teacher}</div>
      </td>`;
    });
    for(let x=(ttData[k]||[]).length; x<6; x++){
      row.innerHTML += `<td>-</td>`;
    }
    timetableBody.appendChild(row);
  });
}

// --- アカウント一覧描画 ---
function renderAccountList() {
  accountListEl.innerHTML = "";
  if (!linkedAccounts.length) {
    accountListEl.textContent = "連携中の Google アカウントはありません。";
    return;
  }
  linkedAccounts.forEach((acc,i)=>{
    const div = document.createElement("div");
    div.className = "account-item";
    div.innerHTML = `
      ${acc.photoURL? `<img src="${acc.photoURL}" class="account-icon">` : ""}
      <span class="account-name">${acc.displayName||acc.email}</span>
      <span class="account-email">${acc.email}</span>
      <button class="unlink-btn" data-i="${i}">連携解除</button>
    `;
    accountListEl.appendChild(div);
  });
  document.querySelectorAll(".unlink-btn").forEach(btn=>{
    btn.onclick = async e=>{
      const idx = +e.target.dataset.i;
      const removed = linkedAccounts.splice(idx,1)[0];
      const email  = removed.email;
      await updateDoc(currentUserRef, {
        linkedGoogleAccounts: arrayRemove(removed),
        linkedGoogleEmails:   arrayRemove(email)
      });
      renderAccountList();
    };
  });
}

// --- 初期表示 ---
showSection("home");
