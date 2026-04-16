
  import React from "react";
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  // Global styles
  import "./styles/index.css";

  // Render the application tree
  createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  