import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Map } from "lucide-react";
import {
  fetchLocations,
  createLocation,
  createLocationReview,
  fetchLocationPhotos,
  fetchLocationReviews,
  fetchAdminLocations,
  fetchAdminLocationReviews,
  deleteAdminLocation,
  deleteAdminReview,
} from "../../entities/location/api/locationApi";
import type {
  CreateLocationPayload,
  Location,
  LocationCategory,
  LocationPhoto,
  LocationReview,
} from "../../entities/location/model/types";
import {
  fetchAdminMembers,
  getOrCreateUser,
  updateAdminMemberRole,
  upsertUserProfile,
} from "../../entities/user/api/userApi";
import type { UserProfile } from "../../entities/user/model/types";
import { hasSeenLocationOnboarding, markLocationOnboardingSeen } from "../../entities/user/model/locationOnboardingStorage";
import { readCachedProfile, writeCachedProfile } from "../../entities/user/model/profileCache";
import { createDefaultNickname, isProfileComplete } from "../../entities/user/model/profileDefaults";
import { AddLocationModal } from "../../features/add-location/ui/AddLocationModal";
import { TapLocationSheet } from "../../features/add-location/ui/TapLocationSheet";
import { LocationDetailSheet } from "../../features/location-detail/ui/LocationDetailSheet";
import { SearchSheet } from "../../features/search/ui/SearchSheet";
import { getTelegramInitData, useTelegramUser } from "../../shared/telegram/useTelegramUser";
import { LocationMap } from "../../widgets/location-map/LocationMap";
import { HomeControls } from "../../widgets/mobile-home/HomeControls";
import { HomeHeader } from "../../widgets/mobile-home/HomeHeader";
import { LocationOnboardingPrompt } from "../../widgets/mobile-home/LocationOnboardingPrompt";
import { OnboardingFlow } from "../../widgets/mobile-home/OnboardingFlow";
import { ProfileSheet } from "../../widgets/mobile-home/ProfileSheet";
import { AdminSheet } from "../../widgets/mobile-home/AdminSheet";

/** When VITE_USE_DEV_FALLBACK_USER=true we skip backend calls entirely. */
const IS_DEV_FALLBACK =
  import.meta.env.DEV && import.meta.env.VITE_USE_DEV_FALLBACK_USER === "true";
const DEV_FALLBACK_ROLE = String(import.meta.env.VITE_DEV_FALLBACK_ROLE ?? "user").toLowerCase() === "admin"
  ? "admin"
  : "user";

const DEV_STUB_PROFILE: UserProfile = {
  id: 1,
  telegram_id: "123456789",
  nickname: "local_user",
  avatar_url: null,
  role: DEV_FALLBACK_ROLE,
  created_at: new Date().toISOString(),
};


export function HomePage() {
  const telegramUser     = useTelegramUser();
  const telegramInitData = getTelegramInitData();
  const telegramUserId = telegramUser?.id ?? null;

  const [userProfile,        setUserProfile]        = useState<UserProfile | null>(null);
  const [locations,          setLocations]          = useState<Location[]>([]);
  const [selectedLocation,   setSelectedLocation]   = useState<Location | null>(null);
  const [selectedLocationPhotos, setSelectedLocationPhotos] = useState<LocationPhoto[]>([]);
  const [selectedLocationReviews, setSelectedLocationReviews] = useState<LocationReview[]>([]);
  const [isSelectedLocationPhotosLoading, setIsSelectedLocationPhotosLoading] = useState(false);
  const [isSelectedLocationReviewsLoading, setIsSelectedLocationReviewsLoading] = useState(false);
  const [pickedCoordinates,  setPickedCoordinates]  = useState<{ latitude: number; longitude: number } | null>(null);
  const [focusCoordinates,   setFocusCoordinates]   = useState<{ latitude: number; longitude: number } | null>(null);
  const [userLocation,        setUserLocation]        = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<LocationCategory[]>([]);
  const [isTapSheetOpen,     setIsTapSheetOpen]     = useState(false);
  const [isModalOpen,        setIsModalOpen]        = useState(false);
  const [isSearchOpen,       setIsSearchOpen]       = useState(false);
  const [isProfileOpen,      setIsProfileOpen]      = useState(false);
  const [isLoading,          setIsLoading]          = useState(true);
  const [isSubmitting,       setIsSubmitting]       = useState(false);
  const [isOnboardingSubmitting, setIsOnboardingSubmitting] = useState(false);
  const [isOnboardingOpen,   setIsOnboardingOpen]   = useState(false);
  const [isLocationPromptOpen, setIsLocationPromptOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [onboardingError,    setOnboardingError]    = useState<string | null>(null);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [error,              setError]              = useState<string | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminMembers, setAdminMembers] = useState<UserProfile[]>([]);
  const [adminLocations, setAdminLocations] = useState<Location[]>([]);
  const [adminSelectedLocation, setAdminSelectedLocation] = useState<Location | null>(null);
  const [adminLocationReviews, setAdminLocationReviews] = useState<LocationReview[]>([]);
  const [adminLoadingMembers, setAdminLoadingMembers] = useState(false);
  const [adminLoadingLocations, setAdminLoadingLocations] = useState(false);
  const [adminLoadingReviews, setAdminLoadingReviews] = useState(false);
  const [adminBusyUserId, setAdminBusyUserId] = useState<number | null>(null);
  const [adminDeletingLocationId, setAdminDeletingLocationId] = useState<number | null>(null);
  const [adminDeletingReviewId, setAdminDeletingReviewId] = useState<number | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [viewportBounds,     setViewportBounds]     = useState<{
    minLat: number;
    minLon: number;
    maxLat: number;
    maxLon: number;
  } | null>(null);
  const [lastFetchedBoundsKey, setLastFetchedBoundsKey] = useState<string | null>(null);

  const defaultNickname = useMemo(
    () => createDefaultNickname(telegramUserId ?? DEV_STUB_PROFILE.telegram_id),
    [telegramUserId]
  );

  useEffect(() => {
    let isActive = true;
    async function bootstrap() {
      if (telegramUserId === null) {
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

      const cachedProfile = readCachedProfile(telegramUserId);
      if (cachedProfile && isActive) {
        setUserProfile(cachedProfile);
        setIsOnboardingOpen(!isProfileComplete(cachedProfile));
      }

      try {
        const [user, loadedLocations] = await Promise.all([
          getOrCreateUser(telegramInitData),
          fetchLocations(telegramInitData),
        ]);
        if (!isActive) return;
        setUserProfile(user);
        writeCachedProfile(user);
        setLocations(loadedLocations);
        setIsOnboardingOpen(!isProfileComplete(user));
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
  }, [telegramInitData, telegramUserId]);

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

  useEffect(() => {
    if (
      isLoading ||
      isLocationPromptOpen ||
      isOnboardingOpen ||
      telegramUserId === null ||
      !userProfile ||
      !isProfileComplete(userProfile) ||
      hasSeenLocationOnboarding(telegramUserId)
    ) {
      return;
    }

    setIsLocationPromptOpen(true);
  }, [isLoading, isLocationPromptOpen, isOnboardingOpen, telegramUserId, userProfile]);

  const placesAddedCount = useMemo(() => {
    if (!userProfile) {
      return 0;
    }
    return locations.filter((location) => location.user_id === userProfile.id).length;
  }, [locations, userProfile]);

  const isAdminUser = (userProfile?.role ?? "").trim().toLowerCase() === "admin";

  const submitOnboardingNickname = async (nickname: string) => {
    if (!telegramUser) {
      return;
    }
    setIsOnboardingSubmitting(true);
    setOnboardingError(null);
    try {
      const updatedProfile = await upsertUserProfile({
        telegramInitData,
        nickname,
      });
      setUserProfile(updatedProfile);
      writeCachedProfile(updatedProfile);
      setOnboardingError(null);
    } catch (err) {
      setOnboardingError(err instanceof Error ? err.message : "Failed to save nickname");
      throw err;
    } finally {
      setIsOnboardingSubmitting(false);
    }
  };

  const skipOnboarding = async () => {
    await submitOnboardingNickname(defaultNickname);
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
    const roundedKey = [
      viewportBounds.minLat.toFixed(4),
      viewportBounds.minLon.toFixed(4),
      viewportBounds.maxLat.toFixed(4),
      viewportBounds.maxLon.toFixed(4),
    ].join(":");
    if (roundedKey === lastFetchedBoundsKey) {
      return;
    }

    let isActive = true;

    const timer = window.setTimeout(async () => {
      try {
        const loaded = await fetchLocations(telegramInitData, viewportBounds);
        if (isActive) {
          setLocations(loaded);
          setLastFetchedBoundsKey(roundedKey);
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
  }, [lastFetchedBoundsKey, telegramInitData, viewportBounds]);

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

  const handleCreateLocationReview = async (rating: number, text: string | null) => {
    if (!selectedLocation) {
      return;
    }
    const created = await createLocationReview(selectedLocation.id, rating, text, telegramInitData);
    setSelectedLocationReviews((prev) => [created, ...prev]);
  };

  const markLocationPromptSeen = () => {
    if (telegramUserId !== null) {
      markLocationOnboardingSeen(telegramUserId);
    }
  };

  const openManualLocationSearch = () => {
    markLocationPromptSeen();
    setIsLocationPromptOpen(false);
    setIsSearchOpen(true);
  };

  const requestUserLocation = (onFailure?: () => void, onSuccess?: () => void) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not available on this device.");
      onFailure?.();
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setUserLocation(coords);
        setFocusCoordinates(coords);
        setError(null);
        setIsLocating(false);
        onSuccess?.();
      },
      () => {
        setIsLocating(false);
        if (onFailure) {
          onFailure();
          return;
        }
        setError("Could not get your current location.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleLocateMe = () => {
    requestUserLocation();
  };

  const handleLocationPromptShare = () => {
    markLocationPromptSeen();
    requestUserLocation(
      () => {
        setIsLocationPromptOpen(false);
        setIsSearchOpen(true);
      },
      () => {
        setIsLocationPromptOpen(false);
      }
    );
  };

  const submitProfile = async (nickname: string) => {
    if (!telegramUser) {
      return;
    }
    setIsProfileSaving(true);
    setProfileError(null);
    try {
      const updatedProfile = await upsertUserProfile({
        telegramInitData,
        nickname,
      });
      setUserProfile(updatedProfile);
      writeCachedProfile(updatedProfile);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to save profile");
      throw err;
    } finally {
      setIsProfileSaving(false);
    }
  };

  const openAdminPanel = async () => {
    setIsAdminOpen(true);
    setAdminError(null);
    setAdminLoadingMembers(true);
    setAdminLoadingLocations(true);
    try {
      const [members, locationsData] = await Promise.all([
        fetchAdminMembers(telegramInitData),
        fetchAdminLocations(telegramInitData),
      ]);
      setAdminMembers(members);
      setAdminLocations(locationsData);
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : "Failed to load admin data");
    } finally {
      setAdminLoadingMembers(false);
      setAdminLoadingLocations(false);
    }
  };

  const handleSelectAdminLocation = async (location: Location) => {
    setAdminSelectedLocation(location);
    setAdminLoadingReviews(true);
    setAdminError(null);
    try {
      const reviews = await fetchAdminLocationReviews(location.id, telegramInitData);
      setAdminLocationReviews(reviews);
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : "Failed to load location reviews");
      setAdminLocationReviews([]);
    } finally {
      setAdminLoadingReviews(false);
    }
  };

  const handleToggleAdminRole = async (member: UserProfile) => {
    const nextRole: "admin" | "user" = member.role === "admin" ? "user" : "admin";
    const prevMembers = adminMembers;
    setAdminBusyUserId(member.id);
    setAdminError(null);
    setAdminMembers((current) =>
      current.map((user) => (user.id === member.id ? { ...user, role: nextRole } : user))
    );
    try {
      const updated = await updateAdminMemberRole(member.id, nextRole, telegramInitData);
      setAdminMembers((current) => current.map((user) => (user.id === updated.id ? updated : user)));
      if (userProfile?.id === updated.id) {
        setUserProfile((current) => (current ? { ...current, role: updated.role } : current));
      }
    } catch (err) {
      setAdminMembers(prevMembers);
      setAdminError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setAdminBusyUserId(null);
    }
  };

  const handleDeleteAdminLocation = async (location: Location) => {
    if (!window.confirm("Delete this location permanently? This will also delete related reviews and photos.")) {
      return;
    }
    setAdminDeletingLocationId(location.id);
    setAdminError(null);
    try {
      await deleteAdminLocation(location.id, telegramInitData);
      setAdminLocations((current) => current.filter((item) => item.id !== location.id));
      setLocations((current) => current.filter((item) => item.id !== location.id));
      if (adminSelectedLocation?.id === location.id) {
        setAdminSelectedLocation(null);
        setAdminLocationReviews([]);
      }
      if (selectedLocation?.id === location.id) {
        setSelectedLocation(null);
        setSelectedLocationReviews([]);
      }
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : "Failed to delete location");
    } finally {
      setAdminDeletingLocationId(null);
    }
  };

  const handleDeleteAdminReview = async (review: LocationReview) => {
    if (!window.confirm("Delete this review permanently?")) {
      return;
    }
    setAdminDeletingReviewId(review.id);
    setAdminError(null);
    try {
      await deleteAdminReview(review.id, telegramInitData);
      setAdminLocationReviews((current) => current.filter((item) => item.id !== review.id));
      setSelectedLocationReviews((current) => current.filter((item) => item.id !== review.id));
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : "Failed to delete review");
    } finally {
      setAdminDeletingReviewId(null);
    }
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
        userLocation={userLocation}
      />

      {/* Overlaid header: search + filter chips */}
      <HomeHeader
        selectedCategories={selectedCategories}
        onToggleCategory={handleToggleCategory}
        onSearchClick={() => setIsSearchOpen(true)}
        profileInitial={profileInitial}
        onProfileClick={() => {
          setProfileError(null);
          setIsProfileOpen(true);
        }}
        isAdmin={isAdminUser}
        onAdminClick={() => {
          void openAdminPanel();
        }}
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

      {isLocationPromptOpen && telegramUser ? (
        <LocationOnboardingPrompt
          isLocating={isLocating}
          onShareLocation={handleLocationPromptShare}
          onSearchManually={openManualLocationSearch}
        />
      ) : null}

      {isProfileOpen ? (
        <ProfileSheet
          isOpen={isProfileOpen}
          profileInitial={profileInitial}
          telegramUser={telegramUser}
          userProfile={userProfile}
          placesAddedCount={placesAddedCount}
          isSavingProfile={isProfileSaving}
          profileError={profileError}
          onSaveProfile={submitProfile}
          onClose={() => setIsProfileOpen(false)}
        />
      ) : null}

      <AdminSheet
        isOpen={isAdminOpen}
        members={adminMembers}
        locations={adminLocations}
        selectedLocation={adminSelectedLocation}
        selectedLocationReviews={adminLocationReviews}
        loadingMembers={adminLoadingMembers}
        loadingLocations={adminLoadingLocations}
        loadingReviews={adminLoadingReviews}
        busyUserId={adminBusyUserId}
        deletingLocationId={adminDeletingLocationId}
        deletingReviewId={adminDeletingReviewId}
        error={adminError}
        onClose={() => {
          setIsAdminOpen(false);
          setAdminSelectedLocation(null);
          setAdminLocationReviews([]);
        }}
        onSelectLocation={(location) => {
          void handleSelectAdminLocation(location);
        }}
        onBackToLocations={() => {
          setAdminSelectedLocation(null);
          setAdminLocationReviews([]);
        }}
        onToggleMemberRole={(member) => {
          void handleToggleAdminRole(member);
        }}
        onDeleteLocation={(location) => {
          void handleDeleteAdminLocation(location);
        }}
        onDeleteReview={(review) => {
          void handleDeleteAdminReview(review);
        }}
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
          defaultNickname={defaultNickname}
          isSubmitting={isOnboardingSubmitting}
          error={onboardingError}
          onSubmitNickname={submitOnboardingNickname}
          onSkip={skipOnboarding}
          onComplete={() => setIsOnboardingOpen(false)}
        />
      )}
    </main>
  );
}
