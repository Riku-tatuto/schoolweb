import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-app.js";
import { getFirestore, doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-auth.js";

// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyA7zF6AG8DutMOe2PZWmr3aGZU9RhsU9-A",
  authDomain: "schoolweb-db.firebaseapp.com",
  projectId: "schoolweb-db",
  storageBucket: "schoolweb-db.appspot.com",
  messagingSenderId: "324683464267",
  appId: "1:324683464267:web:f3a558fa58069c8cd397ce"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 要素取得
const welcomeEl = document.getElementById('welcome-message');
const userInfoEl = document.getElementById('user-info');
const homeSection = document.getElementById('home-section');
const timetableSection = document.getElementById('timetable-section');
const timetableBody = document.getElementById('timetable-body');

// ページ切り替え
document.getElementById('menu-home').addEventListener('click', () => {
  homeSection.style.display = 'block';
  timetableSection.style.display = 'none';
  setActiveMenu('menu-home');
});

document.getElementById('menu-timetable').addEventListener('click', () => {
  homeSection.style.display = 'none';
  timetableSection.style.display = 'block';
  setActiveMenu('menu-timetable');
});

function setActiveMenu(id) {
  document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ログアウト
document.getElementById('logout').addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// ログイン中のユーザー確認
onAuthStateChanged(auth, async user => {
  if (user) {
    const email = user.email;
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);
    let matchedUser = null;

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.email === email) {
        matchedUser = data;
      }
    });

    if (matchedUser) {
      const { grade, class: classNo, number, course, realName } = matchedUser;
      welcomeEl.textContent = `ようこそ ${course}コースの${grade}年${classNo}組${number}番 ${realName}さん！`;
      userInfoEl.textContent = `メール: ${email}`;

      // 時間割取得
      const timetableRef = doc(db, "timetables", course);
      const timetableSnap = await getDoc(timetableRef);
      if (timetableSnap.exists()) {
        const timetableData = timetableSnap.data();
        renderTimetable(timetableData);
      }
    } else {
      welcomeEl.textContent = "ユーザー情報が見つかりませんでした。";
    }
  } else {
    window.location.href = "index.html";
  }
});

function renderTimetable(data) {
  const days = ["mon", "tue", "wed", "thu", "fri", "sat"];
  const dayLabels = ["月", "火", "水", "木", "金", "土"];
  timetableBody.innerHTML = "";

  days.forEach((dayKey, i) => {
    const row = document.createElement("tr");
    const dayCell = document.createElement("td");
    dayCell.textContent = dayLabels[i];
    row.appendChild(dayCell);

    const periods = data[dayKey] || [];
    for (let j = 0; j < 6; j++) {
      const cell = document.createElement("td");
      const period = periods[j];
      if (period) {
        const subjectDiv = document.createElement("div");
        subjectDiv.className = "subject";
        subjectDiv.textContent = period.subject;

        const detailDiv = document.createElement("div");
        detailDiv.className = "detail";
        detailDiv.textContent = `${period.room}/${period.teacher}`;

        cell.appendChild(subjectDiv);
        cell.appendChild(detailDiv);
      } else {
        cell.textContent = "-";
      }
      row.appendChild(cell);
    }
    timetableBody.appendChild(row);
  });
}
