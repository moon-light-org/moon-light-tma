import type {
  CreateLocationPayload,
  Location,
  LocationPhoto,
  LocationReview,
} from "../model/types";
import { httpJson } from "../../../shared/api/http";

type ApiLocation = Partial<Location> & {
  id?: number | string;
  user_id?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  lat?: number | string | null;
  lon?: number | string | null;
};

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeLocation(raw: ApiLocation): Location | null {
  const id = toFiniteNumber(raw.id);
  const latitude = toFiniteNumber(raw.latitude ?? raw.lat);
  const longitude = toFiniteNumber(raw.longitude ?? raw.lon);

  if (id === null || latitude === null || longitude === null || !raw.name || !raw.category) {
    return null;
  }

  return {
    id,
    user_id: toFiniteNumber(raw.user_id) ?? null,
    name: raw.name,
    description: raw.description ?? null,
    latitude,
    longitude,
    category: raw.category,
    website_url: raw.website_url ?? null,
    image_url: raw.image_url ?? null,
    schedules: raw.schedules ?? null,
    is_approved: Boolean(raw.is_approved),
    created_at: raw.created_at ?? new Date(0).toISOString(),
  };
}

type FetchLocationsParams = {
  minLat?: number;
  minLon?: number;
  maxLat?: number;
  maxLon?: number;
  q?: string;
  limit?: number;
};

function toQueryString(params: FetchLocationsParams): string {
  const searchParams = new URLSearchParams();
  if (typeof params.minLat === "number") searchParams.set("minLat", String(params.minLat));
  if (typeof params.minLon === "number") searchParams.set("minLon", String(params.minLon));
  if (typeof params.maxLat === "number") searchParams.set("maxLat", String(params.maxLat));
  if (typeof params.maxLon === "number") searchParams.set("maxLon", String(params.maxLon));
  if (params.q && params.q.trim().length > 0) searchParams.set("q", params.q.trim());
  if (typeof params.limit === "number" && Number.isFinite(params.limit)) {
    searchParams.set("limit", String(Math.max(1, Math.trunc(params.limit))));
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function fetchLocations(
  telegramInitData: string | null,
  params: FetchLocationsParams = {}
): Promise<Location[]> {
  const response = await httpJson<ApiLocation[]>(
    `/api/locations${toQueryString(params)}`,
    { telegramInitData }
  );
  return response.map(normalizeLocation).filter((location): location is Location => location !== null);
}

export async function createLocation(
  payload: CreateLocationPayload,
  telegramInitData: string | null
): Promise<Location> {
  return httpJson<Location>("/api/locations", {
    method: "POST",
    telegramInitData,
    body: payload,
  });
}

export async function fetchLocationPhotos(
  locationId: number,
  telegramInitData: string | null
): Promise<LocationPhoto[]> {
  return httpJson<LocationPhoto[]>(`/api/locations/${locationId}/photos`, { telegramInitData });
}

export async function fetchLocationReviews(
  locationId: number,
  telegramInitData: string | null
): Promise<LocationReview[]> {
  return httpJson<LocationReview[]>(`/api/locations/${locationId}/reviews`, { telegramInitData });
}

export async function createLocationReview(
  locationId: number,
  rating: number,
  text: string | null,
  telegramInitData: string | null
): Promise<LocationReview> {
  return httpJson<LocationReview>(`/api/locations/${locationId}/reviews`, {
    method: "POST",
    telegramInitData,
    body: { rating, text },
  });
}

export async function fetchAdminLocations(
  telegramInitData: string | null
): Promise<Location[]> {
  const response = await httpJson<ApiLocation[]>("/api/admin/locations", { telegramInitData });
  return response.map(normalizeLocation).filter((location): location is Location => location !== null);
}

export async function fetchAdminLocationReviews(
  locationId: number,
  telegramInitData: string | null
): Promise<LocationReview[]> {
  return httpJson<LocationReview[]>(`/api/admin/locations/${locationId}/reviews`, { telegramInitData });
}

export async function deleteAdminLocation(
  locationId: number,
  telegramInitData: string | null
): Promise<void> {
  await httpJson<void>(`/api/admin/locations/${locationId}`, {
    method: "DELETE",
    telegramInitData,
  });
}

export async function deleteAdminReview(
  reviewId: number,
  telegramInitData: string | null
): Promise<void> {
  await httpJson<void>(`/api/admin/reviews/${reviewId}`, {
    method: "DELETE",
    telegramInitData,
  });
}
