import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration (auto-generated for hexparai.firebaseapp.com)
const firebaseConfig = {
  apiKey: "AIzaSyAqGbUlDt8XM3JFwyjkgAnJcMrjSJKWVik",
  authDomain: "hexparai.firebaseapp.com",
  projectId: "hexparai",
  storageBucket: "hexparai.firebasestorage.app",
  messagingSenderId: "509870516408",
  appId: "1:509870516408:web:327f8783e1826274e72c4d",
  measurementId: "G-SB8NXVBWY4"
};
// Initialize Firebase app and analytics safely
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

let analytics = null;
isSupported().then((supported) => {
  if (supported) {
    try {
      analytics = getAnalytics(app);
    } catch (e) {
      console.warn("Firebase Analytics not initialized:", e);
    }
  }
});

export { app, analytics, db, storage };
