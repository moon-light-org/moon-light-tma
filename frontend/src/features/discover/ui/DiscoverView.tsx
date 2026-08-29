import { ChevronRight, Map, Search, X } from "lucide-react";
import { MAIN_CATEGORY_BY_VALUE } from "../../../entities/location/model/mainCategories";
import type { Location } from "../../../entities/location/model/types";
import { useLocationSearch } from "../../search/model/useLocationSearch";

type DiscoverViewProps = {
  isOpen: boolean;
  locations: Location[];
  isLoading: boolean;
  telegramInitData: string | null;
  onSelectLocation: (location: Location) => void;
  onOpenMap: () => void;
};

export function DiscoverView({
  isOpen,
  locations,
  isLoading,
  telegramInitData,
  onSelectLocation,
  onOpenMap,
}: DiscoverViewProps) {
  const { query, setQuery, results, isSearching, clearSearch } = useLocationSearch({
    isActive: isOpen,
    locations,
    telegramInitData,
  });

  if (!isOpen) return null;

  return (
    <section className="discover-view" aria-label="Discover locations">
      <header className="discover-view__header">
        <div className="discover-view__titles">
          <h2>Discover places</h2>
          <p>Browse Bitcoin-friendly places, then open one to see it on the map.</p>
        </div>
        <button type="button" className="discover-view__map-button" onClick={onOpenMap}>
          <Map size={16} />
          Map
        </button>
      </header>

      <div className="discover-view__input-row">
        <span className="discover-view__search-icon">
          <Search size={16} />
        </span>
        <input
          className="discover-view__input"
          type="search"
          placeholder="Search BTC places…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="off"
        />
        {query ? (
          <button type="button" className="discover-view__clear" onClick={clearSearch} aria-label="Clear search">
            <X size={16} />
          </button>
        ) : null}
      </div>

      <div className="discover-view__list">
        {isLoading || isSearching ? (
          <div className="discover-view__empty">
            <Search size={32} strokeWidth={1.5} />
            <p>{isSearching ? "Searching all locations…" : "Loading places…"}</p>
          </div>
        ) : results.length === 0 ? (
          <div className="discover-view__empty">
            <Search size={32} strokeWidth={1.5} />
            <p>{query ? `No results for "${query}"` : "No places to show yet."}</p>
          </div>
        ) : (
          results.map((location) => {
            const category = MAIN_CATEGORY_BY_VALUE[location.main_category];
            const Icon = category.Icon;
            return (
              <button
                key={location.id}
                type="button"
                className="discover-row"
                onClick={() => onSelectLocation(location)}
              >
                <span className="discover-row__icon">
                  <Icon size={16} />
                </span>
                <span className="discover-row__body">
                  <span className="discover-row__name">{location.name}</span>
                  <span className="discover-row__meta">
                    {category.label} · {location.is_approved ? "Verified" : "Not verified"}
                    {location.address ? ` · ${location.address}` : ""}
                  </span>
                </span>
                <ChevronRight size={16} className="discover-row__chevron" />
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
