import { useEffect, useMemo, useState } from "react";
import { X, ExternalLink, AlertCircle, Map } from "lucide-react";
import { fetchLocations, createLocation } from "../../entities/location/api/locationApi";
import type { CreateLocationPayload, Location, LocationCategory } from "../../entities/location/model/types";
import { getOrCreateUser } from "../../entities/user/api/userApi";
import type { UserProfile } from "../../entities/user/model/types";
import { AddLocationModal } from "../../features/add-location/ui/AddLocationModal";
import { TapLocationSheet } from "../../features/add-location/ui/TapLocationSheet";
import { getTelegramInitData, useTelegramUser } from "../../shared/telegram/useTelegramUser";
import { LocationMap } from "../../widgets/location-map/LocationMap";
import { HomeControls } from "../../widgets/mobile-home/HomeControls";
import { HomeHeader } from "../../widgets/mobile-home/HomeHeader";

/** When VITE_USE_DEV_FALLBACK_USER=true we skip backend calls entirely. */
const IS_DEV_FALLBACK =
  import.meta.env.DEV && import.meta.env.VITE_USE_DEV_FALLBACK_USER === "true";

const DEV_STUB_PROFILE: UserProfile = {
  id: 1,
  telegram_id: "123456789",
  nickname: "local_user",
  avatar_url: null,
  role: "user",
  created_at: new Date().toISOString(),
};


export function HomePage() {
  const telegramUser     = useTelegramUser();
  const telegramInitData = useMemo(() => getTelegramInitData(), []);

  const [userProfile,       setUserProfile]       = useState<UserProfile | null>(null);
  const [locations,         setLocations]         = useState<Location[]>([]);
  const [selectedLocation,  setSelectedLocation]  = useState<Location | null>(null);
  const [pickedCoordinates, setPickedCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [focusCoordinates,  setFocusCoordinates]  = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<LocationCategory[]>([]);
  const [isTapSheetOpen,    setIsTapSheetOpen]    = useState(false);
  const [isModalOpen,       setIsModalOpen]       = useState(false);
  const [isLoading,         setIsLoading]         = useState(true);
  const [isSubmitting,      setIsSubmitting]      = useState(false);
  const [error,             setError]             = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    async function bootstrap() {
      if (!telegramUser) { setIsLoading(false); return; }

      // In local dev-fallback mode, skip backend entirely.
      if (IS_DEV_FALLBACK) {
        setUserProfile(DEV_STUB_PROFILE);
        setIsLoading(false);
        return;
      }

      try {
        const [user, loadedLocations] = await Promise.all([
          getOrCreateUser(telegramUser, telegramInitData),
          fetchLocations(telegramInitData),
        ]);
        if (!isActive) return;
        setUserProfile(user);
        setLocations(loadedLocations);
      } catch (err) {
        if (!isActive) return;
        // Show error in toast but don't block the map
        setError(err instanceof Error ? err.message : "Failed to load app data");
        setUserProfile(DEV_STUB_PROFILE);
      } finally {
        if (isActive) setIsLoading(false);
      }
    }
    void bootstrap();
    return () => { isActive = false; };
  }, [telegramInitData, telegramUser]);

  const handlePickLocation = (latitude: number, longitude: number) => {
    setPickedCoordinates({ latitude, longitude });
    setIsTapSheetOpen(true);
  };

  const handleCreateLocation = async (payload: CreateLocationPayload) => {
    setIsSubmitting(true);
    try {
      await createLocation(payload, telegramInitData);
      const reloaded = await fetchLocations(telegramInitData);
      setLocations(reloaded);
      setError(null);
      setSelectedLocation(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleCategory = (category: LocationCategory | "all") => {
    if (category === "all") { setSelectedCategories([]); return; }
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const visibleLocations =
    selectedCategories.length === 0
      ? locations
      : locations.filter((l) => selectedCategories.includes(l.category));

  const handleLocateMe = () => {
    if (!navigator.geolocation) { setError("Geolocation is not available on this device."); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setFocusCoordinates({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => setError("Could not get your current location.")
    );
  };

  /* ── Loading ────────────────────────────────────────── */
  if (isLoading) {
    return (
      <main className="center-screen">
        <div className="spinner" />
        <p>Loading map…</p>
      </main>
    );
  }

  /* ── No telegram user ────────────────────────────────── */
  if (!telegramUser || !userProfile) {
    return (
      <main className="center-screen">
        <Map size={48} strokeWidth={1.5} />
        <p className="center-screen__title">Open in Telegram</p>
        <p>
          Or set <code>VITE_USE_DEV_FALLBACK_USER=true</code> in local dev.
        </p>
      </main>
    );
  }

  /* ── Main UI ─────────────────────────────────────────── */
  return (
    <main className="map-shell">
      {/* Full-screen map */}
      <LocationMap
        locations={visibleLocations}
        onMapPickLocation={handlePickLocation}
        onLocationSelect={setSelectedLocation}
        focusCoordinates={focusCoordinates}
      />

      {/* Overlaid header: search + filter chips */}
      <HomeHeader
        selectedCategories={selectedCategories}
        onToggleCategory={handleToggleCategory}
        onSearchClick={() => setError("Search coming soon.")}
      />

      {/* Floating action buttons */}
      <HomeControls
        canLocate={typeof window !== "undefined" && Boolean(window.navigator?.geolocation)}
        onLocateMe={handleLocateMe}
      />

      {/* Selected location card */}
      {selectedLocation && (
        <div className="location-card" role="region" aria-label="Selected location">
          <div className="location-card__header">
            <h2 className="location-card__name">{selectedLocation.name}</h2>
            <span className="location-card__badge">{selectedLocation.category}</span>
            <button
              type="button"
              className="location-card__close"
              onClick={() => setSelectedLocation(null)}
              aria-label="Dismiss"
            >
              <X size={18} />
            </button>
          </div>
          {selectedLocation.description && (
            <p className="location-card__desc">{selectedLocation.description}</p>
          )}
          <p className="location-card__coords">
            {selectedLocation.latitude.toFixed(5)}, {selectedLocation.longitude.toFixed(5)}
          </p>
          {selectedLocation.website_url && (
            <a
              className="location-card__link"
              href={selectedLocation.website_url}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={12} />
              Visit website
            </a>
          )}
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="error-toast" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Tap to add – prompt sheet */}
      <TapLocationSheet
        isOpen={isTapSheetOpen}
        coordinates={pickedCoordinates}
        onClose={() => setIsTapSheetOpen(false)}
        onAddLocation={() => { setIsTapSheetOpen(false); setIsModalOpen(true); }}
      />

      {/* Add location form sheet */}
      <AddLocationModal
        isOpen={isModalOpen}
        coordinates={pickedCoordinates}
        telegramId={telegramUser.id.toString()}
        isSubmitting={isSubmitting}
        onClose={() => { setIsModalOpen(false); setPickedCoordinates(null); }}
        onSubmit={handleCreateLocation}
      />
    </main>
  );
}
