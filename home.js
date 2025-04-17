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

// 🔧 Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyA7zF6AG8DutMOe2PZWmr3aGZU9RhsU9-A",
  authDomain: "schoolweb-db.firebaseapp.com",
  projectId: "schoolweb-db",
  storageBucket: "schoolweb-db.appspot.com",
  messagingSenderId: "324683464267",
  appId: "1:324683464267:web:f3a558fa58069c8cd397ce"
};

// 初期化
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ユーザー状態確認
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const data = userDoc.data();
    const { name, grade, class: cls, number, course } = data;
    document.getElementById("welcome").innerText =
      `ようこそ${course}コースの${grade}年${cls}組${number}番の${name}さん！`;
  } else {
    // 未ログイン時はリダイレクト
    window.location.href = "index.html";
  }
});

// ページ切り替え
function showPage(pageId) {
  document.getElementById("page-home").style.display = "none";
  document.getElementById("page-timetable").style.display = "none";
  document.getElementById(`page-${pageId}`).style.display = "block";

  if (pageId === "timetable") {
    loadTimetable();
  }
}
window.showPage = showPage; // HTMLから呼べるようにする

// 時間割読み込み
async function loadTimetable() {
  const user = auth.currentUser;
  if (!user) return;

  const userDoc = await getDoc(doc(db, "users", user.uid));
  const course = userDoc.data().course;

  const docRef = doc(db, "timetables", course);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const tableData = docSnap.data().data;
    renderTimetableTable(tableData);
  } else {
    document.getElementById("timetable-area").innerText = "時間割データが見つかりません。";
  }
}

// 時間割テーブル表示
function renderTimetableTable(data) {
  let html = "<table><tr><th>曜日＼時間</th><th>1限</th><th>2限</th><th>3限</th><th>4限</th><th>5限</th><th>6限</th></tr>";
  const days = ["月", "火", "水", "木", "金", "土"];
  for (let i = 0; i < data.length; i++) {
    html += `<tr><th>${days[i]}</th>`;
    for (let j = 0; j < data[i].length; j++) {
      html += `<td>${data[i][j]}</td>`;
    }
    html += "</tr>";
  }
  html += "</table>";
  document.getElementById("timetable-area").innerHTML = html;
}

// ログアウト
document.getElementById("logout").addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
});
