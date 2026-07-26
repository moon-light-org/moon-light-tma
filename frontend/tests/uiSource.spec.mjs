import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const indexHtml = readFileSync("index.html", "utf8");
const styles = readFileSync("src/index.css", "utf8");
const onboarding = readFileSync("src/widgets/mobile-home/OnboardingFlow.tsx", "utf8");
const addLocation = readFileSync("src/features/add-location/ui/AddLocationModal.tsx", "utf8");
const locationDetail = readFileSync("src/features/location-detail/ui/LocationDetailSheet.tsx", "utf8");
const reviewFlow = readFileSync("src/features/location-detail/ui/ReviewFlowModal.tsx", "utf8");
const reportFlow = readFileSync("src/features/location-detail/ui/ReportFlowModal.tsx", "utf8");
const homePage = readFileSync("src/pages/home/HomePage.tsx", "utf8");
const locationApi = readFileSync("src/entities/location/api/locationApi.ts", "utf8");
const locationMap = readFileSync("src/widgets/location-map/LocationMap.tsx", "utf8");
const adminSheet = readFileSync("src/widgets/mobile-home/AdminSheet.tsx", "utf8");
const lotties = readFileSync("src/shared/ui/lotties.ts", "utf8");
const userApi = readFileSync("src/entities/user/api/userApi.ts", "utf8");

assert.match(indexHtml, /dotlottie-wc@0\.9\.14/);
assert.match(indexHtml, /maximum-scale=1\.0/);
assert.match(indexHtml, /user-scalable=no/);

assert.match(lotties, /06b95c48-33c1-4edd-94ec-1e9d168c2f30\/hhj7Rgkswv\.lottie/);
assert.match(onboarding, /onboarding-lottie/);
assert.doesNotMatch(onboarding, /onboarding-blob/);

assert.match(lotties, /8a8f2201-3695-4c92-8336-0a478f50f2f4\/sKfxVRewDm\.lottie/);
assert.match(addLocation, /create-location-loading-lottie/);

assert.match(locationDetail, /location-detail-hero__skeleton/);
assert.doesNotMatch(locationDetail, />No image</);
assert.match(locationDetail, /Add review/);
assert.match(locationDetail, /Community feedback/);
assert.match(locationDetail, /Reviews from other users/);
assert.match(locationDetail, /See what other Bitcoiners are saying before you add your own take\./);
assert.match(locationDetail, /location-detail-review-card/);
assert.match(locationDetail, /location-detail-review-summary/);
assert.doesNotMatch(locationDetail, /placeholder="Write a review \(optional if you rate\)"/);
assert.match(lotties, /16f1a74c-cf0f-4fc2-8742-c0492417d692\/E5OQBtRu8p\.lottie/);
assert.match(lotties, /5e17fba5-56fb-42c0-8266-72086c33efba\/qW13dBgqmt\.lottie/);
assert.match(reviewFlow, /window\.setTimeout/);
assert.match(reviewFlow, /2000/);
assert.match(reviewFlow, /"payment" \| "wallet" \| "rating" \| "comment" \| "success"/);
assert.match(reviewFlow, /Accepts Lightning/);
assert.match(reviewFlow, /Skip/);
assert.match(reviewFlow, /void submit\(null\)/);
assert.match(reportFlow, /type="checkbox"/);
assert.match(reportFlow, /Location doesn't exist/);
assert.match(reportFlow, /Poor quality service/);
assert.match(locationDetail, /location-detail-contribution-actions/);
assert.match(reportFlow, /report-flow-reason/);
assert.match(styles, /\.location-detail-contribution-actions\s*\{/);
assert.match(styles, /@media \(max-width: 360px\)/);
assert.match(styles, /\.report-flow-reason\s*\{[\s\S]*justify-content: center/);
assert.match(locationApi, /export async function createLocationReport/);
assert.match(locationApi, /body: \{ paymentStatus, wallet, rating, text \}/);
assert.match(locationApi, /export async function fetchAdminLocationReports/);
assert.match(locationApi, /"\/api\/admin\/reports"/);

assert.match(homePage, /const \[userLocation,\s*setUserLocation\]/);
assert.match(homePage, /setUserLocation\(coords\)/);
assert.match(homePage, /userLocation=\{userLocation\}/);
assert.match(homePage, /getCurrentUser/);
assert.match(homePage, /signupUser/);
assert.doesNotMatch(homePage, /getOrCreateUser/);
assert.match(homePage, /clearCachedProfile/);
assert.match(homePage, /const cachedProfile = readCachedProfile\(telegramUserId\)/);
assert.match(homePage, /const user = await getCurrentUser\(telegramInitData\)/);
assert.match(homePage, /if \(cachedProfile && !user\)/);
assert.match(homePage, /handleCreateLocationReport/);
assert.match(homePage, /createLocationReport\(selectedLocation\.id/);
assert.match(locationDetail, /Report location/);
assert.match(locationDetail, /ReportFlowModal/);
assert.match(locationDetail, /review\.payment_status/);
assert.match(adminSheet, /review\.rating !== null/);
assert.match(adminSheet, /type TabKey = "members" \| "locations" \| "reports"/);
assert.match(adminSheet, />Reports</);
assert.match(adminSheet, /report\.location_name/);
assert.match(adminSheet, /report\.reasons\.map/);
assert.match(adminSheet, /report\.text \?/);
assert.match(adminSheet, /new Date\(report\.created_at\)\.toLocaleString\(\)/);
assert.match(adminSheet, /reports\.slice\(\)\.sort\(\(a, b\) => new Date\(b\.created_at\)\.getTime\(\) - new Date\(a\.created_at\)\.getTime\(\)\)/);
assert.match(adminSheet, /loadingReports \? <p>Loading reports\.\.\.<\/p> : null/);
assert.match(adminSheet, /!loadingReports && !reportError && reports\.length === 0 \? <p>No reports found\.<\/p> : null/);
assert.match(adminSheet, /reportError: string \| null/);
assert.match(adminSheet, /reportError \? \(/);
assert.match(adminSheet, /error \? \(/);
assert.match(adminSheet, /className="admin-error"/);
assert.match(homePage, /fetchAdminLocationReports\(telegramInitData\)/);
assert.match(homePage, /const \[membersResult, locationsResult, reportsResult\] = await Promise\.allSettled/);
assert.match(homePage, /membersResult\.status === "fulfilled"[\s\S]*setAdminMembers\(membersResult\.value\)/);
assert.match(homePage, /locationsResult\.status === "fulfilled"[\s\S]*setAdminLocations\(locationsResult\.value\)/);
assert.match(homePage, /reportsResult\.status === "fulfilled"[\s\S]*setAdminReports\(reportsResult\.value\)/);
assert.match(homePage, /setAdminReportsError\(/);

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
