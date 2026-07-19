import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const indexHtml = readFileSync("index.html", "utf8");
const onboarding = readFileSync("src/widgets/mobile-home/OnboardingFlow.tsx", "utf8");
const addLocation = readFileSync("src/features/add-location/ui/AddLocationModal.tsx", "utf8");
const locationDetail = readFileSync("src/features/location-detail/ui/LocationDetailSheet.tsx", "utf8");
const homePage = readFileSync("src/pages/home/HomePage.tsx", "utf8");
const locationMap = readFileSync("src/widgets/location-map/LocationMap.tsx", "utf8");
const userApi = readFileSync("src/entities/user/api/userApi.ts", "utf8");

assert.match(indexHtml, /dotlottie-wc@0\.9\.14/);
assert.match(indexHtml, /maximum-scale=1\.0/);
assert.match(indexHtml, /user-scalable=no/);

assert.match(onboarding, /06b95c48-33c1-4edd-94ec-1e9d168c2f30\/hhj7Rgkswv\.lottie/);
assert.match(onboarding, /onboarding-lottie/);
assert.doesNotMatch(onboarding, /onboarding-blob/);

assert.match(addLocation, /8a8f2201-3695-4c92-8336-0a478f50f2f4\/sKfxVRewDm\.lottie/);
assert.match(addLocation, /create-location-loading-lottie/);

assert.match(locationDetail, /location-detail-hero__skeleton/);
assert.doesNotMatch(locationDetail, />No image</);

assert.match(homePage, /const \[userLocation,\s*setUserLocation\]/);
assert.match(homePage, /setUserLocation\(coords\)/);
assert.match(homePage, /userLocation=\{userLocation\}/);
assert.match(homePage, /getCurrentUser/);
assert.match(homePage, /signupUser/);
assert.doesNotMatch(homePage, /getOrCreateUser/);

assert.match(locationMap, /userLocation\?: \{ latitude: number; longitude: number \} \| null/);
assert.match(locationMap, /USER_LOCATION_SOURCE_ID/);
assert.match(locationMap, /USER_LOCATION_POINT_LAYER_ID/);
assert.match(locationMap, /userLocationGeoJson/);
assert.match(locationMap, /https:\/\/tiles\.openfreemap\.org\/styles\/liberty/);
assert.doesNotMatch(locationMap, /tile\.openstreetmap\.org/);

assert.match(onboarding, /Skip for now/);
assert.doesNotMatch(onboarding, /Use \{defaultNickname\}/);

assert.match(userApi, /getCurrentUser/);
assert.match(userApi, /signupUser/);
assert.match(userApi, /updateUserProfile/);

console.log("ui source tests passed");
