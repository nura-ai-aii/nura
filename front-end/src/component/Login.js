// src/component/Login.js
// Firebase login modal component – premium sci‑fi design
import React, { useState } from "react";
import "./Login.css";
import { signInUser } from "../firebaseAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInUser(email, password);
      // Success – auth state observer in App will update currentUser, modal will disappear automatically
    } catch (err) {
      console.error(err);
      setError(err.message || "Login failed");
    }
    setLoading(false);
  };

  return (
    <div className="login-modal">
      <div className="login-card">
        <h2 className="login-title">Hexpar AI Access</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="login-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="login-input"
          />
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Signing In…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
