import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Firebase 設定
const firebaseConfig = {
  apiKey: "AIzaSyA7zF6AG8DutMOe2PZWmr3aGZU9RhsU9-A",
  authDomain: "schoolweb-db.firebaseapp.com",
  projectId: "schoolweb-db",
  storageBucket: "schoolweb-db.appspot.com",
  messagingSenderId: "324683464267",
  appId: "1:324683464267:web:f3a558fa58069c8cd397ce"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let userData = null;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) throw new Error("ユーザーデータが見つかりません。");

      userData = userDoc.data();
      const { name, grade, class: cls, number, course } = userData;
      document.getElementById("welcome").innerText =
        `ようこそ${course}コースの${grade}年${cls}組${number}番の${name}さん！`;

    } catch (err) {
      alert("ユーザー情報の取得に失敗しました：" + err.message);
    }
  } else {
    window.location.href = "index.html";
  }
});

function showPage(pageId) {
  document.getElementById("page-home").style.display = "none";
  document.getElementById("page-timetable").style.display = "none";

  document.getElementById(`page-${pageId}`).style.display = "block";

  if (pageId === "timetable") {
    loadTimetable();
  }
}
window.showPage = showPage;

async function loadTimetable() {
  if (!userData) return;

  const course = userData.course;
  try {
    const snap = await getDoc(doc(db, "timetables", course));
    if (!snap.exists()) throw new Error("時間割データが見つかりません");

    const data = snap.data().data;
    let html = "<table border='1'><tr><th>曜日＼時間</th><th>1限</th><th>2限</th><th>3限</th><th>4限</th><th>5限</th><th>6限</th></tr>";
    const days = ["月", "火", "水", "木", "金", "土"];
    for (let i = 0; i < data.length; i++) {
      html += `<tr><td>${days[i]}</td>`;
      for (let j = 0; j < data[i].length; j++) {
        html += `<td>${data[i][j]}</td>`;
      }
      html += "</tr>";
    }
    html += "</table>";
    document.getElementById("timetable-area").innerHTML = html;
  } catch (e) {
    document.getElementById("timetable-area").innerText = "読み込みに失敗しました: " + e.message;
  }
}

// ログアウト
document.getElementById("logout").addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  }).catch((error) => {
    alert("ログアウトに失敗しました：" + error.message);
  });
});
