import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, MapPin, X } from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import type { MapRef } from "react-map-gl/maplibre";
import {
  fetchLocations,
  createLocation,
  createLocationReview,
  createLocationReport,
  fetchLocationPhotos,
  fetchLocationReviews,
  fetchAdminLocations,
  fetchAdminLocationReports,
  fetchAdminLocationReviews,
  deleteAdminLocation,
  deleteAdminReview,
} from "../../entities/location/api/locationApi";
import type {
  CreateLocationPayload,
  CreateLocationReportPayload,
  CreateLocationReviewPayload,
  AdminLocationReport,
  Location,
  LocationMainCategory,
  LocationPhoto,
  LocationReview,
} from "../../entities/location/model/types";
import {
  fetchAdminMembers,
  getCurrentUser,
  signupUser,
  updateAdminMemberRole,
  updateUserProfile,
} from "../../entities/user/api/userApi";
import type { UserProfile } from "../../entities/user/model/types";
import { clearCachedProfile, readCachedProfile, writeCachedProfile } from "../../entities/user/model/profileCache";
import { AddLocationModal } from "../../features/add-location/ui/AddLocationModal";
import { TapLocationSheet } from "../../features/add-location/ui/TapLocationSheet";
import { DiscoverView } from "../../features/discover/ui/DiscoverView";
import { LocationDetailSheet } from "../../features/location-detail/ui/LocationDetailSheet";
import { SearchSheet } from "../../features/search/ui/SearchSheet";
import { getTelegramInitData, useTelegramUser } from "../../shared/telegram/useTelegramUser";
import { canRequestLocation, getCurrentLocation, openLocationSettingsIfDenied } from "../../shared/telegram/location";
import { LocationMap } from "../../widgets/location-map/LocationMap";
import { HomeControls } from "../../widgets/mobile-home/HomeControls";
import { BottomNavigation, ExploreToolbar, MapLoader, PlacePreview } from "../../widgets/mobile-home/AppShell";
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
  const [isDetailOpen,       setIsDetailOpen]       = useState(false);
  const [selectedLocationPhotos, setSelectedLocationPhotos] = useState<LocationPhoto[]>([]);
  const [selectedLocationReviews, setSelectedLocationReviews] = useState<LocationReview[]>([]);
  const [isSelectedLocationPhotosLoading, setIsSelectedLocationPhotosLoading] = useState(false);
  const [isSelectedLocationReviewsLoading, setIsSelectedLocationReviewsLoading] = useState(false);
  const [pickedCoordinates,  setPickedCoordinates]  = useState<{ latitude: number; longitude: number } | null>(null);
  const [focusCoordinates,   setFocusCoordinates]   = useState<{ latitude: number; longitude: number } | null>(null);
  const [userLocation,        setUserLocation]        = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<LocationMainCategory | null>(null);
  const [lightningOnly, setLightningOnly] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [hasPendingSubmission, setHasPendingSubmission] = useState(false);
  const [submissionConfirmation, setSubmissionConfirmation] = useState<string | null>(null);
  const [isTapSheetOpen,     setIsTapSheetOpen]     = useState(false);
  const [isModalOpen,        setIsModalOpen]        = useState(false);
  const [isSearchOpen,       setIsSearchOpen]       = useState(false);
  const [isDiscoverOpen,     setIsDiscoverOpen]     = useState(false);
  const [isDiscoverLoading,  setIsDiscoverLoading]  = useState(false);
  const [isProfileOpen,      setIsProfileOpen]      = useState(false);
  const [isAwaitingMapPickForNewLocation, setIsAwaitingMapPickForNewLocation] = useState(false);
  const [canRenderMap,       setCanRenderMap]       = useState(true);
  const [isSubmitting,       setIsSubmitting]       = useState(false);
  const [isOnboardingSubmitting, setIsOnboardingSubmitting] = useState(false);
  const [isOnboardingOpen,   setIsOnboardingOpen]   = useState(false);
  const [onboardingError,    setOnboardingError]    = useState<string | null>(null);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [error,              setError]              = useState<string | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminMembers, setAdminMembers] = useState<UserProfile[]>([]);
  const [adminLocations, setAdminLocations] = useState<Location[]>([]);
  const [adminReports, setAdminReports] = useState<AdminLocationReport[]>([]);
  const [adminReportsError, setAdminReportsError] = useState<string | null>(null);
  const [adminSelectedLocation, setAdminSelectedLocation] = useState<Location | null>(null);
  const [adminLocationReviews, setAdminLocationReviews] = useState<LocationReview[]>([]);
  const [adminLoadingMembers, setAdminLoadingMembers] = useState(false);
  const [adminLoadingLocations, setAdminLoadingLocations] = useState(false);
  const [adminLoadingReports, setAdminLoadingReports] = useState(false);
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
  const mapInstanceRef = useRef<MapRef | null>(null);
  const hasRequestedInitialLocation = useRef(false);
  const isLocationRequestPending = useRef(false);
  useEffect(() => {
    if (isMapReady) return;
    const timeout = window.setTimeout(() => {
      setIsMapReady(true);
      setError("Map loading is taking longer than expected. You can use Explore to find places.");
    }, 10000);
    return () => window.clearTimeout(timeout);
  }, [isMapReady]);
  const handleMapReady = useCallback((map: MapRef | null) => {
    mapInstanceRef.current = map;
  }, []);

  useEffect(() => {
    let isActive = true;
    async function bootstrap() {
      if (telegramUserId === null) {
        if (isActive) {
          setCanRenderMap(true);
        }
        return;
      }

      // In dev-fallback mode, skip user registration but still fetch locations.
      if (IS_DEV_FALLBACK) {
        setUserProfile(DEV_STUB_PROFILE);
        if (isActive) {
          setCanRenderMap(true);
        }
        return;
      }

      const cachedProfile = readCachedProfile(telegramUserId);
      if (cachedProfile && isActive) {
        setUserProfile(cachedProfile);
        setCanRenderMap(true);
      }

      try {
        const user = await getCurrentUser(telegramInitData);
        if (!isActive) return;
        if (user) {
          setUserProfile(user);
          setHasPendingSubmission(Boolean(user.has_pending_location));
          writeCachedProfile(user);
          setCanRenderMap(true);
        } else if (cachedProfile && !user) {
          clearCachedProfile(telegramUserId);
          setUserProfile(null);
          setCanRenderMap(true);
          setIsOnboardingOpen(true);
        } else {
          setIsOnboardingOpen(true);
        }
      } catch (err) {
        if (!isActive) return;
        setError(err instanceof Error ? err.message : "Failed to load app data");
        setCanRenderMap(true);
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

  const placesAddedCount = useMemo(() => {
    if (!userProfile) {
      return 0;
    }
    return locations.filter((location) => location.user_id === userProfile.id).length;
  }, [locations, userProfile]);

  const isAdminUser = (userProfile?.role ?? "").trim().toLowerCase() === "admin";

  const requestUserLocation = useCallback(() => {
    if (isLocationRequestPending.current) return;
    isLocationRequestPending.current = true;
    void getCurrentLocation().then((coords) => {
      setUserLocation(coords);
      setFocusCoordinates(coords);
      setError(null);
    }).catch((error: unknown) => {
      setError(error instanceof Error ? error.message : "Could not get your current location. Try again or use search.");
    }).finally(() => {
      isLocationRequestPending.current = false;
    });
  }, []);

  useEffect(() => {
    // StrictMode replays effects in development; request location only once.
    if (hasRequestedInitialLocation.current) return;
    hasRequestedInitialLocation.current = true;
    requestUserLocation();
  }, [requestUserLocation]);

  const submitOnboardingNickname = async (nickname: string) => {
    if (!telegramUser) {
      return;
    }
    setIsOnboardingSubmitting(true);
    setOnboardingError(null);
    try {
      const createdProfile = await signupUser({
        telegramInitData,
        nickname,
      });
      setUserProfile(createdProfile);
      writeCachedProfile(createdProfile);
      setOnboardingError(null);
    } catch (err) {
      setOnboardingError(err instanceof Error ? err.message : "Failed to save nickname");
      throw err;
    } finally {
      setIsOnboardingSubmitting(false);
    }
  };

  const skipOnboarding = async () => {
    if (!telegramUser) {
      return;
    }
    setIsOnboardingSubmitting(true);
    setOnboardingError(null);
    try {
      const createdProfile = await signupUser({
        telegramInitData,
      });
      setUserProfile(createdProfile);
      writeCachedProfile(createdProfile);
      setOnboardingError(null);
    } catch (err) {
      setOnboardingError(err instanceof Error ? err.message : "Failed to create profile");
      throw err;
    } finally {
      setIsOnboardingSubmitting(false);
    }
  };

  const handlePickLocation = (latitude: number, longitude: number) => {
    if (!isAwaitingMapPickForNewLocation) return;
    if (!telegramUser || !userProfile) {
      setError("Open in Telegram to add a new location.");
      return;
    }
    setIsAwaitingMapPickForNewLocation(false);
    setPickedCoordinates({ latitude, longitude });
    setIsTapSheetOpen(true);
  };

  const handleCreateLocation = async (payload: CreateLocationPayload) => {
    setIsSubmitting(true);
    try {
      const created = await createLocation(payload, telegramInitData);
      const reloaded = await fetchLocations(telegramInitData);
      setLocations(reloaded);
      setError(null);
      setSelectedLocation(null);
      if (!created.is_approved) {
        setHasPendingSubmission(true);
        setSubmissionConfirmation("Location application registered. It must be confirmed before you can add another location.");
      } else {
        setSubmissionConfirmation("Location registered successfully.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectCategory = (category: LocationMainCategory | null) => {
    setSelectedCategory(category);
    setSelectedLocation(null);
    setIsDetailOpen(false);
  };

  const handleToggleLightning = () => {
    setLightningOnly((value) => !value);
    setSelectedLocation(null);
    setIsDetailOpen(false);
  };

  const locationsByPayment = lightningOnly ? locations.filter((location) => location.accepts_lightning) : locations;
  const categoryFilteredLocations =
    selectedCategory === null
      ? locationsByPayment
      : locationsByPayment.filter((l) => l.main_category === selectedCategory);
  const visibleLocations =
    selectedLocation && !categoryFilteredLocations.some((location) => location.id === selectedLocation.id)
      ? [selectedLocation, ...categoryFilteredLocations]
      : categoryFilteredLocations;

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
    if (!submissionConfirmation) return;
    const timeoutId = window.setTimeout(() => setSubmissionConfirmation(null), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [submissionConfirmation]);

  // The discover list has no map, so it cannot rely on viewport-driven fetching.
  useEffect(() => {
    if (!isDiscoverOpen || locations.length > 0) {
      return;
    }
    let isActive = true;
    setIsDiscoverLoading(true);
    void fetchLocations(telegramInitData, { limit: 100 })
      .then((loaded) => {
        if (isActive) {
          setLocations(loaded);
        }
      })
      .catch((err: unknown) => {
        if (isActive) {
          setError(err instanceof Error ? err.message : "Failed to load places");
        }
      })
      .finally(() => {
        if (isActive) {
          setIsDiscoverLoading(false);
        }
      });
    return () => {
      isActive = false;
    };
  }, [isDiscoverOpen, locations.length, telegramInitData]);

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

  const handleCreateLocationReview = async (payload: CreateLocationReviewPayload) => {
    if (!selectedLocation) {
      return;
    }
    const created = await createLocationReview(selectedLocation.id, payload, telegramInitData);
    setSelectedLocationReviews((prev) => [created, ...prev]);
  };
  const handleCreateLocationReport = async (payload: CreateLocationReportPayload) => {
    if (!selectedLocation) return;
    await createLocationReport(selectedLocation.id, payload, telegramInitData);
  };

  const handleLocateMe = () => {
    if (openLocationSettingsIfDenied()) return;
    if (userLocation) {
      // A new object also recenters after panning away from the same position.
      setFocusCoordinates({ ...userLocation });
      return;
    }
    requestUserLocation();
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn({ duration: 220 });
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut({ duration: 220 });
  };

  const leaveDiscoverForMap = () => {
    setIsDetailOpen(false);
    setIsDiscoverOpen(false);
    setCanRenderMap(true);
  };

  const handleShowSelectedOnMap = () => {
    if (selectedLocation) {
      setFocusCoordinates({ latitude: selectedLocation.latitude, longitude: selectedLocation.longitude });
    }
    leaveDiscoverForMap();
  };

  const handleOpenLocationDetail = (location: Location | null) => {
    setSelectedLocation(location);
    setIsDetailOpen(Boolean(location));
  };

  const handleCloseLocationDetail = () => {
    setIsDetailOpen(false);
    setSelectedLocation(null);
  };

  const submitProfile = async (nickname: string) => {
    if (!telegramUser) {
      return;
    }
    setIsProfileSaving(true);
    setProfileError(null);
    try {
      const updatedProfile = await updateUserProfile({
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

  const openProfile = async () => {
    setProfileError(null);
    setIsProfileOpen(true);

    if (!telegramUser) {
      return;
    }

    try {
      const freshProfile = await getCurrentUser(telegramInitData);
      if (freshProfile) {
        setUserProfile(freshProfile);
        setHasPendingSubmission(Boolean(freshProfile.has_pending_location));
        writeCachedProfile(freshProfile);
      }
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to refresh profile");
    }
  };

  const handleAddLocationFromProfile = () => {
    if (hasPendingSubmission) {
      return;
    }
    setIsProfileOpen(false);
    setPickedCoordinates(null);
    setIsTapSheetOpen(false);
    setIsModalOpen(false);
    setIsAwaitingMapPickForNewLocation(true);
  };

  const openAdminPanel = async () => {
    setIsAdminOpen(true);
    setAdminError(null);
    setAdminReportsError(null);
    setAdminLoadingMembers(true);
    setAdminLoadingLocations(true);
    setAdminLoadingReports(true);
    try {
      const [membersResult, locationsResult, reportsResult] = await Promise.allSettled([
        fetchAdminMembers(telegramInitData),
        fetchAdminLocations(telegramInitData),
        fetchAdminLocationReports(telegramInitData),
      ]);
      const errors: string[] = [];

      if (membersResult.status === "fulfilled") {
        setAdminMembers(membersResult.value);
      } else {
        errors.push(membersResult.reason instanceof Error ? membersResult.reason.message : "Failed to load members");
      }

      if (locationsResult.status === "fulfilled") {
        setAdminLocations(locationsResult.value);
      } else {
        errors.push(locationsResult.reason instanceof Error ? locationsResult.reason.message : "Failed to load locations");
      }

      if (reportsResult.status === "fulfilled") {
        setAdminReports(reportsResult.value);
      } else {
        setAdminReports([]);
        setAdminReportsError(reportsResult.reason instanceof Error ? reportsResult.reason.message : "Failed to load reports");
      }

      setAdminError(errors[0] ?? null);
    } finally {
      setAdminLoadingMembers(false);
      setAdminLoadingLocations(false);
      setAdminLoadingReports(false);
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

  /* ── Main UI ─────────────────────────────────────────── */
  return (
    <MotionConfig reducedMotion="user"><main className="map-shell app-shell">
      {canRenderMap && !isDiscoverOpen ? (
        <>
          <ExploreToolbar category={selectedCategory} onCategory={handleSelectCategory} lightningOnly={lightningOnly} onLightning={handleToggleLightning} lightningCount={locations.filter((location) => location.accepts_lightning).length} onSearch={() => setIsSearchOpen(true)} isAdmin={isAdminUser} onAdmin={() => void openAdminPanel()} />
          <motion.section className={`explore-map${selectedLocation ? " has-selection" : ""}`} aria-label="Explore map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .45 }}>
          <LocationMap
            locations={visibleLocations}
            selectedLocationId={selectedLocation?.id ?? null}
            pickedCoordinates={pickedCoordinates}
            isPickingLocation={isAwaitingMapPickForNewLocation}
            onMapPickLocation={handlePickLocation}
            onLocationSelect={(location) => { setSelectedLocation(location); setIsDetailOpen(false); }}
            onViewportChange={setViewportBounds}
            initialCenter={userLocation ?? focusCoordinates ?? undefined}
            focusCoordinates={focusCoordinates}
            userLocation={userLocation}
            onMapReady={handleMapReady}
            onMapLoaded={() => setIsMapReady(true)}
          />


          {/* Floating action buttons */}
          <HomeControls
            canLocate={canRequestLocation()}
            onLocateMe={handleLocateMe}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
          />
          <AnimatePresence>{!isMapReady && <MapLoader key="map-loader" />}</AnimatePresence>
          <AnimatePresence mode="wait">{selectedLocation && !isDetailOpen ? <PlacePreview key={selectedLocation.id} location={selectedLocation} onDetails={() => setIsDetailOpen(true)} onClose={handleCloseLocationDetail} /> : null}</AnimatePresence>
          </motion.section>

          <LocationDetailSheet
            isOpen={isDetailOpen && Boolean(selectedLocation)}
            location={selectedLocation}
            photos={selectedLocationPhotos}
            reviews={selectedLocationReviews}
            photosLoading={isSelectedLocationPhotosLoading}
            reviewsLoading={isSelectedLocationReviewsLoading}
            canContribute={Boolean(telegramUser && userProfile)}
            onClose={handleCloseLocationDetail}
            onCreateReview={handleCreateLocationReview}
            onCreateReport={handleCreateLocationReport}
          />

          {/* Search sheet */}
          <SearchSheet
            isOpen={isSearchOpen}
            locations={locations}
            telegramInitData={telegramInitData}
            onClose={() => setIsSearchOpen(false)}
            onSelectLocation={(loc) => {
              setLocations((current) =>
                current.some((location) => location.id === loc.id) ? current : [loc, ...current]
              );
              handleOpenLocationDetail(loc);
              setFocusCoordinates({ latitude: loc.latitude, longitude: loc.longitude });
            }}
          />

        </>
      ) : null}

      {isDiscoverOpen ? (
        <>
          <DiscoverView
            isOpen={isDiscoverOpen}
            locations={locations}
            isLoading={isDiscoverLoading}
            telegramInitData={telegramInitData}
            onSelectLocation={handleOpenLocationDetail}
            onOpenMap={leaveDiscoverForMap}
            category={selectedCategory}
            onCategory={handleSelectCategory}
            lightningOnly={lightningOnly}
            onLightning={handleToggleLightning}
          />
          <LocationDetailSheet
            isOpen={isDetailOpen && Boolean(selectedLocation)}
            location={selectedLocation}
            photos={selectedLocationPhotos}
            reviews={selectedLocationReviews}
            photosLoading={isSelectedLocationPhotosLoading}
            reviewsLoading={isSelectedLocationReviewsLoading}
            canContribute={Boolean(telegramUser && userProfile)}
            variant="page"
            onClose={handleCloseLocationDetail}
            onShowOnMap={handleShowSelectedOnMap}
            onCreateReview={handleCreateLocationReview}
            onCreateReport={handleCreateLocationReport}
          />
        </>
      ) : null}

      {/* Error toast */}
      {error && (
        <div className="error-toast" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button className="toast-dismiss" onClick={() => setError(null)} aria-label="Dismiss message"><X size={15} /></button>
        </div>
      )}

      {submissionConfirmation ? (
        <div className="success-toast" role="status">
          <CheckCircle2 size={18} />
          <span>{submissionConfirmation}</span>
        </div>
      ) : null}

      {canRenderMap && isAwaitingMapPickForNewLocation ? (
        <div className="error-toast error-toast--info" role="status">
          <MapPin size={18} />
          <span>Select a point on the map to add a location.</span>
        </div>
      ) : null}

      {isProfileOpen ? (
        <ProfileSheet
          isOpen={isProfileOpen}
          profileInitial={profileInitial}
          telegramUser={telegramUser}
          userProfile={userProfile}
          placesAddedCount={placesAddedCount}
          hasPendingSubmission={hasPendingSubmission}
          isSavingProfile={isProfileSaving}
          profileError={profileError}
          onSaveProfile={submitProfile}
          onAddLocationClick={handleAddLocationFromProfile}
          onClose={() => setIsProfileOpen(false)}
        />
      ) : null}

      <AdminSheet
        isOpen={isAdminOpen}
        members={adminMembers}
        locations={adminLocations}
        reports={adminReports}
        selectedLocation={adminSelectedLocation}
        selectedLocationReviews={adminLocationReviews}
        loadingMembers={adminLoadingMembers}
        loadingLocations={adminLoadingLocations}
        loadingReports={adminLoadingReports}
        reportError={adminReportsError}
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
      {canRenderMap && telegramUser && userProfile ? (
        <>
          <TapLocationSheet
            isOpen={isTapSheetOpen}
            coordinates={pickedCoordinates}
            onClose={() => {
              setIsTapSheetOpen(false);
              setPickedCoordinates(null);
              setIsAwaitingMapPickForNewLocation(false);
            }}
            onAddLocation={() => {
              setIsTapSheetOpen(false);
              setIsAwaitingMapPickForNewLocation(false);
              setIsModalOpen(true);
            }}
          />

          {/* Add location form sheet */}
          <AddLocationModal
            isOpen={isModalOpen}
            coordinates={pickedCoordinates}
            isSubmitting={isSubmitting}
            onClose={() => {
              setIsModalOpen(false);
              setPickedCoordinates(null);
              setIsAwaitingMapPickForNewLocation(false);
            }}
            onSubmit={handleCreateLocation}
          />
        </>
      ) : null}

      <BottomNavigation active={isProfileOpen ? "profile" : isDiscoverOpen ? "explore" : "map"} onMap={leaveDiscoverForMap} onExplore={() => { setIsDiscoverOpen(true); setIsDetailOpen(false); }} onProfile={() => void openProfile()} onAdd={() => { if (!telegramUser || !userProfile) { setError("Open MoonLight in Telegram to add a place."); return; } leaveDiscoverForMap(); handleAddLocationFromProfile(); }} />

      {isOnboardingOpen && telegramUser && (
        <OnboardingFlow
          isSubmitting={isOnboardingSubmitting}
          error={onboardingError}
          onSubmitNickname={submitOnboardingNickname}
          onSkip={skipOnboarding}
          onComplete={() => {
            setIsOnboardingOpen(false);
            setCanRenderMap(true);
          }}
        />
      )}
    </main></MotionConfig>
  );
}
