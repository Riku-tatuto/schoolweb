import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA7zF6AG8DutMOe2PZWmr3aGZU9RhsU9-A",
  authDomain: "schoolweb-db.firebaseapp.com",
  projectId: "schoolweb-db"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const welcomeMessage = document.getElementById("welcome-message");
const logoutBtn = document.getElementById("logout");
const homeTab = document.getElementById("home-tab");
const scheduleTab = document.getElementById("schedule-tab");
const homeContent = document.getElementById("home-content");
const scheduleContent = document.getElementById("schedule-content");
const scheduleContainer = document.getElementById("schedule-table-container");

let userCourse = null; // 🔥 コースを保存

// 🔥 時間割表示関数
async function loadSchedule(course) {
  const courseRef = doc(db, "timetables", course);
  const courseSnap = await getDoc(courseRef);
  if (!courseSnap.exists()) {
    scheduleContainer.innerHTML = "時間割が見つかりませんでした。";
    return;
  }

  const days = ["mon", "tue", "wed", "thu", "fri", "sat"];
  const dayLabels = ["月", "火", "水", "木", "金", "土"];
  let html = "<table><tr><th>曜日\\時間</th>";

  for (let i = 1; i <= 6; i++) html += `<th>${i}限</th>`;
  html += "</tr>";

  days.forEach((day, idx) => {
    const periods = courseSnap.data()[day];
    html += `<tr><th>${dayLabels[idx]}</th>`;
    if (periods && Array.isArray(periods)) {
      periods.forEach(p => {
        html += `<td>${p.subject}<br><small>${p.room}・${p.teacher}</small></td>`;
      });
    } else {
      html += "<td colspan='6'>データなし</td>";
    }
    html += "</tr>";
  });

  html += "</table>";
  scheduleContainer.innerHTML = html;
}

// 🔥 タブ切り替え
homeTab.addEventListener("click", () => {
  homeContent.style.display = "block";
  scheduleContent.style.display = "none";
  homeTab.classList.add("active");
  scheduleTab.classList.remove("active");
});

scheduleTab.addEventListener("click", () => {
  homeContent.style.display = "none";
  scheduleContent.style.display = "block";
  homeTab.classList.remove("active");
  scheduleTab.classList.add("active");
  if (userCourse) loadSchedule(userCourse);
});

logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => {
    location.href = "index.html";
  });
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      userCourse = data.course;
      const msg = `ようこそ、${data.course}コースの${data.grade}年${data.class}組${data.number}番${data.name}さん！`;
      welcomeMessage.textContent = msg;
    } else {
      welcomeMessage.textContent = "ユーザーデータが見つかりません。";
    }
  } else {
    location.href = "index.html";
  }
});
