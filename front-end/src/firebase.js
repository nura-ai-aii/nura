// src/firebase.js
// Firebase SDK initialization for Hexpar AI project
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

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

// Initialize Firebase app and analytics
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
