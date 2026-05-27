// src/component/PhoneAuth.js
// Simple UI for Firebase phone authentication using reCAPTCHA verifier
import React, { useState } from "react";
import { signInWithPhone } from "../phoneAuth";

const PhoneAuth = () => {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    if (!phone) {
      setMessage("Please enter a phone number.");
      return;
    }
    try {
      await signInWithPhone(phone);
      setMessage("SMS sent! Check your device and enter the code.");
    } catch (err) {
      console.error(err);
      setMessage("Failed to send SMS: " + (err.message || err));
    }
  };

  return (
    <div className="phone-auth" style={{ padding: "1rem", marginTop: "1rem", background: "rgba(255,255,255,0.1)", borderRadius: "8px" }}>
      <h3>Phone Sign‑In</h3>
      <input
        type="tel"
        placeholder="+1 555‑123‑4567"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        style={{ padding: "0.5rem", width: "60%", marginRight: "0.5rem" }}
      />
      <button onClick={handleSend} style={{ padding: "0.5rem 1rem" }}>
        Send SMS
      </button>
      {message && <p style={{ marginTop: "0.5rem" }}>{message}</p>}
    </div>
  );
};

export default PhoneAuth;
