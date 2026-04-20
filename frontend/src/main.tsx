import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "maplibre-gl/dist/maplibre-gl.css";
import "./index.css";
import App from "./App";
import { init } from "./init";

init({
  debug: import.meta.env.DEV,
  eruda: false,
  mockForMacOS: true,
}).catch((error) => {
  console.warn("TMA init failed:", error);
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
