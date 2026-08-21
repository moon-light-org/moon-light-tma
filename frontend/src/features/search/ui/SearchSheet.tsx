import { useEffect, useMemo, useRef, useState } from "react";
import { X, Search, MapPin } from "lucide-react";
import { MAIN_CATEGORY_BY_VALUE } from "../../../entities/location/model/mainCategories";
import type { Location } from "../../../entities/location/model/types";
import { fetchLocations } from "../../../entities/location/api/locationApi";

type SearchSheetProps = {
  isOpen: boolean;
  locations: Location[];
  telegramInitData: string | null;
  onClose: () => void;
  onSelectLocation: (location: Location) => void;
};

function normalizeSearchText(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

export function SearchSheet({
  isOpen,
  locations,
  telegramInitData,
  onClose,
  onSelectLocation,
}: SearchSheetProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [remoteResults, setRemoteResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined" || !window.visualViewport) {
      setKeyboardOffset(0);
      return;
    }

    const viewport = window.visualViewport;
    const updateKeyboardOffset = () => {
      setKeyboardOffset(Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop));
    };

    updateKeyboardOffset();
    viewport.addEventListener("resize", updateKeyboardOffset);
    viewport.addEventListener("scroll", updateKeyboardOffset);

    return () => {
      viewport.removeEventListener("resize", updateKeyboardOffset);
      viewport.removeEventListener("scroll", updateKeyboardOffset);
    };
  }, [isOpen]);

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

  if (!isOpen) return null;

  const handleSelect = (location: Location) => {
    inputRef.current?.blur();
    onSelectLocation(location);
    onClose();
  };

  const clearSearch = () => {
    setQuery("");
    setRemoteResults([]);
    setIsSearching(false);
  };

  return (
    <div className="sheet-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Search locations">
      <div
        className="bottom-sheet search-sheet"
        style={{
          maxHeight: keyboardOffset > 0 ? `calc(100vh - ${keyboardOffset}px - 12px)` : undefined,
          transform: keyboardOffset > 0 ? `translateY(-${keyboardOffset}px)` : undefined,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" />

        <div className="search-sheet__input-row">
          <span className="search-sheet__search-icon">
            <Search size={16} />
          </span>
          <input
            ref={inputRef}
            className="search-sheet__input"
            type="search"
            placeholder="Search BTC places…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            autoComplete="off"
          />
          <button type="button" className="sheet-close" onClick={query ? clearSearch : onClose} aria-label={query ? "Clear search" : "Close search"}>
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
              const category = MAIN_CATEGORY_BY_VALUE[location.main_category];
              const Icon = category.Icon;
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
                      {category.label} · {location.is_approved ? "Verified" : "Not verified"}
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
