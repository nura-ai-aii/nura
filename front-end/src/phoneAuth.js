// src/phoneAuth.js
// Helper for Firebase phone authentication using reCAPTCHA verifier
import { getAuth, signInWithPhoneNumber } from "firebase/auth";

// Assumes window.recaptchaVerifier is initialized (see firebaseAuth.js)
export const signInWithPhone = async (phoneNumber) => {
  try {
    const auth = getAuth();
    const appVerifier = window.recaptchaVerifier;
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      appVerifier
    );
    // Store for later verification of SMS code
    window.confirmationResult = confirmationResult;
    return confirmationResult;
  } catch (error) {
    console.error("Phone sign‑in error:", error);
    throw error;
  }
};

// Example usage (replace with your UI flow):
// const phone = getPhoneNumberFromUserInput();
// signInWithPhone(phone).then(...).catch(...);
