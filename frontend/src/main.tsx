import { init } from "./init";
import { loadTelegramWebApp } from "./shared/telegram/webAppSdk";

const root = document.getElementById("root")!;
const retry = document.getElementById("startup-retry")!;
const message = document.getElementById("startup-message")!;
const timeout = window.setTimeout(() => {
  message.textContent = "Opening is taking longer than expected. Please try again.";
  retry.hidden = false;
}, 12000);

// Neither Telegram's external script nor profile/map requests gate first paint.
void loadTelegramWebApp();
void init({ debug: import.meta.env.DEV, eruda: false, mockForMacOS: true })
  .catch((error: unknown) => console.warn("TMA init failed:", error));

void import("./renderApp").then(() => {
  window.clearTimeout(timeout);
}).catch((error: unknown) => {
  window.clearTimeout(timeout);
  console.error("App startup failed:", error);
  // This fallback lives outside React, so a failed application import is visible.
  if (root.contains(message)) {
    message.textContent = "MoonLight could not open. Please try again.";
    retry.hidden = false;
  }
});
