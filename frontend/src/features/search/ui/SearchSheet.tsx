import { useEffect, useRef, useState } from "react";
import { X, Search, MapPin } from "lucide-react";
import { MAIN_CATEGORY_BY_VALUE } from "../../../entities/location/model/mainCategories";
import type { Location } from "../../../entities/location/model/types";
import { useLocationSearch } from "../model/useLocationSearch";

type SearchSheetProps = {
  isOpen: boolean;
  locations: Location[];
  telegramInitData: string | null;
  onClose: () => void;
  onSelectLocation: (location: Location) => void;
};

export function SearchSheet({
  isOpen,
  locations,
  telegramInitData,
  onClose,
  onSelectLocation,
}: SearchSheetProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { query, setQuery, results, isSearching, clearSearch } = useLocationSearch({
    isActive: isOpen,
    locations,
    telegramInitData,
  });
  const [viewportFrame, setViewportFrame] = useState<{ height: number; offsetTop: number } | null>(null);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined" || !window.visualViewport) {
      setViewportFrame(null);
      return;
    }

    const viewport = window.visualViewport;
    const updateViewportFrame = () => {
      setViewportFrame({
        height: viewport.height,
        offsetTop: viewport.offsetTop,
      });
    };

    updateViewportFrame();
    viewport.addEventListener("resize", updateViewportFrame);
    viewport.addEventListener("scroll", updateViewportFrame);

    return () => {
      viewport.removeEventListener("resize", updateViewportFrame);
      viewport.removeEventListener("scroll", updateViewportFrame);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = (location: Location) => {
    inputRef.current?.blur();
    onSelectLocation(location);
    onClose();
  };

  return (
    <div
      className="sheet-backdrop sheet-backdrop--search"
      style={viewportFrame ? { top: viewportFrame.offsetTop, height: viewportFrame.height, bottom: "auto" } : undefined}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Search locations"
    >
      <div
        className="bottom-sheet search-sheet"
        style={viewportFrame ? { height: viewportFrame.height, maxHeight: viewportFrame.height } : undefined}
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
