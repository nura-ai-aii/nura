// src/component/Login.js
// Firebase login modal component – premium glassmorphism design with routing support
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { 
  signInUser, 
  signUpUser, 
  signInWithGoogle, 
  signInWithGithub, 
  resetUserPassword,
  auth,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "../firebaseAuth";

export default function Login({ mode: initialMode = "login" }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState(initialMode); // "login", "signup", "reset"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Phone Auth State
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Sync internal mode with routing prop
  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
      setError("");
      setSuccessMessage("");
    }
  }, [initialMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      if (mode === "login") {
        await signInUser(email, password);
        localStorage.setItem("hexpar_lastLogin", Date.now().toString());
        navigate("/");
      } else if (mode === "signup") {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        await signUpUser(email, password);
        localStorage.setItem("hexpar_lastLogin", Date.now().toString());
        navigate("/");
      } else if (mode === "reset") {
        await resetUserPassword(email);
        setSuccessMessage("Password reset email sent! Check your Gmail inbox.");
        setTimeout(() => {
          navigate("/log-in");
        }, 3000);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Authentication failed");
    }
    setLoading(false);
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response) => {
          // reCAPTCHA solved
        }
      });
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
      setIsOtpSent(true);
      setSuccessMessage("OTP sent successfully!");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to send OTP");
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!confirmationResult) throw new Error("Please request OTP first.");
      await confirmationResult.confirm(otp);
      localStorage.setItem("hexpar_lastLogin", Date.now().toString());
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Invalid OTP. Please try again.");
    }
    setLoading(false);
  };

  const handleSocialSignIn = async (provider) => {
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      if (provider === "google") {
        await signInWithGoogle();
      } else if (provider === "github") {
        await signInWithGithub();
      } else if (provider === "facebook") {
        throw new Error("Facebook authentication is coming soon.");
      } else if (provider === "phone") {
        setMode("phone");
        setLoading(false);
        return;
      }
      localStorage.setItem("hexpar_lastLogin", Date.now().toString());
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(err.message || `${provider} authentication failed`);
    }
    setLoading(false);
  };

  return (
    <div className="login-modal">
      <div className="login-backdrop-wrapper">
        <div className="login-card-container">
          <div className="login-glass-card">
            
            {/* Logo and title */}
            <div className="login-brand-header">
              <img src="/new-logo-hexper.png" alt="Hexper Logo" className="login-brand-logo" />
              <h2 className="login-title-primary">
                {mode === "login" && "Login"}
                {mode === "signup" && "Register"}
                {mode === "reset" && "Reset"}
              </h2>
            </div>

            {/* Error & Success Notification Boxes */}
            {error && <div className="login-alert-box error">{error}</div>}
            {successMessage && <div className="login-alert-box success">{successMessage}</div>}

            {/* LOGIN FLOW */}
            {mode === "login" && (
              <form onSubmit={handleSubmit} className="login-form-container">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    placeholder="username@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="form-input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="password-input-wrap">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="form-input-field password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle-visibility"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className="forgot-password-link"
                  onClick={() => navigate("/forgot-password")}
                >
                  Forgot Password?
                </button>

                <button type="submit" className="login-action-btn" disabled={loading}>
                  {loading ? <span className="btn-spinner"></span> : <span>Sign in</span>}
                </button>
              </form>
            )}

            {/* DIRECT SIGN UP FLOW (No OTP) */}
            {mode === "signup" && (
              <form onSubmit={handleSubmit} className="login-form-container">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    placeholder="username@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="form-input-field"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="form-input-field"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="form-input-field"
                  />
                </div>
                <button type="submit" className="login-action-btn" disabled={loading}>
                  {loading ? <span className="btn-spinner"></span> : <span>Create Account</span>}
                </button>
              </form>
            )}

            {/* PASSWORD RESET FLOW */}
            {mode === "reset" && (
              <form onSubmit={handleSubmit} className="login-form-container">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    placeholder="username@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="form-input-field"
                  />
                </div>
                <button type="submit" className="login-action-btn" disabled={loading}>
                  {loading ? <span className="btn-spinner"></span> : <span>Send Reset Link</span>}
                </button>
              </form>
            )}

            {/* PHONE LOGIN FLOW */}
            {mode === "phone" && (
              <div className="login-form-container">
                {!isOtpSent ? (
                  <form onSubmit={handleSendOtp}>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="+1 234 567 8900"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                        className="form-input-field"
                      />
                    </div>
                    <div id="recaptcha-container"></div>
                    <button type="submit" className="login-action-btn" disabled={loading}>
                      {loading ? <span className="btn-spinner"></span> : <span>Send Verification Code</span>}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp}>
                    <div className="form-group">
                      <label className="form-label">Verification Code</label>
                      <input
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        className="form-input-field"
                      />
                    </div>
                    <button type="submit" className="login-action-btn" disabled={loading}>
                      {loading ? <span className="btn-spinner"></span> : <span>Verify & Login</span>}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Social logins */}
            {/* Social logins */}
            {(mode !== "reset" && mode !== "phone") && (
              <>
                <div className="social-divider">
                  <span className="divider-line"></span>
                  <span className="divider-text">or continue with</span>
                  <span className="divider-line"></span>
                </div>

                <div className="social-buttons-grid">
                  <button type="button" className="social-login-btn glass-social" onClick={() => handleSocialSignIn("google")} disabled={loading}>
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.13-5.136 4.13A5.79 5.79 0 0 1 8.2 12.74a5.79 5.79 0 0 1 5.79-5.79c2.519 0 4.114 1.085 5.07 2.002l3.207-3.208C20.301 3.865 17.43 2.15 13.99 2.15c-5.437 0-9.84 4.403-9.84 9.84s4.403 9.84 9.84 9.84c5.684 0 9.84-3.997 9.84-9.84 0-.665-.06-1.3-.172-1.705H12.24Z" />
                    </svg>
                    <span>Google</span>
                  </button>
                  
                  <button type="button" className="social-login-btn glass-social" onClick={() => handleSocialSignIn("github")} disabled={loading}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                    </svg>
                    <span>GitHub</span>
                  </button>

                  <button type="button" className="social-login-btn glass-social" onClick={() => handleSocialSignIn("facebook")} disabled={loading}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2">
                      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.95z" />
                    </svg>
                    <span>Facebook</span>
                  </button>

                  <button type="button" className="social-login-btn glass-social" onClick={() => handleSocialSignIn("phone")} disabled={loading}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span>Phone Number</span>
                  </button>
                </div>
              </>
            )}

            <div className="login-footer-text">
              {mode === "login" && (
                <span>
                  Don't have an account? <button type="button" className="footer-toggle-btn" onClick={() => navigate("/sing-in")}>Register for free</button>
                </span>
              )}
              {mode === "signup" && (
                <span>
                  Already have an account? <button type="button" className="footer-toggle-btn" onClick={() => navigate("/log-in")}>Sign in</button>
                </span>
              )}
              {mode === "reset" && (
                <span>
                  Back to <button type="button" className="footer-toggle-btn" onClick={() => navigate("/log-in")}>Sign in</button>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
