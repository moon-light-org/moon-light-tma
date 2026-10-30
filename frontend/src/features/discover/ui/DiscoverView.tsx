import { motion } from "framer-motion";
import { BadgeCheck, Bitcoin, ChevronRight, Map, Search, SearchX, X, Zap } from "lucide-react";
import { MAIN_CATEGORY_BY_VALUE } from "../../../entities/location/model/mainCategories";
import type { Location, LocationMainCategory } from "../../../entities/location/model/types";
import { PlaceFilters } from "../../../widgets/mobile-home/AppShell";
import { useLocationSearch } from "../../search/model/useLocationSearch";

type DiscoverViewProps = {
  isOpen: boolean;
  locations: Location[];
  isLoading: boolean;
  telegramInitData: string | null;
  onSelectLocation: (location: Location) => void;
  onOpenMap: () => void;
  category: LocationMainCategory | null;
  onCategory: (category: LocationMainCategory | null) => void;
  lightningOnly: boolean;
  onLightning: () => void;
};

export function DiscoverView({
  isOpen, locations, isLoading, telegramInitData, onSelectLocation, onOpenMap,
  category, onCategory, lightningOnly, onLightning,
}: DiscoverViewProps) {
  const { query, setQuery, results, isSearching, clearSearch } = useLocationSearch({
    isActive: isOpen, locations, telegramInitData,
  });
  const filtered = results.filter((location) =>
    (!category || location.main_category === category) &&
    (!lightningOnly || location.accepts_lightning)
  );
  const busy = isLoading || isSearching;

  if (!isOpen) return null;

  const reset = () => {
    clearSearch();
    onCategory(null);
    if (lightningOnly) onLightning();
  };

  return (
    <motion.section className="explore-page" aria-label="Explore places" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .2 }}>
      <div className="explore-page__toolbar">
        <div className="explore-search">
          <Search size={19} strokeWidth={1.7} aria-hidden="true" />
          <input aria-label="Search places" type="search" placeholder="Search places…" value={query} onChange={(event) => setQuery(event.target.value)} autoComplete="off" />
          {query && <button type="button" onClick={clearSearch} aria-label="Clear search"><X size={16} /></button>}
        </div>
        <PlaceFilters category={category} onCategory={onCategory} lightningOnly={lightningOnly} onLightning={onLightning} lightningCount={results.filter((location) => location.accepts_lightning).length} />
      </div>

      <div className="explore-page__summary">
        <span aria-live="polite">{busy ? "Searching…" : `${filtered.length} ${filtered.length === 1 ? "place" : "places"}`}</span>
        <button type="button" onClick={onOpenMap}><Map size={14} strokeWidth={1.7} />Show map</button>
      </div>

      <div className="explore-page__results" aria-busy={busy}>
        {busy ? (
          <div className="explore-skeletons" role="status" aria-label="Loading places">
            {Array.from({ length: 5 }, (_, index) => <div className="explore-skeleton" key={index}><span /><div><i /><i /><i /></div></div>)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="explore-empty">
            <SearchX size={28} strokeWidth={1.3} />
            <h2>No places found</h2>
            <p>{query || category || lightningOnly ? "Try another search or category." : "Move the map or search for a place."}</p>
            {(query || category || lightningOnly) && <button type="button" onClick={reset}>Clear filters</button>}
          </div>
        ) : (
          filtered.map((location, index) => {
            const { label, Icon } = MAIN_CATEGORY_BY_VALUE[location.main_category];
            return (
              <motion.button
                type="button" className="explore-place" key={location.id}
                onClick={() => onSelectLocation(location)}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: .22, delay: Math.min(index, 5) * .025 }}
              >
                <span className="explore-place__icon"><Icon size={21} strokeWidth={1.5} /></span>
                <span className="explore-place__body">
                  <span className="explore-place__title"><strong>{location.name}</strong>{location.is_approved && <BadgeCheck size={14} aria-label="Verified place" />}</span>
                  <span className="explore-place__category">{label}</span>
                  {location.address && <span className="explore-place__address">{location.address}</span>}
                  <span className="explore-place__tags">
                    {location.accepts_lightning ? <span><Zap size={11} />Lightning</span> : location.accepts_bitcoin ? <span><Bitcoin size={11} />Bitcoin</span> : <span className="is-unconfirmed">Payment unconfirmed</span>}
                    {!location.is_approved && <span className="is-unconfirmed">Unverified</span>}
                  </span>
                </span>
                <ChevronRight className="explore-place__arrow" size={16} strokeWidth={1.5} />
              </motion.button>
            );
          })
        )}
      </div>
    </motion.section>
  );
}
