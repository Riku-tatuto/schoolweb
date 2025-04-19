import {
  getAuth, signOut, onAuthStateChanged, linkWithPopup,
  GoogleAuthProvider, unlink
} from "https://www.gstatic.com/firebasejs/11.23.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, updateDoc,
  arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/11.23.0/firebase-firestore.js";
import { app } from "./firebaseConfig.js";

const auth = getAuth(app);
const db = getFirestore(app);

const userInfoEl     = document.getElementById("user-info");
const logoutBtn      = document.getElementById("logout-btn");
const accountListEl  = document.getElementById("account-list");
const linkGoogleBtn  = document.getElementById("link-google-btn");

let currentUserRef = null;
let linkedAccounts = [];
let linkedGoogleEmails = [];

onAuthStateChanged(auth, async user => {
  if (!user) return location.href = "index.html";

  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return;

  currentUserRef = docRef;
  const data = docSnap.data();

  // ユーザー情報表示
  userInfoEl.textContent = `ようこそ ${data.course}コースの ${data.grade}年${data.class}組${data.number}番 ${data.name} さん！`;

  linkedAccounts = data.linkedGoogleAccounts || [];
  linkedGoogleEmails = data.linkedGoogleEmails || [];
  renderAccountList();
});

// ログアウト処理
logoutBtn.onclick = () => {
  signOut(auth);
};

// Google アカウント連携ボタン
linkGoogleBtn.onclick = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await linkWithPopup(auth.currentUser, provider);
    const googleInfo = result.user.providerData.find(p => p.providerId === "google.com");

    const email       = googleInfo.email;
    const displayName = googleInfo.displayName;
    const photoURL    = googleInfo.photoURL;

    if (linkedGoogleEmails.includes(email)) {
      alert("この Google アカウントはすでに連携済みです。");
      return;
    }

    // Firestore に保存
    await updateDoc(currentUserRef, {
      linkedGoogleAccounts: arrayUnion({ email, displayName, photoURL }),
      linkedGoogleEmails: arrayUnion(email)
    });

    linkedAccounts.push({ email, displayName, photoURL });
    linkedGoogleEmails.push(email);
    renderAccountList();
  } catch (error) {
    console.error("連携エラー:", error);
    alert("Google アカウントとの連携に失敗しました。");
  }
};

// アカウント一覧の描画
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
      <img src="${acc.photoURL || "default-icon.png"}" alt="profile" class="account-icon">
      <span class="account-name">${acc.displayName || acc.email}</span>
      <span class="account-email">${acc.email}</span>
      <button class="unlink-btn" data-i="${i}">連携解除</button>
    `;
    accountListEl.appendChild(item);
  });

  document.querySelectorAll(".unlink-btn").forEach(btn => {
    btn.onclick = async e => {
      const idx = +e.target.dataset.i;
      const removed = linkedAccounts.splice(idx, 1)[0];
      const email   = removed.email;

      try {
        await unlink(auth.currentUser, "google.com");
      } catch (e) {
        console.warn("unlink エラー（無視）:", e.message);
      }

      await updateDoc(currentUserRef, {
        linkedGoogleAccounts: linkedAccounts,
        linkedGoogleEmails: arrayRemove(email)
      });

      renderAccountList();
    };
  });
}
