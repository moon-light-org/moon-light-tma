import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const indexHtml = readFileSync("index.html", "utf8");
const onboarding = readFileSync("src/widgets/mobile-home/OnboardingFlow.tsx", "utf8");
const addLocation = readFileSync("src/features/add-location/ui/AddLocationModal.tsx", "utf8");
const locationDetail = readFileSync("src/features/location-detail/ui/LocationDetailSheet.tsx", "utf8");

assert.match(indexHtml, /dotlottie-wc@0\.9\.14/);
assert.match(indexHtml, /maximum-scale=1\.0/);
assert.match(indexHtml, /user-scalable=no/);

assert.match(onboarding, /06b95c48-33c1-4edd-94ec-1e9d168c2f30\/hhj7Rgkswv\.lottie/);
assert.match(onboarding, /42ada56a-0e51-475b-a58e-4f64382f33ce\/ufM6EL4mVR\.lottie/);
assert.match(onboarding, /onboarding-lottie/);
assert.doesNotMatch(onboarding, /onboarding-blob/);

assert.match(addLocation, /8a8f2201-3695-4c92-8336-0a478f50f2f4\/sKfxVRewDm\.lottie/);
assert.match(addLocation, /create-location-loading-lottie/);

assert.match(locationDetail, /location-detail-hero__skeleton/);
assert.doesNotMatch(locationDetail, />No image</);

console.log("ui source tests passed");
