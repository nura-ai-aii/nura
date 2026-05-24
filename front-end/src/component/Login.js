// src/component/Login.js
// Firebase login modal component – premium sci‑fi design
import React, { useState, useEffect } from "react";
import "./Login.css";
import { signInUser, signUpUser } from "../firebaseAuth";

export default function Login() {
  const [mode, setMode] = useState("login"); // "login" or "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(true);

  // Show the modal if no user or after 30 days since last login
  useEffect(() => {
    const lastLogin = localStorage.getItem("hexpar_lastLogin");
    if (!lastLogin) {
      // First time – show modal and record timestamp
      setShow(true);
      localStorage.setItem("hexpar_lastLogin", Date.now().toString());
    } else {
      const diff = Date.now() - parseInt(lastLogin, 10);
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      if (diff > thirtyDays) setShow(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await signInUser(email, password);
      } else {
        await signUpUser(email, password);
      }
      // Success – auth observer updates currentUser, hide modal, reset timestamp
      setShow(false);
      localStorage.setItem("hexpar_lastLogin", Date.now().toString());
    } catch (err) {
      console.error(err);
      setError(err.message || "Authentication failed");
    }
    setLoading(false);
  };

  if (!show) return null;

  return (
    <div className="login-modal">
      <div className="login-card">
        <h2 className="login-title">Hexpar AI {mode === "login" ? "Access" : "Register"}</h2>
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
            {loading ? (mode === "login" ? "Signing In…" : "Creating…") : (mode === "login" ? "Sign In" : "Create Account")}
          </button>
        </form>
        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          {mode === "login" ? (
            <span>
              No account? <button onClick={() => setMode("signup")}>Create one</button>
            </span>
          ) : (
            <span>
              Already have an account? <button onClick={() => setMode("login")}>Log In</button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
