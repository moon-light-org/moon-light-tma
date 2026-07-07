const CACHE_PREFIX = "moonlight:location-onboarding";

function getCacheKey(telegramId: string | number): string {
  return `${CACHE_PREFIX}:${telegramId}`;
}

export function hasSeenLocationOnboarding(telegramId: string | number): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem(getCacheKey(telegramId)) === "seen";
}

export function markLocationOnboardingSeen(telegramId: string | number): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(getCacheKey(telegramId), "seen");
}

export function clearLocationOnboardingSeen(telegramId: string | number): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(getCacheKey(telegramId));
}
