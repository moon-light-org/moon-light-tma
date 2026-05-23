import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Map } from "lucide-react";
import {
  fetchLocations,
  createLocation,
  createLocationReview,
  fetchLocationPhotos,
  fetchLocationReviews,
  uploadLocationPhoto,
} from "../../entities/location/api/locationApi";
import type {
  CreateLocationPayload,
  Location,
  LocationCategory,
  LocationPhoto,
  LocationReview,
} from "../../entities/location/model/types";
import { getOrCreateUser, upsertUserProfile } from "../../entities/user/api/userApi";
import type { UserProfile } from "../../entities/user/model/types";
import { AddLocationModal } from "../../features/add-location/ui/AddLocationModal";
import { TapLocationSheet } from "../../features/add-location/ui/TapLocationSheet";
import { LocationDetailSheet } from "../../features/location-detail/ui/LocationDetailSheet";
import { SearchSheet } from "../../features/search/ui/SearchSheet";
import { getTelegramInitData, useTelegramUser } from "../../shared/telegram/useTelegramUser";
import { LocationMap } from "../../widgets/location-map/LocationMap";
import { HomeControls } from "../../widgets/mobile-home/HomeControls";
import { HomeHeader } from "../../widgets/mobile-home/HomeHeader";
import { OnboardingFlow } from "../../widgets/mobile-home/OnboardingFlow";
import { ProfileSheet } from "../../widgets/mobile-home/ProfileSheet";

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
  const telegramInitData = getTelegramInitData();

  const [userProfile,        setUserProfile]        = useState<UserProfile | null>(null);
  const [locations,          setLocations]          = useState<Location[]>([]);
  const [selectedLocation,   setSelectedLocation]   = useState<Location | null>(null);
  const [selectedLocationPhotos, setSelectedLocationPhotos] = useState<LocationPhoto[]>([]);
  const [selectedLocationReviews, setSelectedLocationReviews] = useState<LocationReview[]>([]);
  const [isSelectedLocationPhotosLoading, setIsSelectedLocationPhotosLoading] = useState(false);
  const [isSelectedLocationReviewsLoading, setIsSelectedLocationReviewsLoading] = useState(false);
  const [pickedCoordinates,  setPickedCoordinates]  = useState<{ latitude: number; longitude: number } | null>(null);
  const [focusCoordinates,   setFocusCoordinates]   = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<LocationCategory[]>([]);
  const [isTapSheetOpen,     setIsTapSheetOpen]     = useState(false);
  const [isModalOpen,        setIsModalOpen]        = useState(false);
  const [isSearchOpen,       setIsSearchOpen]       = useState(false);
  const [isProfileOpen,      setIsProfileOpen]      = useState(false);
  const [isLoading,          setIsLoading]          = useState(true);
  const [isSubmitting,       setIsSubmitting]       = useState(false);
  const [isOnboardingSubmitting, setIsOnboardingSubmitting] = useState(false);
  const [isOnboardingOpen,   setIsOnboardingOpen]   = useState(false);
  const [onboardingError,    setOnboardingError]    = useState<string | null>(null);
  const [error,              setError]              = useState<string | null>(null);
  const [viewportBounds,     setViewportBounds]     = useState<{
    minLat: number;
    minLon: number;
    maxLat: number;
    maxLon: number;
  } | null>(null);

  useEffect(() => {
    let isActive = true;
    async function bootstrap() {
      if (!telegramUser) {
        try {
          const loadedLocations = await fetchLocations(null);
          if (isActive) {
            setLocations(loadedLocations);
          }
        } catch (err) {
          if (isActive) {
            setError(err instanceof Error ? err.message : "Failed to load locations");
          }
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
        return;
      }

      // In dev-fallback mode, skip user registration but still fetch locations.
      if (IS_DEV_FALLBACK) {
        setUserProfile(DEV_STUB_PROFILE);
        try {
          const loadedLocations = await fetchLocations(null);
          if (isActive) setLocations(loadedLocations);
        } catch {
          // backend might not be running in pure frontend dev — that's fine
        }
        if (isActive) setIsLoading(false);
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
        setIsOnboardingOpen(!isNicknameConfigured(user.nickname));
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

  const profileInitial = useMemo(() => {
    const fromProfile = userProfile?.nickname?.trim();
    if (fromProfile) {
      return fromProfile.charAt(0).toUpperCase();
    }
    const fromTelegram = telegramUser?.first_name?.trim();
    if (fromTelegram) {
      return fromTelegram.charAt(0).toUpperCase();
    }
    return "?";
  }, [telegramUser, userProfile?.nickname]);

  const placesAddedCount = useMemo(() => {
    if (!userProfile) {
      return 0;
    }
    return locations.filter((location) => location.user_id === userProfile.id).length;
  }, [locations, userProfile]);

  const submitOnboardingNickname = async (nickname: string) => {
    if (!telegramUser) {
      return;
    }
    setIsOnboardingSubmitting(true);
    setOnboardingError(null);
    try {
      const updatedProfile = await upsertUserProfile({
        telegramUser,
        telegramInitData,
        nickname,
      });
      setUserProfile(updatedProfile);
      setOnboardingError(null);
    } catch (err) {
      setOnboardingError(err instanceof Error ? err.message : "Failed to save nickname");
      throw err;
    } finally {
      setIsOnboardingSubmitting(false);
    }
  };

  const handlePickLocation = (latitude: number, longitude: number) => {
    if (!telegramUser || !userProfile) {
      setError("Open in Telegram to add a new location.");
      return;
    }
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

  useEffect(() => {
    if (!viewportBounds) {
      return;
    }

    let isActive = true;

    const timer = window.setTimeout(async () => {
      try {
        const loaded = await fetchLocations(telegramInitData, viewportBounds);
        if (isActive) {
          setLocations(loaded);
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : "Failed to fetch visible locations");
        }
      }
    }, 180);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [telegramInitData, viewportBounds]);

  useEffect(() => {
    if (!selectedLocation) {
      setSelectedLocationPhotos([]);
      setSelectedLocationReviews([]);
      return;
    }
    let isActive = true;
    setIsSelectedLocationPhotosLoading(true);
    setIsSelectedLocationReviewsLoading(true);
    void fetchLocationPhotos(selectedLocation.id, telegramInitData)
      .then((data) => {
        if (isActive) {
          setSelectedLocationPhotos(data);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsSelectedLocationPhotosLoading(false);
        }
      });
    void fetchLocationReviews(selectedLocation.id, telegramInitData)
      .then((data) => {
        if (isActive) {
          setSelectedLocationReviews(data);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsSelectedLocationReviewsLoading(false);
        }
      });
    return () => {
      isActive = false;
    };
  }, [selectedLocation, telegramInitData]);

  const handleUploadLocationPhoto = async (file: File) => {
    if (!selectedLocation) {
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    const created = await uploadLocationPhoto(selectedLocation.id, dataUrl, telegramInitData);
    setSelectedLocationPhotos((prev) => [created, ...prev]);
  };

  const handleCreateLocationReview = async (rating: number, text: string | null) => {
    if (!selectedLocation) {
      return;
    }
    const created = await createLocationReview(selectedLocation.id, rating, text, telegramInitData);
    setSelectedLocationReviews((prev) => [created, ...prev]);
  };

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

  /* ── Main UI ─────────────────────────────────────────── */
  return (
    <main className="map-shell">
      {/* Full-screen map */}
      <LocationMap
        locations={visibleLocations}
        onMapPickLocation={handlePickLocation}
        onLocationSelect={setSelectedLocation}
        onViewportChange={setViewportBounds}
        focusCoordinates={focusCoordinates}
      />

      {/* Overlaid header: search + filter chips */}
      <HomeHeader
        selectedCategories={selectedCategories}
        onToggleCategory={handleToggleCategory}
        onSearchClick={() => setIsSearchOpen(true)}
        profileInitial={profileInitial}
        onProfileClick={() => setIsProfileOpen(true)}
      />

      {/* Floating action buttons */}
      <HomeControls
        canLocate={typeof window !== "undefined" && Boolean(window.navigator?.geolocation)}
        onLocateMe={handleLocateMe}
      />

      <LocationDetailSheet
        isOpen={Boolean(selectedLocation)}
        location={selectedLocation}
        photos={selectedLocationPhotos}
        reviews={selectedLocationReviews}
        photosLoading={isSelectedLocationPhotosLoading}
        reviewsLoading={isSelectedLocationReviewsLoading}
        canContribute={Boolean(telegramUser && userProfile)}
        onClose={() => setSelectedLocation(null)}
        onUploadPhoto={handleUploadLocationPhoto}
        onCreateReview={handleCreateLocationReview}
      />

      {/* Error toast */}
      {error && (
        <div className="error-toast" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Search sheet */}
      <SearchSheet
        isOpen={isSearchOpen}
        locations={locations}
        telegramInitData={telegramInitData}
        onClose={() => setIsSearchOpen(false)}
        onSelectLocation={(loc) => {
          setSelectedLocation(loc);
          setFocusCoordinates({ latitude: loc.latitude, longitude: loc.longitude });
        }}
      />

      <ProfileSheet
        isOpen={isProfileOpen}
        profileInitial={profileInitial}
        telegramUser={telegramUser}
        userProfile={userProfile}
        placesAddedCount={placesAddedCount}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Tap to add – prompt sheet */}
      {telegramUser && userProfile ? (
        <>
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
            isSubmitting={isSubmitting}
            onClose={() => { setIsModalOpen(false); setPickedCoordinates(null); }}
            onSubmit={handleCreateLocation}
          />
        </>
      ) : (
        <div className="error-toast" role="status">
          <Map size={18} />
          <span>
            Viewing existing locations only. Open in Telegram to add new ones.
          </span>
        </div>
      )}

      {isOnboardingOpen && telegramUser && (
        <OnboardingFlow
          initialName={telegramUser.first_name}
          isSubmitting={isOnboardingSubmitting}
          error={onboardingError}
          onSubmitNickname={submitOnboardingNickname}
          onComplete={() => setIsOnboardingOpen(false)}
        />
      )}
    </main>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Failed to read image file"));
    };
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

function isNicknameConfigured(nickname: string | null | undefined): boolean {
  const normalized = nickname?.trim() ?? "";
  if (!normalized) {
    return false;
  }
  return !/^user_\d+$/i.test(normalized);
}
