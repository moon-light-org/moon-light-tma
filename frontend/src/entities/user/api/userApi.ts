import type { UserProfile } from "../model/types";
import { HttpError, httpJson } from "../../../shared/api/http";

type UserMutationParams = {
  telegramInitData: string | null;
  nickname?: string | null;
  avatarUrl?: string | null;
};

function buildUserMutationBody({ nickname, avatarUrl }: Omit<UserMutationParams, "telegramInitData">) {
  const normalizedNickname = typeof nickname === "string" ? nickname.trim() : null;
  const normalizedAvatarUrl = typeof avatarUrl === "string" ? avatarUrl.trim() : avatarUrl;
  const body: { nickname?: string | null; avatarUrl?: string | null } = {};

  if (nickname !== undefined) {
    body.nickname = normalizedNickname && normalizedNickname.length > 0 ? normalizedNickname : null;
  }

  if (avatarUrl !== undefined) {
    body.avatarUrl = normalizedAvatarUrl && normalizedAvatarUrl.length > 0 ? normalizedAvatarUrl : null;
  }

  return body;
}

export async function getCurrentUser(telegramInitData: string | null): Promise<UserProfile | null> {
  try {
    return await httpJson<UserProfile>("/api/users/me", {
      telegramInitData,
    });
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function signupUser({ telegramInitData, nickname, avatarUrl }: UserMutationParams): Promise<UserProfile> {
  const body = buildUserMutationBody({ nickname, avatarUrl });
  return httpJson<UserProfile>("/api/users", {
    method: "POST",
    telegramInitData,
    body,
  });
}

export async function updateUserProfile({ telegramInitData, nickname, avatarUrl }: UserMutationParams): Promise<UserProfile> {
  const body = buildUserMutationBody({ nickname, avatarUrl });
  return httpJson<UserProfile>("/api/users/me", {
    method: "PATCH",
    telegramInitData,
    body,
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
