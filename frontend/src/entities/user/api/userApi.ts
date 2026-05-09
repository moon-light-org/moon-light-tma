import type { UserProfile, TelegramUser } from "../model/types";
import { httpJson } from "../../../shared/api/http";

type UpsertUserParams = {
  telegramUser: TelegramUser;
  telegramInitData: string | null;
  nickname?: string | null;
};

export async function upsertUserProfile({
  telegramUser,
  telegramInitData,
  nickname,
}: UpsertUserParams): Promise<UserProfile> {
  const normalizedNickname = typeof nickname === "string" ? nickname.trim() : null;

  return httpJson<UserProfile>("/api/users", {
    method: "POST",
    telegramInitData,
    body: {
      nickname: normalizedNickname && normalizedNickname.length > 0 ? normalizedNickname : null,
      avatarUrl: telegramUser.photo_url ?? null,
    },
  });
}

export async function getOrCreateUser(
  telegramUser: TelegramUser,
  telegramInitData: string | null
): Promise<UserProfile> {
  return upsertUserProfile({
    telegramUser,
    telegramInitData,
    nickname: null,
  });
}
