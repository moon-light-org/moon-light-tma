import type { UserProfile } from "./types";

const CACHE_PREFIX = "moonlight:user-profile";

function getCacheKey(telegramId: string | number): string {
  return `${CACHE_PREFIX}:${telegramId}`;
}

export function readCachedProfile(telegramId: string | number): UserProfile | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(getCacheKey(telegramId));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    if (
      typeof parsed.id === "number" &&
      String(parsed.telegram_id) === String(telegramId) &&
      typeof parsed.nickname === "string" &&
      typeof parsed.role === "string" &&
      typeof parsed.created_at === "string"
    ) {
      return {
        id: parsed.id,
        telegram_id: String(parsed.telegram_id),
        nickname: parsed.nickname,
        avatar_url: typeof parsed.avatar_url === "string" ? parsed.avatar_url : null,
        role: parsed.role,
        created_at: parsed.created_at,
      };
    }
  } catch {
    window.localStorage.removeItem(getCacheKey(telegramId));
  }
  return null;
}

export function writeCachedProfile(profile: UserProfile): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(getCacheKey(profile.telegram_id), JSON.stringify(profile));
}

export function clearCachedProfile(telegramId: string | number): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(getCacheKey(telegramId));
}
