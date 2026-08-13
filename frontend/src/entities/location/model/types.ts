export type LocationCategory = "grocery" | "restaurant-bar" | "other";
export type LocationPaymentStatus = "lightning" | "btc_only" | "neither";
export type LocationWallet = "wallet_of_satoshi" | "muun" | "breez" | "blw" | "eclair" | "zap" | "phoenix" | "blue_wallet" | "other";
export type LocationReportReason = "missing" | "no_lightning_or_btc" | "illegal_service" | "poor_service" | "other";

export type Location = {
  id: number;
  user_id: number | null;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  category: LocationCategory;
  website_url: string | null;
  phone: string | null;
  address: string | null;
  image_url: string | null;
  schedules: string | null;
  accepts_bitcoin: boolean | null;
  accepts_lightning: boolean | null;
  is_approved: boolean;
  created_at: string;
};

export type CreateLocationPayload = {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  category: LocationCategory;
  websiteUrl?: string;
  imageUrl?: string;
  schedules?: string;
};

export type LocationPhoto = {
  id: number;
  location_id: number;
  user_id: number | null;
  image_url: string;
  caption: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
};

export type LocationReview = {
  id: number;
  source: "app" | "btcmap";
  location_id: number;
  user_id: number | null;
  payment_status: LocationPaymentStatus | null;
  wallet: LocationWallet | null;
  rating: number | null;
  text: string | null;
  created_at: string;
};

export type CreateLocationReviewPayload = {
  paymentStatus: LocationPaymentStatus | null;
  wallet: LocationWallet | null;
  rating: number | null;
  text: string | null;
};

export type CreateLocationReportPayload = {
  reasons: LocationReportReason[];
  text: string | null;
};

export type AdminLocationReport = {
  id: number;
  location_id: number;
  location_name: string;
  reasons: LocationReportReason[];
  text: string | null;
  created_at: string;
};
