// src/component/ThemeToggle.js
// Premium dark/light mode toggle component
// Adds a floating button that toggles a "dark-mode" class on the <body>
// The preference is saved in localStorage and persists across sessions.

import React, { useEffect, useState } from "react";
import "./ThemeToggle.css";

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark";
  });

  // Apply/remove class on body whenever dark changes
  useEffect(() => {
    if (dark) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  const toggle = () => setDark((prev) => !prev);

  return (
    <button className="theme-toggle" onClick={toggle} title="Toggle dark / light mode">
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
