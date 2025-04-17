import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA7zF6AG8DutMOe2PZWmr3aGZU9RhsU9-A",
  authDomain: "schoolweb-db.firebaseapp.com",
  projectId: "schoolweb-db"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const welcome = document.getElementById("welcome-message");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  try {
    const q = query(collection(db, "users"), where("email", "==", user.email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      welcome.textContent = "ユーザー情報が見つかりませんでした。";
      return;
    }

    const userData = snapshot.docs[0].data();
    const message = `ようこそ${userData.course}コースの${userData.grade}年${userData.class}組${userData.number}番の${userData.fullname}さん！`;
    welcome.textContent = message;
  } catch (e) {
    welcome.textContent = "ユーザー情報の取得中にエラーが発生しました。";
    console.error(e);
  }
});

document.getElementById("logout").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});
