// login.js (Googleログイン部分)
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  fetchSignInMethodsForEmail,
  EmailAuthProvider,
  signInWithEmailAndPassword,
  linkWithCredential,
  signOut
} from "https://www.gstatic.com/firebasejs/9.6.11/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js";

const auth = getAuth();
const db   = getFirestore();
const provider = new GoogleAuthProvider();

async function loginWithGoogle() {
  try {
    // 1) まずポップアップでサインイン試行
    const result = await signInWithPopup(auth, provider);
    const googleEmail = result.user.email;

    // 2) Firestore 側の linkedGoogleEmails をチェック
    const q = query(
      collection(db, "users"),
      where("linkedGoogleEmails", "array-contains", googleEmail)
    );
    const snap = await getDocs(q);
    if (snap.empty) throw new Error("この Google アカウントは連携されていません");

    // 3) ログイン成功
    const userDoc = snap.docs[0];
    sessionStorage.setItem("uid", userDoc.id);
    location.href = "home.html";

  } catch (error) {
    // もし「同じメールで別の認証方法」が登録されていて新規作成されそうなら……
    if (error.code === 'auth/account-exists-with-different-credential') {
      const pendingCred = GoogleAuthProvider.credentialFromError(error);
      const email       = error.customData.email;
      // どの認証方法が登録されているか調べる
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.includes(EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD)) {
        // パスワード認証で再度ログインさせて……
        const password = prompt('このメールは既に登録済みです。\nパスワードを入力してください。');
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        // pending の Google 資格情報をリンク
        await linkWithCredential(userCred.user, pendingCred);
        // Firestore 側のメールリストにも追加
        const userRef = doc(db, "users", userCred.user.uid);
        await updateDoc(userRef, {
          linkedGoogleEmails: arrayUnion(email)
        });
        // マージが終わったらホームへ
        sessionStorage.setItem("uid", userCred.user.uid);
        location.href = "home.html";
        return;
      }
    }

    // それ以外 or 上記以外の失敗はサインアウトしてエラー表示
    await signOut(auth);
    document.getElementById("error-message").style.display = "block";
    document.getElementById("error-message").textContent = error.message;
  }
}

// イベントに紐付け
document.getElementById("google-login-btn")
  .addEventListener("click", loginWithGoogle);
