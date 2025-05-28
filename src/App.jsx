// File: src/App.jsx
// import { useState } from "react";
import ImageAnalysis from "./ImageAnalysis";
// import UnifiedAnalysis from "./UnifiedAnalysis";
import "./App.css";

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Image Forensics Tool</h1>
        <p>Upload an image to detect tampering or extract and analyze text</p>
      </header>

      <main className="app-content">
        <ImageAnalysis />
        {/* <UnifiedAnalysis /> */}
      </main>

      <footer className="app-footer">
        <p>Image & Text Forensics Tool &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;
