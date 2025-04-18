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

const welcomeMessage = document.getElementById("welcome-message");
const logoutBtn = document.getElementById("logout");
const timetableContainer = document.getElementById("timetable-container");

function showSection(id) {
  document.querySelectorAll(".section").forEach((sec) => {
    sec.style.display = "none";
  });
  document.getElementById(id).style.display = "block";

  document.querySelectorAll(".menu-item").forEach((item) => {
    item.classList.remove("active");
  });

  if (id === "home-section") {
    document.getElementById("menu-home").classList.add("active");
  } else if (id === "timetable-section") {
    document.getElementById("menu-timetable").classList.add("active");
  }
}

document.getElementById("menu-home").addEventListener("click", () => {
  showSection("home-section");
});

document.getElementById("menu-timetable").addEventListener("click", () => {
  showSection("timetable-section");
});

logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      welcomeMessage.textContent = `ようこそ、${data.course}コースの${data.grade}年${data.class}組${data.number}番${data.name}さん！`;

      const timetableDoc = await getDoc(doc(db, "timetables", data.course));
      if (timetableDoc.exists()) {
        const timetable = timetableDoc.data();
        renderTimetable(timetable);
      } else {
        timetableContainer.innerHTML = "<p>時間割が見つかりませんでした。</p>";
      }
    } else {
      welcomeMessage.textContent = "ユーザー情報が見つかりませんでした。";
    }
  } else {
    window.location.href = "index.html";
  }
});

function renderTimetable(data) {
  const days = ["mon", "tue", "wed", "thu", "fri", "sat"];
  const dayLabels = ["月", "火", "水", "木", "金", "土"];
  let html = `<table><thead><tr><th>曜日＼限</th>`;

  for (let i = 1; i <= 6; i++) {
    html += `<th>${i}限</th>`;
  }
  html += `</tr></thead><tbody>`;

  days.forEach((day, i) => {
    html += `<tr><th>${dayLabels[i]}</th>`;
    const periods = data[day] || [];
    for (let j = 0; j < 6; j++) {
      const period = periods[j];
      if (period) {
        html += `<td>${period.subject}<br>${period.room}<br>${period.teacher}</td>`;
      } else {
        html += `<td></td>`;
      }
    }
    html += `</tr>`;
  });

  html += `</tbody></table>`;
  timetableContainer.innerHTML = html;
}
