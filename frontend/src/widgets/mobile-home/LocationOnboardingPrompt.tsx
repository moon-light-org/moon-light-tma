import { MapPin, Navigation, Search } from "lucide-react";

type LocationOnboardingPromptProps = {
  isLocating: boolean;
  error: string | null;
  onShareLocation: () => void;
  onSearch: () => void;
};

export function LocationOnboardingPrompt({
  isLocating,
  error,
  onShareLocation,
  onSearch,
}: LocationOnboardingPromptProps) {
  return (
    <div className="location-onboarding-shell" role="dialog" aria-modal="true" aria-label="Choose your location">
      <section className="location-onboarding-card">
        <div className="location-onboarding-card__icon" aria-hidden="true">
          <MapPin size={30} />
        </div>
        <p className="location-onboarding-card__eyebrow">Welcome to MoonLight</p>
        <h2>Find Bitcoin places your way</h2>
        <p className="location-onboarding-card__copy">
          Share your location to start nearby, or jump straight into search if you already know what you need.
        </p>
        {error ? <p className="location-onboarding-card__error">{error}</p> : null}
        <button type="button" className="location-onboarding-card__search-preview" disabled={isLocating} onClick={onSearch}>
          <Search size={17} />
          <span>Search shops, restaurants, bars...</span>
        </button>
        <div className="location-onboarding-card__actions">
          <button
            type="button"
            className="btn-primary"
            disabled={isLocating}
            onClick={onShareLocation}
          >
            <Navigation size={17} />
            {isLocating ? "Asking permission..." : "Share my location"}
          </button>
          <button
            type="button"
            className="location-onboarding-card__link"
            disabled={isLocating}
            onClick={onSearch}
          >
            Discover with search
          </button>
        </div>
      </section>
    </div>
  );
}
