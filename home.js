import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs
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
const logoutBtn = document.getElementById("logout-btn");
const homeView = document.getElementById("home-view");
const timetableView = document.getElementById("timetable-view");
const timetableTableBody = document.querySelector("#timetable-table tbody");

// メニュー切り替え
document.getElementById("menu-home").addEventListener("click", () => {
  homeView.style.display = "block";
  timetableView.style.display = "none";
  setActive("menu-home");
});

document.getElementById("menu-timetable").addEventListener("click", () => {
  homeView.style.display = "none";
  timetableView.style.display = "block";
  loadTimetable();
  setActive("menu-timetable");
});

function setActive(id) {
  document.querySelectorAll(".menu-item").forEach(item => {
    item.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");
}

// ログイン状態確認とユーザー情報取得
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const usersRef = collection(db, "users");
    const querySnapshot = await getDocs(usersRef);
    let userData = null;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email === user.email) {
        userData = data;
      }
    });

    if (userData) {
      welcomeMessage.textContent = `ようこそ、${userData.course}コースの${userData.grade}年${userData.class}組${userData.number}番${userData.realName}さん！`;
      window.currentCourse = userData.course; // 時間割読み込みに使う
    } else {
      welcomeMessage.textContent = "ユーザー情報が見つかりませんでした。";
    }
  } else {
    location.href = "index.html";
  }
});

// ログアウト
logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => {
    location.href = "index.html";
  });
});

// 時間割読み込み
async function loadTimetable() {
  const course = window.currentCourse;
  const timetableRef = doc(db, "timetables", course);
  const docSnap = await getDoc(timetableRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    const monday = data.mon; // mon = 配列

    timetableTableBody.innerHTML = ""; // 初期化

    monday.forEach((item, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${item.subject}</td>
        <td>${item.room}</td>
        <td>${item.teacher}</td>
      `;
      timetableTableBody.appendChild(tr);
    });
  } else {
    timetableTableBody.innerHTML = "<tr><td colspan='4'>時間割データが見つかりませんでした。</td></tr>";
  }
}
