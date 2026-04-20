import type { CreateLocationPayload, Location } from "../model/types";
import { httpJson } from "../../../shared/api/http";

export async function fetchLocations(telegramInitData: string | null): Promise<Location[]> {
  return httpJson<Location[]>("/api/locations", { telegramInitData });
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
