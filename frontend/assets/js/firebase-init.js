// ============================================================
// Firebase: Auth + Firestore
// بيستبدل نظام الحسابات القديم (ps_token + /api/auth/*)
// بيشتغل من الفرونت مباشرة بدون الحاجة للباك إند
// ============================================================
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
         signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged,
         updateProfile } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyA3AskVeDQ5ET6tc1iCB9Asb53c8gGk0zQ",
  authDomain: "programming-science-50e64.firebaseapp.com",
  projectId: "programming-science-50e64",
  storageBucket: "programming-science-50e64.firebasestorage.app",
  messagingSenderId: "781775713120",
  appId: "1:781775713120:web:80df8a99bb82f1cdabe405",
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ============================================================
// واجهة عامة بنفس شكل النظام القديم — ما محتاجش تغيّر باقي الكود
// ============================================================

// تسجيل حساب جديد
async function fbSignup(fullName, email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: fullName });
  await setDoc(doc(db, 'users', cred.user.uid), {
    full_name: fullName, email, created_at: serverTimestamp(),
  });
  return fbCurrentUser(cred.user);
}

// تسجيل دخول بإيميل
async function fbLogin(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return fbCurrentUser(cred.user);
}

// تسجيل دخول بـGoogle
async function fbLoginGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  // أنشئ document في Firestore لو مش موجود
  const ref = doc(db, 'users', cred.user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      full_name: cred.user.displayName || cred.user.email,
      email: cred.user.email,
      created_at: serverTimestamp(),
    });
  }
  return fbCurrentUser(cred.user);
}

// تسجيل خروج
async function fbLogout() {
  await signOut(auth);
}

// بيانات المستخدم الحالي
function fbCurrentUser(user) {
  if (!user) return null;
  return { id: user.uid, full_name: user.displayName || user.email, email: user.email };
}

// حفظ التقدم في Firestore
async function fbSaveProgress(items) {
  const user = auth.currentUser;
  if (!user) return false;
  try {
    const ref = doc(db, 'progress', user.uid);
    await setDoc(ref, { items, updatedAt: serverTimestamp() }, { merge: true });
    return true;
  } catch { return false; }
}

// جلب التقدم من Firestore
async function fbGetProgress() {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    const snap = await getDoc(doc(db, 'progress', user.uid));
    return snap.exists() ? snap.data().items : {};
  } catch { return null; }
}

// مراقبة حالة تسجيل الدخول
function fbOnAuthChange(callback) {
  return onAuthStateChanged(auth, (user) => callback(fbCurrentUser(user)));
}

// هل المستخدم أدمن؟
function fbIsAdmin(user) {
  const adminEmail = 'riham1061989@gmail.com'; // نفس الـADMIN_EMAIL على Render
  return !!user && user.email === adminEmail;
}

export {
  fbSignup, fbLogin, fbLoginGoogle, fbLogout,
  fbCurrentUser, fbSaveProgress, fbGetProgress,
  fbOnAuthChange, fbIsAdmin, auth, db,
};
