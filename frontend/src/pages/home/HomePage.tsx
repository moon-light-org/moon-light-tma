import { useEffect, useMemo, useState } from "react";
import { fetchLocations, createLocation } from "../../entities/location/api/locationApi";
import type { CreateLocationPayload, Location } from "../../entities/location/model/types";
import { getOrCreateUser } from "../../entities/user/api/userApi";
import type { UserProfile } from "../../entities/user/model/types";
import { AddLocationModal } from "../../features/add-location/ui/AddLocationModal";
import { getTelegramInitData, useTelegramUser } from "../../shared/telegram/useTelegramUser";
import { LocationMap } from "../../widgets/location-map/LocationMap";

export function HomePage() {
  const telegramUser = useTelegramUser();
  const telegramInitData = useMemo(() => getTelegramInitData(), []);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [pickedCoordinates, setPickedCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function bootstrap() {
      if (!telegramUser) {
        setIsLoading(false);
        return;
      }

      try {
        const [user, loadedLocations] = await Promise.all([
          getOrCreateUser(telegramUser, telegramInitData),
          fetchLocations(telegramInitData),
        ]);

        if (!isActive) {
          return;
        }

        setUserProfile(user);
        setLocations(loadedLocations);
      } catch (bootstrapError) {
        if (!isActive) {
          return;
        }
        const message = bootstrapError instanceof Error ? bootstrapError.message : "Failed to load app data";
        setError(message);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      isActive = false;
    };
  }, [telegramInitData, telegramUser]);

  const handlePickLocation = (latitude: number, longitude: number) => {
    setPickedCoordinates({ latitude, longitude });
    setIsModalOpen(true);
  };

  const handleCreateLocation = async (payload: CreateLocationPayload) => {
    setIsSubmitting(true);
    try {
      await createLocation(payload, telegramInitData);
      const reloaded = await fetchLocations(telegramInitData);
      setLocations(reloaded);
      setError(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <main className="center-screen">Loading map...</main>;
  }

  if (!telegramUser || !userProfile) {
    return (
      <main className="center-screen">
        Open this app inside Telegram, or set <code>VITE_USE_DEV_FALLBACK_USER=true</code> in local dev.
      </main>
    );
  }

  return (
    <main className="home-layout">
      <header className="home-header">
        <div>
          <h1>BTC Places</h1>
          <p>Tap map to add a place that accepts Bitcoin.</p>
        </div>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}

      <section className="map-frame">
        <LocationMap
          locations={locations}
          onMapPickLocation={handlePickLocation}
          onLocationSelect={setSelectedLocation}
        />
      </section>

      {selectedLocation ? (
        <section className="location-card">
          <div className="location-card__header">
            <h2>{selectedLocation.name}</h2>
            <span>{selectedLocation.category}</span>
          </div>
          {selectedLocation.description ? <p>{selectedLocation.description}</p> : null}
          <p>
            {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
          </p>
          {selectedLocation.website_url ? (
            <a href={selectedLocation.website_url} target="_blank" rel="noreferrer">
              Visit website
            </a>
          ) : null}
        </section>
      ) : null}

      <AddLocationModal
        isOpen={isModalOpen}
        coordinates={pickedCoordinates}
        telegramId={telegramUser.id.toString()}
        isSubmitting={isSubmitting}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateLocation}
      />
    </main>
  );
}
