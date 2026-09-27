export type UserProfile = {
  id: number;
  telegram_id: string;
  nickname: string;
  avatar_url: string | null;
  role: string;
  has_pending_location?: boolean;
  created_at: string;
};

export type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};
