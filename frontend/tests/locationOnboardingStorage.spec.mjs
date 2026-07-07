import assert from "node:assert/strict";
import {
  clearLocationOnboardingSeen,
  hasSeenLocationOnboarding,
  markLocationOnboardingSeen,
} from "../.tmp-tests/locationOnboardingStorage.js";

function installFakeStorage() {
  const values = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: (key) => values.delete(key),
    },
  };
}

installFakeStorage();

assert.equal(hasSeenLocationOnboarding(123), false);
markLocationOnboardingSeen(123);
assert.equal(hasSeenLocationOnboarding(123), true);
assert.equal(hasSeenLocationOnboarding(456), false);

clearLocationOnboardingSeen(123);
assert.equal(hasSeenLocationOnboarding(123), false);

delete globalThis.window;
assert.equal(hasSeenLocationOnboarding(123), false);

console.log("locationOnboardingStorage tests passed");
