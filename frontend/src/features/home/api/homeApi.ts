import type { Location } from "../../../entities/location/model/types";
import { normalizeLocation } from "../../../entities/location/api/locationApi";
import { httpJson } from "../../../shared/api/http";

export type HomePlace = Location & {
  distance_km: number | null;
  checkin_count: number;
  review_count: number;
};
export type HomeSection = "popular" | "first-check-in";
export type HomeData = {
  source: "precise" | "ip" | "none";
  center: { latitude: number; longitude: number } | null;
  nearby: HomePlace[];
  popular: HomePlace[];
  firstCheckIn: HomePlace[];
};
export type HomeSectionPage = {
  source: HomeData["source"];
  places: HomePlace[];
  total: number;
  nextOffset: number | null;
};

function locationQuery(center: { latitude: number; longitude: number } | null): string {
  if (!center) return "";
  const params = new URLSearchParams({ lat: String(center.latitude), lon: String(center.longitude) });
  return `?${params}`;
}

function normalizeHomePlace(raw: HomePlace): HomePlace {
  const location = normalizeLocation(raw);
  if (!location) throw new Error("Invalid place returned by the server.");
  return { ...location, distance_km: raw.distance_km, checkin_count: raw.checkin_count, review_count: raw.review_count };
}

export async function fetchHomeData(center: { latitude: number; longitude: number } | null, telegramInitData: string | null) {
  const data = await httpJson<HomeData>(`/api/home${locationQuery(center)}`, { telegramInitData });
  return { ...data, nearby: data.nearby.map(normalizeHomePlace), popular: data.popular.map(normalizeHomePlace), firstCheckIn: data.firstCheckIn.map(normalizeHomePlace) };
}

export async function fetchHomeSection(section: HomeSection, offset: number, center: { latitude: number; longitude: number } | null, telegramInitData: string | null) {
  const params = new URLSearchParams(locationQuery(center).slice(1));
  params.set("offset", String(offset));
  const data = await httpJson<HomeSectionPage>(`/api/home/${section}?${params}`, { telegramInitData });
  return { ...data, places: data.places.map(normalizeHomePlace) };
}
