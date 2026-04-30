import { useEffect, useState, useMemo } from "react";
import { X, Search, MapPin, ShoppingBag, Utensils, Grid2x2 } from "lucide-react";
import type { Location, LocationCategory } from "../../../entities/location/model/types";
import { fetchLocations } from "../../../entities/location/api/locationApi";

type SearchSheetProps = {
  isOpen: boolean;
  locations: Location[];
  telegramInitData: string | null;
  onClose: () => void;
  onSelectLocation: (location: Location) => void;
};

const categoryIcons: Record<LocationCategory, React.ElementType> = {
  grocery:          ShoppingBag,
  "restaurant-bar": Utensils,
  other:            Grid2x2,
};

const categoryLabels: Record<LocationCategory, string> = {
  grocery:          "Grocery",
  "restaurant-bar": "Food & Bar",
  other:            "Other",
};

export function SearchSheet({
  isOpen,
  locations,
  telegramInitData,
  onClose,
  onSelectLocation,
}: SearchSheetProps) {
  const [query, setQuery] = useState("");
  const [remoteResults, setRemoteResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const q = query.trim();
    if (q.length === 0) {
      setRemoteResults([]);
      setIsSearching(false);
      return;
    }

    let isActive = true;
    setIsSearching(true);

    const timer = window.setTimeout(async () => {
      try {
        const matches = await fetchLocations(telegramInitData, { q, limit: 100 });
        if (isActive) {
          setRemoteResults(matches);
        }
      } catch {
        if (isActive) {
          setRemoteResults([]);
        }
      } finally {
        if (isActive) {
          setIsSearching(false);
        }
      }
    }, 220);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [isOpen, query, telegramInitData]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return locations;
    return remoteResults;
  }, [query, locations, remoteResults]);

  if (!isOpen) return null;

  const handleSelect = (location: Location) => {
    onSelectLocation(location);
    onClose();
  };

  return (
    <div className="sheet-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Search locations">
      <div className="bottom-sheet search-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />

        <div className="search-sheet__input-row">
          <span className="search-sheet__search-icon">
            <Search size={16} />
          </span>
          <input
            className="search-sheet__input"
            type="search"
            placeholder="Search BTC places…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            autoComplete="off"
          />
          <button type="button" className="sheet-close" onClick={onClose} aria-label="Close search">
            <X size={16} />
          </button>
        </div>

        <div className="search-sheet__results">
          {isSearching ? (
            <div className="search-sheet__empty">
              <Search size={32} strokeWidth={1.5} />
              <p>Searching all locations…</p>
            </div>
          ) : results.length === 0 ? (
            <div className="search-sheet__empty">
              <Search size={32} strokeWidth={1.5} />
              <p>No results for "{query}"</p>
            </div>
          ) : (
            results.map((location) => {
              const Icon = categoryIcons[location.category] ?? Grid2x2;
              return (
                <button
                  key={location.id}
                  type="button"
                  className="search-result-row"
                  onClick={() => handleSelect(location)}
                >
                  <span className="search-result-row__icon">
                    <Icon size={16} />
                  </span>
                  <span className="search-result-row__body">
                    <span className="search-result-row__name">{location.name}</span>
                    <span className="search-result-row__meta">
                      {categoryLabels[location.category]}
                      {location.description ? ` · ${location.description.slice(0, 48)}${location.description.length > 48 ? "…" : ""}` : ""}
                    </span>
                  </span>
                  <MapPin size={14} className="search-result-row__arrow" />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
