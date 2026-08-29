import { useEffect, useMemo, useState } from "react";
import type { Location } from "../../../entities/location/model/types";
import { fetchLocations } from "../../../entities/location/api/locationApi";

function normalizeSearchText(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

type UseLocationSearchOptions = {
  isActive: boolean;
  locations: Location[];
  telegramInitData: string | null;
};

export function useLocationSearch({ isActive, locations, telegramInitData }: UseLocationSearchOptions) {
  const [query, setQuery] = useState("");
  const [remoteResults, setRemoteResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const q = query.trim();
    if (q.length === 0) {
      setRemoteResults([]);
      setIsSearching(false);
      return;
    }

    let isCurrent = true;
    setIsSearching(true);

    const timer = window.setTimeout(async () => {
      try {
        const matches = await fetchLocations(telegramInitData, { q, limit: 100 });
        if (isCurrent) {
          setRemoteResults(matches);
        }
      } catch {
        if (isCurrent) {
          setRemoteResults([]);
        }
      } finally {
        if (isCurrent) {
          setIsSearching(false);
        }
      }
    }, 220);

    return () => {
      isCurrent = false;
      window.clearTimeout(timer);
    };
  }, [isActive, query, telegramInitData]);

  const results = useMemo(() => {
    const q = normalizeSearchText(query);
    if (!q) return locations;
    const merged = new Map<number, Location>();
    for (const location of remoteResults) {
      merged.set(location.id, location);
    }
    for (const location of locations) {
      const searchable = normalizeSearchText([
        location.name,
        location.description,
        location.category,
        location.main_category,
        location.address,
        location.phone,
        location.website_url,
      ].filter(Boolean).join(" "));
      if (searchable.includes(q)) {
        merged.set(location.id, location);
      }
    }
    return [...merged.values()];
  }, [query, locations, remoteResults]);

  const clearSearch = () => {
    setQuery("");
    setRemoteResults([]);
    setIsSearching(false);
  };

  return { query, setQuery, results, isSearching, clearSearch };
}
