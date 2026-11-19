import { ArrowLeft, ArrowRight, BadgeCheck, Bitcoin, Map, MapPin, Navigation, Search, Zap } from "lucide-react";
import { MAIN_CATEGORY_BY_VALUE } from "../../../entities/location/model/mainCategories";
import type { Location } from "../../../entities/location/model/types";
import { LocationMap } from "../../../widgets/location-map/LocationMap";
import type { HomeData, HomePlace, HomeSection, HomeSectionPage } from "../api/homeApi";

type HomeViewProps = {
  data: HomeData | null;
  loading: boolean;
  error: string | null;
  preciseLocation: { latitude: number; longitude: number } | null;
  locating: boolean;
  section: HomeSection | null;
  sectionPage: HomeSectionPage | null;
  sectionLoading: boolean;
  onSearch: () => void;
  onLocate: () => void;
  onMap: () => void;
  onSelectLocation: (location: Location) => void;
  onSection: (section: HomeSection | null) => void;
  onMore: () => void;
};

const sectionTitle = { popular: "Popular places", "first-check-in": "First check-in" };

function HomePlaceCard({ place, onSelect, firstCheckIn = false, approximate = false }: { place: HomePlace; onSelect: (place: HomePlace) => void; firstCheckIn?: boolean; approximate?: boolean }) {
  const category = MAIN_CATEGORY_BY_VALUE[place.main_category];
  return <button type="button" className="home-place-card" onClick={() => onSelect(place)}>
    <span className="home-place-card__image">
      {place.image_url ? <img src={place.image_url} alt="" loading="lazy" /> : <category.Icon size={25} aria-hidden="true" />}
    </span>
    <span className="home-place-card__content">
      <span className="home-place-card__badges">
        {place.is_approved ? <span><BadgeCheck size={13} /> Verified</span> : null}
        {place.distance_km !== null ? <span>{approximate ? "In your area" : place.distance_km < 1 ? "Under 1 km" : `${Math.round(place.distance_km)} km away`}</span> : null}
      </span>
      <strong>{place.name}</strong>
      <small>{category.label}{place.address ? ` · ${place.address}` : ""}</small>
      <span className="home-place-card__footer">
        <span>{firstCheckIn ? "Be the first to check in" : `${place.checkin_count} ${place.checkin_count === 1 ? "check-in" : "check-ins"} · ${place.review_count} ${place.review_count === 1 ? "review" : "reviews"}`}</span>
        <span className="home-place-card__payment">{place.accepts_lightning ? <><Zap size={12} /> Lightning</> : place.accepts_bitcoin ? <><Bitcoin size={12} /> Bitcoin</> : "Payment unconfirmed"}</span>
      </span>
    </span>
    <ArrowRight size={17} className="home-place-card__arrow" aria-hidden="true" />
  </button>;
}

function HomeCarousel({ title, section, places, approximate, onSelectLocation, onSection }: { title: string; section: HomeSection; places: HomePlace[]; approximate: boolean; onSelectLocation: (location: Location) => void; onSection: (section: HomeSection) => void }) {
  return <section className="home-section" aria-label={title}>
    <div className="home-section__heading"><h2>{title}</h2><button type="button" onClick={() => onSection(section)}>See all <ArrowRight size={14} /></button></div>
    {places.length ? <div className="home-card-carousel">{places.map((place) => <HomePlaceCard key={place.id} place={place} onSelect={onSelectLocation} firstCheckIn={section === "first-check-in"} approximate={approximate} />)}</div>
      : <p className="home-section__empty">{section === "popular" ? "No places with activity found here yet." : "No places waiting for a first check-in here yet."}</p>}
  </section>;
}

export function HomeView({ data, loading, error, preciseLocation, locating, section, sectionPage, sectionLoading, onSearch, onLocate, onMap, onSelectLocation, onSection, onMore }: HomeViewProps) {
  if (section) {
    return <section className="home-page home-page--list" aria-label={sectionTitle[section]}>
      <header className="home-list-header"><button type="button" onClick={() => onSection(null)} aria-label="Back to Home"><ArrowLeft size={20} /></button><div><span>Places</span><h1>{sectionTitle[section]}</h1></div></header>
      <div className="home-list-body">
        {error ? <p className="home-section__empty" role="alert">{error}</p> : null}
        {sectionPage?.places.map((place) => <HomePlaceCard key={place.id} place={place} onSelect={onSelectLocation} firstCheckIn={section === "first-check-in"} approximate={sectionPage.source === "ip"} />)}
        {sectionLoading ? <p className="home-section__empty">Loading places…</p> : null}
        {!sectionLoading && sectionPage?.places.length === 0 ? <p className="home-section__empty">No places to show yet.</p> : null}
        {sectionPage?.nextOffset !== null && sectionPage?.nextOffset !== undefined ? <button className="home-more-button" type="button" disabled={sectionLoading} onClick={onMore}>Show more places</button> : null}
      </div>
    </section>;
  }

  return <section className="home-page" aria-label="Home">
    <div className="home-scroll">
      <header className="home-header"><span>MoonLight Guide</span><h1>Places</h1><p>Discover places that welcome Bitcoin.</p></header>
      <button className="home-search" type="button" onClick={onSearch}><Search size={19} /><span>Search the MoonLight Guide</span><ArrowRight size={16} /></button>
      {preciseLocation ? <section className="home-section home-nearby" aria-label="Places near you">
        <div className="home-section__heading"><h2>Places near you</h2><button type="button" onClick={onMap}>Open map <ArrowRight size={14} /></button></div>
        <div className="home-nearby-map">
          <div className="home-nearby-map__canvas" inert><LocationMap locations={data?.nearby ?? []} selectedLocationId={null} isPickingLocation={false} onMapPickLocation={() => {}} onLocationSelect={() => {}} initialCenter={preciseLocation} userLocation={preciseLocation} /></div>
          <button type="button" className="home-nearby-map__open" onClick={onMap} aria-label="Open full map of places near you"><span><Map size={18} /> Explore nearby places <ArrowRight size={16} /></span></button>
        </div>
      </section> : <button type="button" className="home-locate-card" onClick={() => onLocate()} disabled={locating}><span><Navigation size={22} /></span><span><strong>{locating ? "Finding your location…" : "Search near me"}</strong><small>Share your location to see nearby places on a map.</small></span><ArrowRight size={18} /></button>}
      {error ? <p className="home-section__empty" role="alert">{error}</p> : null}
      {loading && !data ? <p className="home-section__empty">Finding places for you…</p> : null}
      {data ? <>
        {data.source === "ip" && !preciseLocation ? <p className="home-area-note"><MapPin size={14} /> Suggestions based on your approximate area</p> : null}
        {data.source === "none" ? <p className="home-area-note">Showing places from the MoonLight Guide</p> : null}
        <HomeCarousel title="Popular places" section="popular" places={data.popular} approximate={data.source === "ip"} onSelectLocation={onSelectLocation} onSection={onSection} />
        <HomeCarousel title="First check-in" section="first-check-in" places={data.firstCheckIn} approximate={data.source === "ip"} onSelectLocation={onSelectLocation} onSection={onSection} />
      </> : null}
    </div>
  </section>;
}
