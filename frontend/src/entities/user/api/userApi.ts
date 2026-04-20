import type { UserProfile, TelegramUser } from "../model/types";
import { httpJson } from "../../../shared/api/http";

export async function getOrCreateUser(
  telegramUser: TelegramUser,
  telegramInitData: string | null
): Promise<UserProfile> {
  return httpJson<UserProfile>("/api/users", {
    method: "POST",
    telegramInitData,
    body: {
      telegramId: telegramUser.id.toString(),
      nickname: telegramUser.username || `${telegramUser.first_name}`,
      avatarUrl: telegramUser.photo_url ?? null,
    },
  });
}
