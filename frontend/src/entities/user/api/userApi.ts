import type { UserProfile, TelegramUser } from "../model/types";
import { httpJson } from "../../../shared/api/http";

type UpsertUserParams = {
  telegramUser: TelegramUser;
  telegramInitData: string | null;
  nickname?: string | null;
  avatarUrl?: string | null;
};

export async function upsertUserProfile({
  telegramInitData,
  nickname,
  avatarUrl,
}: UpsertUserParams): Promise<UserProfile> {
  const normalizedNickname = typeof nickname === "string" ? nickname.trim() : null;
  const normalizedAvatarUrl = typeof avatarUrl === "string" ? avatarUrl.trim() : avatarUrl;
  const body: { nickname: string | null; avatarUrl?: string | null } = {
    nickname: normalizedNickname && normalizedNickname.length > 0 ? normalizedNickname : null,
  };

  if (avatarUrl !== undefined) {
    body.avatarUrl = normalizedAvatarUrl && normalizedAvatarUrl.length > 0 ? normalizedAvatarUrl : null;
  }

  return httpJson<UserProfile>("/api/users", {
    method: "POST",
    telegramInitData,
    body,
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

export async function fetchAdminMembers(telegramInitData: string | null): Promise<UserProfile[]> {
  return httpJson<UserProfile[]>("/api/admin/members", {
    telegramInitData,
  });
}

export async function updateAdminMemberRole(
  userId: number,
  role: "admin" | "user",
  telegramInitData: string | null
): Promise<UserProfile> {
  return httpJson<UserProfile>(`/api/admin/members/${userId}/role`, {
    method: "PATCH",
    telegramInitData,
    body: { role },
  });
}
