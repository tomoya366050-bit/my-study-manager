import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ▼ ここをあなたの Firebase 設定（firebaseConfig）にそっくり書き換えてください
const firebaseConfig = {
  apiKey: "AIzaSyBlygK168QF-SQ5aLOGveoWxy7HGUFKTCY",
  authDomain: "app-mystudymanager.firebaseapp.com",
  projectId: "app-mystudymanager",
  storageBucket: "app-mystudymanager.firebasestorage.app",
  messagingSenderId: "95245330289",
  appId: "1:95245330289:web:804196ed1841f85b74f8d0"
};
// ▲ ここまで

// Firebaseを初期化
const app = initializeApp(firebaseConfig);

// 他のファイルで使えるように書き出す
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);