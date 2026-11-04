import { loadTelegramWebApp } from "./webAppSdk.js";

export type Coordinates = { latitude: number; longitude: number };
export type LocationFix = Coordinates & { accuracyMeters: number | null };

type LocationManager = {
  isInited: boolean;
  isLocationAvailable: boolean;
  isAccessRequested: boolean;
  isAccessGranted: boolean;
  init(callback: () => void): void;
  getLocation(callback: (location: (Coordinates & { horizontal_accuracy?: number | null }) | null) => void): void;
  openSettings(): void;
};

class LocationTimeoutError extends Error {}

function getLocationManager(): LocationManager | null {
  if (typeof window === "undefined") return null;
  const webApp = (window as Window & {
    Telegram?: { WebApp?: {
      initData?: string;
      isVersionAtLeast?: (version: string) => boolean;
      LocationManager?: LocationManager;
    } };
  }).Telegram?.WebApp;
  if (!webApp?.initData || !webApp.isVersionAtLeast?.("8.0")) return null;
  return webApp.LocationManager ?? null;
}

function waitForCallback<T>(start: (done: (result: T) => void) => void, timeoutMs = 20000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new LocationTimeoutError("Location is taking too long. Try again or use search.")), timeoutMs);
    const done = (result: T) => {
      clearTimeout(timeout);
      resolve(result);
    };
    try {
      start(done);
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
}

export function canRequestLocation(): boolean {
  return Boolean(getLocationManager() || (typeof navigator !== "undefined" && navigator.geolocation));
}

// Call directly from a click handler: Telegram requires a user gesture.
export function openLocationSettingsIfDenied(): boolean {
  const manager = getLocationManager();
  if (!manager?.isInited || !manager.isLocationAvailable || !manager.isAccessRequested || manager.isAccessGranted) return false;
  manager.openSettings();
  return true;
}

function browserPosition(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, options));
}

function browserErrorMessage(error: unknown): string {
  const code = (error as { code?: number } | null)?.code;
  if (code === 1) return "Location permission is blocked. Enable it in your browser or device settings, or use search instead.";
  if (code === 2) return "Your current location is unavailable right now. Try again or use search.";
  if (code === 3) return "Location is taking too long. Try again or use search.";
  return "Could not get your current location. Try again or use search.";
}

export async function getCurrentLocation(): Promise<Coordinates> {
  const sdkLoaded = typeof document === "undefined" ? true : await loadTelegramWebApp();
  // Avoid a second permission path if the native bridge hasn't arrived yet.
  if (!sdkLoaded && /tgWebAppData=/.test(window.location.hash + window.location.search)) {
    throw new Error("Telegram location is still starting. Try the location button again or use search.");
  }
  const manager = getLocationManager();
  if (manager) {
    let nativeReady = manager.isInited;
    if (!manager.isInited) {
      try {
        await waitForCallback<void>((done) => manager.init(() => done()), 8000);
        nativeReady = true;
      } catch (error) {
        if (!(error instanceof LocationTimeoutError)) throw error;
      }
    }
    if (manager.isAccessRequested && !manager.isAccessGranted) {
      throw new Error("Location access is disabled. Tap the location button to open Telegram settings, or use search.");
    }
    if (nativeReady && manager.isLocationAvailable) {
      let location: Coordinates | null | undefined;
      try {
        location = await waitForCallback<Coordinates | null>((done) => manager.getLocation(done), 8000);
      } catch (error) {
        if (!(error instanceof LocationTimeoutError)) throw error;
      }
      if (location === null) {
        // Do not ask through the browser after Telegram has declined the request.
        throw new Error("Location was not shared. You can enable it in the bot's location settings or use search.");
      }
      if (location) {
        if (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) {
          throw new Error("Your current location is unavailable right now. Try again or use search.");
        }
        return { latitude: location.latitude, longitude: location.longitude };
      }
    }
  }

  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new Error("Geolocation is not available on this device.");
  }
  let position: GeolocationPosition;
  try {
    position = await browserPosition({ enableHighAccuracy: true, timeout: 8000, maximumAge: 0 });
  } catch (initialError) {
    if ((initialError as { code?: number } | null)?.code === 1) {
      throw new Error(browserErrorMessage(initialError));
    }
    try {
      position = await browserPosition({ enableHighAccuracy: false, timeout: 14000, maximumAge: 300000 });
    } catch (error) {
      throw new Error(browserErrorMessage(error));
    }
  }
  return { latitude: position.coords.latitude, longitude: position.coords.longitude };
}

/** Check-ins need a new fix and its reported accuracy, not the map's cached coordinates. */
export async function getCheckInLocation(): Promise<LocationFix> {
  const sdkLoaded = typeof document === "undefined" ? true : await loadTelegramWebApp();
  if (!sdkLoaded && /tgWebAppData=/.test(window.location.hash + window.location.search)) {
    throw new Error("Telegram location is still starting. Try again.");
  }
  const manager = getLocationManager();
  if (manager) {
    let nativeReady = manager.isInited;
    if (!nativeReady) {
      try {
        await waitForCallback<void>((done) => manager.init(() => done()), 8000);
        nativeReady = true;
      } catch (error) {
        if (!(error instanceof LocationTimeoutError)) throw error;
      }
    }
    if (manager.isAccessRequested && !manager.isAccessGranted) {
      throw new Error("Location access is disabled. Open Telegram location settings and try again.");
    }
    if (nativeReady && manager.isLocationAvailable) {
      let location: (Coordinates & { horizontal_accuracy?: number | null }) | null | undefined;
      try {
        location = await waitForCallback<Coordinates & { horizontal_accuracy?: number | null } | null>((done) => manager.getLocation(done), 8000);
      } catch (error) {
        if (!(error instanceof LocationTimeoutError)) throw error;
      }
      if (location === null) throw new Error("Location was not shared. Enable location access and try again.");
      if (location) {
        if (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) {
          throw new Error("Your current location is unavailable. Try again.");
        }
        return {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracyMeters: Number.isFinite(location.horizontal_accuracy) ? location.horizontal_accuracy! : null,
        };
      }
    }
  }
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new Error("Geolocation is not available on this device.");
  }
  let position: GeolocationPosition;
  try {
    position = await browserPosition({ enableHighAccuracy: true, timeout: 8000, maximumAge: 0 });
  } catch (initialError) {
    if ((initialError as { code?: number } | null)?.code === 1) throw new Error(browserErrorMessage(initialError));
    try {
      position = await browserPosition({ enableHighAccuracy: false, timeout: 8000, maximumAge: 0 });
    } catch (error) {
      throw new Error(browserErrorMessage(error));
    }
  }
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracyMeters: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null,
  };
}
