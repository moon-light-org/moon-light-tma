let pending: Promise<boolean> | undefined;

/** Load the native LocationManager bridge without blocking the app shell. */
export function loadTelegramWebApp(): Promise<boolean> {
  const existing = (window as Window & { Telegram?: { WebApp?: unknown } }).Telegram?.WebApp;
  if (existing) return Promise.resolve(true);
  if (pending) return pending;
  pending = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    // Location callers may wait briefly, but cannot wait forever on telegram.org.
    const timeout = window.setTimeout(() => resolve(false), 4000);
    script.onload = () => {
      window.clearTimeout(timeout);
      const webApp = (window as Window & { Telegram?: { WebApp?: { ready?: () => void } } }).Telegram?.WebApp;
      webApp?.ready?.();
      resolve(true);
    };
    script.onerror = () => {
      window.clearTimeout(timeout);
      resolve(false);
    };
    document.head.appendChild(script);
  });
  return pending;
}
