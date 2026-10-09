// firebaseconfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBgiYfZs05-ooYambxET63p08zqviokIJM",
  authDomain: "musicapp-49167.firebaseapp.com",
  projectId: "musicapp-49167",
  storageBucket: "musicapp-49167.firebasestorage.app",
  messagingSenderId: "577491730306",
  appId: "1:577491730306:web:7f82f045ce36c77ca6999b",
  measurementId: "G-QKCKKW76XJ",
};

const app = initializeApp(firebaseConfig);

// 🔹 Simple auth – no AsyncStorage persistence, no TS errors
export const auth = getAuth(app);
export const db = getFirestore(app);
