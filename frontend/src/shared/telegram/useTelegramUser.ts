import { initDataState, useSignal } from "@telegram-apps/sdk-react";
import type { TelegramUser } from "../../entities/user/model/types";

const DEV_FALLBACK_TELEGRAM_USER: TelegramUser = {
  id: 123456789,
  first_name: "Local",
  last_name: "User",
  username: "local_user",
};

export function useTelegramUser(): TelegramUser | null {
  const initData = useSignal(initDataState);
  const runtimeUser =
    initData?.user ??
    (typeof window !== "undefined"
      ? (window as Window & { Telegram?: { WebApp?: { initDataUnsafe?: { user?: TelegramUser } } } }).Telegram
          ?.WebApp?.initDataUnsafe?.user
      : undefined);

  if (runtimeUser) {
    return {
      id: Number(runtimeUser.id),
      first_name: runtimeUser.first_name,
      last_name: runtimeUser.last_name,
      username: runtimeUser.username,
      photo_url: runtimeUser.photo_url,
    };
  }

  if (import.meta.env.DEV && import.meta.env.VITE_USE_DEV_FALLBACK_USER === "true") {
    return DEV_FALLBACK_TELEGRAM_USER;
  }

  return null;
}

export function getTelegramInitData(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const webApp = (window as Window & { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp;
  return webApp?.initData ?? null;
}
