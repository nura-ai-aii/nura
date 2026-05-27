// src/component/islamic-blob.js
// Premium Islamic‑themed background blob component
// Renders a full‑screen animated blob with the provided background image.

import React, { useEffect } from "react";
import "./islamic-blob.css";
import backgroundImg from "../images/islamic-2-backgroud.png";

export default function IslamicBlob() {
  // Add a CSS class to body to ensure full‑screen backdrop
  useEffect(() => {
    document.body.classList.add("islamic-blob-body");
    return () => document.body.classList.remove("islamic-blob-body");
  }, []);

  return (
    <div className="islamic-blob-container" style={{ backgroundImage: `url(${backgroundImg})` }}>
      <div className="blob" />
    </div>
  );
}
