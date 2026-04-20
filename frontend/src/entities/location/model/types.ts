export type LocationCategory = "grocery" | "restaurant-bar" | "other";

export type Location = {
  id: number;
  user_id: number | null;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  category: LocationCategory;
  website_url: string | null;
  image_url: string | null;
  schedules: string | null;
  is_approved: boolean;
  created_at: string;
};

export type CreateLocationPayload = {
  telegramId: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  category: LocationCategory;
  websiteUrl?: string;
  imageUrl?: string;
  schedules?: string;
};
