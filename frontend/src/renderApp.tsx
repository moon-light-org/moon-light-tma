import { Component, StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "maplibre-gl/dist/maplibre-gl.css";
import "./index.css";
import "./shell.css";
import App from "./App";

class StartupBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { console.error("App rendering failed:", error); }
  render() {
    if (this.state.failed) return <main className="center-screen" role="alert"><p>MoonLight could not open.</p><button type="button" onClick={() => window.location.reload()}>Try again</button></main>;
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode><StartupBoundary><App /></StartupBoundary></StrictMode>
);

// Optional animation support must never delay application module evaluation.
const animationPlayer = document.createElement("script");
animationPlayer.type = "module";
animationPlayer.src = "https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.14/dist/dotlottie-wc.js";
animationPlayer.async = true;
document.head.appendChild(animationPlayer);
