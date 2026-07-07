import { MapPin, Navigation, Search } from "lucide-react";

type LocationOnboardingPromptProps = {
  isLocating: boolean;
  onShareLocation: () => void;
  onSearchManually: () => void;
};

export function LocationOnboardingPrompt({
  isLocating,
  onShareLocation,
  onSearchManually,
}: LocationOnboardingPromptProps) {
  return (
    <div className="location-onboarding-shell" role="dialog" aria-modal="true" aria-label="Choose your location">
      <section className="location-onboarding-card">
        <div className="location-onboarding-card__icon" aria-hidden="true">
          <MapPin size={30} />
        </div>
        <p className="location-onboarding-card__eyebrow">Start nearby</p>
        <h2>Find Bitcoin places around you</h2>
        <p className="location-onboarding-card__copy">
          Share your location once to center the map, or search for a city or place manually.
        </p>
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
            className="btn-secondary"
            disabled={isLocating}
            onClick={onSearchManually}
          >
            <Search size={17} />
            Search manually
          </button>
        </div>
      </section>
    </div>
  );
}
