import assert from "node:assert/strict";
import { canRequestLocation, getCheckInLocation, getCurrentLocation, openLocationSettingsIfDenied } from "../.tmp-tests/location.js";

const position = { latitude: 33.7, longitude: 73.0 };
let browserCalls = 0;
let nativeCalls = 0;
let settingsCalls = 0;
let initCalls = 0;

function setup({ version = true, available = true, requested = false, granted = false, result = position, inited = false } = {}) {
  const manager = {
    isInited: inited,
    isLocationAvailable: available,
    isAccessRequested: requested,
    isAccessGranted: granted,
    init(callback) { initCalls++; this.isInited = true; callback(); },
    getLocation(callback) { nativeCalls++; callback(result); },
    openSettings() { settingsCalls++; },
  };
  globalThis.window = { Telegram: { WebApp: { initData: "telegram-session", isVersionAtLeast: () => version, LocationManager: manager } } };
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: {
    geolocation: { getCurrentPosition(success) { browserCalls++; success({ coords: position }); } },
  } });
  browserCalls = nativeCalls = settingsCalls = initCalls = 0;
  return manager;
}

setup();
assert.equal(canRequestLocation(), true);
assert.deepEqual(await getCurrentLocation(), position);
assert.equal(initCalls, 1);
assert.equal(nativeCalls, 1);
assert.equal(browserCalls, 0, "Use Telegram rather than asking the browser too");

setup({ requested: true, granted: true, inited: true });
assert.deepEqual(await getCurrentLocation(), position);
assert.equal(initCalls, 0);
assert.equal(nativeCalls, 1, "Previously granted access still returns a fresh location");
assert.equal(browserCalls, 0);

setup({ requested: true, granted: true, inited: true, result: { ...position, horizontal_accuracy: 12 } });
assert.deepEqual(await getCheckInLocation(), { ...position, accuracyMeters: 12 });
assert.equal(browserCalls, 0, "Check-in uses the Telegram fix and its accuracy");

setup({ requested: true, granted: true, inited: true });
assert.deepEqual(await getCheckInLocation(), { ...position, accuracyMeters: null }, "Missing accuracy must remain explicit");

setup({ available: false });
navigator.geolocation.getCurrentPosition = (success, failure, options) => {
  browserCalls++;
  if (options.enableHighAccuracy) failure({ code: 3 });
  else success({ coords: { ...position, accuracy: 24 } });
};
assert.deepEqual(await getCheckInLocation(), { ...position, accuracyMeters: 24 }, "Check-in retries after a precise location timeout");
assert.equal(browserCalls, 2);

const stalledManager = setup({ requested: true, granted: true, inited: true });
stalledManager.getLocation = () => { nativeCalls++; };
const originalSetTimeout = globalThis.setTimeout;
globalThis.setTimeout = (callback, delay, ...args) => originalSetTimeout(callback, delay === 8000 ? 0 : delay, ...args);
try {
  assert.deepEqual(await getCheckInLocation(), { ...position, accuracyMeters: null }, "A stalled Telegram bridge falls back when access was granted");
  assert.equal(nativeCalls, 1);
  assert.equal(browserCalls, 1);
} finally {
  globalThis.setTimeout = originalSetTimeout;
}

const stalledMapManager = setup({ requested: true, granted: true, inited: true });
stalledMapManager.getLocation = () => { nativeCalls++; };
globalThis.setTimeout = (callback, delay, ...args) => originalSetTimeout(callback, delay === 8000 ? 0 : delay, ...args);
try {
  assert.deepEqual(await getCurrentLocation(), position, "Map location recovers from a stalled Telegram bridge");
  assert.equal(browserCalls, 1);
} finally {
  globalThis.setTimeout = originalSetTimeout;
}

setup({ requested: true, granted: false });
await assert.rejects(getCheckInLocation(), /Location access is disabled/);
assert.equal(browserCalls, 0, "Check-in must not bypass a Telegram permission denial");
await assert.rejects(getCurrentLocation(), /Location access is disabled/);
assert.equal(nativeCalls, 0, "Do not request permission again after a denial");
assert.equal(browserCalls, 0, "Do not bypass native denial with a browser prompt");
assert.equal(settingsCalls, 0, "Startup must not open settings without a user gesture");
assert.equal(openLocationSettingsIfDenied(), true);
assert.equal(settingsCalls, 1);

setup({ result: null });
await assert.rejects(getCurrentLocation(), /Location was not shared/);
assert.equal(browserCalls, 0, "A declined native request must not trigger a second prompt");

setup({ result: { latitude: NaN, longitude: 73 } });
await assert.rejects(getCurrentLocation(), /unavailable/);
assert.equal(browserCalls, 0);

setup({ available: false });
assert.deepEqual(await getCurrentLocation(), position);
assert.equal(nativeCalls, 0);
assert.equal(browserCalls, 1, "Use browser fallback when native location is unavailable");

setup({ version: false });
assert.deepEqual(await getCurrentLocation(), position);
assert.equal(initCalls, 0);
assert.equal(browserCalls, 1, "Older clients use the browser fallback");

setup();
delete window.Telegram;
assert.deepEqual(await getCurrentLocation(), position);
assert.equal(browserCalls, 1, "Standalone browser usage remains supported");

setup();
window.Telegram.WebApp.initData = "";
assert.deepEqual(await getCurrentLocation(), position);
assert.equal(nativeCalls, 0, "Loading the Telegram script alone is not a Telegram session");

setup();
delete window.Telegram;
navigator.geolocation.getCurrentPosition = (_success, failure) => { browserCalls++; failure({ code: 1 }); };
await assert.rejects(getCurrentLocation(), /Location permission is blocked/);
assert.equal(browserCalls, 1, "Do not retry a denied browser request");

setup();
delete window.Telegram;
navigator.geolocation.getCurrentPosition = (success, failure) => {
  browserCalls++;
  if (browserCalls === 1) failure({ code: 3 });
  else success({ coords: position });
};
assert.deepEqual(await getCurrentLocation(), position);
assert.equal(browserCalls, 2, "Retry an accuracy timeout with the lower accuracy fallback");

setup();
delete window.Telegram;
delete navigator.geolocation;
assert.equal(canRequestLocation(), false);
await assert.rejects(getCurrentLocation(), /not available/);

console.log("Location tests passed (native access, denial, settings and browser fallback)");
