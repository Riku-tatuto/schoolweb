import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA7zF6AG8DutMOe2PZWmr3aGZU9RhsU9-A",
  authDomain: "schoolweb-db.firebaseapp.com",
  projectId: "schoolweb-db",
  storageBucket: "schoolweb-db.firebasestorage.app",
  messagingSenderId: "324683464267",
  appId: "1:324683464267:web:f3a558fa58069c8cd397ce"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ログアウト
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
});

// セクション切り替え
document.getElementById("homeBtn").addEventListener("click", () => showSection("home"));
document.getElementById("scheduleBtn").addEventListener("click", () => showSection("timetable"));
document.getElementById("accountBtn").addEventListener("click", () => showSection("account"));

function showSection(target) {
  document.getElementById("home-section").style.display = (target === "home") ? "block" : "none";
  document.getElementById("timetable-section").style.display = (target === "timetable") ? "block" : "none";
  document.getElementById("account-section").style.display = (target === "account") ? "block" : "none";

  document.querySelectorAll(".menu-item").forEach(btn => btn.classList.remove("active"));
  document.getElementById(`${target}Btn`).classList.add("active");
}

// ユーザー状態を監視
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists()) return;

  const userData = userDoc.data();
  const { name, grade, class: classNum, number, course } = userData;

  const courseName = course.toUpperCase();
  const welcome = `ようこそ${courseName}コースの${grade}年${classNum}組${number}番${name}さん！`;
  document.getElementById("welcome-message").textContent = welcome;

  const courseId = course.toLowerCase(); // FirestoreのドキュメントID (例: ag, sg, 本科 → "ag", "sg", "honka"など)

  // 今日の時間割表示
  const todayIndex = new Date().getDay(); // 0(日)〜6(土)
  const todayTable = document.getElementById("today-timetable-body");

  if (todayIndex >= 1 && todayIndex <= 6) {
    const weekdayKeys = ["mon", "tue", "wed", "thu", "fri", "sat"];
    const todayKey = weekdayKeys[todayIndex - 1];

    const ttSnap = await getDoc(doc(db, "timetables", courseId));
    const ttData = ttSnap.exists() ? ttSnap.data() : {};
    const todaySubjects = ttData[todayKey] || [];

    todayTable.innerHTML = "";
    for (let i = 0; i < 6; i++) {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${i + 1}限</td>`;
      if (todaySubjects[i]) {
        row.innerHTML += `
          <td>${todaySubjects[i].subject}</td>
          <td>${todaySubjects[i].room} / ${todaySubjects[i].teacher}</td>
        `;
      } else {
        row.innerHTML += `<td>-</td><td>-</td>`;
      }
      todayTable.appendChild(row);
    }
  } else {
    todayTable.innerHTML = `<tr><td colspan="3">今日は授業がありません（日曜日）</td></tr>`;
  }
});
