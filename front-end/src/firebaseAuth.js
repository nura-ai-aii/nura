// src/firebaseAuth.js
// Helper functions for Firebase Authentication in Hexpar AI project
import { getAuth, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { app } from "./firebase";

const auth = getAuth(app);

export const signInUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Firebase signIn error:", error);
    throw error;
  }
};

export const signUpUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Firebase signUp error:", error);
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Firebase signOut error:", error);
    throw error;
  }
};

export const observeAuthState = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export { auth };
